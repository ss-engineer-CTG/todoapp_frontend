"use client"

import { useMemo } from "react"
import { getDatePosition } from "@/components/timeline-view/date-utils"
import type { DateRange } from "@/types/timeline"

export const useDateRange = (viewUnit: 'day' | 'week', cellWidth: number, timelineRef: HTMLDivElement | null) => {
  const today = new Date()

  // 日付範囲計算
  const dateRange: DateRange = useMemo(() => {
    const viewConfigs = {
      'day': {
        days: 365,
        ratio: [0.3, 0.7],
        label: '日表示'
      },
      'week': {
        days: 365,
        ratio: [0.3, 0.7],
        label: '週表示'
      }
    }

    const config = viewConfigs[viewUnit] || viewConfigs['week']
    
    const beforeDays = Math.floor(config.days * config.ratio[0])
    const afterDays = Math.floor(config.days * config.ratio[1])
    
    const rawStartDate = new Date(today)
    rawStartDate.setDate(rawStartDate.getDate() - beforeDays)
    const rawEndDate = new Date(today)
    rawEndDate.setDate(rawEndDate.getDate() + afterDays)
    
    let actualStartDate = rawStartDate
    let actualEndDate = rawEndDate
    
    // 週表示の場合は月曜日基準に調整
    if (viewUnit === 'week') {
      actualStartDate = new Date(rawStartDate)
      while (actualStartDate.getDay() !== 1) {
        actualStartDate.setDate(actualStartDate.getDate() - 1)
      }
      
      actualEndDate = new Date(rawEndDate)
      while (actualEndDate.getDay() !== 0) {
        actualEndDate.setDate(actualEndDate.getDate() + 1)
      }
    }
    
    return { 
      startDate: actualStartDate,
      endDate: actualEndDate,
      rawStartDate,
      rawEndDate,
      cellWidth,
      unit: viewUnit,
      label: config.label
    }
  }, [viewUnit, cellWidth, today])

  // 表示する日付配列
  const visibleDates = useMemo(() => {
    if (viewUnit === 'week') {
      const weeks = []
      const currentDate = new Date(dateRange.startDate)
      
      while (currentDate <= dateRange.endDate) {
        weeks.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 7)
      }
      return weeks
    } else {
      const dates = []
      const currentDate = new Date(dateRange.startDate)
      while (currentDate <= dateRange.endDate) {
        dates.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
      }
      return dates
    }
  }, [dateRange, viewUnit])

  // 今日ボタンの処理
  const handleTodayButton = (timelineRef: HTMLDivElement | null) => {
    if (timelineRef) {
      const todayPosition = getDatePosition(today, dateRange, viewUnit)
      const containerWidth = timelineRef.clientWidth
      const scrollPosition = Math.max(0, todayPosition - containerWidth / 2)
      
      timelineRef.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      })
    }
  }

  return {
    dateRange,
    visibleDates,
    handleTodayButton
  }
}