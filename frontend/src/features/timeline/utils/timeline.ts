// システムプロンプト準拠：タイムライン統合ユーティリティ（階層表示機能追加版）
// 🔧 修正内容：既存機能保持 + 階層表示専用関数追加
// DRY原則：既存のタイムライン関数を維持しつつ、階層機能を追加

import { format, parseISO, isValid } from 'date-fns'
import { ja } from 'date-fns/locale'

// ===== 基本設定（既存維持） =====
export const ZOOM_CONFIG = {
  min: 10,
  max: 200,
  default: 100,
  step: 10
} as const

export const BASE_SIZES = {
  cellWidth: { day: 30, week: 20 },
  rowHeight: { project: 48, task: 40, subtask: 32 },
  fontSize: { base: 14, small: 12, large: 16 }
} as const

// ===== 日本の祝日データ（2025年）（既存維持） =====
export interface Holiday {
  date: Date
  name: string
  type: 'national' | 'substitute'
}

export const holidays2025: Holiday[] = [
  { date: new Date(2025, 0, 1), name: '元日', type: 'national' },
  { date: new Date(2025, 0, 13), name: '成人の日', type: 'national' },
  { date: new Date(2025, 1, 11), name: '建国記念の日', type: 'national' },
  { date: new Date(2025, 1, 23), name: '天皇誕生日', type: 'national' },
  { date: new Date(2025, 2, 20), name: '春分の日', type: 'national' },
  { date: new Date(2025, 3, 29), name: '昭和の日', type: 'national' },
  { date: new Date(2025, 4, 3), name: '憲法記念日', type: 'national' },
  { date: new Date(2025, 4, 4), name: 'みどりの日', type: 'national' },
  { date: new Date(2025, 4, 5), name: 'こどもの日', type: 'national' },
  { date: new Date(2025, 6, 21), name: '海の日', type: 'national' },
  { date: new Date(2025, 7, 11), name: '山の日', type: 'national' },
  { date: new Date(2025, 8, 15), name: '敬老の日', type: 'national' },
  { date: new Date(2025, 8, 23), name: '秋分の日', type: 'national' },
  { date: new Date(2025, 9, 13), name: 'スポーツの日', type: 'national' },
  { date: new Date(2025, 10, 3), name: '文化の日', type: 'national' },
  { date: new Date(2025, 10, 23), name: '勤労感謝の日', type: 'national' }
]

// ===== 日付ユーティリティ（既存維持） =====
export type DateType = 'weekday' | 'saturday' | 'sunday' | 'holiday'

export const isHoliday = (date: Date): boolean => {
  return holidays2025.some(holiday => 
    holiday.date.getFullYear() === date.getFullYear() &&
    holiday.date.getMonth() === date.getMonth() &&
    holiday.date.getDate() === date.getDate()
  )
}

export const getDateType = (date: Date): DateType => {
  if (isHoliday(date)) return 'holiday'
  if (date.getDay() === 0) return 'sunday'
  if (date.getDay() === 6) return 'saturday'
  return 'weekday'
}

export const formatDate = (date: Date | string | null | undefined): string => {
  try {
    if (!date) return '未設定'
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    
    if (!isValid(dateObj)) return '無効な日付'
    
    return format(dateObj, 'yyyy年M月d日', { locale: ja })
  } catch (error) {
    return '無効な日付'
  }
}

export const getMonthName = (date: Date): string => {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  return months[date.getMonth()]
}

// ===== 動的サイズ計算（既存維持） =====
export const calculateFontSize = (zoom: number) => {
  if (zoom <= 30) return { base: 8, small: 7, large: 9, week: 8 }
  if (zoom <= 50) return { base: 10, small: 9, large: 11, week: 10 }
  if (zoom <= 80) return { base: 12, small: 11, large: 13, week: 12 }
  if (zoom <= 120) return { base: 14, small: 12, large: 16, week: 13 }
  if (zoom <= 150) return { base: 16, small: 14, large: 18, week: 15 }
  return { base: 18, small: 16, large: 20, week: 17 }
}

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

// ===== 表示レベル判定（既存維持） =====
export const getDisplayLevel = (zoom: number): 'minimal' | 'compact' | 'reduced' | 'full' => {
  if (zoom <= 30) return 'minimal'
  if (zoom <= 50) return 'compact'
  if (zoom <= 80) return 'reduced'
  return 'full'
}

