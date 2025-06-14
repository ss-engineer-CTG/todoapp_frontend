// システムプロンプト準拠：メインタイムラインビューコンポーネント（軽量化版）
// 修正内容：ビューモード変更機能のプロパティ受け取りと中継
// 修正内容：日付ヘッダーのスクロール機能無効化による統合スクロール制御

import React, { useCallback } from 'react'
import { 
  ChevronDown, ChevronRight, Check, AlertTriangle, Factory, Star
} from 'lucide-react'
import { TimelineControls } from './TimelineControls'
import { TimelineViewProps } from '../types'
import { useTimeline } from '../hooks/useTimeline'
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
  projects: initialProjects,
  onProjectsUpdate,
  // 修正：ビューモード変更機能を受け取る
  onViewModeChange
}) => {
  const {
    state,
    projects,
    dimensions,
    timeRange,
    visibleDates,
    displayLevel,
    setZoomLevel,
    setViewUnit,
    setScrollLeft,
    toggleTheme,
    setProjects,
    toggleProject,
    expandAllProjects,
    collapseAllProjects,
    toggleTask,
    fitToScreen,
    scrollToToday,
    convertFromTasklist,
    timelineRef
  } = useTimeline(100, 'week', 'light')

  const today = new Date()

  // プロジェクトデータの初期化
  React.useEffect(() => {
    if (initialProjects.length > 0) {
      setProjects(initialProjects)
    }
  }, [initialProjects, setProjects])

  // プロジェクト更新の伝播
  React.useEffect(() => {
    onProjectsUpdate(projects)
  }, [projects, onProjectsUpdate])

  // フィット機能
  const handleFitToScreen = useCallback(() => {
    if (timelineRef.current) {
      fitToScreen(timelineRef.current.clientWidth)
    }
  }, [fitToScreen])

  // 統合スクロール処理（日付ヘッダーとタイムライングリッドの同期）
  const handleTimelineScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollLeft = e.currentTarget.scrollLeft
    setScrollLeft(newScrollLeft)
    
    // 日付ヘッダーに同期（一方向制御）
    const headerElement = document.querySelector('.timeline-date-header') as HTMLElement
    if (headerElement) {
      headerElement.scrollLeft = newScrollLeft
    }
  }, [setScrollLeft])

  // ステータススタイル取得
  const getStatusStyle = useCallback((
    status: string, 
    projectColor: string, 
    isMilestone = false, 
    isSubtask = false
  ) => {
    const adjustColorForSubtask = (color: string) => {
      if (color.startsWith('#')) {
        const r = parseInt(color.substr(1, 2), 16)
        const g = parseInt(color.substr(3, 2), 16)
        const b = parseInt(color.substr(5, 2), 16)
        return `rgba(${r}, ${g}, ${b}, 0.4)`
      }
      return color
    }
    
    switch (status) {
      case 'completed':
        return {
          backgroundColor: isSubtask ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.65)',
          borderColor: isSubtask ? 'rgba(5, 150, 105, 0.45)' : 'rgba(5, 150, 105, 0.75)',
          textColor: isSubtask ? 'text-gray-700 dark:text-gray-300' : 'text-white'
        }
      case 'in-progress':
        const lightProjectColor = projectColor.startsWith('#') 
          ? (() => {
              const r = parseInt(projectColor.substr(1, 2), 16)
              const g = parseInt(projectColor.substr(3, 2), 16)
              const b = parseInt(projectColor.substr(5, 2), 16)
              return isSubtask 
                ? `rgba(${r}, ${g}, ${b}, 0.35)` 
                : `rgba(${r}, ${g}, ${b}, 0.65)`
            })()
          : (isSubtask ? adjustColorForSubtask(projectColor) : projectColor)
        
        return {
          backgroundColor: lightProjectColor,
          borderColor: lightProjectColor,
          textColor: isSubtask ? 'text-gray-700 dark:text-gray-300' : 'text-white'
        }
      case 'overdue':
        return {
          backgroundColor: isSubtask ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.65)',
          borderColor: isSubtask ? 'rgba(220, 38, 38, 0.45)' : 'rgba(220, 38, 38, 0.75)',
          textColor: isSubtask ? 'text-gray-700 dark:text-gray-300' : 'text-white'
        }
      default:
        return {
          backgroundColor: isSubtask ? 'rgba(243, 244, 246, 0.4)' : 'rgba(243, 244, 246, 0.7)',
          borderColor: isSubtask ? 'rgba(156, 163, 175, 0.4)' : 'rgba(156, 163, 175, 0.6)',
          textColor: 'text-gray-600 dark:text-gray-400'
        }
    }
  }, [])

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

  return (
    <div className={`h-screen flex flex-col ${classes.app} overflow-hidden`}>
      {/* 統合コントロール */}
      {/* 修正：onViewModeChangeをTimelineControlsに渡す */}
      <TimelineControls
        zoomLevel={state.zoomLevel}
        onZoomChange={setZoomLevel}
        viewUnit={state.viewUnit}
        onViewUnitChange={setViewUnit}
        theme={state.theme}
        onThemeToggle={toggleTheme}
        onTodayClick={scrollToToday}
        onFitToScreen={handleFitToScreen}
        onExpandAll={expandAllProjects}
        onCollapseAll={collapseAllProjects}
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
            
            {/* プロジェクト・タスク表示 */}
            {projects.map(project => (
              <div key={project.id} className={`relative border-b-2 ${classes.projectRow}`}>
                {/* プロジェクトヘッダー行 */}
                <div 
                  className="flex items-center relative cursor-pointer transition-colors duration-200 hover:opacity-90"
                  onClick={() => toggleProject(project.id)}
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
                        {project.expanded ? 
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
                
                {/* プロジェクト内のタスク */}
                {project.expanded && project.tasks.map(task => (
                  <div key={task.id}>
                    {/* 親タスク行 */}
                    <div className={`relative cursor-pointer border-b ${classes.taskRow} transition-colors duration-150`} 
                         style={{ 
                           height: `${dimensions.rowHeight.subtask}px`,
                           overflow: state.viewUnit === 'week' ? 'visible' : 'hidden' 
                         }}>
                      {/* 親タスクバー */}
                      <div
                        className="absolute rounded-lg shadow-lg flex items-center transition-all duration-200 hover:shadow-xl hover:scale-105 group cursor-pointer"
                        style={{ 
                          left: `${getDatePosition(task.startDate, timeRange.startDate, dimensions.cellWidth, state.viewUnit)}px`,
                          width: state.viewUnit === 'week'
                            ? `${getDatePosition(task.dueDate, timeRange.startDate, dimensions.cellWidth, state.viewUnit) - getDatePosition(task.startDate, timeRange.startDate, dimensions.cellWidth, state.viewUnit) + dimensions.cellWidth}px`
                            : `${Math.max(getDatePosition(task.dueDate, timeRange.startDate, dimensions.cellWidth, state.viewUnit) - getDatePosition(task.startDate, timeRange.startDate, dimensions.cellWidth, state.viewUnit) + dimensions.cellWidth, task.subtasks && task.subtasks.length > 0 ? 120 : 80)}px`,
                          height: `${Math.round(dimensions.taskBarHeight * 0.8)}px`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: getStatusStyle(task.status || 'not-started', project.color, task.milestone, false).backgroundColor,
                          color: getStatusStyle(task.status || 'not-started', project.color, task.milestone, false).textColor,
                          borderWidth: task.milestone ? '2px' : '1px',
                          borderStyle: 'solid',
                          borderColor: getStatusStyle(task.status || 'not-started', project.color, task.milestone, false).borderColor,
                          zIndex: task.milestone ? 3 : 2,
                          overflow: 'visible'
                        }}
                      >
                        {/* タスク情報 */}
                        <div 
                          className="px-4 font-semibold truncate flex-1 flex items-center min-w-0 group-hover:pr-2 transition-all duration-200"
                          style={{ fontSize: `${dimensions.fontSize.small}px` }}
                        >
                          {task.status === 'completed' && <Check size={Math.max(10, Math.round(14 * dimensions.zoomRatio))} className="mr-2 flex-shrink-0" />}
                          {task.status === 'overdue' && <AlertTriangle size={Math.max(10, Math.round(14 * dimensions.zoomRatio))} className="mr-2 flex-shrink-0" />}
                          <span className="truncate">{getDisplayText(task.name, state.zoomLevel, state.viewUnit === 'week' ? 20 : 15)}</span>
                        </div>
                        
                        {/* 展開/折り畳みバッジ */}
                        {task.subtasks && task.subtasks.length > 0 && state.zoomLevel > 30 && (
                          <div 
                            className={`flex-shrink-0 mr-3 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 shadow-md border group-hover:shadow-lg ${
                              task.expanded 
                                ? 'bg-white/40 border-white/50 ring-2 ring-white/30' 
                                : 'bg-white/25 border-white/30 hover:bg-white/35 group-hover:bg-white/40'
                            }`}
                            style={{
                              backdropFilter: 'blur(8px)',
                              minWidth: `${Math.round(dimensions.taskBarHeight * 0.8 * 1.8)}px`,
                              height: `${Math.round(dimensions.taskBarHeight * 0.8 * 0.9)}px`,
                              padding: `${Math.max(2, Math.round(4 * dimensions.zoomRatio))}px ${Math.max(4, Math.round(8 * dimensions.zoomRatio))}px`
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleTask(project.id, task.id)
                            }}
                            title={`${task.expanded ? 'サブタスクを非表示' : 'サブタスクを表示'} (${task.subtasks?.length || 0}件)`}
                          >
                            <div className="flex items-center justify-center space-x-1.5 h-full">
                              <div 
                                className="flex items-center justify-center"
                                style={{
                                  width: `${Math.max(8, Math.round(12 * dimensions.zoomRatio))}px`,
                                  height: `${Math.max(8, Math.round(12 * dimensions.zoomRatio))}px`
                                }}
                              >
                                {task.expanded ? (
                                  <ChevronDown size={Math.max(8, Math.round(10 * dimensions.zoomRatio))} className="text-white drop-shadow-lg font-bold" />
                                ) : (
                                  <ChevronRight size={Math.max(8, Math.round(10 * dimensions.zoomRatio))} className="text-white drop-shadow-lg font-bold" />
                                )}
                              </div>
                              <div 
                                className="flex items-center justify-center bg-white/30 rounded-full"
                                style={{
                                  width: `${Math.max(12, Math.round(16 * dimensions.zoomRatio))}px`,
                                  height: `${Math.max(12, Math.round(16 * dimensions.zoomRatio))}px`
                                }}
                              >
                                <span 
                                  className="font-bold text-white drop-shadow-lg"
                                  style={{
                                    fontSize: `${Math.max(6, Math.round(9 * dimensions.zoomRatio))}px`
                                  }}
                                >
                                  {task.subtasks?.length || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* サブタスク行 */}
                    {task.expanded && task.subtasks?.map((subtask, subtaskIndex) => (
                      <div key={subtask.id} className={`relative cursor-pointer border-b ${classes.subtaskRow} transition-colors duration-150`} 
                           style={{ 
                             height: `${dimensions.rowHeight.subtask}px`,
                             overflow: state.viewUnit === 'week' ? 'visible' : 'hidden' 
                           }}>
                        {/* 階層接続線 */}
                        {subtaskIndex === 0 && state.zoomLevel > 30 && (
                          <>
                            <div 
                              className="absolute bg-gradient-to-b from-gray-400 to-gray-300 dark:from-gray-500 dark:to-gray-600 opacity-70 rounded-full"
                              style={{
                                left: `${getDatePosition(task.startDate, timeRange.startDate, dimensions.cellWidth, state.viewUnit) + Math.round(20 * dimensions.zoomRatio)}px`,
                                top: `${-Math.round(12 * dimensions.zoomRatio)}px`,
                                width: `${Math.max(1, Math.round(2 * dimensions.zoomRatio))}px`,
                                height: `${((task.subtasks?.length || 0) * dimensions.rowHeight.subtask) + Math.round(12 * dimensions.zoomRatio)}px`,
                                zIndex: 1,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                              }}
                            />
                            <div 
                              className="absolute bg-gradient-to-br from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600 rounded-full shadow-sm border border-white dark:border-gray-800"
                              style={{
                                left: `${getDatePosition(task.startDate, timeRange.startDate, dimensions.cellWidth, state.viewUnit) + Math.round(20 * dimensions.zoomRatio) - Math.round(4 * dimensions.zoomRatio)}px`,
                                top: `${-Math.round(16 * dimensions.zoomRatio)}px`,
                                width: `${Math.max(6, Math.round(8 * dimensions.zoomRatio))}px`,
                                height: `${Math.max(6, Math.round(8 * dimensions.zoomRatio))}px`,
                                zIndex: 3
                              }}
                            />
                          </>
                        )}
                        
                        {/* 水平接続線 */}
                        {state.zoomLevel > 30 && (
                          <div 
                            className="absolute opacity-70 rounded-full"
                            style={{
                              left: `${Math.min(getDatePosition(task.startDate, timeRange.startDate, dimensions.cellWidth, state.viewUnit) + Math.round(20 * dimensions.zoomRatio), getDatePosition(subtask.startDate, timeRange.startDate, dimensions.cellWidth, state.viewUnit) + Math.round(32 * dimensions.zoomRatio))}px`,
                              width: `${Math.abs(getDatePosition(subtask.startDate, timeRange.startDate, dimensions.cellWidth, state.viewUnit) + Math.round(32 * dimensions.zoomRatio) - (getDatePosition(task.startDate, timeRange.startDate, dimensions.cellWidth, state.viewUnit) + Math.round(20 * dimensions.zoomRatio)))}px`,
                              height: `${Math.max(1, Math.round(2 * dimensions.zoomRatio))}px`,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              zIndex: 1,
                              background: getDatePosition(subtask.startDate, timeRange.startDate, dimensions.cellWidth, state.viewUnit) + Math.round(32 * dimensions.zoomRatio) >= getDatePosition(task.startDate, timeRange.startDate, dimensions.cellWidth, state.viewUnit) + Math.round(20 * dimensions.zoomRatio)
                                ? 'linear-gradient(to right, #9ca3af, #d1d5db)'
                                : 'linear-gradient(to left, #9ca3af, #d1d5db)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                          />
                        )}
                        
                        {/* 接続点 */}
                        {state.zoomLevel > 30 && (
                          <div 
                            className="absolute bg-gradient-to-br from-green-400 to-green-500 dark:from-green-500 dark:to-green-600 rounded-full shadow-sm border border-white dark:border-gray-800"
                            style={{
                              left: `${getDatePosition(subtask.startDate, timeRange.startDate, dimensions.cellWidth, state.viewUnit) + Math.round(32 * dimensions.zoomRatio) - Math.round(5 * dimensions.zoomRatio)}px`,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: `${Math.max(6, Math.round(10 * dimensions.zoomRatio))}px`,
                              height: `${Math.max(6, Math.round(10 * dimensions.zoomRatio))}px`,
                              zIndex: 2
                            }}
                          />
                        )}
                        
                        {/* サブタスクバー */}
                        <div
                          className="absolute rounded-md shadow-md flex items-center transition-all duration-200 hover:shadow-lg"
                          style={{ 
                            left: `${getDatePosition(subtask.startDate, timeRange.startDate, dimensions.cellWidth, state.viewUnit) + Math.round(32 * dimensions.zoomRatio)}px`,
                            width: `${getDatePosition(subtask.dueDate, timeRange.startDate, dimensions.cellWidth, state.viewUnit) - getDatePosition(subtask.startDate, timeRange.startDate, dimensions.cellWidth, state.viewUnit) + dimensions.cellWidth - Math.round(32 * dimensions.zoomRatio)}px`,
                            height: `${Math.round(dimensions.taskBarHeight * 0.8)}px`,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: getStatusStyle(subtask.status || 'not-started', project.color, subtask.milestone, true).backgroundColor,
                            color: getStatusStyle(subtask.status || 'not-started', project.color, subtask.milestone, true).textColor,
                            borderWidth: subtask.milestone ? '2px' : '1px',
                            borderStyle: 'dashed',
                            borderColor: getStatusStyle(subtask.status || 'not-started', project.color, subtask.milestone, true).borderColor,
                            zIndex: subtask.milestone ? 3 : 1,
                            overflow: 'visible'
                          }}
                        >
                          <div className="px-3 flex items-center flex-shrink-0">
                            {subtask.status === 'completed' && <Check size={Math.max(8, Math.round(14 * dimensions.zoomRatio))} className="flex-shrink-0" />}
                            {subtask.status === 'overdue' && <AlertTriangle size={Math.max(8, Math.round(14 * dimensions.zoomRatio))} className="flex-shrink-0" />}
                            {subtask.milestone && <Star size={Math.max(8, Math.round(14 * dimensions.zoomRatio))} className="text-yellow-200 flex-shrink-0" />}
                          </div>
                        </div>
                        
                        {/* サブタスク名ラベル */}
                        {state.zoomLevel > 30 && (
                          <div
                            className={`absolute flex items-center pointer-events-none z-10`}
                            style={{
                              left: `${getDatePosition(subtask.dueDate, timeRange.startDate, dimensions.cellWidth, state.viewUnit) + dimensions.cellWidth + 8}px`,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              whiteSpace: 'nowrap',
                              height: `${Math.round(dimensions.taskBarHeight * 0.8)}px`
                            }}
                          >
                            <div 
                              className={`px-2 py-0.5 rounded font-medium shadow-sm border opacity-90 ${
                                state.theme === 'dark' 
                                  ? 'bg-gray-800 text-gray-200 border-gray-600' 
                                  : 'bg-white text-gray-700 border-gray-300'
                              }`}
                              style={{
                                backdropFilter: 'blur(4px)',
                                backgroundColor: state.theme === 'dark' ? 'rgba(31, 41, 55, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                                fontSize: `${Math.max(8, dimensions.fontSize.small)}px`
                              }}
                            >
                              {getDisplayText(subtask.name, state.zoomLevel, 15)}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
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