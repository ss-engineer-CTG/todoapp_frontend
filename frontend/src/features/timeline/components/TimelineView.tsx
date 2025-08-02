// システムプロンプト準拠：メインタイムラインビューコンポーネント（全プロジェクト対応版）
// 🔧 修正内容：ドラッグ機能の統合、onTaskUpdateプロパティの追加、コンテキストメニュー統合

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { TimelineControls } from './TimelineControls'
import { TimelineRenderer } from './TimelineRenderer'
import { TimelineMenuBar } from './TimelineMenuBar'
import { DateShiftDialog, DateShiftOptions } from './DateShiftDialog'
import { TaskNameDialog } from './TaskNameDialog'
import { TimelineViewProps } from '../types'
import { useTimeline } from '../hooks/useTimeline'
import { useRowSelection } from '../hooks/useRowSelection'
import { useTimelineKeyboard } from '../hooks/useTimelineKeyboard'
import { useTimelineTaskOperations } from '../hooks/useTimelineTaskOperations'
import { buildTaskRelationMap } from '@tasklist/utils/task'
import { useTheme } from '@core/components/ThemeProvider'
import { Task } from '@core/types'
import { apiService } from '@core/services/api'
import { 
  logger,
  getDateCellClass,
  getMonthName,
  getWeekNumber,
  calculateDateHeaderFontSize
} from '@core/utils'
import { isFirstDayOfWeek, isFirstDayOfMonth } from '../utils'
import { DateShiftType } from './ContextMenu'

// 🔧 修正：onTaskUpdateプロパティとキーボード機能を含むインターフェース
interface ExtendedTimelineViewProps extends TimelineViewProps {
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>
  selectedProjectId?: string
  refreshTasks?: () => Promise<void>
}

