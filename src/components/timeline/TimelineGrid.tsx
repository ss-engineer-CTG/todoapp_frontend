import React from 'react'
import { useTimeline } from '@/hooks/useTimeline'
import { getDateType, isToday } from '@/utils/dateUtils'
import { getDatePosition } from '@/utils/timelineUtils'

const TimelineGrid: React.FC = () => {
  const { viewUnit, visibleDates, dateRange, dynamicSizes } = useTimeline()
  const [renderError, setRenderError] = React.useState<string | null>(null)

  // グリッドをレンダリング（エラーハンドリング付き）
  const renderGrid = React.useCallback(() => {
    try {
      if (!visibleDates || visibleDates.length === 0) {
        return null
      }

      const firstDate = visibleDates[0]
      const lastDate = visibleDates[visibleDates.length - 1]

      if (!firstDate || !lastDate) {
        throw new Error('有効な日付範囲が見つかりません')
      }

      return (
        <>
          {/* 背景グリッド */}
          <div className="absolute inset-0 pointer-events-none">
            {viewUnit === 'week' ? renderWeekGrid() : renderDayGrid()}
          </div>

          {/* 土日祝日オーバーレイ */}
          <div className="absolute inset-0 pointer-events-none">
            {viewUnit === 'week' ? renderWeekHolidayOverlay() : renderDayHolidayOverlay()}
          </div>
        </>
      )
    } catch (error) {
      console.error('Error rendering timeline grid:', error)
      setRenderError('タイムライングリッドの表示中にエラーが発生しました')
      return null
    }
  }, [viewUnit, visibleDates, dateRange, dynamicSizes])

  // 週表示のグリッド
  const renderWeekGrid = () => {
    try {
      return visibleDates.map((weekStart, index) => {
        if (!weekStart) return null

        const prevWeekStart = index > 0 ? visibleDates[index - 1] : null
        const isFirstMonth = index === 0 || (prevWeekStart && prevWeekStart.getMonth() !== weekStart.getMonth())
        const nextWeek = index < visibleDates.length - 1 ? visibleDates[index + 1] : null
        const isLastWeekOfMonth = nextWeek ? weekStart.getMonth() !== nextWeek.getMonth() : index === visibleDates.length - 1

        const cellWidth = Math.max(20, dateRange.cellWidth)
        const weekWidth = cellWidth * 7

        return (
          <div
            key={`grid-week-${weekStart.getTime()}-${index}`}
            className={`absolute inset-y-0 timeline-grid-line ${
              index % 2 === 0 ? 'bg-muted/10' : 'bg-background/80'
            }`}
            style={{
              left: `${index * weekWidth}px`,
              width: `${weekWidth}px`,
              borderRightWidth: isLastWeekOfMonth ? '3px' : '1px',
              borderRightStyle: 'solid',
              borderRightColor: isLastWeekOfMonth ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--border) / 0.5)',
              borderLeftWidth: isFirstMonth ? '3px' : '0px',
              borderLeftStyle: 'solid',
              borderLeftColor: isFirstMonth ? 'hsl(var(--primary) / 0.3)' : 'transparent',
            }}
          />
        )
      })
    } catch (error) {
      console.error('Error rendering week grid:', error)
      return null
    }
  }

  // 日表示のグリッド
  const renderDayGrid = () => {
    try {
      return visibleDates.map((date, index) => {
        if (!date) return null

        const prevDate = index > 0 ? visibleDates[index - 1] : null
        const isFirstMonth = index === 0 || (prevDate && prevDate.getMonth() !== date.getMonth())
        const isFirstWeek = date.getDay() === 1
        const nextDate = index < visibleDates.length - 1 ? visibleDates[index + 1] : null
        const isLastDateOfMonth = nextDate ? date.getMonth() !== nextDate.getMonth() : index === visibleDates.length - 1

        const cellWidth = Math.max(20, dateRange.cellWidth)
        const position = getDatePosition(date, { startDate: visibleDates[0]!, cellWidth }, 'day')

        return (
          <div
            key={`grid-day-${date.getTime()}-${index}`}
            className={`absolute inset-y-0 timeline-grid-line ${
              Math.floor(index / 7) % 2 === 0 ? 'bg-muted/10' : 'bg-background/80'
            }`}
            style={{
              left: `${position}px`,
              width: `${cellWidth}px`,
              borderRightWidth: isLastDateOfMonth ? '3px' : isFirstWeek ? '1px' : '0.5px',
              borderRightStyle: 'solid',
              borderRightColor: isLastDateOfMonth 
                ? 'hsl(var(--primary) / 0.3)' 
                : isFirstWeek 
                  ? 'hsl(var(--border) / 0.5)' 
                  : 'hsl(var(--border) / 0.2)',
              borderLeftWidth: isFirstMonth ? '3px' : '0px',
              borderLeftStyle: 'solid',
              borderLeftColor: isFirstMonth ? 'hsl(var(--primary) / 0.3)' : 'transparent',
            }}
          />
        )
      })
    } catch (error) {
      console.error('Error rendering day grid:', error)
      return null
    }
  }

  // 週表示での土日祝日オーバーレイ
  const renderWeekHolidayOverlay = () => {
    try {
      return visibleDates.map((weekStart, weekIndex) => {
        if (!weekStart) return null

        const weekDates = []
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(weekStart)
          currentDate.setDate(currentDate.getDate() + i)
          if (currentDate <= new Date(visibleDates[visibleDates.length - 1]!.getTime() + 6 * 24 * 60 * 60 * 1000)) {
            weekDates.push(currentDate)
          }
        }

        const cellWidth = Math.max(20, dateRange.cellWidth)

        return weekDates.map((date, dayIndex) => {
          const dateType = getDateType(date)
          const isTodayDate = isToday(date)
          
          if (dateType === 'weekday' && !isTodayDate) return null

          let overlayClass = ''
          if (isTodayDate) {
            overlayClass = 'bg-red-100/50 dark:bg-red-900/20 border-r border-red-300'
          } else if (dateType === 'holiday') {
            overlayClass = 'bg-yellow-100/50 dark:bg-yellow-900/20'
          } else if (dateType === 'saturday') {
            overlayClass = 'bg-blue-100/30 dark:bg-blue-900/10'
          } else if (dateType === 'sunday') {
            overlayClass = 'bg-red-100/30 dark:bg-red-900/10'
          }

          return (
            <div
              key={`holiday-week-${date.getTime()}-${dayIndex}`}
              className={`absolute inset-y-0 ${overlayClass}`}
              style={{
                left: `${weekIndex * cellWidth * 7 + dayIndex * cellWidth}px`,
                width: `${cellWidth}px`,
                zIndex: 1
              }}
              title={isTodayDate ? '今日' : dateType === 'holiday' ? '祝日' : ''}
            />
          )
        })
      })
    } catch (error) {
      console.error('Error rendering week holiday overlay:', error)
      return null
    }
  }

  // 日表示での土日祝日オーバーレイ
  const renderDayHolidayOverlay = () => {
    try {
      return visibleDates.map((date, index) => {
        if (!date) return null

        const dateType = getDateType(date)
        const isTodayDate = isToday(date)
        
        if (dateType === 'weekday' && !isTodayDate) return null

        let overlayClass = ''
        if (isTodayDate) {
          overlayClass = 'bg-red-100/50 dark:bg-red-900/20 border-r-2 border-red-400'
        } else if (dateType === 'holiday') {
          overlayClass = 'bg-yellow-100/50 dark:bg-yellow-900/20'
        } else if (dateType === 'saturday') {
          overlayClass = 'bg-blue-100/30 dark:bg-blue-900/10'
        } else if (dateType === 'sunday') {
          overlayClass = 'bg-red-100/30 dark:bg-red-900/10'
        }

        const cellWidth = Math.max(20, dateRange.cellWidth)
        const position = getDatePosition(date, { startDate: visibleDates[0]!, cellWidth }, 'day')

        return (
          <div
            key={`holiday-day-${date.getTime()}-${index}`}
            className={`absolute inset-y-0 ${overlayClass}`}
            style={{
              left: `${position}px`,
              width: `${cellWidth}px`,
              zIndex: 1
            }}
            title={isTodayDate ? '今日' : dateType === 'holiday' ? '祝日' : ''}
          />
        )
      })
    } catch (error) {
      console.error('Error rendering day holiday overlay:', error)
      return null
    }
  }

  if (renderError) {
    console.warn('TimelineGrid render error:', renderError)
    return null // エラー時は何も表示しない
  }

  return renderGrid()
}

export default React.memo(TimelineGrid)