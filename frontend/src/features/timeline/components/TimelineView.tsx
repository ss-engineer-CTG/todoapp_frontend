// システムプロンプト準拠：メインタイムラインビューコンポーネント（画面幅対応版）
// 修正内容：アプリヘッダー分離、固定表示レイアウト採用、画面幅対応

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  ChevronDown, ChevronRight, Check,
  AlertTriangle, Clock, Factory, Star
} from 'lucide-react'
import { AppHeader } from './AppHeader'
import { TimelineControls } from './TimelineControls'
import { TimelineViewProps, TimelineState, TimelineProject } from '../types'
import {
  calculateDynamicSizes,
  calculateTimeRange,
  generateVisibleDates,
  getDatePosition,
  getProjectNamePosition,
  getDisplayText,
  getDateCellClass,
  getWeekBackground,
  isFirstDayOfMonth,
  isFirstDayOfWeek,
  getMonthName
} from '../utils/timelineUtils'
import { getDateType, getWeekNumber } from '../utils/holidayData'

export const TimelineView: React.FC<TimelineViewProps> = ({
  projects: initialProjects
}) => {
  // 状態管理
  const [timelineState, setTimelineState] = useState<TimelineState>({
    zoomLevel: 100,
    viewUnit: 'week',
    scrollLeft: 0,
    isZooming: false,
    theme: 'light'
  })
  
  const [timelineRef, setTimelineRef] = useState<HTMLDivElement | null>(null)
  const [projects, setProjects] = useState<TimelineProject[]>(initialProjects)

  const today = new Date()

  // 動的サイズ計算
  const dynamicSizes = useMemo(() => 
    calculateDynamicSizes(timelineState.zoomLevel, timelineState.viewUnit),
    [timelineState.zoomLevel, timelineState.viewUnit]
  )

  // 時間範囲計算
  const dateRange = useMemo(() => {
    const range = calculateTimeRange(timelineState.viewUnit, today)
    return {
      ...range,
      cellWidth: dynamicSizes.cellWidth
    }
  }, [timelineState.viewUnit, dynamicSizes.cellWidth])

  // 表示日付配列
  const visibleDates = useMemo(() => 
    generateVisibleDates(dateRange.startDate, dateRange.endDate, timelineState.viewUnit),
    [dateRange.startDate, dateRange.endDate, timelineState.viewUnit]
  )

  // テーマ適用
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(timelineState.theme)
  }, [timelineState.theme])

  // スクロールバー非表示スタイル
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // ズーム操作
  const handleZoomChange = useCallback((newLevel: number) => {
    setTimelineState(prev => ({
      ...prev,
      zoomLevel: newLevel,
      isZooming: true
    }))
    setTimeout(() => {
      setTimelineState(prev => ({ ...prev, isZooming: false }))
    }, 300)
  }, [])

  // 表示単位変更
  const handleViewUnitChange = useCallback((newUnit: 'day' | 'week') => {
    setTimelineState(prev => ({ ...prev, viewUnit: newUnit }))
  }, [])

  // テーマ切り替え
  const handleThemeToggle = useCallback(() => {
    setTimelineState(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }))
  }, [])

  // 今日ボタン処理
  const handleTodayClick = useCallback(() => {
    if (timelineRef) {
      const todayPosition = getDatePosition(
        today, 
        dateRange.startDate, 
        dateRange.cellWidth, 
        timelineState.viewUnit
      )
      const containerWidth = timelineRef.clientWidth
      const scrollPosition = Math.max(0, todayPosition - containerWidth / 2)
      
      timelineRef.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      })
      
      const headerScroll = document.querySelector('.scrollbar-hide') as HTMLElement
      if (headerScroll) {
        headerScroll.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        })
      }
    }
  }, [timelineRef, dateRange, timelineState.viewUnit])

  // フィット機能
  const handleFitToScreen = useCallback(() => {
    if (timelineRef) {
      const containerWidth = timelineRef.clientWidth
      const totalDates = visibleDates.length
      const requiredCellWidth = timelineState.viewUnit === 'week' 
        ? containerWidth / (totalDates * 7) 
        : containerWidth / totalDates
      
      const baseCellWidth = timelineState.viewUnit === 'week' ? 20 : 30
      const fitZoom = Math.round((requiredCellWidth / baseCellWidth) * 100)
      handleZoomChange(Math.max(10, Math.min(200, fitZoom)))
    }
  }, [timelineRef, visibleDates.length, timelineState.viewUnit, handleZoomChange])

  // プロジェクト展開/折りたたみ
  const toggleProject = useCallback((projectId: string) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { ...project, expanded: !project.expanded } 
        : project
    ))
  }, [])

  // タスク展開/折りたたみ
  const toggleTask = useCallback((projectId: string, taskId: string) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { 
            ...project, 
            tasks: project.tasks.map(task =>
              task.id === taskId 
                ? { ...task, expanded: !task.expanded }
                : task
            )
          }
        : project
    ))
  }, [])

  // 一括展開
  const handleExpandAll = useCallback(() => {
    setProjects(prev => prev.map(project => ({
      ...project,
      expanded: true,
      tasks: project.tasks.map(task => ({
        ...task,
        expanded: true
      }))
    })))
  }, [])

  // 一括折り畳み
  const handleCollapseAll = useCallback(() => {
    setProjects(prev => prev.map(project => ({
      ...project,
      expanded: false,
      tasks: project.tasks.map(task => ({
        ...task,
        expanded: false
      }))
    })))
  }, [])

  // スクロール処理
  const handleTimelineScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollLeft = e.currentTarget.scrollLeft
    setTimelineState(prev => ({ ...prev, scrollLeft: newScrollLeft }))
    
    const headerScroll = document.querySelector('.scrollbar-hide') as HTMLElement
    if (headerScroll) {
      headerScroll.scrollLeft = newScrollLeft
    }
  }, [])

  // ステータススタイル取得
  const getStatusStyle = useCallback((
    status: string, 
    projectColor: string, 
    isMilestone = false, 
    isSubtask = false
  ) => {
    const baseStyle = {
      borderWidth: isMilestone ? `${Math.max(1, Math.round(2 * dynamicSizes.zoomRatio))}px` : `${Math.max(1, Math.round(dynamicSizes.zoomRatio))}px`,
      borderStyle: isMilestone ? 'solid' : (isSubtask ? 'dashed' : 'solid')
    }
    
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
          ...baseStyle,
          backgroundColor: isSubtask ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.65)',
          borderColor: isSubtask ? 'rgba(5, 150, 105, 0.45)' : 'rgba(5, 150, 105, 0.75)',
          textColor: isSubtask ? 'text-gray-700 dark:text-gray-300' : 'text-white',
          opacity: 1
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
          ...baseStyle,
          backgroundColor: lightProjectColor,
          borderColor: lightProjectColor,
          textColor: isSubtask ? 'text-gray-700 dark:text-gray-300' : 'text-white',
          opacity: 1
        }
      case 'not-started':
        return { 
          ...baseStyle,
          backgroundColor: isSubtask ? 'rgba(243, 244, 246, 0.4)' : 'rgba(243, 244, 246, 0.7)',
          borderColor: isSubtask ? 'rgba(156, 163, 175, 0.4)' : 'rgba(156, 163, 175, 0.6)',
          textColor: 'text-gray-600 dark:text-gray-400',
          opacity: 1
        }
      case 'overdue':
        return { 
          ...baseStyle,
          backgroundColor: isSubtask ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.65)',
          borderColor: isSubtask ? 'rgba(220, 38, 38, 0.45)' : 'rgba(220, 38, 38, 0.75)',
          textColor: isSubtask ? 'text-gray-700 dark:text-gray-300' : 'text-white',
          opacity: 1
        }
      default:
        return { 
          ...baseStyle,
          backgroundColor: isSubtask ? 'rgba(243, 244, 246, 0.4)' : 'rgba(243, 244, 246, 0.7)',
          borderColor: isSubtask ? 'rgba(156, 163, 175, 0.4)' : 'rgba(156, 163, 175, 0.6)',
          textColor: 'text-gray-600 dark:text-gray-400',
          opacity: 1
        }
    }
  }, [dynamicSizes.zoomRatio])

  // テーマクラス
  const getAppClasses = useCallback(() => {
    return timelineState.theme === 'dark' 
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
  }, [timelineState.theme])

  const classes = getAppClasses()

  return (
    <div className={`h-screen flex flex-col ${classes.app} overflow-hidden`}>
      {/* 固定アプリヘッダー */}
      <AppHeader
        theme={timelineState.theme}
        onThemeToggle={handleThemeToggle}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
      />
      
      {/* 固定タイムラインコントロール */}
      <TimelineControls
        zoomLevel={timelineState.zoomLevel}
        onZoomChange={handleZoomChange}
        viewUnit={timelineState.viewUnit}
        onViewUnitChange={handleViewUnitChange}
        theme={timelineState.theme}
        onTodayClick={handleTodayClick}
        onFitToScreen={handleFitToScreen}
      />
      
      {/* スクロール可能コンテンツ */}
      <main className="flex-1 flex flex-col overflow-hidden w-full min-w-0" style={{ height: 'calc(100vh - 114px)' }}>
        {/* 日付ヘッダー */}
        <div className={`${classes.dateHeader} border-b-2 overflow-hidden w-full`}>
          <div className="w-full overflow-x-auto scrollbar-hide" 
               onScroll={(e) => {
                 const target = e.target as HTMLElement
                 if (timelineRef && target) {
                   timelineRef.scrollLeft = target.scrollLeft
                 }
               }}
          >
            {timelineState.viewUnit === 'day' ? (
              // 日表示：2行構造
              <div>
                {/* 月行 */}
                <div className="flex border-b" style={{ 
                  height: `${Math.max(20, Math.round(dynamicSizes.rowHeight.project * 0.6))}px`,
                  minWidth: `${visibleDates.length * dateRange.cellWidth}px` 
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
                            width: monthWidth * dateRange.cellWidth
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
                          width: monthWidth * dateRange.cellWidth
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
                          borderRightColor: timelineState.theme === 'dark' ? '#6366f1' : '#4f46e5',
                          fontSize: `${dynamicSizes.fontSize.base}px`,
                          backgroundColor: timelineState.theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(79, 70, 229, 0.05)'
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
                  height: `${Math.max(24, Math.round(dynamicSizes.rowHeight.project * 0.8))}px`,
                  minWidth: `${visibleDates.length * dateRange.cellWidth}px` 
                }}>
                  {visibleDates.map((date, index) => {
                    const isFirstWeek = isFirstDayOfWeek(date)
                    const nextDate = index < visibleDates.length - 1 ? visibleDates[index + 1] : null
                    const isLastDateOfMonth = nextDate ? date.getMonth() !== nextDate.getMonth() : index === visibleDates.length - 1
                    
                    return (
                      <div 
                        key={date.getTime()} 
                        className={`text-center font-semibold py-1 border-r ${classes.dateHeader} ${getDateCellClass(date, today, timelineState.theme)} flex items-center justify-center`}
                        style={{ 
                          width: `${dateRange.cellWidth}px`,
                          minWidth: `${dateRange.cellWidth}px`,
                          borderRightWidth: isLastDateOfMonth ? '3px' : isFirstWeek ? '2px' : '1px',
                          borderRightColor: isLastDateOfMonth ? (timelineState.theme === 'dark' ? '#6366f1' : '#4f46e5') : isFirstWeek ? (timelineState.theme === 'dark' ? '#6b7280' : '#9ca3af') : (timelineState.theme === 'dark' ? '#4b5563' : '#d1d5db'),
                          fontSize: `${dynamicSizes.fontSize.small}px`
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
                height: `${Math.max(36, dynamicSizes.rowHeight.project + 4)}px`,
                minWidth: `${visibleDates.length * dateRange.cellWidth * 7}px` 
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
                        width: `${dateRange.cellWidth * 7}px`,
                        minWidth: `${dateRange.cellWidth * 7}px`,
                        borderRightWidth: isLastWeekOfMonth ? '4px' : '2px',
                        borderRightColor: isLastWeekOfMonth ? (timelineState.theme === 'dark' ? '#6366f1' : '#4f46e5') : (timelineState.theme === 'dark' ? '#6b7280' : '#9ca3af'),
                        borderLeftWidth: isFirstMonth ? '4px' : '0px',
                        borderLeftColor: isFirstMonth ? (timelineState.theme === 'dark' ? '#6366f1' : '#4f46e5') : undefined,
                      }}
                    >
                      <div className="font-bold text-gray-900 dark:text-white" style={{ fontSize: `${dynamicSizes.fontSize.week}px` }}>
                        {weekStart.getMonth() === weekEnd.getMonth() 
                          ? (isFirstMonth 
                              ? `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getDate()}`
                              : `${weekStart.getDate()}-${weekEnd.getDate()}`)
                          : `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
                        }
                      </div>
                      {timelineState.zoomLevel > 40 && (
                        <div className="text-gray-600 dark:text-gray-300 mt-1" style={{ fontSize: `${Math.max(8, dynamicSizes.fontSize.week - 2)}px` }}>
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
        
        {/* タイムライングリッド */}
        <div 
          className="w-full flex-1 relative overflow-auto timeline-scroll-container" 
          onScroll={handleTimelineScroll}
          ref={setTimelineRef}
        >
          <div className="relative" style={{ 
            minWidth: `${visibleDates.length > 0 ? (
              timelineState.viewUnit === 'week' 
                ? visibleDates.length * dateRange.cellWidth * 7
                : visibleDates.length * dateRange.cellWidth
            ) : 0}px` 
          }}>
            {/* 背景グリッド */}
            <div className="absolute inset-0 pointer-events-none">
              {timelineState.viewUnit === 'week' ? (
                visibleDates.map((weekStart, index) => {
                  const isFirstMonth = index === 0 || (index > 0 && visibleDates[index - 1].getMonth() !== weekStart.getMonth())
                  const nextWeek = index < visibleDates.length - 1 ? visibleDates[index + 1] : null
                  const isLastWeekOfMonth = nextWeek ? weekStart.getMonth() !== nextWeek.getMonth() : index === visibleDates.length - 1
                  
                  return (
                    <div
                      key={`grid-week-${weekStart.getTime()}`}
                      className={`absolute inset-y-0 ${index % 2 === 0 ? (timelineState.theme === 'dark' ? 'bg-gray-900/60' : 'bg-gray-50/60') : (timelineState.theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/60')}`}
                      style={{
                        left: `${index * dateRange.cellWidth * 7}px`,
                        width: `${dateRange.cellWidth * 7}px`,
                        borderRightWidth: isLastWeekOfMonth ? '3px' : '1px',
                        borderRightStyle: 'solid',
                        borderRightColor: isLastWeekOfMonth ? (timelineState.theme === 'dark' ? '#6366f1' : '#4f46e5') : (timelineState.theme === 'dark' ? '#6b7280' : '#d1d5db'),
                        borderLeftWidth: isFirstMonth ? '3px' : '0px',
                        borderLeftStyle: 'solid',
                        borderLeftColor: isFirstMonth ? (timelineState.theme === 'dark' ? '#6366f1' : '#4f46e5') : 'transparent',
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
                      className={`absolute inset-y-0 ${getWeekBackground(date, dateRange.startDate, timelineState.theme)}`}
                      style={{
                        left: `${getDatePosition(date, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit)}px`,
                        width: `${dateRange.cellWidth}px`,
                        borderRightWidth: isLastDateOfMonth ? '3px' : isFirstWeek ? '1px' : '0px',
                        borderRightStyle: 'solid',
                        borderRightColor: isLastDateOfMonth ? (timelineState.theme === 'dark' ? '#6366f1' : '#4f46e5') : isFirstWeek ? (timelineState.theme === 'dark' ? '#6b7280' : '#d1d5db') : 'transparent',
                        borderLeftWidth: isFirstMonth ? '3px' : '0px',
                        borderLeftStyle: 'solid',
                        borderLeftColor: isFirstMonth ? (timelineState.theme === 'dark' ? '#6366f1' : '#4f46e5') : 'transparent',
                        opacity: 0.4
                      }}
                    />
                  )
                })
              )}
            </div>
            
            {/* 土日祝日オーバーレイ */}
            <div className="absolute inset-0 pointer-events-none">
              {timelineState.viewUnit === 'week' ? (
                visibleDates.map((weekStart, weekIndex) => {
                  const weekDates = []
                  for (let i = 0; i < 7; i++) {
                    const currentDate = new Date(weekStart)
                    currentDate.setDate(currentDate.getDate() + i)
                    if (currentDate <= dateRange.endDate) {
                      weekDates.push(currentDate)
                    }
                  }
                  
                  return weekDates.map((date, dayIndex) => {
                    const dateType = getDateType(date)
                    if (dateType === 'weekday') return null
                    
                    const bgColor = timelineState.theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-300/50'
                    
                    return (
                      <div
                        key={`holiday-week-${date.getTime()}`}
                        className={`absolute inset-y-0 ${bgColor}`}
                        style={{
                          left: `${weekIndex * dateRange.cellWidth * 7 + dayIndex * dateRange.cellWidth}px`,
                          width: `${dateRange.cellWidth}px`,
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
                  
                  const bgColor = timelineState.theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-300/50'
                  
                  return (
                    <div
                      key={`holiday-${date.getTime()}`}
                      className={`absolute inset-y-0 ${bgColor}`}
                      style={{
                        left: `${getDatePosition(date, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit)}px`,
                        width: `${dateRange.cellWidth}px`,
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
                    height: `${dynamicSizes.rowHeight.project}px`,
                    backgroundColor: `${project.color}${timelineState.theme === 'dark' ? '60' : '50'}`,
                    borderLeft: `${Math.max(4, Math.round(6 * dynamicSizes.zoomRatio))}px solid ${project.color}`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent opacity-50"></div>
                  
                  {/* 動的プロジェクト名 */}
                  <div 
                    className={`absolute z-10 ${timelineState.theme === 'dark' ? 'bg-gray-800 border-gray-500' : 'bg-white border-gray-300'} rounded-lg shadow-lg border-2 transition-all duration-200`}
                    style={{
                      left: `${getProjectNamePosition(timelineState.scrollLeft)}px`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      maxWidth: `${Math.max(200, Math.round(320 * dynamicSizes.zoomRatio))}px`,
                      maxHeight: `${Math.round(dynamicSizes.rowHeight.project * 0.8)}px`,
                      padding: `${Math.max(2, Math.round(4 * dynamicSizes.zoomRatio))}px ${Math.max(6, Math.round(12 * dynamicSizes.zoomRatio))}px`,
                      borderWidth: `${Math.max(1, Math.round(2 * dynamicSizes.zoomRatio))}px`,
                      overflow: 'hidden'
                    }}
                  >
                    <div 
                      className="flex items-center h-full"
                      style={{ 
                        color: project.color,
                        gap: `${Math.max(4, Math.round(8 * dynamicSizes.zoomRatio))}px`
                      }}
                    >
                      <div 
                        className="rounded-md bg-gray-100 dark:bg-gray-700 flex-shrink-0"
                        style={{
                          padding: `${Math.max(1, Math.round(2 * dynamicSizes.zoomRatio))}px`
                        }}
                      >
                        {project.expanded ? 
                          <ChevronDown size={Math.max(8, Math.round(14 * dynamicSizes.zoomRatio))} className="flex-shrink-0" /> :
                          <ChevronRight size={Math.max(8, Math.round(14 * dynamicSizes.zoomRatio))} className="flex-shrink-0" />
                        }
                      </div>
                      <Factory size={Math.max(10, Math.round(14 * dynamicSizes.zoomRatio))} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div 
                          className="font-bold truncate leading-tight"
                          style={{ 
                            fontSize: `${Math.min(dynamicSizes.fontSize.base, Math.round(dynamicSizes.rowHeight.project * 0.4))}px`,
                            lineHeight: '1.2'
                          }}
                        >
                          {getDisplayText(project.name, timelineState.zoomLevel, Math.max(10, Math.round(20 * dynamicSizes.zoomRatio)))}
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
                           height: `${dynamicSizes.rowHeight.subtask}px`,
                           overflow: timelineState.viewUnit === 'week' ? 'visible' : 'hidden' 
                         }}>
                      {/* 親タスクバー */}
                      <div
                        className="absolute rounded-lg shadow-lg flex items-center transition-all duration-200 hover:shadow-xl hover:scale-105 group cursor-pointer"
                        style={{ 
                          left: `${getDatePosition(task.startDate, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit)}px`,
                          width: timelineState.viewUnit === 'week'
                            ? `${getDatePosition(task.dueDate, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit) - getDatePosition(task.startDate, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit) + dateRange.cellWidth}px`
                            : `${Math.max(getDatePosition(task.dueDate, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit) - getDatePosition(task.startDate, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit) + dateRange.cellWidth, task.subtasks && task.subtasks.length > 0 ? 120 : 80)}px`,
                          height: `${Math.round(dynamicSizes.taskBarHeight * 0.8)}px`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: getStatusStyle(task.status || 'not-started', project.color, task.milestone, false).backgroundColor,
                          color: getStatusStyle(task.status || 'not-started', project.color, task.milestone, false).textColor,
                          borderWidth: getStatusStyle(task.status || 'not-started', project.color, task.milestone, false).borderWidth,
                          borderStyle: getStatusStyle(task.status || 'not-started', project.color, task.milestone, false).borderStyle,
                          borderColor: getStatusStyle(task.status || 'not-started', project.color, task.milestone, false).borderColor,
                          opacity: getStatusStyle(task.status || 'not-started', project.color, task.milestone, false).opacity,
                          zIndex: task.milestone ? 3 : 2,
                          overflow: 'visible'
                        }}
                      >
                        {/* タスク情報 */}
                        <div 
                          className="px-4 font-semibold truncate flex-1 flex items-center min-w-0 group-hover:pr-2 transition-all duration-200"
                          style={{ fontSize: `${dynamicSizes.fontSize.small}px` }}
                        >
                          {task.status === 'completed' && <Check size={Math.max(10, Math.round(14 * dynamicSizes.zoomRatio))} className="mr-2 flex-shrink-0" />}
                          {task.status === 'overdue' && <AlertTriangle size={Math.max(10, Math.round(14 * dynamicSizes.zoomRatio))} className="mr-2 flex-shrink-0" />}
                          <span className="truncate">{getDisplayText(task.name, timelineState.zoomLevel, timelineState.viewUnit === 'week' ? 20 : 15)}</span>
                        </div>
                        
                        {/* 展開/折り畳みバッジ */}
                        {task.subtasks && task.subtasks.length > 0 && timelineState.zoomLevel > 30 && (
                          <div 
                            className={`flex-shrink-0 mr-3 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 shadow-md border group-hover:shadow-lg ${
                              task.expanded 
                                ? 'bg-white/40 border-white/50 ring-2 ring-white/30' 
                                : 'bg-white/25 border-white/30 hover:bg-white/35 group-hover:bg-white/40'
                            }`}
                            style={{
                              backdropFilter: 'blur(8px)',
                              minWidth: `${Math.round(dynamicSizes.taskBarHeight * 0.8 * 1.8)}px`,
                              height: `${Math.round(dynamicSizes.taskBarHeight * 0.8 * 0.9)}px`,
                              padding: `${Math.max(2, Math.round(4 * dynamicSizes.zoomRatio))}px ${Math.max(4, Math.round(8 * dynamicSizes.zoomRatio))}px`
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
                                  width: `${Math.max(8, Math.round(12 * dynamicSizes.zoomRatio))}px`,
                                  height: `${Math.max(8, Math.round(12 * dynamicSizes.zoomRatio))}px`
                                }}
                              >
                                {task.expanded ? (
                                  <ChevronDown size={Math.max(8, Math.round(10 * dynamicSizes.zoomRatio))} className="text-white drop-shadow-lg font-bold" />
                                ) : (
                                  <ChevronRight size={Math.max(8, Math.round(10 * dynamicSizes.zoomRatio))} className="text-white drop-shadow-lg font-bold" />
                                )}
                              </div>
                              <div 
                                className="flex items-center justify-center bg-white/30 rounded-full"
                                style={{
                                  width: `${Math.max(12, Math.round(16 * dynamicSizes.zoomRatio))}px`,
                                  height: `${Math.max(12, Math.round(16 * dynamicSizes.zoomRatio))}px`
                                }}
                              >
                                <span 
                                  className="font-bold text-white drop-shadow-lg"
                                  style={{
                                    fontSize: `${Math.max(6, Math.round(9 * dynamicSizes.zoomRatio))}px`
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
                             height: `${dynamicSizes.rowHeight.subtask}px`,
                             overflow: timelineState.viewUnit === 'week' ? 'visible' : 'hidden' 
                           }}>
                        {/* 階層接続線 */}
                        {subtaskIndex === 0 && timelineState.zoomLevel > 30 && (
                          <>
                            <div 
                              className="absolute bg-gradient-to-b from-gray-400 to-gray-300 dark:from-gray-500 dark:to-gray-600 opacity-70 rounded-full"
                              style={{
                                left: `${getDatePosition(task.startDate, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit) + Math.round(20 * dynamicSizes.zoomRatio)}px`,
                                top: `${-Math.round(12 * dynamicSizes.zoomRatio)}px`,
                                width: `${Math.max(1, Math.round(2 * dynamicSizes.zoomRatio))}px`,
                                height: `${((task.subtasks?.length || 0) * dynamicSizes.rowHeight.subtask) + Math.round(12 * dynamicSizes.zoomRatio)}px`,
                                zIndex: 1,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                              }}
                            />
                            <div 
                              className="absolute bg-gradient-to-br from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600 rounded-full shadow-sm border border-white dark:border-gray-800"
                              style={{
                                left: `${getDatePosition(task.startDate, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit) + Math.round(20 * dynamicSizes.zoomRatio) - Math.round(4 * dynamicSizes.zoomRatio)}px`,
                                top: `${-Math.round(16 * dynamicSizes.zoomRatio)}px`,
                                width: `${Math.max(6, Math.round(8 * dynamicSizes.zoomRatio))}px`,
                                height: `${Math.max(6, Math.round(8 * dynamicSizes.zoomRatio))}px`,
                                zIndex: 3
                              }}
                            />
                          </>
                        )}
                        
                        {/* 水平接続線 */}
                        {timelineState.zoomLevel > 30 && (
                          <div 
                            className="absolute opacity-70 rounded-full"
                            style={{
                              left: `${Math.min(getDatePosition(task.startDate, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit) + Math.round(20 * dynamicSizes.zoomRatio), getDatePosition(subtask.startDate, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit) + Math.round(32 * dynamicSizes.zoomRatio))}px`,
                              width: `${Math.abs(getDatePosition(subtask.startDate, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit) + Math.round(32 * dynamicSizes.zoomRatio) - (getDatePosition(task.startDate, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit) + Math.round(20 * dynamicSizes.zoomRatio)))}px`,
                              height: `${Math.max(1, Math.round(2 * dynamicSizes.zoomRatio))}px`,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              zIndex: 1,
                              background: getDatePosition(subtask.startDate, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit) + Math.round(32 * dynamicSizes.zoomRatio) >= getDatePosition(task.startDate, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit) + Math.round(20 * dynamicSizes.zoomRatio)
                                ? 'linear-gradient(to right, #9ca3af, #d1d5db)'
                                : 'linear-gradient(to left, #9ca3af, #d1d5db)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                          />
                        )}
                        
                        {/* 接続点 */}
                        {timelineState.zoomLevel > 30 && (
                          <div 
                            className="absolute bg-gradient-to-br from-green-400 to-green-500 dark:from-green-500 dark:to-green-600 rounded-full shadow-sm border border-white dark:border-gray-800"
                            style={{
                              left: `${getDatePosition(subtask.startDate, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit) + Math.round(32 * dynamicSizes.zoomRatio) - Math.round(5 * dynamicSizes.zoomRatio)}px`,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: `${Math.max(6, Math.round(10 * dynamicSizes.zoomRatio))}px`,
                              height: `${Math.max(6, Math.round(10 * dynamicSizes.zoomRatio))}px`,
                              zIndex: 2
                            }}
                          />
                        )}
                        
                        {/* サブタスクバー */}
                        <div
                          className="absolute rounded-md shadow-md flex items-center transition-all duration-200 hover:shadow-lg"
                          style={{ 
                            left: `${getDatePosition(subtask.startDate, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit) + Math.round(32 * dynamicSizes.zoomRatio)}px`,
                            width: `${getDatePosition(subtask.dueDate, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit) - getDatePosition(subtask.startDate, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit) + dateRange.cellWidth - Math.round(32 * dynamicSizes.zoomRatio)}px`,
                            height: `${Math.round(dynamicSizes.taskBarHeight * 0.8)}px`,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: getStatusStyle(subtask.status || 'not-started', project.color, subtask.milestone, true).backgroundColor,
                            color: getStatusStyle(subtask.status || 'not-started', project.color, subtask.milestone, true).textColor,
                            borderWidth: getStatusStyle(subtask.status || 'not-started', project.color, subtask.milestone, true).borderWidth,
                            borderStyle: getStatusStyle(subtask.status || 'not-started', project.color, subtask.milestone, true).borderStyle,
                            borderColor: getStatusStyle(subtask.status || 'not-started', project.color, subtask.milestone, true).borderColor,
                            opacity: getStatusStyle(subtask.status || 'not-started', project.color, subtask.milestone, true).opacity,
                            zIndex: subtask.milestone ? 3 : 1,
                            overflow: 'visible'
                          }}
                        >
                          <div className="px-3 flex items-center flex-shrink-0">
                            {subtask.status === 'completed' && <Check size={Math.max(8, Math.round(14 * dynamicSizes.zoomRatio))} className="flex-shrink-0" />}
                            {subtask.status === 'overdue' && <AlertTriangle size={Math.max(8, Math.round(14 * dynamicSizes.zoomRatio))} className="flex-shrink-0" />}
                            {subtask.milestone && <Star size={Math.max(8, Math.round(14 * dynamicSizes.zoomRatio))} className="text-yellow-200 flex-shrink-0" />}
                          </div>
                        </div>
                        
                        {/* サブタスク名ラベル */}
                        {timelineState.zoomLevel > 30 && (
                          <div
                            className={`absolute flex items-center pointer-events-none z-10`}
                            style={{
                              left: `${getDatePosition(subtask.dueDate, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit) + dateRange.cellWidth + 8}px`,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              whiteSpace: 'nowrap',
                              height: `${Math.round(dynamicSizes.taskBarHeight * 0.8)}px`
                            }}
                          >
                            <div 
                              className={`px-2 py-0.5 rounded font-medium shadow-sm border opacity-90 ${
                                timelineState.theme === 'dark' 
                                  ? 'bg-gray-800 text-gray-200 border-gray-600' 
                                  : 'bg-white text-gray-700 border-gray-300'
                              }`}
                              style={{
                                backdropFilter: 'blur(4px)',
                                backgroundColor: timelineState.theme === 'dark' ? 'rgba(31, 41, 55, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                                fontSize: `${Math.max(8, dynamicSizes.fontSize.small)}px`
                              }}
                            >
                              {getDisplayText(subtask.name, timelineState.zoomLevel, 15)}
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
                left: `${getDatePosition(today, dateRange.startDate, dateRange.cellWidth, timelineState.viewUnit)}px`,
                width: `${Math.max(1, Math.round(2 * dynamicSizes.zoomRatio))}px`,
                height: '100%'
              }}
            >
              <div 
                className="absolute top-0 bg-red-500 rounded-full shadow-lg flex items-center justify-center border-2 border-white dark:border-gray-900"
                style={{
                  left: `${-Math.round(10 * dynamicSizes.zoomRatio)}px`,
                  width: `${Math.max(12, Math.round(20 * dynamicSizes.zoomRatio))}px`,
                  height: `${Math.max(12, Math.round(20 * dynamicSizes.zoomRatio))}px`
                }}
              >
                <div 
                  className="bg-white rounded-full"
                  style={{
                    width: `${Math.max(6, Math.round(8 * dynamicSizes.zoomRatio))}px`,
                    height: `${Math.max(6, Math.round(8 * dynamicSizes.zoomRatio))}px`
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