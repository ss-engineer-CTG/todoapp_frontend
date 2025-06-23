// システムプロンプト準拠：Timeline描画統合コンポーネント（ドラッグ機能統合版）
// 🔧 修正内容：DraggableTaskBarの統合、ドラッグ状態管理の追加

import React, { useMemo, useCallback, useEffect } from 'react'
import { 
  Check, AlertTriangle, ChevronDown, ChevronRight, Factory, Star
} from 'lucide-react'
import { Task, Project } from '@core/types'
import { TaskRelationMap } from '@tasklist/types'
import { TimelineRendererProps, TaskWithChildren } from '../types'
import { DraggableTaskBar } from './DraggableTaskBar'
import { useTaskDrag } from '../hooks/useTaskDrag'
import { 
  calculateTimelineTaskStatus,
  isTaskVisibleInTimeline,
  filterTasksForAllProjects,
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

// 🔧 修正：TimelineRendererPropsにドラッグ関連のプロパティを追加
interface ExtendedTimelineRendererProps extends TimelineRendererProps {
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>
}

export const TimelineRenderer: React.FC<ExtendedTimelineRendererProps> = ({
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
  onToggleTask,
  onTaskUpdate
}) => {
  
  const today = new Date()
  const dimensions = useMemo(() => calculateDynamicSizes(zoomLevel, viewUnit), [zoomLevel, viewUnit])

  // 🆕 追加：ドラッグ機能の統合
  const {
    dragState,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
    isDragging
  } = useTaskDrag({
    timelineStartDate: timeRange.startDate,
    cellWidth: dimensions.cellWidth,
    viewUnit,
    scrollLeft,
    onTaskUpdate: onTaskUpdate || (async () => {
      logger.warn('Task update handler not provided')
    })
  })

  // 🆕 追加：ドラッグ中のグローバルマウスイベント管理
  useEffect(() => {
    if (!isDragging) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleDragMove(e)
    }

    const handleGlobalMouseUp = () => {
      handleDragEnd()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDragCancel()
      }
    }

    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDragging, handleDragMove, handleDragEnd, handleDragCancel])

  const taskChildrenMap = useMemo(() => {
    logger.info('Building task children map for all projects', {
      totalTasks: tasks.length,
      totalProjects: projects.length
    })
    return buildTaskChildrenMap(tasks, taskRelationMap)
  }, [tasks, taskRelationMap, projects.length])

  const getProjectNamePosition = useCallback((scrollLeft: number): number => {
    const visibleAreaWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.6, 800) : 800
    const nameWidth = 200
    return Math.max(8, Math.min(scrollLeft + 8, scrollLeft + visibleAreaWidth - nameWidth - 8))
  }, [])

  const getTotalTimelineWidth = useCallback((): number => {
    const cellCount = viewUnit === 'week' ? visibleDates.length * 7 : visibleDates.length
    return Math.max(cellCount * dimensions.cellWidth, typeof window !== 'undefined' ? window.innerWidth : 1200)
  }, [visibleDates.length, dimensions.cellWidth, viewUnit])

  const getTaskStatusStyle = useCallback((task: Task) => {
    const status = calculateTimelineTaskStatus(task)
    const levelOpacity = Math.max(0.9, 1 - (task.level * 0.05))
    
    switch (status) {
      case 'completed':
        return {
          background: `linear-gradient(135deg, rgba(34, 197, 94, ${levelOpacity * 0.2}) 0%, rgba(16, 185, 129, ${levelOpacity * 0.3}) 100%)`,
          borderColor: '#10b981',
          textColor: 'text-emerald-800 dark:text-emerald-700',
          borderStyle: 'solid'
        }
      case 'in-progress':
        return {
          background: `linear-gradient(135deg, rgba(59, 130, 246, ${levelOpacity * 0.2}) 0%, rgba(37, 99, 235, ${levelOpacity * 0.3}) 100%)`,
          borderColor: '#2563eb',
          textColor: 'text-blue-800 dark:text-blue-700',
          borderStyle: 'solid'
        }
      case 'overdue':
        return {
          background: `linear-gradient(135deg, rgba(239, 68, 68, ${levelOpacity * 0.2}) 0%, rgba(220, 38, 38, ${levelOpacity * 0.3}) 100%)`,
          borderColor: '#dc2626',
          textColor: 'text-red-800 dark:text-red-700',
          borderStyle: 'solid'
        }
      default: // 'not-started'
        return {
          background: `linear-gradient(135deg, rgba(168, 85, 247, ${levelOpacity * 0.2}) 0%, rgba(147, 51, 234, ${levelOpacity * 0.3}) 100%)`,
          borderColor: '#9333ea',
          textColor: 'text-purple-800 dark:text-purple-700',
          borderStyle: 'solid'
        }
    }
  }, [])

  const calculateIndent = useCallback((level: number): number => {
    return level * Math.max(20, Math.round(32 * dimensions.zoomRatio))
  }, [dimensions.zoomRatio])

  const getConnectionLineStyle = useCallback((task: Task): { 
    color: string; 
    opacity: number; 
    style: 'solid' | 'dotted' | 'dashed';
    width: number;
  } => {
    const baseOpacity = 0.9  // プロジェクト管理ツール風に統一された透明度
    const baseWidth = Math.max(2, Math.round(3 * dimensions.zoomRatio))  // 少し太めの線
    const accentColor = '#8B5CF6'  // 統一されたアクセントカラー（紫）
    
    // プロジェクト管理ツール風の階層別線種
    switch (task.level) {
      case 1: // 親タスク（レベル1）- 実線
        return {
          color: accentColor,
          opacity: baseOpacity,
          style: 'solid',
          width: baseWidth
        }
      case 2: // 子タスク（レベル2）- 点線
        return {
          color: accentColor,
          opacity: baseOpacity,
          style: 'dotted',
          width: baseWidth
        }
      default: // 孫タスク（レベル3以上）- 破線
        return {
          color: accentColor,
          opacity: baseOpacity,
          style: 'dashed',
          width: Math.max(1, Math.round(baseWidth * 0.9))
        }
    }
  }, [dimensions.zoomRatio])

  const renderConnectionLines = useCallback((task: Task, parentTask: Task | null) => {
    if (!parentTask || task.level === 0 || dimensions.zoomRatio < 0.3) return null
    if (!isValidDate(task.startDate) || !isValidDate(parentTask.startDate)) return null

    try {
      const parentTaskStartPos = getDatePosition(parentTask.startDate, timeRange.startDate, dimensions.cellWidth, viewUnit)
      const childTaskStartPos = getDatePosition(task.startDate, timeRange.startDate, dimensions.cellWidth, viewUnit)
      
      const connectionOffset = Math.max(15, Math.round(20 * dimensions.zoomRatio))
      
      const parentConnectionX = parentTaskStartPos - connectionOffset
      const childConnectionX = childTaskStartPos - connectionOffset
      
      const connectionStyle = getConnectionLineStyle(task)
      const lineColor = connectionStyle.color
      const lineWidth = connectionStyle.width
      const borderStyle = connectionStyle.style
      
      const taskBarHeight = Math.max(20, dimensions.taskBarHeight - (task.level * 2))
      const taskBarCenterY = (dimensions.rowHeight.task - taskBarHeight) / 2 + (taskBarHeight / 2)

      return (
        <div className="absolute pointer-events-none">
          {/* プロジェクト管理ツール風: 親タスク接続点の円 */}
          <div
            className="absolute z-10"
            style={{
              left: `${parentConnectionX - Math.round(4 * dimensions.zoomRatio)}px`,
              top: `${taskBarCenterY}px`,
              transform: 'translateY(-50%)',
              width: `${Math.max(8, Math.round(8 * dimensions.zoomRatio))}px`,
              height: `${Math.max(8, Math.round(8 * dimensions.zoomRatio))}px`,
              backgroundColor: lineColor,
              borderRadius: '50%',
              border: `${Math.max(1, Math.round(2 * dimensions.zoomRatio))}px solid ${
                theme === 'dark' ? '#1f2937' : '#ffffff'
              }`,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
            }}
          />

          {/* プロジェクト管理ツール風: 垂直線 */}
          <div
            className="absolute"
            style={{
              left: `${parentConnectionX}px`,
              top: `-${Math.round(dimensions.rowHeight.task * 0.4)}px`,
              width: `${lineWidth}px`,
              height: `${Math.round(dimensions.rowHeight.task * 0.9)}px`,
              backgroundColor: borderStyle === 'solid' ? lineColor : 'transparent',
              border: borderStyle === 'dotted' ? 
                `${lineWidth}px dotted ${lineColor}` : 
                borderStyle === 'dashed' ? 
                  `${lineWidth}px dashed ${lineColor}` : 'none',
              opacity: connectionStyle.opacity,
              zIndex: 1
            }}
          />
          
          {/* プロジェクト管理ツール風: 水平線 */}
          <div
            className="absolute"
            style={{
              left: `${Math.min(parentConnectionX, childConnectionX)}px`,
              top: `${taskBarCenterY}px`,
              transform: 'translateY(-50%)',
              width: `${Math.abs(childConnectionX - parentConnectionX) + Math.round(connectionOffset * 0.8)}px`,
              height: `${lineWidth}px`,
              backgroundColor: borderStyle === 'solid' ? lineColor : 'transparent',
              border: borderStyle === 'dotted' ? 
                `${lineWidth}px dotted ${lineColor}` : 
                borderStyle === 'dashed' ? 
                  `${lineWidth}px dashed ${lineColor}` : 'none',
              opacity: connectionStyle.opacity,
              zIndex: 1
            }}
          />
          
          {/* プロジェクト管理ツール風: 子タスク接続点の円 */}
          <div
            className="absolute rounded-full"
            style={{
              left: `${childConnectionX - Math.round(4 * dimensions.zoomRatio)}px`,
              top: `${taskBarCenterY}px`,
              transform: 'translateY(-50%)',
              width: `${Math.max(8, Math.round(8 * dimensions.zoomRatio))}px`,
              height: `${Math.max(8, Math.round(8 * dimensions.zoomRatio))}px`,
              backgroundColor: lineColor,
              border: `${Math.max(1, Math.round(2 * dimensions.zoomRatio))}px solid ${
                theme === 'dark' ? '#1f2937' : '#ffffff'
              }`,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
              zIndex: 2
            }}
          />
        </div>
      )
    } catch (error) {
      logger.error('Connection line rendering failed', { 
        taskId: task.id, 
        parentTaskId: parentTask.id, 
        error 
      })
      return null
    }
  }, [dimensions, getDatePosition, timeRange, viewUnit, theme, getConnectionLineStyle])

  // 🔧 修正：renderTaskBarをDraggableTaskBarに置き換え
  const renderTaskBar = useCallback((taskWithChildren: TaskWithChildren, project: Project) => {
    const { task } = taskWithChildren
    
    if (!isValidDate(task.startDate) || !isValidDate(task.dueDate)) return null

    const statusStyle = getTaskStatusStyle(task)
    const indent = calculateIndent(task.level)
    
    let startPos = getDatePosition(task.startDate, timeRange.startDate, dimensions.cellWidth, viewUnit)
    let endPos = getDatePosition(task.dueDate, timeRange.startDate, dimensions.cellWidth, viewUnit)
    
    const barWidth = Math.max(80, endPos - startPos + dimensions.cellWidth)
    const barHeight = Math.max(20, dimensions.taskBarHeight - (task.level * 2))

    // 🆕 追加：ドラッグ中かつ対象タスクの場合の処理
    const isCurrentlyDragging = isDragging && dragState.originalTask?.id === task.id

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
        {/* 🔧 修正：DraggableTaskBarコンポーネントを使用 */}
        <DraggableTaskBar
          taskWithChildren={taskWithChildren}
          project={project}
          startPos={startPos}
          barWidth={barWidth}
          barHeight={barHeight}
          statusStyle={statusStyle}
          dimensions={dimensions}
          zoomLevel={zoomLevel}
          theme={theme}
          onTaskClick={onToggleTask}
          onDragStart={handleDragStart}
          isDragging={isCurrentlyDragging}
          isPreview={false}
          previewStartDate={dragState.previewStartDate}
          previewDueDate={dragState.previewDueDate}
        />

        {/* 🆕 追加：ドラッグ中のプレビュー表示 */}
        {isCurrentlyDragging && dragState.previewStartDate && dragState.previewDueDate && (
          <DraggableTaskBar
            taskWithChildren={{
              ...taskWithChildren,
              task: {
                ...task,
                startDate: dragState.previewStartDate,
                dueDate: dragState.previewDueDate
              }
            }}
            project={project}
            startPos={getDatePosition(dragState.previewStartDate, timeRange.startDate, dimensions.cellWidth, viewUnit)}
            barWidth={Math.max(80, 
              getDatePosition(dragState.previewDueDate, timeRange.startDate, dimensions.cellWidth, viewUnit) - 
              getDatePosition(dragState.previewStartDate, timeRange.startDate, dimensions.cellWidth, viewUnit) + 
              dimensions.cellWidth
            )}
            barHeight={barHeight}
            statusStyle={{
              ...statusStyle,
              backgroundColor: statusStyle.backgroundColor.replace(/[\d.]+\)/, '0.5)')
            }}
            dimensions={dimensions}
            zoomLevel={zoomLevel}
            theme={theme}
            onDragStart={() => {}}
            isDragging={false}
            isPreview={true}
            previewStartDate={dragState.previewStartDate}
            previewDueDate={dragState.previewDueDate}
          />
        )}
      </div>
    )
  }, [
    getTaskStatusStyle, 
    calculateIndent, 
    getDatePosition, 
    dimensions, 
    timeRange, 
    viewUnit, 
    zoomLevel, 
    theme, 
    onToggleTask,
    handleDragStart,
    isDragging,
    dragState
  ])

  const getProjectTasks = useCallback((projectId: string): TaskWithChildren[] => {
    try {
      const projectTasks = tasks.filter(task => task.projectId === projectId)
      
      logger.info('Filtering tasks for project in all-projects mode', {
        projectId,
        totalTasks: tasks.length,
        projectTasks: projectTasks.length
      })
      
      const filtered = filterTasksForAllProjects(projectTasks, true, taskRelationMap)
      const sorted = sortTasksHierarchically(filtered, taskRelationMap)
      
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

      const result = visibleTasks.map(task => ({
        task,
        hasChildren: taskChildrenMap[task.id]?.hasChildren || false,
        childrenCount: taskChildrenMap[task.id]?.childrenCount || 0
      }))

      logger.info('Project tasks processed for timeline', {
        projectId,
        inputTasks: projectTasks.length,
        filteredTasks: filtered.length,
        visibleTasks: result.length
      })

      return result
    } catch (error) {
      logger.error('Project tasks filtering failed', { projectId, error })
      return []
    }
  }, [tasks, taskRelationMap, taskChildrenMap])

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
            {/* プロジェクトヘッダー */}
            <div 
              className="flex items-center relative cursor-pointer transition-colors duration-200 hover:opacity-90 project-header-row"
              onClick={() => {
                logger.info('Project header clicked in all-projects mode', { 
                  projectId: project.id, 
                  projectName: project.name,
                  currentCollapsed: project.collapsed,
                  taskCount: projectTasksWithChildren.length
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
              title={`${project.name} (${projectTasksWithChildren.length}タスク) - クリックで${project.collapsed ? '展開' : '折りたたみ'}`}
            >
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
            
            {/* プロジェクト内タスク */}
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
          left: `${getDatePosition(today, timeRange.startDate, dimensions.cellWidth, viewUnit) + (viewUnit === 'day' ? dimensions.cellWidth / 2 : dimensions.cellWidth / 2)}px`,
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