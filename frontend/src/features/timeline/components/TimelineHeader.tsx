// システムプロンプト準拠：タイムラインヘッダー部分（リファクタリング：ヘッダー描画分離）
// リファクタリング対象：OptimizedTimeline から日付ヘッダー描画ロジックを抽出

import React from 'react'
import { 
  getDateCellClass,
  getMonthName,
  getWeekNumber
} from '@core/utils'
import { isFirstDayOfWeek, isFirstDayOfMonth } from '../utils'

interface TimelineHeaderProps {
  visibleDates: Date[]
  dimensions: {
    cellWidth: number
    rowHeight: number
  }
  dynamicFontSizes: {
    daySize: number
    monthSize: number
  }
  viewUnit: 'day' | 'week' | 'month'
  theme: "dark" | "light"
  today: Date
  scrollLeft: number
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = React.memo(({
  visibleDates,
  dimensions,
  dynamicFontSizes,
  viewUnit,
  theme,
  today,
  scrollLeft
}) => {
  return (
    <div 
      className="sticky top-0 z-20 flex bg-background border-b border-border"
      style={{ left: `${scrollLeft}px` }}
    >
      {/* プロジェクト/タスク列ヘッダー */}
      <div className="w-64 bg-muted border-r border-border flex items-center justify-center text-sm font-medium">
        プロジェクト / タスク
      </div>
      
      {/* 日付ヘッダー */}
      <div className="flex">
        {visibleDates.map((date, index) => {
          const dateStr = date.toISOString().split('T')[0]
          const isFirstOfWeek = isFirstDayOfWeek(date)
          const isFirstOfMonth = isFirstDayOfMonth(date)
          const dayNumber = date.getDate()
          const monthName = getMonthName(date)
          const weekNumber = getWeekNumber(date)
          
          return (
            <div
              key={`date-${dateStr}`}
              className={getDateCellClass(date, today, theme)}
              style={{
                width: `${dimensions.cellWidth}px`,
                minWidth: `${dimensions.cellWidth}px`,
                fontSize: `${dynamicFontSizes.daySize}px`
              }}
            >
              <div className="text-center">
                {viewUnit === 'week' && isFirstOfWeek && (
                  <div className="text-xs opacity-70">W{weekNumber}</div>
                )}
                <div className="font-medium">{dayNumber}</div>
                {isFirstOfMonth && (
                  <div 
                    className="text-xs opacity-70"
                    style={{ fontSize: `${dynamicFontSizes.monthSize}px` }}
                  >
                    {monthName}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

TimelineHeader.displayName = 'TimelineHeader'