export const getDisplayText = (text: string, zoomLevel: number, maxLength?: number): string => {
  const displayLevel = getDisplayLevel(zoomLevel)
  
  switch (displayLevel) {
    case 'minimal': return ''
    case 'compact': return text.length > 5 ? text.substring(0, 3) + '…' : text
    case 'reduced':
      const shortLength = maxLength || Math.floor(text.length * 0.7)
      return text.length > shortLength ? text.substring(0, shortLength - 1) + '…' : text
    default: return text
  }
}

// ===== 時間範囲計算（既存維持） =====
export const calculateTimeRange = (viewUnit: 'day' | 'week', today: Date) => {
  const config = { days: 365, ratio: [0.3, 0.7] }
  
  const beforeDays = Math.floor(config.days * config.ratio[0])
  const afterDays = Math.floor(config.days * config.ratio[1])
  
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

// ===== 表示日付配列生成（既存維持） =====
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

// ===== 日付位置計算（既存維持） =====
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
    
    const weeksDiff = Math.round((startOfWeek.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    const daysInWeek = (date.getDay() + 6) % 7
    
    return weeksDiff * cellWidth * 7 + daysInWeek * cellWidth
  } else {
    const diffDays = Math.round((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays * cellWidth
  }
}

// ===== プロジェクト名動的位置計算（既存維持） =====
export const getProjectNamePosition = (scrollLeft: number, timelineWidth = 1200): number => {
  const visibleAreaWidth = Math.min(timelineWidth, 800)
  const nameWidth = 200
  
  return Math.max(8, Math.min(scrollLeft + 8, scrollLeft + visibleAreaWidth - nameWidth - 8))
}

// ===== 境界判定（既存維持） =====
export const isFirstDayOfMonth = (date: Date, index: number, visibleDates: Date[]): boolean => {
  return index === 0 || (index > 0 && visibleDates[index - 1].getMonth() !== date.getMonth())
}

export const isFirstDayOfWeek = (date: Date): boolean => {
  return date.getDay() === 1
}

// ===== 日付セルクラス取得（既存維持） =====
export const getDateCellClass = (date: Date, today: Date, theme: string): string => {
  const isToday = date.toDateString() === today.toDateString()
  if (isToday) return theme === 'dark' ? 'bg-yellow-900/40 border-yellow-400' : 'bg-yellow-100 border-yellow-400'
  
  const dateType = getDateType(date)
  if (dateType === 'holiday' || dateType === 'sunday' || dateType === 'saturday') {
    return theme === 'dark' ? 'bg-gray-800/40' : 'bg-gray-200/60'
  }
  return ''
}

// ===== 週背景色取得（既存維持） =====
export const getWeekBackground = (date: Date, startDate: Date, theme: string): string => {
  const mondayOfWeek = new Date(date)
  const daysSinceMonday = (date.getDay() + 6) % 7
  mondayOfWeek.setDate(date.getDate() - daysSinceMonday)
  
  const weekNumber = Math.floor((mondayOfWeek.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return weekNumber % 2 === 0 ? 
    (theme === 'dark' ? 'bg-gray-900/60' : 'bg-gray-50/60') : 
    (theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/60')
}

// ===== 週番号計算（既存維持） =====
export const getWeekNumber = (date: Date): number => {
  const mondayOfWeek = new Date(date)
  const daysSinceMonday = (date.getDay() + 6) % 7
  mondayOfWeek.setDate(date.getDate() - daysSinceMonday)
  
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  return Math.ceil((mondayOfWeek.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
}

// 🆕 ===== 階層表示専用関数（新規追加） =====

/**
 * 階層レベルに応じたインデント幅計算
 * システムプロンプト準拠：KISS原則でシンプルな計算
 */
export const calculateHierarchyIndent = (level: number, zoomRatio: number): number => {
  const baseIndentWidth = Math.max(20, Math.round(32 * zoomRatio))
  return level * baseIndentWidth
}

/**
 * 階層レベルに応じたタスクバー高さ調整
 */
export const calculateHierarchyTaskBarHeight = (level: number, baseHeight: number, zoomRatio: number): number => {
  // 階層が深くなるほどバーを少し小さく
  const levelReduction = Math.min(level * 2, 8) // 最大8px減少
  const adjustedHeight = Math.max(16, baseHeight - levelReduction)
  return Math.round(adjustedHeight * zoomRatio)
}

/**
 * 階層レベルに応じたフォントサイズ調整
 */
export const calculateHierarchyFontSize = (level: number, baseFontSize: number): number => {
  // 階層が深くなるほどフォントを少し小さく
  const levelReduction = Math.min(level, 3) // 最大3px減少
  return Math.max(8, baseFontSize - levelReduction)
}

/**
 * 階層接続線の座標計算
 */
export const calculateConnectionLinePosition = (
  parentLevel: number,
  childLevel: number,
  parentStartPos: number,
  childStartPos: number,
  zoomRatio: number
): { vertical: any, horizontal: any } => {
  const baseIndentWidth = Math.max(20, Math.round(32 * zoomRatio))
  const parentIndent = parentLevel * baseIndentWidth
  const childIndent = childLevel * baseIndentWidth
  
  const connectionPointOffset = Math.round(16 * zoomRatio)
  const lineWidth = Math.max(1, Math.round(2 * zoomRatio))
  
  return {
    vertical: {
      left: parentStartPos + parentIndent + connectionPointOffset,
      width: lineWidth,
      top: 0,
      height: Math.round(40 * zoomRatio) // 基本行高さ
    },
    horizontal: {
      left: Math.min(
        parentStartPos + parentIndent + connectionPointOffset,
        childStartPos + childIndent + connectionPointOffset
      ),
      width: Math.abs(
        (childStartPos + childIndent + connectionPointOffset) - 
        (parentStartPos + parentIndent + connectionPointOffset)
      ),
      height: lineWidth,
      top: Math.round(20 * zoomRatio) // 中央位置
    }
  }
}

/**
 * 階層レベルに応じた色調整
 */
export const getHierarchyColor = (level: number, baseColor: string, theme: 'light' | 'dark'): string => {
  try {
    // 階層が深いほど薄く表示
    const opacityReduction = Math.min(level * 0.1, 0.4)
    const targetOpacity = 1 - opacityReduction
    
    // HEX色をRGBAに変換
    if (baseColor.startsWith('#')) {
      const r = parseInt(baseColor.substr(1, 2), 16)
      const g = parseInt(baseColor.substr(3, 2), 16)
      const b = parseInt(baseColor.substr(5, 2), 16)
      return `rgba(${r}, ${g}, ${b}, ${targetOpacity})`
    }
    
    // すでにrgba形式の場合はopacityのみ調整
    if (baseColor.includes('rgba')) {
      return baseColor.replace(/[\d\.]+\)$/g, `${targetOpacity})`)
    }
    
    return baseColor
  } catch (error) {
    return baseColor // フォールバック
  }
}

/**
 * 階層バッジ表示用のカウント計算
 */
export const calculateHierarchyBadgeCount = (
  taskId: string,
  childrenMap: { [parentId: string]: string[] }
): { directChildren: number, totalDescendants: number } => {
  const directChildren = childrenMap[taskId]?.length || 0
  
  const getTotalDescendants = (id: string): number => {
    const children = childrenMap[id] || []
    let total = children.length
    children.forEach(childId => {
      total += getTotalDescendants(childId)
    })
    return total
  }
  
  const totalDescendants = getTotalDescendants(taskId)
  
  return { directChildren, totalDescendants }
}

/**
 * ズームレベルに応じた階層表示制御
 */
export const getHierarchyVisibilityControls = (zoomLevel: number) => {
  return {
    showConnectionLines: zoomLevel > 30,
    showHierarchyBadges: zoomLevel > 40,
    showSubtaskLabels: zoomLevel > 50,
    maxVisibleLevel: zoomLevel <= 30 ? 1 : zoomLevel <= 50 ? 2 : zoomLevel <= 80 ? 3 : 10,
    compactMode: zoomLevel <= 50
  }
}

/**
 * 階層表示用のタスクバー幅計算（接続考慮）
 */
export const calculateHierarchyTaskBarWidth = (
  startDate: Date,
  endDate: Date,
  timeRangeStart: Date,
  cellWidth: number,
  viewUnit: 'day' | 'week',
  level: number,
  zoomRatio: number
): number => {
  const basicWidth = getDatePosition(endDate, timeRangeStart, cellWidth, viewUnit) - 
                   getDatePosition(startDate, timeRangeStart, cellWidth, viewUnit) + cellWidth
  
  // 階層が深い場合は最小幅を確保
  const minWidth = Math.max(60, Math.round(80 * zoomRatio))
  const levelAdjustment = level > 2 ? Math.round(20 * zoomRatio) : 0
  
  return Math.max(minWidth, basicWidth - levelAdjustment)
}