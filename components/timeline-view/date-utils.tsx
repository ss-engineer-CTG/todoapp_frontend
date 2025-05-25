"use client"

import type { DateRange } from "@/types/timeline"

// 2025年の祝日データ（日本）
export const HOLIDAYS_2025 = [
  new Date(2025, 0, 1),   // 元日
  new Date(2025, 0, 13),  // 成人の日
  new Date(2025, 1, 11),  // 建国記念の日
  new Date(2025, 1, 23),  // 天皇誕生日
  new Date(2025, 2, 20),  // 春分の日
  new Date(2025, 3, 29),  // 昭和の日
  new Date(2025, 4, 3),   // 憲法記念日
  new Date(2025, 4, 4),   // みどりの日
  new Date(2025, 4, 5),   // こどもの日
  new Date(2025, 6, 21),  // 海の日
  new Date(2025, 7, 11),  // 山の日
  new Date(2025, 8, 15),  // 敬老の日
  new Date(2025, 8, 23),  // 秋分の日
  new Date(2025, 9, 13),  // スポーツの日
  new Date(2025, 10, 3),  // 文化の日
  new Date(2025, 10, 23), // 勤労感謝の日
]

// 祝日判定関数
export const isHoliday = (date: Date): boolean => {
  return HOLIDAYS_2025.some(holiday => 
    holiday.getFullYear() === date.getFullYear() &&
    holiday.getMonth() === date.getMonth() &&
    holiday.getDate() === date.getDate()
  )
}

// 土日祝日判定関数
export const getDateType = (date: Date): 'weekday' | 'saturday' | 'sunday' | 'holiday' => {
  if (isHoliday(date)) return 'holiday'
  if (date.getDay() === 0) return 'sunday'
  if (date.getDay() === 6) return 'saturday'
  return 'weekday'
}

// 月名取得
export const getMonthName = (date: Date): string => {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  return months[date.getMonth()]
}

// 月の最初の日判定
export const isFirstDayOfMonth = (date: Date, index: number, dates: Date[]): boolean => {
  return index === 0 || (index > 0 && dates[index - 1].getMonth() !== date.getMonth())
}

// 週の最初の日判定（月曜日）
export const isFirstDayOfWeek = (date: Date): boolean => {
  return date.getDay() === 1
}

// 週の背景色取得
export const getWeekBackground = (date: Date, startDate: Date): string => {
  const mondayOfWeek = new Date(date)
  const daysSinceMonday = (date.getDay() + 6) % 7
  mondayOfWeek.setDate(date.getDate() - daysSinceMonday)
  
  const weekNumber = Math.floor((mondayOfWeek.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return weekNumber % 2 === 0 ? 'bg-muted/10' : 'bg-background'
}

// 日付位置計算
export const getDatePosition = (date: Date, dateRange: DateRange, viewUnit: 'day' | 'week'): number => {
  if (viewUnit === 'week') {
    // 週表示：週単位での位置計算
    const startOfWeek = new Date(date)
    while (startOfWeek.getDay() !== 1) {
      startOfWeek.setDate(startOfWeek.getDate() - 1)
    }
    
    const weeksDiff = Math.round((startOfWeek.getTime() - dateRange.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    const daysInWeek = (date.getDay() + 6) % 7
    
    return weeksDiff * dateRange.cellWidth * 7 + daysInWeek * dateRange.cellWidth
  } else {
    // 日表示：日単位での位置計算
    const diffDays = Math.round((date.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays * dateRange.cellWidth
  }
}

// 日付フォーマット
export const formatDate = (date: Date): string => {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 週番号計算
export const getWeekNumber = (date: Date): number => {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const weekNumber = Math.ceil((date.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return weekNumber
}