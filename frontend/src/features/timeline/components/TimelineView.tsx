// システムプロンプト準拠：メインタイムラインビューコンポーネント（全プロジェクト対応版）
// 🔧 修正内容：ドラッグ機能の統合、onTaskUpdateプロパティの追加

import React, { useCallback, useEffect, useMemo } from 'react'
import { TimelineControls } from './TimelineControls'
import { TimelineRenderer } from './TimelineRenderer'
import { TimelineViewProps, SelectionMode } from '../types'
import { useTimeline } from '../hooks/useTimeline'
import { useRowSelection } from '../hooks/useRowSelection'
import { buildTaskRelationMap } from '@tasklist/utils/task'
import { useTheme } from '@core/components/ThemeProvider'
import { Task } from '@core/types'
import { 
  logger,
  getDateCellClass,
  getMonthName,
  getWeekNumber,
  calculateDateHeaderFontSize
} from '@core/utils'
import { isFirstDayOfWeek, isFirstDayOfMonth } from '../utils'

// 🔧 修正：onTaskUpdateプロパティを含むインターフェース
interface ExtendedTimelineViewProps extends TimelineViewProps {
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>
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
  onTaskUpdate // 🆕 追加
}) => {
  const { theme } = useTheme()
  
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
    selectAll,
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

  const today = new Date()
  
  // 動的フォントサイズ計算
  const dynamicFontSizes = useMemo(() => 
    calculateDateHeaderFontSize(dimensions.cellWidth, state.viewUnit, state.zoomLevel),
    [dimensions.cellWidth, state.viewUnit, state.zoomLevel]
  )
  
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

  useEffect(() => {
    if (onScrollToToday) {
      logger.info('Registering scroll to today function with parent component (all projects mode)')
      onScrollToToday(handleScrollToToday)
    }
  }, [onScrollToToday, handleScrollToToday])

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

  // 全選択ハンドラー（Ctrl+A）
  const handleSelectAll = useCallback(() => {
    logger.info('Select all tasks requested', {
      totalTasks: tasks.length,
      currentSelectedCount: selectedCount
    })
    selectAll(tasks)
  }, [tasks, selectedCount, selectAll])

  // タスクリストの更新（行選択フックに通知）
  useEffect(() => {
    updateTasksRef(tasks)
  }, [tasks, updateTasksRef])

  const getAppClasses = useCallback(() => {
    return theme === 'dark' 
      ? {
          app: "bg-gray-950 text-gray-50",
          dateHeader: "bg-gray-900 border-gray-600 text-white"
        }
      : {
          app: "bg-gray-50 text-gray-900",
          dateHeader: "bg-white border-gray-300 text-gray-900"
        }
  }, [theme])

  const classes = getAppClasses()

  // 重複関数削除：utils/index.tsからインポート済み

  useEffect(() => {
    logger.info('Timeline view state changed (all projects mode)', {
      viewUnit: state.viewUnit,
      zoomLevel: state.zoomLevel,
      taskCount: tasks.length,
      projectCount: projects.length,
      visibleDatesCount: visibleDates.length,
      projectStats: projectTaskStats.reduce((summary, stat) => {
        summary[stat.projectId] = {
          name: stat.projectName,
          tasks: stat.totalTasks,
          completion: `${stat.completionRate}%`
        }
        return summary
      }, {} as { [key: string]: { name: string; tasks: number; completion: string } })
    })
  }, [state.viewUnit, state.zoomLevel, tasks.length, projects.length, visibleDates.length, projectTaskStats])

  if (projects.length === 0) {
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
      </div>
    )
  }

  if (tasks.length === 0) {
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
      </div>
    )
  }

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
      
      {/* 複数選択状態インジケーター */}
      {isSelecting && (
        <div className={`px-4 py-2 border-b ${
          theme === 'dark' ? 'bg-blue-900/20 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedCount}個のタスクが選択されています
            </span>
            <button
              onClick={clearSelection}
              className="text-sm px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
            >
              選択解除
            </button>
          </div>
        </div>
      )}
      
      <main className="flex-1 flex flex-col overflow-hidden w-full min-w-0" style={{ height: 'calc(100vh - 114px)' }}>
        <div className={`${classes.dateHeader} border-b-2 overflow-hidden w-full`}>
          <div className="w-full overflow-x-hidden timeline-date-header">
            {state.viewUnit === 'day' ? (
              <div>
                <div className="flex border-b" style={{ 
                  height: `${Math.max(20, Math.round(dimensions.rowHeight.project * 0.6))}px`,
                  minWidth: `${visibleDates.length * dimensions.cellWidth}px` 
                }}>
                  {(() => {
                    const monthGroups: Array<{month: number, year: number, startIndex: number, width: number}> = []
                    let currentMonth: number | null = null
                    let monthStart = 0
                    let monthWidth = 0
                    
                    visibleDates.forEach((date, index) => {
                      if (currentMonth !== date.getMonth()) {
                        if (currentMonth !== null) {
                          monthGroups.push({
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
                        monthGroups.push({
                          month: currentMonth!,
                          year: date.getFullYear(),
                          startIndex: monthStart,
                          width: monthWidth * dimensions.cellWidth
                        })
                      }
                    })
                    
                    return monthGroups.map((monthGroup) => (
                      <div 
                        key={`month-${monthGroup.year}-${monthGroup.month}`}
                        className={`text-center font-bold border-r-2 ${classes.dateHeader} flex items-center justify-center`}
                        style={{ 
                          width: `${monthGroup.width}px`,
                          minWidth: `${monthGroup.width}px`,
                          borderRightWidth: '3px',
                          borderRightColor: theme === 'dark' ? '#6366f1' : '#4f46e5',
                          fontSize: `${dynamicFontSizes.base}px`,
                          backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(79, 70, 229, 0.05)'
                        }}
                      >
                        <div className="text-indigo-700 dark:text-indigo-300 font-bold">
                          {monthGroup.year}年{getMonthName(monthGroup.month)}
                        </div>
                      </div>
                    ))
                  })()}
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
                        className={`text-center font-semibold py-1 border-r ${classes.dateHeader} ${getDateCellClass(date, today, theme)} flex items-center justify-center`}
                        style={{ 
                          width: `${dimensions.cellWidth}px`,
                          minWidth: `${dimensions.cellWidth}px`,
                          borderRightWidth: isLastDateOfMonth ? '3px' : isFirstWeek ? '2px' : '1px',
                          borderRightColor: isLastDateOfMonth ? (theme === 'dark' ? '#6366f1' : '#4f46e5') : isFirstWeek ? (theme === 'dark' ? '#6b7280' : '#9ca3af') : (theme === 'dark' ? '#4b5563' : '#d1d5db'),
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
                        borderRightColor: isLastWeekOfMonth ? (theme === 'dark' ? '#6366f1' : '#4f46e5') : (theme === 'dark' ? '#6b7280' : '#9ca3af'),
                        borderLeftWidth: isFirstMonth ? '4px' : '0px',
                        borderLeftColor: isFirstMonth ? (theme === 'dark' ? '#6366f1' : '#4f46e5') : undefined,
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
            scrollbarColor: theme === 'dark' ? '#6b7280 #1f2937' : '#9ca3af #ffffff'
          }}
        >
          {/* 🔧 修正：TimelineRendererに行選択機能を渡す */}
          <TimelineRenderer
            projects={projects}
            tasks={tasks}
            taskRelationMap={taskRelationMap}
            zoomLevel={state.zoomLevel}
            viewUnit={state.viewUnit}
            theme={theme === 'system' ? 'light' : theme}
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
          />
        </div>
      </main>
    </div>
  )
}