export const TimelineView: React.FC<ExtendedTimelineViewProps> = ({
  projects,
  tasks,
  onViewModeChange,
  onScrollToToday,
  onToggleProject,
  onToggleTask,
  onExpandAll,
  onCollapseAll,
  onTaskUpdate, // 🆕 追加
  selectedProjectId, // 🆕 追加
  refreshTasks // 🆕 追加
}) => {
  const { resolvedTheme } = useTheme()
  
  // ダイアログの状態管理
  const [isDateShiftDialogOpen, setIsDateShiftDialogOpen] = useState(false)
  const [currentShiftType, setCurrentShiftType] = useState<DateShiftType>('both')
  
  // タスク名入力ダイアログの状態管理
  const [isTaskNameDialogOpen, setIsTaskNameDialogOpen] = useState(false)
  const [taskDialogType, setTaskDialogType] = useState<'task' | 'subtask'>('task')
  const [taskDialogParentTask, setTaskDialogParentTask] = useState<Task | null>(null)
  
  const {
    state,
    dimensions,
    timeRange,
    visibleDates,
    setZoomLevel,
    setViewUnit,
    setScrollLeft,
    fitToScreen,
    scrollToToday,
    timelineRef
  } = useTimeline(100, 'week')

  // 行レベル選択機能
  const {
    selectedTaskIds,
    selectedCount,
    isSelecting,
    isDragSelecting,
    previewTaskIds,
    dragSelectionStartY,
    dragSelectionCurrentY,
    clearSelection,
    getSelectedTasks,
    handleRowClick,
    handleRowMouseDown,
    updateTasksRef,
    registerRowElement,
    taskPositions,
    updateTaskPosition,
    isRecentDragEnd
  } = useRowSelection()

  // 🆕 プロジェクト選択状態（デフォルト値設定）
  const currentSelectedProjectId = selectedProjectId || (projects.length > 0 ? projects[0].id : null)
  
  // 🆕 データ再読み込み関数（デフォルト実装）
  const handleRefreshTasks = useCallback(async () => {
    if (refreshTasks) {
      await refreshTasks()
    } else {
      // デフォルト実装：何もしない（親コンポーネントが管理）
      logger.info('Tasks refresh requested but no refresh function provided')
    }
  }, [refreshTasks])

  // 🆕 タスク名ダイアログ制御
  const handleShowTaskNameDialog = useCallback((taskType: 'task' | 'subtask', parentTask?: Task) => {
    setTaskDialogType(taskType)
    setTaskDialogParentTask(parentTask || null)
    setIsTaskNameDialogOpen(true)
    
    logger.info('Task name dialog opened from keyboard shortcut', {
      taskType,
      parentTaskId: parentTask?.id,
      parentTaskName: parentTask?.name
    })
  }, [])

  const handleTaskNameDialogClose = useCallback(() => {
    setIsTaskNameDialogOpen(false)
    setTaskDialogParentTask(null)
    
    logger.info('Task name dialog closed')
  }, [])

  // 🆕 タイムライン用タスク操作
  const {
    createTaskWithName,
    createSubTaskWithName,
    toggleTaskCompletion,
    deleteTask
  } = useTimelineTaskOperations({
    tasks,
    selectedProjectId: currentSelectedProjectId,
    onTaskUpdate,
    refreshTasks: handleRefreshTasks
  })

  const handleTaskNameDialogConfirm = useCallback(async (taskName: string) => {
    try {
      if (taskDialogType === 'subtask' && taskDialogParentTask) {
        // サブタスク作成
        await createSubTaskWithName(
          taskDialogParentTask.id,
          taskDialogParentTask.level + 1,
          taskName
        )
        
        logger.info('Sub task created from dialog', {
          taskName,
          parentTaskId: taskDialogParentTask.id,
          parentTaskName: taskDialogParentTask.name
        })
      } else {
        // 通常タスク作成
        const parentId = taskDialogParentTask?.parentId || null
        const level = taskDialogParentTask?.level || 0
        
        await createTaskWithName(parentId, level, taskName)
        
        logger.info('Task created from dialog', {
          taskName,
          parentId,
          level
        })
      }
    } catch (error) {
      logger.error('Task creation from dialog failed', {
        taskName,
        taskDialogType,
        parentTaskId: taskDialogParentTask?.id,
        error
      })
      throw error
    }
  }, [taskDialogType, taskDialogParentTask, createTaskWithName, createSubTaskWithName])

  // 🆕 タイムライン用キーボードショートカット
  const keyboardState = useTimelineKeyboard({
    tasks,
    selectedTaskIds,
    selectedCount,
    isSelecting,
    getSelectedTasks,
    onCreateTaskWithName: createTaskWithName,
    onCreateSubTaskWithName: createSubTaskWithName,
    onToggleCompletion: toggleTaskCompletion,
    onDeleteTask: deleteTask,
    clearSelection,
    onShowTaskNameDialog: handleShowTaskNameDialog,
    isTimelineActive: true // タイムラインビューがアクティブ
  })

  const today = new Date()
  
  // 動的フォントサイズ計算
  const dynamicFontSizes = useMemo(() => 
    calculateDateHeaderFontSize(dimensions.cellWidth, state.viewUnit, state.zoomLevel),
    [dimensions.cellWidth, state.viewUnit, state.zoomLevel]
  )

  // 月グループ計算用のuseMemo（条件付きレンダリング外に移動）
  const monthGroups = useMemo(() => {
    if (state.viewUnit !== 'day') return []
    
    const groups: Array<{month: number, year: number, startIndex: number, width: number}> = []
    let currentMonth: number | null = null
    let monthStart = 0
    let monthWidth = 0
    
    visibleDates.forEach((date, index) => {
      if (currentMonth !== date.getMonth()) {
        if (currentMonth !== null) {
          groups.push({
            month: currentMonth,
            year: visibleDates[monthStart].getFullYear(),
            startIndex: monthStart,
            width: monthWidth * dimensions.cellWidth
          })
        }
        currentMonth = date.getMonth()
        monthStart = index
        monthWidth = 1
      } else {
        monthWidth++
      }
      
      if (index === visibleDates.length - 1) {
        groups.push({
          month: currentMonth!,
          year: date.getFullYear(),
          startIndex: monthStart,
          width: monthWidth * dimensions.cellWidth
        })
      }
    })
    
    logger.debug('Month groups calculated for timeline header', {
      groupCount: groups.length,
      cellWidth: dimensions.cellWidth,
      visibleDatesCount: visibleDates.length
    })
    
    return groups
  }, [state.viewUnit, visibleDates, dimensions.cellWidth])
  
  const taskRelationMap = useMemo(() => {
    logger.info('Building task relation map for all projects', {
      taskCount: tasks.length,
      projectCount: projects.length,
      viewType: 'timeline_all_projects'
    })
    
    return buildTaskRelationMap(tasks)
  }, [tasks, projects.length])

  const projectTaskStats = useMemo(() => {
    const stats = projects.map(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id)
      const completedTasks = projectTasks.filter(task => task.completed).length
      const activeTasks = projectTasks.filter(task => !task.completed).length
      
      return {
        projectId: project.id,
        projectName: project.name,
        totalTasks: projectTasks.length,
        completedTasks,
        activeTasks,
        completionRate: projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0
      }
    })
    
    logger.info('Timeline project statistics calculated', {
      projectCount: stats.length,
      totalTasksAcrossProjects: stats.reduce((sum, stat) => sum + stat.totalTasks, 0),
      averageCompletionRate: stats.length > 0 ? 
        Math.round(stats.reduce((sum, stat) => sum + stat.completionRate, 0) / stats.length) : 0
    })
    
    return stats
  }, [projects, tasks])

  // 階層ソート済みタスクリストを行選択フックに通知
  const hierarchicalTasks = useMemo(() => {
    return tasks // TimelineRendererで階層ソートされるため、ここでは元の配列を使用
  }, [tasks])

  const handleFitToScreen = useCallback(() => {
    if (timelineRef.current) {
      fitToScreen(timelineRef.current.clientWidth)
    }
  }, [fitToScreen])

  const handleScrollToToday = useCallback(() => {
    logger.info('Today scroll requested from timeline view (all projects)')
    const scrollPosition = scrollToToday()
    return scrollPosition
  }, [scrollToToday])

  const handleTimelineScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollLeft = e.currentTarget.scrollLeft
    setScrollLeft(newScrollLeft)
    
    const headerElement = document.querySelector('.timeline-date-header') as HTMLElement
    if (headerElement) {
      headerElement.scrollLeft = newScrollLeft
    }
  }, [setScrollLeft])

  const handleToggleProjectLocal = useCallback((projectId: string) => {
    logger.info('Toggling project in all projects timeline', { 
      projectId,
      totalProjects: projects.length
    })
    onToggleProject?.(projectId)
  }, [onToggleProject, projects.length])

  const handleToggleTaskLocal = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    logger.info('Toggling task in all projects timeline', { 
      taskId,
      taskProject: task?.projectId,
      totalTasks: tasks.length
    })
    onToggleTask?.(taskId)
  }, [onToggleTask, tasks])

  const handleExpandAll = useCallback(() => {
    logger.info('Expanding all projects and tasks in timeline', {
      projectCount: projects.length,
      taskCount: tasks.length
    })
    onExpandAll?.()
  }, [onExpandAll, projects.length, tasks.length])

  const handleCollapseAll = useCallback(() => {
    logger.info('Collapsing all projects and tasks in timeline', {
      projectCount: projects.length,
      taskCount: tasks.length
    })
    onCollapseAll?.()
  }, [onCollapseAll, projects.length, tasks.length])

  // 選択解除ハンドラー（空白部分クリック時）
  const handleSelectionClear = useCallback((event: React.MouseEvent) => {
    // ドラッグ選択中または直後の場合はクリアを防ぐ
    if (isDragSelecting || isRecentDragEnd()) {
      logger.info('Ignoring background click during or after drag selection', {
        isDragSelecting,
        isRecentDragEnd: isRecentDragEnd()
      })
      return
    }
    
    // タスク行やその子要素がクリックされた場合はクリアしない
    const target = event.target as HTMLElement
    const isTaskRowClick = target.closest('.timeline-task-bar') || 
                          target.closest('[data-task-row]') ||
                          target.closest('.selection-border')
    
    if (isTaskRowClick) {
      logger.info('Ignoring click on task-related element', {
        targetClassName: target.className,
        closestTaskRow: !!target.closest('[data-task-row]')
      })
      return
    }
    
    if (isSelecting) {
      logger.info('Clearing selection from timeline background click', {
        previousSelectedCount: selectedCount,
        targetElement: target.className
      })
      clearSelection()
    }
  }, [isSelecting, isDragSelecting, selectedCount, clearSelection, isRecentDragEnd])

  // 日付ずらし機能のハンドラー
  const handleDateShift = useCallback((type: DateShiftType) => {
    setCurrentShiftType(type)
    setIsDateShiftDialogOpen(true)
  }, [])

  const handleDateShiftConfirm = useCallback(async (options: DateShiftOptions) => {
    const selectedTasks = getSelectedTasks(tasks)
    const taskIds = selectedTasks.map(task => task.id)
    
    try {
      logger.info('Batch date shift requested', {
        taskIds,
        shiftType: options.type,
        direction: options.direction,
        days: options.days
      })
      
      const result = await apiService.batchShiftTaskDates(
        taskIds,
        options.type,
        options.direction,
        options.days
      )
      
      logger.info('Batch date shift completed', {
        result,
        affectedCount: result.affected_count
      })
      
      // タスクデータの再読み込み（onTaskUpdateがある場合）
      if (onTaskUpdate) {
        // 個別のタスクに対してonTaskUpdateを呼び出すのではなく、
        // バッチ処理が完了したことを通知
        await Promise.all(
          selectedTasks.map(task => onTaskUpdate(task.id, {}))
        )
      }
      
      // 選択解除
      clearSelection()
      
    } catch (error) {
      logger.error('Batch date shift failed', {
        error,
        taskIds,
        options
      })
      throw error
    }
  }, [tasks, getSelectedTasks, clearSelection, onTaskUpdate])

  const getAppClasses = useCallback(() => {
    return resolvedTheme === 'dark' 
      ? {
          app: "bg-gray-950 text-gray-50",
          dateHeader: "bg-gray-900 border-gray-600 text-white"
        }
      : {
          app: "bg-gray-50 text-gray-900",
          dateHeader: "bg-white border-gray-300 text-gray-900"
        }
  }, [resolvedTheme])

  const classes = getAppClasses()

  // すべてのEffect hookを早期returnの前に配置
  useEffect(() => {
    if (onScrollToToday) {
      logger.info('Registering scroll to today function with parent component (all projects mode)')
      onScrollToToday(handleScrollToToday)
    }
  }, [onScrollToToday, handleScrollToToday])

  useEffect(() => {
    updateTasksRef(hierarchicalTasks)
  }, [hierarchicalTasks, updateTasksRef])

  useEffect(() => {
    logger.info('Timeline view state changed (all projects mode)', {
      viewUnit: state.viewUnit,
      zoomLevel: state.zoomLevel,
      taskCount: tasks.length,
      projectCount: projects.length,
      visibleDatesCount: visibleDates.length,
      selectedProjectId: currentSelectedProjectId,
      keyboardShortcutsActive: keyboardState.isActive,
      selectedTasksCount: selectedCount,
      projectStats: projectTaskStats.reduce((summary, stat) => {
        summary[stat.projectId] = {
          name: stat.projectName,
          tasks: stat.totalTasks,
          completion: `${stat.completionRate}%`
        }
        return summary
      }, {} as { [key: string]: { name: string; tasks: number; completion: string } })
    })
  }, [state.viewUnit, state.zoomLevel, tasks.length, projects.length, visibleDates.length, projectTaskStats, currentSelectedProjectId, keyboardState.isActive, selectedCount])

  // 条件付きレンダリング用の変数
  const hasNoProjects = projects.length === 0
  const hasNoTasks = tasks.length === 0

  return (
    <div className={`h-screen flex flex-col ${classes.app} overflow-hidden`}>
      <TimelineControls
        zoomLevel={state.zoomLevel}
        onZoomChange={setZoomLevel}
        viewUnit={state.viewUnit}
        onViewUnitChange={setViewUnit}
        onTodayClick={handleScrollToToday}
        onFitToScreen={handleFitToScreen}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onViewModeChange={onViewModeChange}
      />
      
      {/* プロジェクトがない場合の表示 */}
      {hasNoProjects && (
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-bold mb-4">プロジェクトがありません</h2>
            <p className="text-muted-foreground mb-6">
              リストビューでプロジェクトを作成してからタイムラインビューをお使いください
            </p>
            <button
              onClick={() => onViewModeChange?.('tasklist')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              リストビューに戻る
            </button>
          </div>
        </main>
      )}
      
      {/* タスクがない場合の表示 */}
      {!hasNoProjects && hasNoTasks && (
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold mb-4">タスクがありません</h2>
            <p className="text-muted-foreground mb-6">
              リストビューでタスクを作成してからタイムラインビューで確認できます
            </p>
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2">プロジェクト一覧:</h3>
              <ul className="text-left space-y-1">
                {projects.map(project => (
                  <li key={project.id} className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: project.color }}
                    />
                    {project.name}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => onViewModeChange?.('tasklist')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              リストビューに戻る
            </button>
          </div>
        </main>
      )}
      
      {/* 通常のタイムライン表示 */}
      {!hasNoProjects && !hasNoTasks && (
        <>
          {/* メニューバー（一括操作）*/}
          <TimelineMenuBar
            selectedTasks={getSelectedTasks(tasks)}
            onDateShift={handleDateShift}
            onClearSelection={clearSelection}
            theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
          />
          
          <main className="flex-1 flex flex-col overflow-hidden w-full min-w-0" style={{ height: 'calc(100vh - 114px)' }}>
        <div className={`${classes.dateHeader} border-b-2 overflow-hidden w-full`}>
          <div className="w-full overflow-x-hidden timeline-date-header">
            {state.viewUnit === 'day' ? (
              <div>
                <div className="flex border-b" style={{ 
                  height: `${Math.max(20, Math.round(dimensions.rowHeight.project * 0.6))}px`,
                  minWidth: `${visibleDates.length * dimensions.cellWidth}px` 
                }}>
                  {monthGroups.map((monthGroup) => (
                    <div 
                      key={`month-${monthGroup.year}-${monthGroup.month}`}
                      className={`text-center font-bold border-r-2 ${classes.dateHeader} flex items-center justify-center`}
                      style={{ 
                        width: `${monthGroup.width}px`,
                        minWidth: `${monthGroup.width}px`,
                        borderRightWidth: '3px',
                        borderRightColor: resolvedTheme === 'dark' ? '#6366f1' : '#4f46e5',
                        fontSize: `${dynamicFontSizes.base}px`,
                        backgroundColor: resolvedTheme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(79, 70, 229, 0.05)'
                      }}
                    >
                      <div className="text-indigo-700 dark:text-indigo-300 font-bold">
                        {monthGroup.year}年{getMonthName(monthGroup.month)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex" style={{ 
                  height: `${Math.max(24, Math.round(dimensions.rowHeight.project * 0.8))}px`,
                  minWidth: `${visibleDates.length * dimensions.cellWidth}px` 
                }}>
                  {visibleDates.map((date, index) => {
                    const isFirstWeek = isFirstDayOfWeek(date)
                    const nextDate = index < visibleDates.length - 1 ? visibleDates[index + 1] : null
                    const isLastDateOfMonth = nextDate ? date.getMonth() !== nextDate.getMonth() : index === visibleDates.length - 1
                    
                    return (
                      <div 
                        key={date.getTime()} 
                        className={`text-center font-semibold py-1 border-r ${classes.dateHeader} ${getDateCellClass(date, today, resolvedTheme)} flex items-center justify-center`}
                        style={{ 
                          width: `${dimensions.cellWidth}px`,
                          minWidth: `${dimensions.cellWidth}px`,
                          borderRightWidth: isLastDateOfMonth ? '3px' : isFirstWeek ? '2px' : '1px',
                          borderRightColor: isLastDateOfMonth ? (resolvedTheme === 'dark' ? '#6366f1' : '#4f46e5') : isFirstWeek ? (resolvedTheme === 'dark' ? '#6b7280' : '#9ca3af') : (resolvedTheme === 'dark' ? '#4b5563' : '#d1d5db'),
                          fontSize: `${dynamicFontSizes.small}px`
                        }}
                      >
                        <div className={`font-medium ${
                          date.getDay() === 0 || date.getDay() === 6
                            ? 'text-gray-600 dark:text-gray-400'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {date.getDate()}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex" style={{ 
                height: `${Math.max(36, dimensions.rowHeight.project + 4)}px`,
                minWidth: `${visibleDates.length * dimensions.cellWidth * 7}px` 
              }}>
                {visibleDates.map((date, index) => {
                  const weekStart = new Date(date)
                  const weekEnd = new Date(date)
                  weekEnd.setDate(weekEnd.getDate() + 6)
                  
                  const isFirstMonth = isFirstDayOfMonth(date, index, visibleDates)
                  const nextWeek = index < visibleDates.length - 1 ? visibleDates[index + 1] : null
                  const isLastWeekOfMonth = nextWeek ? date.getMonth() !== nextWeek.getMonth() : index === visibleDates.length - 1
                  
                  return (
                    <div 
                      key={date.getTime()} 
                      className={`text-center font-semibold py-2 border-r-2 ${classes.dateHeader} flex flex-col justify-center`}
                      style={{ 
                        width: `${dimensions.cellWidth * 7}px`,
                        minWidth: `${dimensions.cellWidth * 7}px`,
                        borderRightWidth: isLastWeekOfMonth ? '4px' : '2px',
                        borderRightColor: isLastWeekOfMonth ? (resolvedTheme === 'dark' ? '#6366f1' : '#4f46e5') : (resolvedTheme === 'dark' ? '#6b7280' : '#9ca3af'),
                        borderLeftWidth: isFirstMonth ? '4px' : '0px',
                        borderLeftColor: isFirstMonth ? (resolvedTheme === 'dark' ? '#6366f1' : '#4f46e5') : undefined,
                      }}
                    >
                      <div className="font-bold text-gray-900 dark:text-white" style={{ fontSize: `${dynamicFontSizes.base}px` }}>
                        {weekStart.getMonth() === weekEnd.getMonth() 
                          ? (isFirstMonth 
                              ? `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getDate()}`
                              : `${weekStart.getDate()}-${weekEnd.getDate()}`)
                          : `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
                        }
                      </div>
                      {state.zoomLevel > 40 && (
                        <div className="text-gray-600 dark:text-gray-300 mt-1" style={{ fontSize: `${dynamicFontSizes.small}px` }}>
                          第{getWeekNumber(weekStart)}週
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        
        <div 
          className="w-full flex-1 relative overflow-auto timeline-content" 
          onScroll={handleTimelineScroll}
          onClick={handleSelectionClear}
          ref={timelineRef}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: resolvedTheme === 'dark' ? '#6b7280 #1f2937' : '#9ca3af #ffffff'
          }}
        >
          {/* 🔧 修正：TimelineRendererに行選択機能を渡す */}
          <TimelineRenderer
            projects={projects}
            tasks={tasks}
            taskRelationMap={taskRelationMap}
            zoomLevel={state.zoomLevel}
            viewUnit={state.viewUnit}
            theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
            timeRange={timeRange}
            visibleDates={visibleDates}
            scrollLeft={state.scrollLeft}
            onToggleProject={handleToggleProjectLocal}
            onToggleTask={handleToggleTaskLocal}
            onTaskUpdate={onTaskUpdate}
            selectedTaskIds={selectedTaskIds}
            previewTaskIds={previewTaskIds}
            onRowClick={handleRowClick}
            onRowMouseDown={handleRowMouseDown}
            onSelectionClear={handleSelectionClear}
            registerRowElement={registerRowElement}
            taskPositions={taskPositions}
            updateTaskPosition={updateTaskPosition}
            isDragSelecting={isDragSelecting}
            dragSelectionStartY={dragSelectionStartY}
            dragSelectionCurrentY={dragSelectionCurrentY}
          />
          </div>
        </main>
        </>
      )}
      
      {/* コンテキストメニュー（右クリックメニュー）- 暫定的に無効化 */}
      {/* {selectedCount > 0 && (
        <ContextMenu
          selectedTasks={getSelectedTasks(tasks)}
          isOpen={isContextMenuOpen}
          onOpenChange={setIsContextMenuOpen}
          onDateShift={handleDateShift}
          onClearSelection={clearSelection}
        >
          <div 
            className="fixed inset-0 z-40 pointer-events-none"
            onContextMenu={handleContextMenu}
          />
        </ContextMenu>
      )} */}
      
      {/* 日付ずらしダイアログ */}
      <DateShiftDialog
        isOpen={isDateShiftDialogOpen}
        onClose={() => setIsDateShiftDialogOpen(false)}
        selectedTasks={getSelectedTasks(tasks)}
        shiftType={currentShiftType}
        onConfirm={handleDateShiftConfirm}
      />
      
      {/* タスク名入力ダイアログ */}
      <TaskNameDialog
        isOpen={isTaskNameDialogOpen}
        onClose={handleTaskNameDialogClose}
        onConfirm={handleTaskNameDialogConfirm}
        taskType={taskDialogType}
        parentTaskName={taskDialogParentTask?.name}
      />
    </div>
  )
}