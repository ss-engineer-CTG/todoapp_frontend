// システムプロンプト準拠：Timeline描画統合コンポーネント（フックネスト解消版）
// 🔧 修正内容：renderTaskBar内のフック除去、シンプル化

import React, { useMemo, useCallback } from 'react'
import { 
  Check, AlertTriangle, ChevronDown, ChevronRight, Factory
} from 'lucide-react'
import { Task, Project } from '@core/types'
import { TaskRelationMap } from '@tasklist/types'
import { TimelineRendererProps, TaskWithChildren } from '../types'
import { 
  calculateTimelineTaskStatus,
  isTaskVisibleInTimeline,
  filterTasksForTimeline,
  sortTasksHierarchically
} from '@tasklist/utils/task'
import { 
  calculateDynamicSizes, 
  getDatePosition,
  getDisplayText,
  isValidDate,
  isWeekend,
  logger
} from '@core/utils'
import { buildTaskChildrenMap } from '../utils'

export const TimelineRenderer: React.FC<TimelineRendererProps> = ({
  projects,
  tasks,
  taskRelationMap,
  zoomLevel,
  viewUnit,
  theme,
  timeRange,
  visibleDates,
  scrollLeft,
  onToggleProject,
  onToggleTask
}) => {
  
  const today = new Date()
  const dimensions = useMemo(() => calculateDynamicSizes(zoomLevel, viewUnit), [zoomLevel, viewUnit])

  // 🔧 修正：子タスクマップを事前計算（フック規則準拠）
  const taskChildrenMap = useMemo(() => buildTaskChildrenMap(tasks, taskRelationMap), [tasks, taskRelationMap])

  // 🔧 修正：プロジェクト名動的位置計算
  const getProjectNamePosition = useCallback((scrollLeft: number): number => {
    const visibleAreaWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.6, 800) : 800
    const nameWidth = 200
    return Math.max(8, Math.min(scrollLeft + 8, scrollLeft + visibleAreaWidth - nameWidth - 8))
  }, [])

  // 🔧 修正：タイムライン全体幅の計算
  const getTotalTimelineWidth = useCallback((): number => {
    const cellCount = viewUnit === 'week' ? visibleDates.length * 7 : visibleDates.length
    return Math.max(cellCount * dimensions.cellWidth, typeof window !== 'undefined' ? window.innerWidth : 1200)
  }, [visibleDates.length, dimensions.cellWidth, viewUnit])

  // タスクステータススタイル計算
  const getTaskStatusStyle = useCallback((task: Task, projectColor: string) => {
    const status = calculateTimelineTaskStatus(task)
    const levelOpacity = Math.max(0.6, 1 - (task.level * 0.1))
    
    switch (status) {
      case 'completed':
        return {
          backgroundColor: `rgba(16, 185, 129, ${levelOpacity})`,
          borderColor: '#059669',
          textColor: task.level > 1 ? 'text-gray-700 dark:text-gray-300' : 'text-white'
        }
      case 'in-progress':
        const color = projectColor.replace('#', '')
        const r = parseInt(color.substr(0, 2), 16)
        const g = parseInt(color.substr(2, 2), 16)
        const b = parseInt(color.substr(4, 2), 16)
        return {
          backgroundColor: `rgba(${r}, ${g}, ${b}, ${levelOpacity})`,
          borderColor: projectColor,
          textColor: task.level > 1 ? 'text-gray-700 dark:text-gray-300' : 'text-white'
        }
      case 'overdue':
        return {
          backgroundColor: `rgba(239, 68, 68, ${levelOpacity})`,
          borderColor: '#dc2626',
          textColor: task.level > 1 ? 'text-gray-700 dark:text-gray-300' : 'text-white'
        }
      default:
        return {
          backgroundColor: `rgba(156, 163, 175, ${levelOpacity})`,
          borderColor: '#9ca3af',
          textColor: 'text-gray-600 dark:text-gray-400'
        }
    }
  }, [])

  // 階層インデント計算
  const calculateIndent = useCallback((level: number): number => {
    return level * Math.max(20, Math.round(32 * dimensions.zoomRatio))
  }, [dimensions.zoomRatio])

  // 接続線描画
  const renderConnectionLines = useCallback((task: Task, parentTask: Task | null) => {
    if (!parentTask || task.level === 0 || dimensions.zoomRatio < 0.3) return null

    const parentIndent = calculateIndent(parentTask.level)
    const childIndent = calculateIndent(task.level)
    const lineColor = `rgba(107, 114, 128, ${Math.max(0.3, dimensions.zoomRatio * 0.7)})`
    const lineWidth = Math.max(1, Math.round(2 * dimensions.zoomRatio))

    return (
      <div className="absolute pointer-events-none">
        {/* 垂直線 */}
        <div
          className="absolute"
          style={{
            left: `${parentIndent + 16}px`,
            top: `-${Math.round(dimensions.rowHeight.task * 0.3)}px`,
            width: `${lineWidth}px`,
            height: `${Math.round(dimensions.rowHeight.task * 0.8)}px`,
            backgroundColor: lineColor,
            zIndex: 1
          }}
        />
        
        {/* 水平線 */}
        <div
          className="absolute"
          style={{
            left: `${parentIndent + 16}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: `${Math.abs(childIndent - parentIndent - 16)}px`,
            height: `${lineWidth}px`,
            backgroundColor: lineColor,
            zIndex: 1
          }}
        />
        
        {/* 接続点 */}
        <div
          className="absolute rounded-full border border-white dark:border-gray-800"
          style={{
            left: `${childIndent - 4}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: `${Math.max(6, Math.round(8 * dimensions.zoomRatio))}px`,
            height: `${Math.max(6, Math.round(8 * dimensions.zoomRatio))}px`,
            backgroundColor: lineColor,
            zIndex: 2
          }}
        />
      </div>
    )
  }, [calculateIndent, dimensions])

  // 🔧 修正：タスクバー描画（フックネスト解消）
  const renderTaskBar = useCallback((taskWithChildren: TaskWithChildren, project: Project) => {
    const { task, hasChildren, childrenCount } = taskWithChildren
    
    if (!isValidDate(task.startDate) || !isValidDate(task.dueDate)) return null

    const statusStyle = getTaskStatusStyle(task, project.color)
    const indent = calculateIndent(task.level)
    const startPos = getDatePosition(task.startDate, timeRange.startDate, dimensions.cellWidth, viewUnit)
    const endPos = getDatePosition(task.dueDate, timeRange.startDate, dimensions.cellWidth, viewUnit)
    const barWidth = Math.max(80, endPos - startPos + dimensions.cellWidth)
    const barHeight = Math.max(20, dimensions.taskBarHeight - (task.level * 2))

    // 🔧 修正：シンプルなクリック処理（フックなし）
    const handleTaskClick = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      logger.info('Task bar clicked', { 
        taskId: task.id, 
        taskName: task.name,
        hasChildren,
        currentCollapsed: task.collapsed
      })
      
      if (hasChildren && onToggleTask) {
        onToggleTask(task.id)
      }
    }

    return (
      <div
        key={task.id}
        className={`relative border-b transition-colors duration-150 ${
          theme === 'dark' ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'
        }`}
        style={{ 
          height: `${dimensions.rowHeight.task}px`,
          paddingLeft: `${indent}px`
        }}
      >
        {/* タスクバー */}
        <div
          className={`absolute rounded-lg shadow-lg flex items-center transition-all duration-200 hover:shadow-xl ${
            hasChildren ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'
          }`}
          style={{ 
            left: `${startPos}px`,
            width: `${barWidth}px`,
            height: `${barHeight}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: statusStyle.backgroundColor,
            color: statusStyle.textColor,
            borderWidth: task.level > 1 ? '1px' : '2px',
            borderStyle: task.level > 1 ? 'dashed' : 'solid',
            borderColor: statusStyle.borderColor,
            zIndex: 2
          }}
          onClick={handleTaskClick}
          title={hasChildren ? 
            `${task.name} (${childrenCount}個の子タスク - クリックで${task.collapsed ? '展開' : '折りたたみ'})` :
            task.name
          }
        >
          <div className="px-3 flex items-center flex-shrink-0">
            {task.completed && <Check size={Math.max(10, 14)} className="mr-2" />}
            {calculateTimelineTaskStatus(task) === 'overdue' && !task.completed && 
              <AlertTriangle size={Math.max(10, 14)} className="mr-2" />}
          </div>
          
          <div 
            className="px-2 font-semibold truncate flex-1"
            style={{ fontSize: `${Math.max(10, dimensions.fontSize.small - task.level)}px` }}
          >
            {getDisplayText(task.name, zoomLevel, Math.max(10, 20 - task.level * 2))}
          </div>
          
          {hasChildren && dimensions.zoomRatio > 0.5 && (
            <div className="mr-3 bg-white/30 rounded-full px-2 py-1 flex items-center space-x-1">
              {!task.collapsed ? 
                <ChevronDown size={Math.max(8, 12)} /> :
                <ChevronRight size={Math.max(8, 12)} />
              }
              <span className="text-xs font-bold">
                {childrenCount}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }, [getTaskStatusStyle, calculateIndent, getDatePosition, dimensions, timeRange, viewUnit, zoomLevel, theme, onToggleTask])

  // 🔧 修正：プロジェクト表示用タスクフィルタリング（事前計算済み子タスク情報使用）
  const getProjectTasks = useCallback((projectId: string): TaskWithChildren[] => {
    try {
      const filtered = filterTasksForTimeline(tasks, projectId, true, taskRelationMap)
      const sorted = sortTasksHierarchically(filtered, taskRelationMap)
      
      // 🔧 修正：折りたたみ状態を考慮したフィルタリング
      const visibleTasks = sorted.filter(task => {
        if (!isTaskVisibleInTimeline(task, tasks, taskRelationMap)) {
          return false
        }
        
        if (task.parentId) {
          let currentParentId: string | null = task.parentId
          
          while (currentParentId) {
            const parentTask = tasks.find(t => t.id === currentParentId)
            if (!parentTask) break
            
            if (parentTask.collapsed) {
              logger.debug('Task hidden due to collapsed parent', {
                taskId: task.id,
                taskName: task.name,
                parentId: currentParentId,
                parentName: parentTask.name
              })
              return false
            }
            
            currentParentId = taskRelationMap.parentMap[currentParentId] || null
          }
        }
        
        return true
      })

      // 🔧 修正：TaskWithChildren形式に変換
      return visibleTasks.map(task => ({
        task,
        hasChildren: taskChildrenMap[task.id]?.hasChildren || false,
        childrenCount: taskChildrenMap[task.id]?.childrenCount || 0
      }))
    } catch (error) {
      logger.error('Project tasks filtering failed', { projectId, error })
      return []
    }
  }, [tasks, taskRelationMap, taskChildrenMap])

  // 🔧 修正：タイムライン全体幅
  const totalTimelineWidth = getTotalTimelineWidth()

  return (
    <div className="relative timeline-renderer-container" style={{ minWidth: `${totalTimelineWidth}px` }}>
      {/* グリッド背景 */}
      <div className="absolute inset-0 pointer-events-none" style={{ width: `${totalTimelineWidth}px` }}>
        {viewUnit === 'week' ? (
          visibleDates.map((weekStart, index) => (
            <div
              key={`grid-week-${weekStart.getTime()}`}
              className={`absolute inset-y-0 ${
                index % 2 === 0 
                  ? (theme === 'dark' ? 'bg-gray-900/60' : 'bg-gray-50/60')
                  : (theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/60')
              }`}
              style={{
                left: `${index * dimensions.cellWidth * 7}px`,
                width: `${dimensions.cellWidth * 7}px`,
                borderRight: `1px solid ${theme === 'dark' ? '#6b7280' : '#d1d5db'}`,
                opacity: 0.4
              }}
            />
          ))
        ) : (
          visibleDates.map((date) => (
            <div
              key={`grid-${date.getTime()}`}
              className={`absolute inset-y-0 ${
                isWeekend(date)
                  ? (theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-300/50')
                  : ''
              }`}
              style={{
                left: `${getDatePosition(date, timeRange.startDate, dimensions.cellWidth, viewUnit)}px`,
                width: `${dimensions.cellWidth}px`,
                borderRight: `1px solid ${theme === 'dark' ? '#6b7280' : '#d1d5db'}`,
                opacity: 0.4
              }}
            />
          ))
        )}
      </div>

      {/* プロジェクト・タスク表示 */}
      {projects.map(project => {
        const projectTasksWithChildren = getProjectTasks(project.id)
        
        return (
          <div key={project.id} className={`relative border-b-2 ${
            theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
          }`}>
            {/* 🔧 修正：プロジェクトヘッダー（クリック処理追加） */}
            <div 
              className="flex items-center relative cursor-pointer transition-colors duration-200 hover:opacity-90 project-header-row"
              onClick={() => {
                logger.info('Project header clicked', { 
                  projectId: project.id, 
                  projectName: project.name,
                  currentCollapsed: project.collapsed
                })
                if (onToggleProject) {
                  onToggleProject(project.id)
                }
              }}
              style={{ 
                height: `${dimensions.rowHeight.project}px`,
                backgroundColor: `${project.color}${theme === 'dark' ? '60' : '50'}`,
                borderLeft: `6px solid ${project.color}`,
                width: `${totalTimelineWidth}px`,
                minWidth: `${totalTimelineWidth}px`
              }}
              title={`${project.name} - クリックで${project.collapsed ? '展開' : '折りたたみ'}`}
            >
              {/* 動的プロジェクト名 */}
              <div 
                className={`absolute z-10 ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-500' : 'bg-white border-gray-300'
                } rounded-lg shadow-lg border-2`}
                style={{
                  left: `${getProjectNamePosition(scrollLeft)}px`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  maxWidth: '320px',
                  padding: '8px 12px'
                }}
              >
                <div className="flex items-center" style={{ color: project.color, gap: '8px' }}>
                  <div className="rounded-md bg-gray-100 dark:bg-gray-700 p-1">
                    {!project.collapsed ? 
                      <ChevronDown size={14} /> :
                      <ChevronRight size={14} />
                    }
                  </div>
                  <Factory size={14} />
                  <div className="font-bold truncate" style={{ fontSize: `${dimensions.fontSize.base}px` }}>
                    {getDisplayText(project.name, zoomLevel, 20)}
                  </div>
                  {projectTasksWithChildren.length > 0 && (
                    <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {projectTasksWithChildren.length}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 🔧 修正：プロジェクト内タスク（折りたたみ対応） */}
            {!project.collapsed && projectTasksWithChildren.map(taskWithChildren => {
              const parentTask = taskWithChildren.task.parentId ? tasks.find(t => t.id === taskWithChildren.task.parentId) || null : null
              
              return (
                <div key={taskWithChildren.task.id} style={{ width: `${totalTimelineWidth}px`, minWidth: `${totalTimelineWidth}px` }}>
                  {renderConnectionLines(taskWithChildren.task, parentTask)}
                  {renderTaskBar(taskWithChildren, project)}
                </div>
              )
            })}
          </div>
        )
      })}
      
      {/* 今日のインジケーター */}
      <div 
        className="absolute top-0 bg-red-500 z-30"
        style={{ 
          left: `${getDatePosition(today, timeRange.startDate, dimensions.cellWidth, viewUnit)}px`,
          width: `2px`,
          height: '100%'
        }}
      >
        <div 
          className="absolute top-0 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center"
          style={{
            left: '-10px',
            width: '20px',
            height: '20px'
          }}
        >
          <div className="bg-white rounded-full w-2 h-2" />
        </div>
      </div>
    </div>
  )
}