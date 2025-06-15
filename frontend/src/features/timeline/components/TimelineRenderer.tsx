// システムプロンプト準拠：Timeline描画統合コンポーネント（タスクバー表示改善版）
// 🔧 修正内容：
// 1. 折り畳みバッジを左揃えに変更
// 2. 子タスク・孫タスクのタスク名を外部表示
// 3. 接続線の階層別色分け強化

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

  // 子タスクマップを事前計算（フック規則準拠）
  const taskChildrenMap = useMemo(() => buildTaskChildrenMap(tasks, taskRelationMap), [tasks, taskRelationMap])

  // プロジェクト名動的位置計算
  const getProjectNamePosition = useCallback((scrollLeft: number): number => {
    const visibleAreaWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.6, 800) : 800
    const nameWidth = 200
    return Math.max(8, Math.min(scrollLeft + 8, scrollLeft + visibleAreaWidth - nameWidth - 8))
  }, [])

  // タイムライン全体幅の計算
  const getTotalTimelineWidth = useCallback((): number => {
    const cellCount = viewUnit === 'week' ? visibleDates.length * 7 : visibleDates.length
    return Math.max(cellCount * dimensions.cellWidth, typeof window !== 'undefined' ? window.innerWidth : 1200)
  }, [visibleDates.length, dimensions.cellWidth, viewUnit])

  // タスクステータススタイル計算（ダークモード最適化配色適用）
  const getTaskStatusStyle = useCallback((task: Task) => {
    const status = calculateTimelineTaskStatus(task)
    const levelOpacity = Math.max(0.6, 1 - (task.level * 0.1))
    
    switch (status) {
      case 'completed':
        return {
          backgroundColor: `rgba(74, 222, 128, ${levelOpacity})`,   // 🟢 ダークモード緑
          borderColor: '#4ade80',
          textColor: task.level > 1 ? 'text-gray-700 dark:text-gray-300' : 'text-white'
        }
      case 'in-progress':
        return {
          backgroundColor: `rgba(96, 165, 250, ${levelOpacity})`,   // 🔵 ダークモード青
          borderColor: '#60a5fa',
          textColor: task.level > 1 ? 'text-gray-700 dark:text-gray-300' : 'text-white'
        }
      case 'overdue':
        return {
          backgroundColor: `rgba(248, 113, 113, ${levelOpacity})`,  // 🔴 ダークモード赤
          borderColor: '#f87171',
          textColor: task.level > 1 ? 'text-gray-700 dark:text-gray-300' : 'text-white'
        }
      default: // 'not-started'
        return {
          backgroundColor: `rgba(148, 163, 184, ${levelOpacity})`,  // 🔵 ダークモードグレー
          borderColor: '#94a3b8',
          textColor: task.level > 1 ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900'
        }
    }
  }, [])

  // 階層インデント計算
  const calculateIndent = useCallback((level: number): number => {
    return level * Math.max(20, Math.round(32 * dimensions.zoomRatio))
  }, [dimensions.zoomRatio])

  // 🔧 修正3: 接続線の階層別色分け強化
  const getConnectionLineColor = useCallback((task: Task): { color: string; opacity: number; style: string } => {
    const baseOpacity = Math.max(0.7, dimensions.zoomRatio)
    
    switch (task.level) {
      case 1: // 親子関係（第1階層）
        return {
          color: 'rgba(59, 130, 246, 1)', // 濃い青
          opacity: baseOpacity * 0.9,
          style: 'solid'
        }
      case 2: // 子孫関係（第2階層）
        return {
          color: 'rgba(34, 197, 94, 1)', // 濃い緑
          opacity: baseOpacity * 0.8,
          style: 'dashed'
        }
      case 3: // 曾孫関係（第3階層）
        return {
          color: 'rgba(245, 158, 11, 1)', // 濃いオレンジ
          opacity: baseOpacity * 0.7,
          style: 'dotted'
        }
      default: // より深い階層
        return {
          color: 'rgba(139, 92, 246, 1)', // 紫
          opacity: baseOpacity * 0.6,
          style: 'dotted'
        }
    }
  }, [dimensions.zoomRatio])

  // 🔧 統合修正：接続線描画（階層別色分け対応）
  const renderConnectionLines = useCallback((task: Task, parentTask: Task | null) => {
    if (!parentTask || task.level === 0 || dimensions.zoomRatio < 0.3) return null
    if (!isValidDate(task.startDate) || !isValidDate(parentTask.startDate)) return null

    try {
      // タスクバーの実際の位置を取得
      const parentTaskStartPos = getDatePosition(parentTask.startDate, timeRange.startDate, dimensions.cellWidth, viewUnit)
      const childTaskStartPos = getDatePosition(task.startDate, timeRange.startDate, dimensions.cellWidth, viewUnit)
      
      // 水平位置の精密調整
      const connectionOffset = Math.max(15, Math.round(20 * dimensions.zoomRatio))
      
      const parentConnectionX = parentTaskStartPos - connectionOffset
      const childConnectionX = childTaskStartPos - connectionOffset
      
      // 🔧 修正3: 階層別色分け適用
      const connectionStyle = getConnectionLineColor(task)
      const lineColor = connectionStyle.color.replace('1)', `${connectionStyle.opacity})`)
      const baseLineWidth = Math.max(2, Math.round(3 * dimensions.zoomRatio))
      
      // 階層レベル別線の太さ調整
      const levelLineWidth = task.level === 1 ? baseLineWidth : Math.max(1, baseLineWidth - 1)
      
      // 垂直位置の中央揃え
      const taskBarHeight = Math.max(20, dimensions.taskBarHeight - (task.level * 2))
      const taskBarCenterY = (dimensions.rowHeight.task - taskBarHeight) / 2 + (taskBarHeight / 2)
      
      // 🔧 修正3: スタイルパターンの生成
      const getDashedPattern = (style: string, color: string) => {
        switch (style) {
          case 'dashed':
            return `repeating-linear-gradient(to right, ${color} 0px, ${color} 6px, transparent 6px, transparent 12px)`
          case 'dotted':
            return `repeating-linear-gradient(to right, ${color} 0px, ${color} 3px, transparent 3px, transparent 9px)`
          default:
            return 'none'
        }
      }

      const getVerticalDashedPattern = (style: string, color: string) => {
        switch (style) {
          case 'dashed':
            return `repeating-linear-gradient(to bottom, ${color} 0px, ${color} 4px, transparent 4px, transparent 8px)`
          case 'dotted':
            return `repeating-linear-gradient(to bottom, ${color} 0px, ${color} 2px, transparent 2px, transparent 6px)`
          default:
            return 'none'
        }
      }

      return (
        <div className="absolute pointer-events-none">
          {/* 垂直線（親タスクから下へ）- 階層別色分け対応 */}
          <div
            className="absolute"
            style={{
              left: `${parentConnectionX}px`,
              top: `-${Math.round(dimensions.rowHeight.task * 0.4)}px`,
              width: `${levelLineWidth}px`,
              height: `${Math.round(dimensions.rowHeight.task * 0.9)}px`,
              backgroundColor: connectionStyle.style === 'solid' ? lineColor : 'transparent',
              backgroundImage: getVerticalDashedPattern(connectionStyle.style, lineColor),
              zIndex: 1
            }}
          />
          
          {/* 水平線（親から子への横線）- 階層別色分け対応 */}
          <div
            className="absolute"
            style={{
              left: `${Math.min(parentConnectionX, childConnectionX)}px`,
              top: `${taskBarCenterY}px`,
              transform: 'translateY(-50%)',
              width: `${Math.abs(childConnectionX - parentConnectionX) + Math.round(connectionOffset * 0.8)}px`,
              height: `${levelLineWidth}px`,
              backgroundColor: connectionStyle.style === 'solid' ? lineColor : 'transparent',
              backgroundImage: getDashedPattern(connectionStyle.style, lineColor),
              zIndex: 1
            }}
          />
          
          {/* 接続点（子タスク位置のマーカー）- 階層別色分け対応 */}
          <div
            className="absolute rounded-full border-2"
            style={{
              left: `${childConnectionX - Math.round(5 * dimensions.zoomRatio)}px`,
              top: `${taskBarCenterY}px`,
              transform: 'translateY(-50%)',
              width: `${Math.max(8, Math.round(10 * dimensions.zoomRatio))}px`,
              height: `${Math.max(8, Math.round(10 * dimensions.zoomRatio))}px`,
              backgroundColor: lineColor,
              borderColor: theme === 'dark' ? '#374151' : '#ffffff',
              borderWidth: `${Math.max(1, Math.round(2 * dimensions.zoomRatio))}px`,
              boxShadow: theme === 'dark' ? 
                '0 1px 3px rgba(0, 0, 0, 0.4)' : 
                '0 1px 3px rgba(0, 0, 0, 0.2)',
              zIndex: 2
            }}
          />
          
          {/* 階層レベル表示（デバッグ・理解支援用） */}
          {zoomLevel > 80 && task.level > 1 && (
            <div
              className="absolute text-xs font-bold text-center pointer-events-none"
              style={{
                left: `${childConnectionX - 15}px`,
                top: `${taskBarCenterY + 15}px`,
                width: '30px',
                color: lineColor,
                fontSize: `${Math.max(8, dimensions.fontSize.small - 2)}px`,
                textShadow: theme === 'dark' ? 
                  '1px 1px 2px rgba(0, 0, 0, 0.8)' : 
                  '1px 1px 2px rgba(255, 255, 255, 0.8)',
                zIndex: 3
              }}
            >
              L{task.level}
            </div>
          )}
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
  }, [dimensions, getDatePosition, timeRange, viewUnit, zoomLevel, theme, getConnectionLineColor])

  // 🔧 修正2: 外部タスク名表示の計算
  const calculateExternalNamePosition = useCallback((task: Task, taskStartPos: number, barWidth: number) => {
    const nameMargin = 12 // タスクバーからの距離
    const nameLeft = taskStartPos + barWidth + nameMargin
    const maxNameWidth = Math.max(150, 300 - (task.level * 30)) // 階層に応じて幅を調整
    
    return {
      left: nameLeft,
      maxWidth: maxNameWidth,
      fontSize: Math.max(10, dimensions.fontSize.small - (task.level * 2)),
      opacity: Math.max(0.7, 1 - (task.level * 0.15))
    }
  }, [dimensions.fontSize])

  // タスクバー描画（大幅修正版）
  const renderTaskBar = useCallback((taskWithChildren: TaskWithChildren, project: Project) => {
    const { task, hasChildren, childrenCount } = taskWithChildren
    
    if (!isValidDate(task.startDate) || !isValidDate(task.dueDate)) return null

    const statusStyle = getTaskStatusStyle(task)
    const indent = calculateIndent(task.level)
    const startPos = getDatePosition(task.startDate, timeRange.startDate, dimensions.cellWidth, viewUnit)
    const endPos = getDatePosition(task.dueDate, timeRange.startDate, dimensions.cellWidth, viewUnit)
    const barWidth = Math.max(80, endPos - startPos + dimensions.cellWidth)
    const barHeight = Math.max(20, dimensions.taskBarHeight - (task.level * 2))

    // 🔧 修正2: 外部タスク名表示用の計算
    const isExternalNameDisplay = task.level > 0 // 子タスク・孫タスク
    const externalNameStyle = isExternalNameDisplay ? calculateExternalNamePosition(task, startPos, barWidth) : null

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
          {/* 🔧 修正1: 左側アイコン群（折り畳みバッジを左揃えに移動） */}
          <div className="px-3 flex items-center flex-shrink-0 space-x-2">
            {/* ステータスアイコン */}
            <div className="flex items-center space-x-1">
              {task.completed && <Check size={Math.max(10, 14)} />}
              {calculateTimelineTaskStatus(task) === 'overdue' && !task.completed && 
                <AlertTriangle size={Math.max(10, 14)} />}
            </div>
            
            {/* 🔧 修正1: 折り畳みバッジを左側に配置 */}
            {hasChildren && dimensions.zoomRatio > 0.5 && (
              <div className="bg-white/30 rounded-full px-2 py-1 flex items-center space-x-1">
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
          
          {/* 🔧 修正2: タスク名表示（条件付き） */}
          {!isExternalNameDisplay && (
            <div 
              className="px-2 font-semibold truncate flex-1"
              style={{ fontSize: `${Math.max(10, dimensions.fontSize.small - task.level)}px` }}
            >
              {getDisplayText(task.name, zoomLevel, Math.max(10, 20 - task.level * 2))}
            </div>
          )}
        </div>

        {/* 🔧 修正2: 外部タスク名表示（子タスク・孫タスク用） */}
        {isExternalNameDisplay && externalNameStyle && (
          <div
            className={`absolute font-semibold pointer-events-none ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
            style={{
              left: `${externalNameStyle.left}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              maxWidth: `${externalNameStyle.maxWidth}px`,
              fontSize: `${externalNameStyle.fontSize}px`,
              opacity: externalNameStyle.opacity,
              zIndex: 3,
              padding: '4px 8px',
              backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              borderRadius: '4px',
              border: `1px solid ${theme === 'dark' ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.5)'}`,
              backdropFilter: 'blur(4px)',
              textShadow: theme === 'dark' ? 
                '1px 1px 2px rgba(0, 0, 0, 0.8)' : 
                '1px 1px 2px rgba(255, 255, 255, 0.8)'
            }}
            title={task.name}
          >
            <div className="truncate">
              {getDisplayText(task.name, zoomLevel, Math.max(15, 25 - task.level * 3))}
            </div>
            {/* 階層レベル表示 */}
            <div 
              className="text-xs opacity-60 mt-1"
              style={{ fontSize: `${Math.max(8, externalNameStyle.fontSize - 2)}px` }}
            >
              Level {task.level}
            </div>
          </div>
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
    calculateExternalNamePosition
  ])

  // プロジェクト表示用タスクフィルタリング（事前計算済み子タスク情報使用）
  const getProjectTasks = useCallback((projectId: string): TaskWithChildren[] => {
    try {
      const filtered = filterTasksForTimeline(tasks, projectId, true, taskRelationMap)
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

  // タイムライン全体幅
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
            
            {/* プロジェクト内タスク（折りたたみ対応） */}
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