import React from 'react'
import { useTimeline } from '@/hooks/useTimeline'
import { isHoliday, getDateType, getMonthName } from '@/utils/dateUtils'
import { cn } from '@/lib/utils'
import ErrorMessage from '@/components/common/ErrorMessage'

const TimelineHeader: React.FC = () => {
  const { viewUnit, visibleDates, dateRange, dynamicSizes, error } = useTimeline()
  const [renderError, setRenderError] = React.useState<string | null>(null)

  // エラーハンドリングを含む安全なレンダリング
  const renderTimelineHeader = React.useCallback(() => {
    try {
      if (!visibleDates || visibleDates.length === 0) {
        return (
          <div className="h-16 flex items-center justify-center border-b bg-muted/30">
            <span className="text-sm text-muted-foreground">日付データを読み込み中...</span>
          </div>
        )
      }

      const firstDate = visibleDates[0]
      const lastDate = visibleDates[visibleDates.length - 1]

      if (!firstDate || !lastDate) {
        throw new Error('有効な日付範囲が見つかりません')
      }

      return viewUnit === 'day' ? renderDayView() : renderWeekView()
    } catch (err) {
      console.error('Error rendering timeline header:', err)
      setRenderError('タイムラインヘッダーの表示中にエラーが発生しました')
      return null
    }
  }, [viewUnit, visibleDates, dateRange, dynamicSizes])

  // 日表示のレンダリング
  const renderDayView = () => {
    try {
      return (
        <div className="border-b-2 overflow-hidden bg-background sticky top-0 z-10">
          <div 
            className="w-full overflow-x-auto timeline-header scrollbar-hide" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* 2行構造：月行＋日行 */}
            <div>
              {/* 月行 */}
              <div
                className="flex border-b bg-primary/5"
                style={{
                  height: `${Math.max(24, Math.round(dynamicSizes.rowHeight.project * 0.6))}px`,
                  minWidth: `${visibleDates.length * dateRange.cellWidth}px`
                }}
              >
                {(() => {
                  const monthGroups: Array<{
                    month: number
                    year: number
                    startIndex: number
                    width: number
                  }> = []
                  
                  let currentMonth: number | null = null
                  let monthStart = 0
                  let monthWidth = 0

                  visibleDates.forEach((date, index) => {
                    if (!date) return
                    
                    if (currentMonth !== date.getMonth()) {
                      if (currentMonth !== null) {
                        const startDate = visibleDates[monthStart]
                        if (startDate) {
                          monthGroups.push({
                            month: currentMonth,
                            year: startDate.getFullYear(),
                            startIndex: monthStart,
                            width: monthWidth * dateRange.cellWidth
                          })
                        }
                      }
                      currentMonth = date.getMonth()
                      monthStart = index
                      monthWidth = 1
                    } else {
                      monthWidth++
                    }

                    if (index === visibleDates.length - 1) {
                      monthGroups.push({
                        month: currentMonth,
                        year: date.getFullYear(),
                        startIndex: monthStart,
                        width: monthWidth * dateRange.cellWidth
                      })
                    }
                  })

                  return monthGroups.map((monthGroup, index) => (
                    <div
                      key={`month-${monthGroup.year}-${monthGroup.month}-${index}`}
                      className="text-center font-bold border-r-2 flex items-center justify-center"
                      style={{
                        width: `${Math.max(60, monthGroup.width)}px`,
                        minWidth: `${Math.max(60, monthGroup.width)}px`,
                        borderRightWidth: '3px',
                        borderRightColor: 'hsl(var(--primary))',
                        fontSize: `${Math.max(11, dynamicSizes.fontSize.base)}px`
                      }}
                    >
                      <div className="text-primary font-bold truncate px-1">
                        {monthGroup.year}年{getMonthName(new Date(monthGroup.year, monthGroup.month))}
                      </div>
                    </div>
                  ))
                })()}
              </div>

              {/* 日行 */}
              <div
                className="flex"
                style={{
                  height: `${Math.max(28, Math.round(dynamicSizes.rowHeight.project * 0.8))}px`,
                  minWidth: `${visibleDates.length * dateRange.cellWidth}px`
                }}
              >
                {visibleDates.map((date, index) => {
                  if (!date) return null
                  
                  const nextDate = index < visibleDates.length - 1 ? visibleDates[index + 1] : null
                  const isLastDateOfMonth = nextDate ? date.getMonth() !== nextDate.getMonth() : index === visibleDates.length - 1
                  const isFirstWeek = date.getDay() === 1
                  const isToday = date.toDateString() === new Date().toDateString()
                  const dateType = getDateType(date)

                  return (
                    <div
                      key={`day-${date.getTime()}-${index}`}
                      className={cn(
                        "text-center font-medium py-1 border-r flex items-center justify-center transition-colors",
                        isToday ? "bg-red-100 dark:bg-red-900/40 border-red-400 text-red-600 dark:text-red-400 font-bold" : "",
                        dateType !== 'weekday' ? "bg-muted/40 text-muted-foreground" : "hover:bg-accent/50"
                      )}
                      style={{
                        width: `${Math.max(20, dateRange.cellWidth)}px`,
                        minWidth: `${Math.max(20, dateRange.cellWidth)}px`,
                        borderRightWidth: isLastDateOfMonth ? '3px' : isFirstWeek ? '2px' : '1px',
                        borderRightColor: isLastDateOfMonth ? 'hsl(var(--primary))' : isFirstWeek ? 'hsl(var(--muted-foreground))' : 'hsl(var(--border))',
                        fontSize: `${Math.max(10, dynamicSizes.fontSize.small)}px`
                      }}
                      title={`${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日${isToday ? ' (今日)' : ''}${isHoliday(date) ? ' (祝日)' : ''}`}
                    >
                      <div className="truncate">
                        {date.getDate()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )
    } catch (error) {
      console.error('Error rendering day view:', error)
      setRenderError('日表示の描画中にエラーが発生しました')
      return null
    }
  }

  // 週表示のレンダリング
  const renderWeekView = () => {
    try {
      return (
        <div className="border-b-2 overflow-hidden bg-background sticky top-0 z-10">
          <div 
            className="w-full overflow-x-auto timeline-header scrollbar-hide" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* 1行構造：週情報 */}
            <div
              className="flex"
              style={{
                height: `${Math.max(40, dynamicSizes.rowHeight.project + 8)}px`,
                minWidth: `${visibleDates.length * dateRange.cellWidth * 7}px`
              }}
            >
              {visibleDates.map((date, index) => {
                if (!date) return null
                
                const weekStart = new Date(date)
                const weekEnd = new Date(date)
                weekEnd.setDate(weekEnd.getDate() + 6)

                const prevWeek = index > 0 ? visibleDates[index - 1] : null
                const isFirstMonth = index === 0 || (prevWeek && prevWeek.getMonth() !== date.getMonth())
                const nextWeek = index < visibleDates.length - 1 ? visibleDates[index + 1] : null
                const isLastWeekOfMonth = nextWeek ? date.getMonth() !== nextWeek.getMonth() : index === visibleDates.length - 1
                
                // 今日がこの週に含まれるかチェック
                const today = new Date()
                const isThisWeek = today >= weekStart && today <= weekEnd

                return (
                  <div
                    key={`week-${date.getTime()}-${index}`}
                    className={cn(
                      "text-center font-semibold py-2 border-r-2 flex flex-col justify-center transition-colors hover:bg-accent/30",
                      isThisWeek ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800" : ""
                    )}
                    style={{
                      width: `${Math.max(120, dateRange.cellWidth * 7)}px`,
                      minWidth: `${Math.max(120, dateRange.cellWidth * 7)}px`,
                      borderRightWidth: isLastWeekOfMonth ? '4px' : '2px',
                      borderRightColor: isLastWeekOfMonth ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      borderLeftWidth: isFirstMonth ? '4px' : '0px',
                      borderLeftColor: isFirstMonth ? 'hsl(var(--primary))' : 'transparent'
                    }}
                    title={`${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日${isThisWeek ? ' (今週)' : ''}`}
                  >
                    <div 
                      className={cn(
                        "font-bold truncate px-2",
                        isThisWeek ? "text-red-600 dark:text-red-400" : "text-foreground"
                      )} 
                      style={{ fontSize: `${Math.max(12, dynamicSizes.fontSize.week)}px` }}
                    >
                      {weekStart.getMonth() === weekEnd.getMonth()
                        ? (isFirstMonth
                            ? `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getDate()}`
                            : `${weekStart.getDate()}-${weekEnd.getDate()}`)
                        : `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
                      }
                    </div>
                    {dynamicSizes.zoomRatio > 0.4 && (
                      <div 
                        className="text-muted-foreground mt-0.5 truncate px-1" 
                        style={{ fontSize: `${Math.max(9, dynamicSizes.fontSize.week - 2)}px` }}
                      >
                        第{Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}週
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    } catch (error) {
      console.error('Error rendering week view:', error)
      setRenderError('週表示の描画中にエラーが発生しました')
      return null
    }
  }

  if (error || renderError) {
    return (
      <div className="h-16 border-b bg-background">
        <div className="p-2">
          <ErrorMessage
            type="error"
            message={error || renderError || ''}
            onClose={() => setRenderError(null)}
            className="text-sm"
          />
        </div>
      </div>
    )
  }

  return renderTimelineHeader()
}

export default React.memo(TimelineHeader)