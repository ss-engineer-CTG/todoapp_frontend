// システムプロンプト準拠：メインタイムラインビューコンポーネント（TaskRelationMap対応版）
// 🔧 重要修正：ネスト構造削除、平坦配列 + TaskRelationMap方式に完全統一
// DRY原則：Tasklistの階層管理ロジック完全再利用

import React, { useCallback, useEffect, useMemo } from 'react'
import { ChevronDown, ChevronRight, Factory } from 'lucide-react'
import { TimelineControls } from './TimelineControls'
import { TimelineTaskRenderer } from './TimelineTaskRenderer'
import { TimelineViewProps } from '../types'
import { useTimeline } from '../hooks/useTimeline'
import { buildTaskRelationMap } from '@tasklist/utils/task'
import { logger } from '@core/utils/core'
import {
  getDatePosition,
  getProjectNamePosition,
  getDisplayText,
  getDateCellClass,
  getWeekBackground,
  isFirstDayOfMonth,
  isFirstDayOfWeek,
  getMonthName,
  getDateType,
  getWeekNumber
} from '../utils/timeline'

export const TimelineView: React.FC<TimelineViewProps> = ({
  projects: externalProjects,
  allTasks: externalAllTasks,
  onProjectsUpdate,
  onTasksUpdate,
  onViewModeChange,
  onScrollToToday
}) => {
  const {
    state,
    timelineData,
    dimensions,
    timeRange,
    visibleDates,
    displayLevel,
    setZoomLevel,
    setViewUnit,
    setScrollLeft,
    toggleTheme,
    setTimelineData,
    updateTimelineProjects,
    updateTimelineTasks,
    toggleTask,
    expandAllTasks,
    collapseAllTasks,
    fitToScreen,
    scrollToToday,
    timelineRef
  } = useTimeline(100, 'week', 'light')

  const today = new Date()

  // 🔧 修正：外部データをTimeline内部状態に同期
  useEffect(() => {
    if (externalProjects.length > 0 || externalAllTasks.length > 0) {
      logger.info('Syncing external data to timeline', { 
        projectCount: externalProjects.length,
        taskCount: externalAllTasks.length
      })
      
      // TaskRelationMapを自動構築
      const taskRelationMap = buildTaskRelationMap(externalAllTasks)
      
      setTimelineData({
        projects: externalProjects,
        allTasks: externalAllTasks,
        taskRelationMap,
        filteredTasks: [] // 自動計算される
      })
    }
  }, [externalProjects, externalAllTasks, setTimelineData])

  // 🔧 修正：内部データ変更を外部に伝播
  useEffect(() => {
    if (timelineData.projects.length > 0 && onProjectsUpdate) {
      onProjectsUpdate(timelineData.projects)
    }
  }, [timelineData.projects, onProjectsUpdate])

  useEffect(() => {
    if (timelineData.allTasks.length > 0 && onTasksUpdate) {
      onTasksUpdate(timelineData.allTasks)
    }
  }, [timelineData.allTasks, onTasksUpdate])

  // フィット機能
  const handleFitToScreen = useCallback(() => {
    if (timelineRef.current) {
      fitToScreen(timelineRef.current.clientWidth)
    }
  }, [fitToScreen])

  // 今日スクロール機能のラッパー
  const handleScrollToToday = useCallback(() => {
    logger.info('Today scroll requested from timeline view')
    const scrollPosition = scrollToToday()
    return scrollPosition
  }, [scrollToToday])

  // 今日スクロール関数を上位コンポーネントに登録
  useEffect(() => {
    if (onScrollToToday) {
      logger.info('Registering scroll to today function with parent component')
      onScrollToToday(handleScrollToToday)
    }
  }, [onScrollToToday, handleScrollToToday])

  // 統合スクロール処理
  const handleTimelineScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollLeft = e.currentTarget.scrollLeft
    setScrollLeft(newScrollLeft)
    
    // 日付ヘッダーに同期
    const headerElement = document.querySelector('.timeline-date-header') as HTMLElement
    if (headerElement) {
      headerElement.scrollLeft = newScrollLeft
    }
  }, [setScrollLeft])

  // 🔧 修正：プロジェクト展開/折り畳み（TaskRelationMap準拠）
  const handleToggleProject = useCallback((projectId: string) => {
    logger.info('Toggling project', { projectId })
    
    updateTimelineProjects(
      timelineData.projects.map(project => 
        project.id === projectId 
          ? { ...project, collapsed: !project.collapsed }
          : project
      )
    )
  }, [timelineData.projects, updateTimelineProjects])

  // 🔧 修正：タスク展開/折り畳み（TaskRelationMap準拠）
  const handleToggleTask = useCallback((taskId: string) => {
    logger.info('Toggling task', { taskId })
    
    updateTimelineTasks(
      timelineData.allTasks.map(task => 
        task.id === taskId 
          ? { ...task, collapsed: !task.collapsed }
          : task
      )
    )
  }, [timelineData.allTasks, updateTimelineTasks])

  // 全プロジェクト展開
  const handleExpandAll = useCallback(() => {
    logger.info('Expanding all projects and tasks')
    
    updateTimelineProjects(
      timelineData.projects.map(project => ({ ...project, collapsed: false }))
    )
    expandAllTasks()
  }, [timelineData.projects, updateTimelineProjects, expandAllTasks])

  // 全プロジェクト折り畳み
  const handleCollapseAll = useCallback(() => {
    logger.info('Collapsing all projects and tasks')
    
    updateTimelineProjects(
      timelineData.projects.map(project => ({ ...project, collapsed: true }))
    )
    collapseAllTasks()
  }, [timelineData.projects, updateTimelineProjects, collapseAllTasks])

  // テーマクラス
  const getAppClasses = useCallback(() => {
    return state.theme === 'dark' 
      ? {
          app: "bg-gray-950 text-gray-50",
          dateHeader: "bg-gray-900 border-gray-600 text-white",
          projectRow: "border-gray-600",
          taskRow: "border-gray-700 hover:bg-gray-800/50",
          subtaskRow: "border-gray-800 hover:bg-gray-800/30"
        }
      : {
          app: "bg-gray-50 text-gray-900",
          dateHeader: "bg-white border-gray-300 text-gray-900",
          projectRow: "border-gray-300",
          taskRow: "border-gray-200 hover:bg-gray-50",
          subtaskRow: "border-gray-100 hover:bg-gray-25"
        }
  }, [state.theme])

  const classes = getAppClasses()

  // プロジェクトデータが空の場合の表示
  if (timelineData.projects.length === 0) {
    return (
      <div className={`h-screen flex flex-col ${classes.app} overflow-hidden`}>
        <TimelineControls
          zoomLevel={state.zoomLevel}
          onZoomChange={setZoomLevel}
          viewUnit={state.viewUnit}
          onViewUnitChange={setViewUnit}
          theme={state.theme}
          onThemeToggle={toggleTheme}
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

  return (
    <div className={`h-screen flex flex-col ${classes.app} overflow-hidden`}>
      {/* 統合コントロール */}
      <TimelineControls
        zoomLevel={state.zoomLevel}
        onZoomChange={setZoomLevel}
        viewUnit={state.viewUnit}
        onViewUnitChange={setViewUnit}
        theme={state.theme}
        onThemeToggle={toggleTheme}
        onTodayClick={handleScrollToToday}
        onFitToScreen={handleFitToScreen}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onViewModeChange={onViewModeChange}
      />
      
      {/* スクロール可能コンテンツ */}
      <main className="flex-1 flex flex-col overflow-hidden w-full min-w-0" style={{ height: 'calc(100vh - 114px)' }}>
        {/* 日付ヘッダー（スクロールバー非表示・追従のみ） */}
        <div className={`${classes.dateHeader} border-b-2 overflow-hidden w-full`}>
          <div className="w-full overflow-x-hidden timeline-date-header">
            {state.viewUnit === 'day' ? (
              // 日表示：2行構造
              <div>
                {/* 月行 */}
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
                          borderRightColor: state.theme === 'dark' ? '#6366f1' : '#4f46e5',
                          fontSize: `${dimensions.fontSize.base}px`,
                          backgroundColor: state.theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(79, 70, 229, 0.05)'
                        }}
                      >
                        <div className="text-indigo-700 dark:text-indigo-300 font-bold">
                          {monthGroup.year}年{getMonthName(new Date(monthGroup.year, monthGroup.month))}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
                
                {/* 日行 */}
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
                        className={`text-center font-semibold py-1 border-r ${classes.dateHeader} ${getDateCellClass(date, today, state.theme)} flex items-center justify-center`}
                        style={{ 
                          width: `${dimensions.cellWidth}px`,
                          minWidth: `${dimensions.cellWidth}px`,
                          borderRightWidth: isLastDateOfMonth ? '3px' : isFirstWeek ? '2px' : '1px',
                          borderRightColor: isLastDateOfMonth ? (state.theme === 'dark' ? '#6366f1' : '#4f46e5') : isFirstWeek ? (state.theme === 'dark' ? '#6b7280' : '#9ca3af') : (state.theme === 'dark' ? '#4b5563' : '#d1d5db'),
                          fontSize: `${dimensions.fontSize.small}px`
                        }}
                      >
                        <div className={`font-medium ${
                          date.getDay() === 0 || getDateType(date) === 'holiday'
                            ? 'text-gray-600 dark:text-gray-400'
                            : date.getDay() === 6 
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
              // 週表示：1行構造
              <div className="flex" style={{ 
                height: `${Math.max(36, dimensions.rowHeight.project + 4)}px`,
                minWidth: `${visibleDates.length * dimensions.cellWidth * 7}px` 
              }}>
                {visibleDates.map((date, index) => {
                  const weekStart = new Date(date)
                  const weekEnd = new Date(date)
                  weekEnd.setDate(weekEnd.getDate() + 6)
                  
                  const isFirstMonth = index === 0 || (index > 0 && visibleDates[index - 1].getMonth() !== date.getMonth())
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
                        borderRightColor: isLastWeekOfMonth ? (state.theme === 'dark' ? '#6366f1' : '#4f46e5') : (state.theme === 'dark' ? '#6b7280' : '#9ca3af'),
                        borderLeftWidth: isFirstMonth ? '4px' : '0px',
                        borderLeftColor: isFirstMonth ? (state.theme === 'dark' ? '#6366f1' : '#4f46e5') : undefined,
                      }}
                    >
                      <div className="font-bold text-gray-900 dark:text-white" style={{ fontSize: `${dimensions.fontSize.week}px` }}>
                        {weekStart.getMonth() === weekEnd.getMonth() 
                          ? (isFirstMonth 
                              ? `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getDate()}`
                              : `${weekStart.getDate()}-${weekEnd.getDate()}`)
                          : `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
                        }
                      </div>
                      {state.zoomLevel > 40 && (
                        <div className="text-gray-600 dark:text-gray-300 mt-1" style={{ fontSize: `${Math.max(8, dimensions.fontSize.week - 2)}px` }}>
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
        
        {/* タイムライングリッド（メインスクロール制御） */}
        <div 
          className="w-full flex-1 relative overflow-auto timeline-scroll-container" 
          onScroll={handleTimelineScroll}
          ref={timelineRef}
        >
          <div className="relative" style={{ 
            minWidth: `${visibleDates.length > 0 ? (
              state.viewUnit === 'week' 
                ? visibleDates.length * dimensions.cellWidth * 7
                : visibleDates.length * dimensions.cellWidth
            ) : 0}px` 
          }}>
            {/* 背景グリッド */}
            <div className="absolute inset-0 pointer-events-none">
              {state.viewUnit === 'week' ? (
                visibleDates.map((weekStart, index) => {
                  const isFirstMonth = index === 0 || (index > 0 && visibleDates[index - 1].getMonth() !== weekStart.getMonth())
                  const nextWeek = index < visibleDates.length - 1 ? visibleDates[index + 1] : null
                  const isLastWeekOfMonth = nextWeek ? weekStart.getMonth() !== nextWeek.getMonth() : index === visibleDates.length - 1
                  
                  return (
                    <div
                      key={`grid-week-${weekStart.getTime()}`}
                      className={`absolute inset-y-0 ${index % 2 === 0 ? (state.theme === 'dark' ? 'bg-gray-900/60' : 'bg-gray-50/60') : (state.theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/60')}`}
                      style={{
                        left: `${index * dimensions.cellWidth * 7}px`,
                        width: `${dimensions.cellWidth * 7}px`,
                        borderRightWidth: isLastWeekOfMonth ? '3px' : '1px',
                        borderRightStyle: 'solid',
                        borderRightColor: isLastWeekOfMonth ? (state.theme === 'dark' ? '#6366f1' : '#4f46e5') : (state.theme === 'dark' ? '#6b7280' : '#d1d5db'),
                        borderLeftWidth: isFirstMonth ? '3px' : '0px',
                        borderLeftStyle: 'solid',
                        borderLeftColor: isFirstMonth ? (state.theme === 'dark' ? '#6366f1' : '#4f46e5') : 'transparent',
                        opacity: 0.4
                      }}
                    />
                  )
                })
              ) : (
                visibleDates.map((date, index) => {
                  const isFirstMonth = isFirstDayOfMonth(date, index, visibleDates)
                  const isFirstWeek = isFirstDayOfWeek(date)
                  const nextDate = index < visibleDates.length - 1 ? visibleDates[index + 1] : null
                  const isLastDateOfMonth = nextDate ? date.getMonth() !== nextDate.getMonth() : index === visibleDates.length - 1
                  
                  return (
                    <div
                      key={`grid-${date.getTime()}`}
                      className={`absolute inset-y-0 ${getWeekBackground(date, timeRange.startDate, state.theme)}`}
                      style={{
                        left: `${getDatePosition(date, timeRange.startDate, dimensions.cellWidth, state.viewUnit)}px`,
                        width: `${dimensions.cellWidth}px`,
                        borderRightWidth: isLastDateOfMonth ? '3px' : isFirstWeek ? '1px' : '0px',
                        borderRightStyle: 'solid',
                        borderRightColor: isLastDateOfMonth ? (state.theme === 'dark' ? '#6366f1' : '#4f46e5') : isFirstWeek ? (state.theme === 'dark' ? '#6b7280' : '#d1d5db') : 'transparent',
                        borderLeftWidth: isFirstMonth ? '3px' : '0px',
                        borderLeftStyle: 'solid',
                        borderLeftColor: isFirstMonth ? (state.theme === 'dark' ? '#6366f1' : '#4f46e5') : 'transparent',
                        opacity: 0.4
                      }}
                    />
                  )
                })
              )}
            </div>
            
            {/* 土日祝日オーバーレイ */}
            <div className="absolute inset-0 pointer-events-none">
              {state.viewUnit === 'week' ? (
                visibleDates.map((weekStart, weekIndex) => {
                  const weekDates = []
                  for (let i = 0; i < 7; i++) {
                    const currentDate = new Date(weekStart)
                    currentDate.setDate(currentDate.getDate() + i)
                    if (currentDate <= timeRange.endDate) {
                      weekDates.push(currentDate)
                    }
                  }
                  
                  return weekDates.map((date, dayIndex) => {
                    const dateType = getDateType(date)
                    if (dateType === 'weekday') return null
                    
                    const bgColor = state.theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-300/50'
                    
                    return (
                      <div
                        key={`holiday-week-${date.getTime()}`}
                        className={`absolute inset-y-0 ${bgColor}`}
                        style={{
                          left: `${weekIndex * dimensions.cellWidth * 7 + dayIndex * dimensions.cellWidth}px`,
                          width: `${dimensions.cellWidth}px`,
                          zIndex: 1
                        }}
                      />
                    )
                  })
                })
              ) : (
                visibleDates.map((date) => {
                  const dateType = getDateType(date)
                  if (dateType === 'weekday') return null
                  
                  const bgColor = state.theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-300/50'
                  
                  return (
                    <div
                      key={`holiday-${date.getTime()}`}
                      className={`absolute inset-y-0 ${bgColor}`}
                      style={{
                        left: `${getDatePosition(date, timeRange.startDate, dimensions.cellWidth, state.viewUnit)}px`,
                        width: `${dimensions.cellWidth}px`,
                        zIndex: 1
                      }}
                    />
                  )
                })
              )}
            </div>
            
            {/* 🔧 修正：プロジェクト・タスク表示（TaskRelationMap準拠） */}
            {timelineData.projects.map(project => (
              <div key={project.id} className={`relative border-b-2 ${classes.projectRow}`}>
                {/* プロジェクトヘッダー行 */}
                <div 
                  className="flex items-center relative cursor-pointer transition-colors duration-200 hover:opacity-90"
                  onClick={() => handleToggleProject(project.id)}
                  style={{ 
                    height: `${dimensions.rowHeight.project}px`,
                    backgroundColor: `${project.color}${state.theme === 'dark' ? '60' : '50'}`,
                    borderLeft: `${Math.max(4, Math.round(6 * dimensions.zoomRatio))}px solid ${project.color}`
                  }}
                >
                  {/* 動的プロジェクト名 */}
                  <div 
                    className={`absolute z-10 ${state.theme === 'dark' ? 'bg-gray-800 border-gray-500' : 'bg-white border-gray-300'} rounded-lg shadow-lg border-2 transition-all duration-200`}
                    style={{
                      left: `${getProjectNamePosition(state.scrollLeft)}px`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      maxWidth: `${Math.max(200, Math.round(320 * dimensions.zoomRatio))}px`,
                      maxHeight: `${Math.round(dimensions.rowHeight.project * 0.8)}px`,
                      padding: `${Math.max(2, Math.round(4 * dimensions.zoomRatio))}px ${Math.max(6, Math.round(12 * dimensions.zoomRatio))}px`,
                      borderWidth: `${Math.max(1, Math.round(2 * dimensions.zoomRatio))}px`,
                      overflow: 'hidden'
                    }}
                  >
                    <div 
                      className="flex items-center h-full"
                      style={{ 
                        color: project.color,
                        gap: `${Math.max(4, Math.round(8 * dimensions.zoomRatio))}px`
                      }}
                    >
                      <div 
                        className="rounded-md bg-gray-100 dark:bg-gray-700 flex-shrink-0"
                        style={{
                          padding: `${Math.max(1, Math.round(2 * dimensions.zoomRatio))}px`
                        }}
                      >
                        {!project.collapsed ? 
                          <ChevronDown size={Math.max(8, Math.round(14 * dimensions.zoomRatio))} className="flex-shrink-0" /> :
                          <ChevronRight size={Math.max(8, Math.round(14 * dimensions.zoomRatio))} className="flex-shrink-0" />
                        }
                      </div>
                      <Factory size={Math.max(10, Math.round(14 * dimensions.zoomRatio))} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div 
                          className="font-bold truncate leading-tight"
                          style={{ 
                            fontSize: `${Math.min(dimensions.fontSize.base, Math.round(dimensions.rowHeight.project * 0.4))}px`,
                            lineHeight: '1.2'
                          }}
                        >
                          {getDisplayText(project.name, state.zoomLevel, Math.max(10, Math.round(20 * dimensions.zoomRatio)))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 🔧 修正：プロジェクト内のタスク（再帰的レンダリング） */}
                {!project.collapsed && (
                  <TimelineTaskRenderer
                    project={project}
                    tasks={timelineData.allTasks}
                    taskRelationMap={timelineData.taskRelationMap}
                    dimensions={dimensions}
                    timeRange={timeRange}
                    state={state}
                    onToggleTask={handleToggleTask}
                  />
                )}
              </div>
            ))}
            
            {/* 今日のインジケーター */}
            <div 
              className="absolute top-0 bg-red-500 z-30 shadow-xl"
              style={{ 
                left: `${getDatePosition(today, timeRange.startDate, dimensions.cellWidth, state.viewUnit)}px`,
                width: `${Math.max(1, Math.round(2 * dimensions.zoomRatio))}px`,
                height: '100%'
              }}
            >
              <div 
                className="absolute top-0 bg-red-500 rounded-full shadow-lg flex items-center justify-center border-2 border-white dark:border-gray-900"
                style={{
                  left: `${-Math.round(10 * dimensions.zoomRatio)}px`,
                  width: `${Math.max(12, Math.round(20 * dimensions.zoomRatio))}px`,
                  height: `${Math.max(12, Math.round(20 * dimensions.zoomRatio))}px`
                }}
              >
                <div 
                  className="bg-white rounded-full"
                  style={{
                    width: `${Math.max(6, Math.round(8 * dimensions.zoomRatio))}px`,
                    height: `${Math.max(6, Math.round(8 * dimensions.zoomRatio))}px`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}