"use client"

import React from "react"
import { getWeekBackground, getDateType, getDatePosition } from "./date-utils"
import { cn } from "@/lib/utils"
import type { DateRange, DynamicSizes } from "@/types/timeline"

interface TimelineGridProps {
  visibleDates: Date[]
  viewUnit: 'day' | 'week'
  dateRange: DateRange
  dynamicSizes: DynamicSizes
  todayPosition: number
  children: React.ReactNode
}

export default function TimelineGrid({
  visibleDates,
  viewUnit,
  dateRange,
  dynamicSizes,
  todayPosition,
  children
}: TimelineGridProps) {
  const totalWidth = viewUnit === 'week' 
    ? visibleDates.length * dateRange.cellWidth * 7
    : visibleDates.length * dateRange.cellWidth

  return (
    <div 
      className="relative"
      style={{ minWidth: totalWidth }}
    >
      {/* 背景グリッド */}
      <div className="absolute inset-0 pointer-events-none">
        {viewUnit === 'week' ? (
          // 週表示の背景
          visibleDates.map((weekStart, index) => {
            const isFirstMonth = index === 0 || (index > 0 && visibleDates[index - 1].getMonth() !== weekStart.getMonth())
            const nextWeek = index < visibleDates.length - 1 ? visibleDates[index + 1] : null
            const isLastWeekOfMonth = nextWeek ? weekStart.getMonth() !== nextWeek.getMonth() : true

            return (
              <div
                key={`grid-week-${weekStart.getTime()}`}
                className={cn(
                  "absolute inset-y-0",
                  index % 2 === 0 ? "bg-muted/20" : "bg-background"
                )}
                style={{
                  left: index * dateRange.cellWidth * 7,
                  width: dateRange.cellWidth * 7,
                  borderRightWidth: isLastWeekOfMonth ? '2px' : '1px',
                  borderRightStyle: 'solid',
                  borderRightColor: isLastWeekOfMonth ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  borderLeftWidth: isFirstMonth ? '2px' : '0px',
                  borderLeftStyle: 'solid',
                  borderLeftColor: isFirstMonth ? 'hsl(var(--primary))' : 'transparent'
                }}
              />
            )
          })
        ) : (
          // 日表示の背景
          visibleDates.map((date, index) => {
            const isFirstMonth = index === 0 || (index > 0 && visibleDates[index - 1].getMonth() !== date.getMonth())
            const nextDate = index < visibleDates.length - 1 ? visibleDates[index + 1] : null
            const isLastDateOfMonth = nextDate ? date.getMonth() !== nextDate.getMonth() : true

            return (
              <div
                key={`grid-${date.getTime()}`}
                className={cn(
                  "absolute inset-y-0",
                  getWeekBackground(date, dateRange.startDate)
                )}
                style={{
                  left: getDatePosition(date, dateRange, viewUnit),
                  width: dateRange.cellWidth,
                  borderRightWidth: isLastDateOfMonth ? '2px' : '1px',
                  borderRightStyle: 'solid',
                  borderRightColor: isLastDateOfMonth ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  borderLeftWidth: isFirstMonth ? '2px' : '0px',
                  borderLeftStyle: 'solid',
                  borderLeftColor: isFirstMonth ? 'hsl(var(--primary))' : 'transparent'
                }}
              />
            )
          })
        )}
      </div>

      {/* 土日祝日のオーバーレイ */}
      <div className="absolute inset-0 pointer-events-none">
        {viewUnit === 'week' ? (
          // 週表示での土日祝日表示
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

              return (
                <div
                  key={`holiday-week-${date.getTime()}`}
                  className="absolute inset-y-0 bg-muted/40"
                  style={{
                    left: weekIndex * dateRange.cellWidth * 7 + dayIndex * dateRange.cellWidth,
                    width: dateRange.cellWidth,
                    zIndex: 1
                  }}
                />
              )
            })
          })
        ) : (
          // 日表示での土日祝日表示
          visibleDates.map((date) => {
            const dateType = getDateType(date)
            if (dateType === 'weekday') return null

            return (
              <div
                key={`holiday-${date.getTime()}`}
                className="absolute inset-y-0 bg-muted/40"
                style={{
                  left: getDatePosition(date, dateRange, viewUnit),
                  width: dateRange.cellWidth,
                  zIndex: 1
                }}
              />
            )
          })
        )}
      </div>

      {/* プロジェクト・タスク内容 */}
      {children}

      {/* 今日のインジケーター */}
      <div
        className="absolute top-0 bg-red-500 z-30 shadow-lg"
        style={{
          left: todayPosition,
          width: Math.max(2, Math.round(2 * dynamicSizes.zoomRatio)),
          height: '100%'
        }}
      >
        <div
          className="absolute top-0 bg-red-500 rounded-full shadow-lg flex items-center justify-center border-2 border-background"
          style={{
            left: -Math.round(10 * dynamicSizes.zoomRatio),
            width: Math.max(16, Math.round(20 * dynamicSizes.zoomRatio)),
            height: Math.max(16, Math.round(20 * dynamicSizes.zoomRatio))
          }}
        >
          <div
            className="bg-background rounded-full"
            style={{
              width: Math.max(6, Math.round(8 * dynamicSizes.zoomRatio)),
              height: Math.max(6, Math.round(8 * dynamicSizes.zoomRatio))
            }}
          />
        </div>
      </div>
    </div>
  )
}