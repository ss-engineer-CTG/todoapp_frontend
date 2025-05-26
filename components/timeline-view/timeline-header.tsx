"use client"

import React from "react"
import { getMonthName, isFirstDayOfMonth, isFirstDayOfWeek } from "./date-utils"
import { cn } from "@/lib/utils"
import type { DateRange, DynamicSizes } from "@/types/timeline"

interface TimelineHeaderProps {
  visibleDates: Date[]
  viewUnit: 'day' | 'week'
  dateRange: DateRange
  dynamicSizes: DynamicSizes
  scrollLeft: number
  onScroll: (scrollLeft: number) => void
}

interface MonthGroup {
  month: number
  year: number
  width: number
}

// 日本の祝日判定関数
const isHoliday = (date: Date): boolean => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  // 固定祝日（例：2025年）
  const fixedHolidays = [
    { month: 1, day: 1 },   // 元日
    { month: 2, day: 11 },  // 建国記念の日
    { month: 4, day: 29 },  // 昭和の日
    { month: 5, day: 3 },   // 憲法記念日
    { month: 5, day: 4 },   // みどりの日
    { month: 5, day: 5 },   // こどもの日
    { month: 8, day: 11 },  // 山の日
    { month: 11, day: 3 },  // 文化の日
    { month: 11, day: 23 }, // 勤労感謝の日
  ]
  
  return fixedHolidays.some(holiday => 
    holiday.month === month && holiday.day === day
  )
}

export default function TimelineHeader({
  visibleDates,
  viewUnit,
  dateRange,
  dynamicSizes,
  scrollLeft,
  onScroll
}: TimelineHeaderProps) {
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    onScroll(e.currentTarget.scrollLeft)
  }

  const totalWidth = viewUnit === 'week' 
    ? visibleDates.length * dateRange.cellWidth * 7
    : visibleDates.length * dateRange.cellWidth

  return (
    <div className="border-b-2 border-primary/20 bg-background sticky top-0 z-10">
      <div
        className="overflow-x-auto scrollbar-hide timeline-header-scroll"
        onScroll={handleScroll}
      >
        {viewUnit === 'day' ? (
          // 日表示：2行構造
          <div>
            {/* 月行 */}
            <div 
              className="flex border-b bg-background"
              style={{ 
                height: Math.max(24, dynamicSizes.rowHeight.project * 0.6),
                minWidth: totalWidth
              }}
            >
              {(() => {
                const monthGroups: MonthGroup[] = []
                let currentMonth: number | null = null
                let monthStart = 0
                let monthWidth = 0

                visibleDates.forEach((date, index) => {
                  if (currentMonth !== date.getMonth()) {
                    if (currentMonth !== null) {
                      monthGroups.push({
                        month: currentMonth,
                        year: visibleDates[monthStart].getFullYear(),
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
                      month: currentMonth,
                      year: date.getFullYear(),
                      width: monthWidth * dateRange.cellWidth
                    })
                  }
                })

                return monthGroups.map((group, index) => (
                  <div
                    key={`month-${group.year}-${group.month}`}
                    className="text-center font-bold border-r-2 border-primary/30 flex items-center justify-center bg-primary/5"
                    style={{
                      width: group.width,
                      minWidth: group.width,
                      fontSize: dynamicSizes.fontSize.base
                    }}
                  >
                    <span className="text-primary font-bold">
                      {group.year}年{getMonthName(new Date(group.year, group.month))}
                    </span>
                  </div>
                ))
              })()}
            </div>

            {/* 日行 */}
            <div 
              className="flex"
              style={{ 
                height: Math.max(28, dynamicSizes.rowHeight.project * 0.8),
                minWidth: totalWidth
              }}
            >
              {visibleDates.map((date, index) => {
                const isFirstMonth = isFirstDayOfMonth(date, index, visibleDates)
                const isFirstWeek = isFirstDayOfWeek(date)
                const nextDate = index < visibleDates.length - 1 ? visibleDates[index + 1] : null
                const isLastDateOfMonth = nextDate ? date.getMonth() !== nextDate.getMonth() : true

                return (
                  <div
                    key={date.getTime()}
                    className={cn(
                      "text-center font-semibold border-r flex items-center justify-center",
                      date.toDateString() === new Date().toDateString() ? "bg-yellow-100 dark:bg-yellow-900/40" : "bg-background"
                    )}
                    style={{
                      width: dateRange.cellWidth,
                      minWidth: dateRange.cellWidth,
                      borderRightWidth: isLastDateOfMonth ? '2px' : isFirstWeek ? '1px' : '1px',
                      fontSize: dynamicSizes.fontSize.small
                    }}
                  >
                    <span className={cn(
                      "font-medium",
                      date.getDay() === 0 || date.getDay() === 6 || isHoliday(date)
                        ? "text-muted-foreground"
                        : "text-foreground"
                    )}>
                      {date.getDate()}
                    </span>
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
              height: Math.max(40, dynamicSizes.rowHeight.project + 8),
              minWidth: totalWidth
            }}
          >
            {visibleDates.map((date, index) => {
              const weekStart = new Date(date)
              const weekEnd = new Date(date)
              weekEnd.setDate(weekEnd.getDate() + 6)

              const isFirstMonth = index === 0 || (index > 0 && visibleDates[index - 1].getMonth() !== date.getMonth())
              const nextWeek = index < visibleDates.length - 1 ? visibleDates[index + 1] : null
              const isLastWeekOfMonth = nextWeek ? date.getMonth() !== nextWeek.getMonth() : true

              return (
                <div
                  key={date.getTime()}
                  className="text-center font-semibold border-r-2 flex flex-col justify-center bg-background"
                  style={{
                    width: dateRange.cellWidth * 7,
                    minWidth: dateRange.cellWidth * 7,
                    borderRightWidth: isLastWeekOfMonth ? '3px' : '2px',
                    borderRightColor: isLastWeekOfMonth ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    borderLeftWidth: isFirstMonth ? '3px' : '0px',
                    borderLeftColor: isFirstMonth ? 'hsl(var(--primary))' : 'transparent'
                  }}
                >
                  <div 
                    className="font-bold text-foreground"
                    style={{ fontSize: dynamicSizes.fontSize.week || dynamicSizes.fontSize.base }}
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
                      className="text-muted-foreground mt-1"
                      style={{ fontSize: Math.max(8, (dynamicSizes.fontSize.week || dynamicSizes.fontSize.base) - 2) }}
                    >
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