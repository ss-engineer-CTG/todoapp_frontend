import React from 'react'
import { useTimeline } from '@/hooks/useTimeline'
import { getDateType } from '@/utils/dateUtils'
import { getDatePosition } from '@/utils/timelineUtils'

const TimelineGrid: React.FC = () => {
  const { viewUnit, visibleDates, dateRange } = useTimeline()

  if (!visibleDates || visibleDates.length === 0) {
    return null
  }

  const firstDate = visibleDates[0]
  const lastDate = visibleDates[visibleDates.length - 1]

  if (!firstDate || !lastDate) {
    return null
  }

  return (
    <>
      {/* 背景グリッド */}
      <div className="absolute inset-0 pointer-events-none">
        {viewUnit === 'week' ? (
          // 週表示
          visibleDates.map((weekStart, index) => {
            const prevWeekStart = index > 0 ? visibleDates[index - 1] : null
            const isFirstMonth = index === 0 || (prevWeekStart && prevWeekStart.getMonth() !== weekStart.getMonth())
            const nextWeek = index < visibleDates.length - 1 ? visibleDates[index + 1] : null
            const isLastWeekOfMonth = nextWeek ? weekStart.getMonth() !== nextWeek.getMonth() : index === visibleDates.length - 1

            return (
              <div
                key={`grid-week-${weekStart.getTime()}`}
                className={`absolute inset-y-0 ${
                  index % 2 === 0 ? 'bg-muted/20' : 'bg-background/60'
                }`}
                style={{
                  left: `${index * dateRange.cellWidth * 7}px`,
                  width: `${dateRange.cellWidth * 7}px`,
                  borderRightWidth: isLastWeekOfMonth ? '3px' : '1px',
                  borderRightStyle: 'solid',
                  borderRightColor: isLastWeekOfMonth ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  borderLeftWidth: isFirstMonth ? '3px' : '0px',
                  borderLeftStyle: 'solid',
                  borderLeftColor: isFirstMonth ? 'hsl(var(--primary))' : 'transparent',
                  opacity: 0.4
                }}
              />
            )
          })
        ) : (
          // 日表示
          visibleDates.map((date, index) => {
            const prevDate = index > 0 ? visibleDates[index - 1] : null
            const isFirstMonth = index === 0 || (prevDate && prevDate.getMonth() !== date.getMonth())
            const isFirstWeek = date.getDay() === 1
            const nextDate = index < visibleDates.length - 1 ? visibleDates[index + 1] : null
            const isLastDateOfMonth = nextDate ? date.getMonth() !== nextDate.getMonth() : index === visibleDates.length - 1

            return (
              <div
                key={`grid-${date.getTime()}`}
                className={`absolute inset-y-0 ${
                  Math.floor(index / 7) % 2 === 0 ? 'bg-muted/20' : 'bg-background/60'
                }`}
                style={{
                  left: `${getDatePosition(date, { startDate: firstDate, cellWidth: dateRange.cellWidth }, 'day')}px`,
                  width: `${dateRange.cellWidth}px`,
                  borderRightWidth: isLastDateOfMonth ? '3px' : isFirstWeek ? '1px' : '0px',
                  borderRightStyle: 'solid',
                  borderRightColor: isLastDateOfMonth ? 'hsl(var(--primary))' : isFirstWeek ? 'hsl(var(--border))' : 'transparent',
                  borderLeftWidth: isFirstMonth ? '3px' : '0px',
                  borderLeftStyle: 'solid',
                  borderLeftColor: isFirstMonth ? 'hsl(var(--primary))' : 'transparent',
                  opacity: 0.4
                }}
              />
            )
          })
        )}
      </div>

      {/* 土日祝日オーバーレイ */}
      <div className="absolute inset-0 pointer-events-none">
        {viewUnit === 'week' ? (
          // 週表示での土日祝日
          visibleDates.map((weekStart, weekIndex) => {
            const weekDates = []
            for (let i = 0; i < 7; i++) {
              const currentDate = new Date(weekStart)
              currentDate.setDate(currentDate.getDate() + i)
              if (currentDate <= new Date(lastDate.getTime() + 6 * 24 * 60 * 60 * 1000)) {
                weekDates.push(currentDate)
              }
            }

            return weekDates.map((date, dayIndex) => {
              const dateType = getDateType(date)
              if (dateType === 'weekday') return null

              return (
                <div
                  key={`holiday-week-${date.getTime()}`}
                  className="absolute inset-y-0 bg-muted/30"
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
          // 日表示での土日祝日
          visibleDates.map((date) => {
            const dateType = getDateType(date)
            if (dateType === 'weekday') return null

            return (
              <div
                key={`holiday-${date.getTime()}`}
                className="absolute inset-y-0 bg-muted/30"
                style={{
                  left: `${getDatePosition(date, { startDate: firstDate, cellWidth: dateRange.cellWidth }, 'day')}px`,
                  width: `${dateRange.cellWidth}px`,
                  zIndex: 1
                }}
              />
            )
          })
        )}
      </div>
    </>
  )
}

export default TimelineGrid