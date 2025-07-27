// システムプロンプト準拠：Timeline描画統合コンポーネント（ドラッグ機能統合版）
// 🔧 修正内容：DraggableTaskBarの統合、ドラッグ状態管理の追加

import React, { useMemo, useCallback, useEffect } from 'react'
import { 
  ChevronDown, ChevronRight, Factory
} from 'lucide-react'
import { Task, Project } from '@core/types'
import { TimelineRendererProps, TaskWithChildren } from '../types'
// import { DraggableTaskBar } from './DraggableTaskBar'
import { TaskRow } from './TaskRow'
import { SelectionBorder } from './SelectionBorder'
import { DragSelectionRectangle } from './DragSelectionRectangle'
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
  onTaskUpdate,
  selectedTaskIds,
  previewTaskIds,
  onRowClick,
  onRowMouseDown,
  _onSelectionClear,
  registerRowElement,
  taskPositions,
  updateTaskPosition,
  // ドラッグ選択状態
  isDragSelecting,
  dragSelectionStartY,
  dragSelectionCurrentY
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
    cellWidth: dimensions.cellWidth,
    viewUnit,
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
    const isDark = theme === 'dark'
    
    switch (status) {
      case 'completed':
        return {
          background: isDark 
            ? `linear-gradient(135deg, rgba(20, 83, 45, ${levelOpacity * 0.85}) 0%, rgba(25, 90, 50, ${levelOpacity * 0.9}) 50%, rgba(30, 97, 55, ${levelOpacity * 0.8}) 100%)`
            : `linear-gradient(135deg, rgba(239, 250, 244, ${levelOpacity * 0.85}) 0%, rgba(243, 251, 247, ${levelOpacity * 0.9}) 50%, rgba(247, 252, 249, ${levelOpacity * 0.8}) 100%)`,
          backgroundColor: isDark ? '#14532d' : '#eff8f4',
          borderColor: '#059669',
          textColor: 'text-gray-800 dark:text-gray-200',
        }
      case 'in-progress':
        return {
          background: isDark 
            ? `linear-gradient(135deg, rgba(30, 58, 138, ${levelOpacity * 0.85}) 0%, rgba(37, 99, 235, ${levelOpacity * 0.9}) 50%, rgba(45, 125, 255, ${levelOpacity * 0.8}) 100%)`
            : `linear-gradient(135deg, rgba(239, 246, 255, ${levelOpacity * 0.85}) 0%, rgba(243, 248, 255, ${levelOpacity * 0.9}) 50%, rgba(247, 250, 255, ${levelOpacity * 0.8}) 100%)`,
          backgroundColor: isDark ? '#1e3a8a' : '#eff6ff',
          borderColor: '#1d4ed8',
          textColor: 'text-gray-800 dark:text-gray-200',
          borderStyle: 'solid',
        }
      case 'overdue':
        return {
          background: isDark 
            ? `linear-gradient(135deg, rgba(127, 29, 29, ${levelOpacity * 0.85}) 0%, rgba(153, 27, 27, ${levelOpacity * 0.9}) 50%, rgba(185, 28, 28, ${levelOpacity * 0.8}) 100%)`
            : `linear-gradient(135deg, rgba(254, 242, 242, ${levelOpacity * 0.85}) 0%, rgba(254, 244, 244, ${levelOpacity * 0.9}) 50%, rgba(255, 247, 247, ${levelOpacity * 0.8}) 100%)`,
          backgroundColor: isDark ? '#7f1d1d' : '#fef2f2',
          borderColor: '#b91c1c',
          textColor: 'text-gray-800 dark:text-gray-200',
        }
      default: // 'not-started'
        return {
          background: isDark 
            ? `linear-gradient(135deg, rgba(76, 29, 149, ${levelOpacity * 0.85}) 0%, rgba(109, 40, 217, ${levelOpacity * 0.9}) 50%, rgba(124, 58, 237, ${levelOpacity * 0.8}) 100%)`
            : `linear-gradient(135deg, rgba(250, 245, 255, ${levelOpacity * 0.85}) 0%, rgba(252, 248, 255, ${levelOpacity * 0.9}) 50%, rgba(253, 250, 255, ${levelOpacity * 0.8}) 100%)`,
          backgroundColor: isDark ? '#4c1d95' : '#faf5ff',
          borderColor: '#7c3aed',
          textColor: 'text-gray-800 dark:text-gray-200',
        }
    }
  }, [theme])

  const calculateIndent = useCallback((level: number): number => {
    return level * Math.max(20, Math.round(32 * dimensions.zoomRatio))
  }, [dimensions.zoomRatio])

  const getConnectionLineStyle = useCallback((task: Task, project: Project): { 
    color: string; 
    gradientColor: string;
    opacity: number; 
    style: 'solid' | 'dotted' | 'dashed';
    width: number;
  } => {
    const baseOpacity = 0.8  // プロジェクト色との調和を考慮した透明度
    const baseWidth = Math.max(2, Math.round(3 * dimensions.zoomRatio))  // 少し太めの線
    
    // プロジェクト色をベースにした線色（適度な透明度でグラデーション）
    const projectColor = project.color
    const gradientColor = `linear-gradient(135deg, ${projectColor}CC, ${projectColor}99)`
    
    // プロジェクト管理ツール風の階層別線種
    switch (task.level) {
      case 1: // 親タスク（レベル1）- 実線
        return {
          color: projectColor,
          gradientColor,
          opacity: baseOpacity,
          style: 'solid',
          width: baseWidth
        }
      case 2: // 子タスク（レベル2）- 点線
        return {
          color: projectColor,
          gradientColor,
          opacity: baseOpacity * 0.9,
          style: 'dotted',
          width: baseWidth
        }
      default: // 孫タスク（レベル3以上）- 破線
        return {
          color: projectColor,
          gradientColor,
          opacity: baseOpacity * 0.8,
          style: 'dashed',
          width: Math.max(1, Math.round(baseWidth * 0.9))
        }
    }
  }, [dimensions.zoomRatio])

  const renderConnectionLines = useCallback((task: Task, parentTask: Task | null, project: Project) => {
    if (!parentTask || task.level === 0 || dimensions.zoomRatio < 0.3) return null
    if (!isValidDate(task.startDate) || !isValidDate(parentTask.startDate)) return null

    try {
      const parentTaskStartPos = getDatePosition(parentTask.startDate, timeRange.startDate, dimensions.cellWidth, viewUnit)
      const childTaskStartPos = getDatePosition(task.startDate, timeRange.startDate, dimensions.cellWidth, viewUnit)
      
      const connectionOffset = Math.max(15, Math.round(20 * dimensions.zoomRatio))
      
      // 親タスクの開始日から線を出現（ダイヤモンド接続点）
      const parentConnectionX = parentTaskStartPos - Math.round(8 * dimensions.zoomRatio)
      // 子タスクの左端で終了（矢印接続点）
      const childConnectionX = childTaskStartPos - connectionOffset
      
      const connectionStyle = getConnectionLineStyle(task, project)
      const lineColor = connectionStyle.color
      const gradientColor = connectionStyle.gradientColor
      const lineWidth = connectionStyle.width
      const borderStyle = connectionStyle.style
      
      const taskBarHeight = Math.max(24, dimensions.taskBarHeight - (task.level * 1.5))
      const taskBarCenterY = (dimensions.rowHeight.task - taskBarHeight) / 2 + (taskBarHeight / 2)

      return (
        <div className="absolute pointer-events-none">
          {/* 親タスク右端のダイヤモンド形接続点（アウトプット） */}
          <div
            className="absolute z-10"
            style={{
              left: `${parentConnectionX - Math.round(6 * dimensions.zoomRatio)}px`,
              top: `${taskBarCenterY}px`,
              transform: 'translateY(-50%) rotate(45deg)',
              width: `${Math.max(10, Math.round(10 * dimensions.zoomRatio))}px`,
              height: `${Math.max(10, Math.round(10 * dimensions.zoomRatio))}px`,
              background: gradientColor,
              border: `${Math.max(1, Math.round(2 * dimensions.zoomRatio))}px solid ${
                theme === 'dark' ? '#1f2937' : '#ffffff'
              }`,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            }}
          />

          {/* T字型結合部での垂直線 */}
          <div
            className="absolute"
            style={{
              left: `${parentConnectionX}px`,
              top: `-${Math.round(dimensions.rowHeight.task * 0.4)}px`,
              width: `${lineWidth}px`,
              height: `${Math.round(dimensions.rowHeight.task * 0.9)}px`,
              background: borderStyle === 'solid' ? gradientColor : 'transparent',
              border: borderStyle === 'dotted' ? 
                `${lineWidth}px dotted ${lineColor}` : 
                borderStyle === 'dashed' ? 
                  `${lineWidth}px dashed ${lineColor}` : 'none',
              opacity: connectionStyle.opacity,
              zIndex: 1
            }}
          />
          
          {/* グラデーション水平線 */}
          <div
            className="absolute"
            style={{
              left: `${Math.min(parentConnectionX, childConnectionX)}px`,
              top: `${taskBarCenterY}px`,
              transform: 'translateY(-50%)',
              width: `${Math.abs(childConnectionX - parentConnectionX) + Math.round(connectionOffset * 0.8)}px`,
              height: `${lineWidth}px`,
              background: borderStyle === 'solid' ? gradientColor : 'transparent',
              border: borderStyle === 'dotted' ? 
                `${lineWidth}px dotted ${lineColor}` : 
                borderStyle === 'dashed' ? 
                  `${lineWidth}px dashed ${lineColor}` : 'none',
              opacity: connectionStyle.opacity,
              zIndex: 1
            }}
          />
          
          {/* 子タスク左端の矢印形接続点（インプット） */}
          <div
            className="absolute"
            style={{
              left: `${childConnectionX - Math.round(8 * dimensions.zoomRatio)}px`,
              top: `${taskBarCenterY}px`,
              transform: 'translateY(-50%)',
              width: '0',
              height: '0',
              borderLeft: `${Math.max(8, Math.round(8 * dimensions.zoomRatio))}px solid ${lineColor}`,
              borderTop: `${Math.max(6, Math.round(6 * dimensions.zoomRatio))}px solid transparent`,
              borderBottom: `${Math.max(6, Math.round(6 * dimensions.zoomRatio))}px solid transparent`,
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
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

  // 🔧 修正：TaskRowコンポーネントを使用してHook問題を解決
  const renderTaskRow = useCallback((taskWithChildren: TaskWithChildren, project: Project) => {
    const { task } = taskWithChildren
    
    // 選択状態・プレビュー状態の確認
    const isSelected = selectedTaskIds?.has(task.id) || false
    const isPreview = previewTaskIds?.has(task.id) || false

    return (
      <TaskRow
        key={task.id}
        taskWithChildren={taskWithChildren}
        project={project}
        dimensions={dimensions}
        timeRange={timeRange}
        viewUnit={viewUnit}
        theme={theme}
        zoomLevel={zoomLevel}
        onDragStart={handleDragStart}
        isDragging={isDragging}
        dragState={dragState}
        onToggleTask={onToggleTask}
        isSelected={isSelected}
        isPreview={isPreview}
        onRowClick={onRowClick}
        onRowMouseDown={onRowMouseDown}
        registerRowElement={registerRowElement}
        updateTaskPosition={updateTaskPosition}
        getTaskStatusStyle={getTaskStatusStyle}
        calculateIndent={calculateIndent}
      />
    )
  }, [
    selectedTaskIds,
    previewTaskIds,
    dimensions,
    timeRange,
    viewUnit,
    theme,
    zoomLevel,
    handleDragStart,
    isDragging,
    dragState,
    onToggleTask,
    onRowClick,
    onRowMouseDown,
    registerRowElement,
    updateTaskPosition,
    getTaskStatusStyle,
    calculateIndent
  ])

  // プロジェクトタスクデータのメモ化（パフォーマンス改善）
  const projectTasksMap = useMemo(() => {
    const result = new Map<string, TaskWithChildren[]>()
    
    projects.forEach(project => {
      try {
        const projectTasks = tasks.filter(task => task.projectId === project.id)
        
        if (projectTasks.length === 0) {
          result.set(project.id, [])
          return
        }
        
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
                return false
              }
              
              currentParentId = taskRelationMap.parentMap[currentParentId] || null
            }
          }
          
          return true
        })

        const taskWithChildren = visibleTasks.map(task => ({
          task,
          hasChildren: taskChildrenMap[task.id]?.hasChildren || false,
          childrenCount: taskChildrenMap[task.id]?.childrenCount || 0
        }))

        result.set(project.id, taskWithChildren)
      } catch (error) {
        logger.error('Project tasks filtering failed', { projectId: project.id, error })
        result.set(project.id, [])
      }
    })
    
    logger.info('All project tasks processed for timeline', {
      projectCount: projects.length,
      totalProcessedTasks: Array.from(result.values()).reduce((sum, tasks) => sum + tasks.length, 0)
    })
    
    return result
  }, [projects, tasks, taskRelationMap, taskChildrenMap])

  const getProjectTasks = useCallback((projectId: string): TaskWithChildren[] => {
    return projectTasksMap.get(projectId) || []
  }, [projectTasksMap])

  const totalTimelineWidth = getTotalTimelineWidth()

  // 選択されたタスクを取得
  const selectedTasks = useMemo(() => {
    if (!selectedTaskIds || selectedTaskIds.size === 0) return []
    return tasks.filter(task => selectedTaskIds.has(task.id))
  }, [tasks, selectedTaskIds])

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
                  {renderConnectionLines(taskWithChildren.task, parentTask, project)}
                  {renderTaskRow(taskWithChildren, project)}
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
      
      {/* 選択範囲の枠線 */}
      {selectedTasks.length > 0 && taskPositions && (
        <SelectionBorder
          selectedTasks={selectedTasks}
          taskPositions={taskPositions}
          theme={theme}
          containerRef={{ current: null }}
        />
      )}
      
      {/* ドラッグ選択矩形 */}
      {isDragSelecting && dragSelectionStartY !== undefined && dragSelectionCurrentY !== undefined && (
        <DragSelectionRectangle
          startY={dragSelectionStartY}
          currentY={dragSelectionCurrentY}
          isVisible={isDragSelecting}
          theme={theme}
        />
      )}
    </div>
  )
}