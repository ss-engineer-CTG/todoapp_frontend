import React from 'react'
import { useTimeline } from '@/hooks/useTimeline'
import { isHoliday, getDateType, getMonthName } from '@/utils/dateUtils'
import { cn } from '@/lib/utils'

const TimelineHeader: React.FC = () => {
  const { viewUnit, visibleDates, dateRange, dynamicSizes } = useTimeline()

  if (!visibleDates || visibleDates.length === 0) {
    return null
  }

  const firstDate = visibleDates[0]
  const lastDate = visibleDates[visibleDates.length - 1]

  if (!firstDate || !lastDate) {
    return null
  }

  return (
    <div className="border-b-2 overflow-hidden bg-background">
      <div className="w-full overflow-x-auto timeline-header" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {viewUnit === 'day' ? (
          // 日表示：2行構造
          <div>
            {/* 月行 */}
            <div
              className="flex border-b"
              style={{
                height: `${Math.max(20, Math.round(dynamicSizes.rowHeight.project * 0.6))}px`,
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

                return monthGroups.map((monthGroup) => (
                  <div
                    key={`month-${monthGroup.year}-${monthGroup.month}`}
                    className="text-center font-bold border-r-2 flex items-center justify-center bg-primary/5"
                    style={{
                      width: `${monthGroup.width}px`,
                      minWidth: `${monthGroup.width}px`,
                      borderRightWidth: '3px',
                      borderRightColor: 'hsl(var(--primary))',
                      fontSize: `${dynamicSizes.fontSize.base}px`
                    }}
                  >
                    <div className="text-primary font-bold">
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
                height: `${Math.max(24, Math.round(dynamicSizes.rowHeight.project * 0.8))}px`,
                minWidth: `${visibleDates.length * dateRange.cellWidth}px`
              }}
            >
              {visibleDates.map((date, index) => {
                const prevDate = index > 0 ? visibleDates[index - 1] : null
                const nextDate = index < visibleDates.length - 1 ? visibleDates[index + 1] : null
                const isLastDateOfMonth = nextDate ? date.getMonth() !== nextDate.getMonth() : index === visibleDates.length - 1
                const isFirstWeek = date.getDay() === 1
                const isToday = date.toDateString() === new Date().toDateString()

                return (
                  <div
                    key={date.getTime()}
                    className={cn(
                      "text-center font-semibold py-1 border-r flex items-center justify-center",
                      isToday ? "bg-yellow-100 dark:bg-yellow-900/40 border-yellow-400" : "",
                      getDateType(date) !== 'weekday' ? "bg-gray-200/60 dark:bg-gray-800/40" : ""
                    )}
                    style={{
                      width: `${dateRange.cellWidth}px`,
                      minWidth: `${dateRange.cellWidth}px`,
                      borderRightWidth: isLastDateOfMonth ? '3px' : isFirstWeek ? '2px' : '1px',
                      borderRightColor: isLastDateOfMonth ? 'hsl(var(--primary))' : isFirstWeek ? 'hsl(var(--muted-foreground))' : 'hsl(var(--border))',
                      fontSize: `${dynamicSizes.fontSize.small}px`
                    }}
                  >
                    <div
                      className={cn(
                        "font-medium",
                        date.getDay() === 0 || isHoliday(date) || date.getDay() === 6
                          ? "text-muted-foreground"
                          : "text-foreground"
                      )}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          // 週表示：1行構造
          <div
            className="flex"
            style={{
              height: `${Math.max(36, dynamicSizes.rowHeight.project + 4)}px`,
              minWidth: `${visibleDates.length * dateRange.cellWidth * 7}px`
            }}
          >
            {visibleDates.map((date, index) => {
              const weekStart = new Date(date)
              const weekEnd = new Date(date)
              weekEnd.setDate(weekEnd.getDate() + 6)

              const prevWeek = index > 0 ? visibleDates[index - 1] : null
              const isFirstMonth = index === 0 || (prevWeek && prevWeek.getMonth() !== date.getMonth())
              const nextWeek = index < visibleDates.length - 1 ? visibleDates[index + 1] : null
              const isLastWeekOfMonth = nextWeek ? date.getMonth() !== nextWeek.getMonth() : index === visibleDates.length - 1

              return (
                <div
                  key={date.getTime()}
                  className="text-center font-semibold py-2 border-r-2 flex flex-col justify-center"
                  style={{
                    width: `${dateRange.cellWidth * 7}px`,
                    minWidth: `${dateRange.cellWidth * 7}px`,
                    borderRightWidth: isLastWeekOfMonth ? '4px' : '2px',
                    borderRightColor: isLastWeekOfMonth ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                    borderLeftWidth: isFirstMonth ? '4px' : '0px',
                    borderLeftColor: isFirstMonth ? 'hsl(var(--primary))' : 'transparent'
                  }}
                >
                  <div className="font-bold text-foreground" style={{ fontSize: `${dynamicSizes.fontSize.week}px` }}>
                    {weekStart.getMonth() === weekEnd.getMonth()
                      ? (isFirstMonth
                          ? `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getDate()}`
                          : `${weekStart.getDate()}-${weekEnd.getDate()}`)
                      : `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
                    }
                  </div>
                  {dynamicSizes.zoomRatio > 0.4 && (
                    <div className="text-muted-foreground mt-1" style={{ fontSize: `${Math.max(8, dynamicSizes.fontSize.week - 2)}px` }}>
                      第{Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}週
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default TimelineHeader