// システムプロンプト準拠：Timeline統合ユーティリティ（軽量化版）
// 🔧 修正内容：全ユーティリティ統合、不要機能削除

import { format, parseISO, isValid } from 'date-fns'
import { ja } from 'date-fns/locale'

// ===== 基本設定 =====
export const ZOOM_CONFIG = {
  min: 50,
  max: 150,
  default: 100,
  step: 10
} as const

// ===== 時間範囲計算 =====
export const calculateTimeRange = (viewUnit: 'day' | 'week', today: Date) => {
  const beforeDays = Math.floor(365 * 0.3)
  const afterDays = Math.floor(365 * 0.7)
  
  const rawStartDate = new Date(today)
  rawStartDate.setDate(rawStartDate.getDate() - beforeDays)
  const rawEndDate = new Date(today)
  rawEndDate.setDate(rawEndDate.getDate() + afterDays)
  
  let actualStartDate = rawStartDate
  let actualEndDate = rawEndDate
  
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
    unit: viewUnit,
    label: viewUnit === 'day' ? '日表示' : '週表示'
  }
}

// ===== 表示日付配列生成 =====
export const generateVisibleDates = (startDate: Date, endDate: Date, viewUnit: 'day' | 'week') => {
  if (viewUnit === 'week') {
    const weeks = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      weeks.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 7)
    }
    return weeks
  } else {
    const dates = []
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return dates
  }
}

// ===== 境界判定 =====
export const isFirstDayOfMonth = (date: Date, index: number, visibleDates: Date[]): boolean => {
  return index === 0 || (index > 0 && visibleDates[index - 1].getMonth() !== date.getMonth())
}

export const isFirstDayOfWeek = (date: Date): boolean => {
  return date.getDay() === 1
}

// ===== 日付セルクラス取得 =====
export const getDateCellClass = (date: Date, today: Date, theme: string): string => {
  const isToday = date.toDateString() === today.toDateString()
  if (isToday) return theme === 'dark' ? 'bg-yellow-900/40 border-yellow-400' : 'bg-yellow-100 border-yellow-400'
  
  const isWeekendOrHoliday = date.getDay() === 0 || date.getDay() === 6
  if (isWeekendOrHoliday) {
    return theme === 'dark' ? 'bg-gray-800/40' : 'bg-gray-200/60'
  }
  return ''
}

// ===== 週背景色取得 =====
export const getWeekBackground = (date: Date, startDate: Date, theme: string): string => {
  const mondayOfWeek = new Date(date)
  const daysSinceMonday = (date.getDay() + 6) % 7
  mondayOfWeek.setDate(date.getDate() - daysSinceMonday)
  
  const weekNumber = Math.floor((mondayOfWeek.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return weekNumber % 2 === 0 ? 
    (theme === 'dark' ? 'bg-gray-900/60' : 'bg-gray-50/60') : 
    (theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/60')
}