// システムプロンプト準拠：タイムライン計算ユーティリティ統合
// DRY原則：計算ロジックの一元化、KISS原則：シンプルな関数群

import { getDateType } from './holidayData'

// ズーム設定
export const ZOOM_CONFIG = {
  min: 10,
  max: 200,
  default: 100,
  step: 10
} as const

// 基準サイズ（100%時のサイズ）
export const BASE_SIZES = {
  cellWidth: {
    day: 30,
    week: 20
  },
  rowHeight: {
    project: 32,
    task: 48,
    subtask: 40
  },
  fontSize: {
    base: 14,
    small: 12,
    large: 16
  }
} as const

// 動的フォントサイズ計算
export const calculateFontSize = (zoom: number) => {
  if (zoom <= 30) return { base: 8, small: 7, large: 9, week: 8 }
  if (zoom <= 50) return { base: 10, small: 9, large: 11, week: 10 }
  if (zoom <= 80) return { base: 12, small: 11, large: 13, week: 12 }
  if (zoom <= 120) return { base: 14, small: 12, large: 16, week: 13 }
  if (zoom <= 150) return { base: 16, small: 14, large: 18, week: 15 }
  return { base: 18, small: 16, large: 20, week: 17 }
}

// 動的サイズ計算
export const calculateDynamicSizes = (zoomLevel: number, viewUnit: 'day' | 'week') => {
  const zoomRatio = zoomLevel / 100
  
  return {
    cellWidth: Math.round(BASE_SIZES.cellWidth[viewUnit] * zoomRatio),
    rowHeight: {
      project: Math.round(BASE_SIZES.rowHeight.project * zoomRatio),
      task: Math.round(BASE_SIZES.rowHeight.task * zoomRatio),
      subtask: Math.round(BASE_SIZES.rowHeight.subtask * zoomRatio)
    },
    fontSize: calculateFontSize(zoomLevel),
    taskBarHeight: Math.round(32 * zoomRatio),
    zoomRatio
  }
}

// 表示レベル判定
export const getDisplayLevel = (zoom: number): 'minimal' | 'compact' | 'reduced' | 'full' => {
  if (zoom <= 30) return 'minimal'
  if (zoom <= 50) return 'compact'
  if (zoom <= 80) return 'reduced'
  return 'full'
}

// テキスト表示制御
export const getDisplayText = (text: string, zoomLevel: number, maxLength?: number): string => {
  const displayLevel = getDisplayLevel(zoomLevel)
  
  switch (displayLevel) {
    case 'minimal':
      return ''
    case 'compact':
      return text.length > 5 ? text.substring(0, 3) + '…' : text
    case 'reduced':
      const shortLength = maxLength || Math.floor(text.length * 0.7)
      return text.length > shortLength ? text.substring(0, shortLength - 1) + '…' : text
    default:
      return text
  }
}

// 時間範囲計算
export const calculateTimeRange = (viewUnit: 'day' | 'week', today: Date) => {
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
  
  const config = viewConfigs[viewUnit]
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
    unit: viewUnit,
    label: config.label
  }
}

// 表示日付配列生成
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

// 日付位置計算
export const getDatePosition = (
  date: Date, 
  startDate: Date, 
  cellWidth: number, 
  viewUnit: 'day' | 'week'
): number => {
  if (viewUnit === 'week') {
    const startOfWeek = new Date(date)
    while (startOfWeek.getDay() !== 1) {
      startOfWeek.setDate(startOfWeek.getDate() - 1)
    }
    
    const weeksDiff = Math.round((startOfWeek - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    const daysInWeek = (date.getDay() + 6) % 7
    
    return weeksDiff * cellWidth * 7 + daysInWeek * cellWidth
  } else {
    const diffDays = Math.round((date - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays * cellWidth
  }
}

// プロジェクト名動的位置計算
export const getProjectNamePosition = (scrollLeft: number, timelineWidth = 1200): number => {
  const visibleAreaWidth = Math.min(timelineWidth, 800)
  const nameWidth = 200
  
  return Math.max(8, Math.min(scrollLeft + 8, scrollLeft + visibleAreaWidth - nameWidth - 8))
}

// 日付フォーマット
export const formatDate = (date: Date): string => {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 月の境界判定
export const isFirstDayOfMonth = (date: Date, index: number, visibleDates: Date[]): boolean => {
  return index === 0 || (index > 0 && visibleDates[index - 1].getMonth() !== date.getMonth())
}

// 週の境界判定
export const isFirstDayOfWeek = (date: Date): boolean => {
  return date.getDay() === 1
}

// 日付セルクラス取得
export const getDateCellClass = (date: Date, today: Date, theme: string): string => {
  const isToday = date.toDateString() === today.toDateString()
  if (isToday) return theme === 'dark' ? 'bg-yellow-900/40 border-yellow-400' : 'bg-yellow-100 border-yellow-400'
  
  const dateType = getDateType(date)
  if (dateType === 'holiday' || dateType === 'sunday' || dateType === 'saturday') {
    return theme === 'dark' ? 'bg-gray-800/40' : 'bg-gray-200/60'
  }
  return ''
}

// 週背景色取得
export const getWeekBackground = (date: Date, startDate: Date, theme: string): string => {
  const mondayOfWeek = new Date(date)
  const daysSinceMonday = (date.getDay() + 6) % 7
  mondayOfWeek.setDate(date.getDate() - daysSinceMonday)
  
  const weekNumber = Math.floor((mondayOfWeek.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return weekNumber % 2 === 0 ? 
    (theme === 'dark' ? 'bg-gray-900/60' : 'bg-gray-50/60') : 
    (theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/60')
}