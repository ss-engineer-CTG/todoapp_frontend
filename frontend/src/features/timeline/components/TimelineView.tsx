// システムプロンプト準拠：メインタイムラインビューコンポーネント（テーマ統合版）
// 🔧 修正内容：独自テーマ状態除去・ThemeProvider統合

import React, { useCallback, useEffect, useMemo } from 'react'
import { TimelineControls } from './TimelineControls'
import { TimelineRenderer } from './TimelineRenderer'
import { TimelineViewProps } from '../types'
import { useTimeline } from '../hooks/useTimeline'
import { buildTaskRelationMap } from '@tasklist/utils/task'
import { useTheme } from '@core/components/ThemeProvider'
import { 
  logger,
  getDateCellClass,
  getMonthName,
  getWeekNumber
} from '@core/utils'

export const TimelineView: React.FC<TimelineViewProps> = ({
  projects,
  tasks,
  onViewModeChange,
  onScrollToToday
}) => {
  // 🔧 修正：ThemeProviderのテーマを使用
  const { theme, setTheme } = useTheme()
  
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

  const today = new Date()
  const taskRelationMap = useMemo(() => buildTaskRelationMap(tasks), [tasks])

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

  // プロジェクト展開/折り畳み
  const handleToggleProject = useCallback((projectId: string) => {
    logger.info('Toggling project', { projectId })
    // 実装は親コンポーネントで管理
  }, [])

  // タスク展開/折り畳み
  const handleToggleTask = useCallback((taskId: string) => {
    logger.info('Toggling task', { taskId })
    // 実装は親コンポーネントで管理
  }, [])

  // 全展開
  const handleExpandAll = useCallback(() => {
    logger.info('Expanding all projects and tasks')
    // 実装は親コンポーネントで管理
  }, [])

  // 全折り畳み
  const handleCollapseAll = useCallback(() => {
    logger.info('Collapsing all projects and tasks')
    // 実装は親コンポーネントで管理
  }, [])

  // 🔧 修正：テーマクラス統一
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

  // 週の開始日判定（月曜日）
  const isFirstDayOfWeek = useCallback((date: Date): boolean => {
    return date.getDay() === 1
  }, [])

  // 月の最初の日判定
  const isFirstDayOfMonth = useCallback((date: Date, index: number, visibleDates: Date[]): boolean => {
    return index === 0 || (index > 0 && visibleDates[index - 1].getMonth() !== date.getMonth())
  }, [])

  // プロジェクトデータが空の場合の表示
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

  return (
    <div className={`h-screen flex flex-col ${classes.app} overflow-hidden`}>
      {/* 統合コントロール */}
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
      
      {/* スクロール可能コンテンツ */}
      <main className="flex-1 flex flex-col overflow-hidden w-full min-w-0" style={{ height: 'calc(100vh - 114px)' }}>
        {/* 日付ヘッダー */}
        <div className={`${classes.dateHeader} border-b-2 overflow-hidden w-full`}>
          <div className="w-full overflow-x-hidden timeline-date-header">
            {state.viewUnit === 'day' ? (
              // 日表示
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
                          borderRightColor: theme === 'dark' ? '#6366f1' : '#4f46e5',
                          fontSize: `${dimensions.fontSize.base}px`,
                          backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(79, 70, 229, 0.05)'
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
                        className={`text-center font-semibold py-1 border-r ${classes.dateHeader} ${getDateCellClass(date, today, theme)} flex items-center justify-center`}
                        style={{ 
                          width: `${dimensions.cellWidth}px`,
                          minWidth: `${dimensions.cellWidth}px`,
                          borderRightWidth: isLastDateOfMonth ? '3px' : isFirstWeek ? '2px' : '1px',
                          borderRightColor: isLastDateOfMonth ? (theme === 'dark' ? '#6366f1' : '#4f46e5') : isFirstWeek ? (theme === 'dark' ? '#6b7280' : '#9ca3af') : (theme === 'dark' ? '#4b5563' : '#d1d5db'),
                          fontSize: `${dimensions.fontSize.small}px`
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
              // 週表示
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
                      <div className="font-bold text-gray-900 dark:text-white" style={{ fontSize: `${dimensions.fontSize.base}px` }}>
                        {weekStart.getMonth() === weekEnd.getMonth() 
                          ? (isFirstMonth 
                              ? `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getDate()}`
                              : `${weekStart.getDate()}-${weekEnd.getDate()}`)
                          : `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
                        }
                      </div>
                      {state.zoomLevel > 40 && (
                        <div className="text-gray-600 dark:text-gray-300 mt-1" style={{ fontSize: `${Math.max(8, dimensions.fontSize.base - 2)}px` }}>
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
          className="w-full flex-1 relative overflow-auto timeline-content" 
          onScroll={handleTimelineScroll}
          ref={timelineRef}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: theme === 'dark' ? '#6b7280 #1f2937' : '#9ca3af #ffffff'
          }}
        >
          <TimelineRenderer
            projects={projects}
            tasks={tasks}
            taskRelationMap={taskRelationMap}
            zoomLevel={state.zoomLevel}
            viewUnit={state.viewUnit}
            theme={theme}
            timeRange={timeRange}
            visibleDates={visibleDates}
            scrollLeft={state.scrollLeft}
            onToggleProject={handleToggleProject}
            onToggleTask={handleToggleTask}
          />
        </div>
      </main>
    </div>
  )
}