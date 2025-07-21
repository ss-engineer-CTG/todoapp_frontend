// システムプロンプト準拠：基盤ユーティリティ統合（構造最適化）
// フェーズ3リファクタリング：重複除去・Reactコンポーネント分離

import { isValid } from 'date-fns'

// 分割された機能をインポート
export { logger } from './logger'
export { handleError, ERROR_MESSAGES } from './errorHandler'
export { 
  formatDate, 
  formatDateDisplay, 
  getMonthName, 
  getWeekNumber, 
  convertApiResponseDate 
} from './dateUtils'
export { 
  calculateDimensions, 
  calculateTimelineTaskStatus, 
  getDateCellClass, 
  getWeekBackground,
  calculateDynamicSizes,
  getDisplayText,
  calculateDateHeaderFontSize,
  calculateTaskDuration,
  isShortDurationTask
} from './timelineUtils'
// dragUtils は現在未使用のためコメントアウト
// TODO: 将来的に高度なドラッグ機能が必要になった場合は復活
// export { 
//   calculatePreciseDateDifference, 
//   validateDragBounds, 
//   calculateDragPreview, 
//   calculateTimelinePosition, 
//   getDragStyle, 
//   shouldCancelDrag,
//   calculateDateFromPosition
// } from './dragUtils'

// 基本ユーティリティ関数
export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && isValid(date)
}

export const isWeekend = (date: Date): boolean => {
  return date.getDay() === 0 || date.getDay() === 6
}

// 日付を正規化（時刻を00:00:00に設定）
const normalizeDate = (d: Date): Date => {
  const normalized = new Date(d)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

// 週の開始日（月曜日）を取得
const getMonday = (d: Date): Date => {
  const monday = new Date(d)
  const day = monday.getDay()
  const diff = day === 0 ? -6 : 1 - day
  monday.setDate(monday.getDate() + diff)
  return monday
}

// 統合されたポジション計算関数（最適化版・重複除去）
export const calculateDatePosition = (
  date: Date,
  startDate: Date,
  cellWidth: number,
  viewUnit: 'day' | 'week' = 'week'
): number => {
  // 計算の高速化：ミリ秒単位の定数を事前定義
  const DAY_MS = 24 * 60 * 60 * 1000
  const WEEK_MS = 7 * DAY_MS
  
  const normalizedDate = normalizeDate(date)
  const normalizedStartDate = normalizeDate(startDate)
  
  if (viewUnit === 'week') {
    const startOfWeek = getMonday(normalizedDate)
    const normalizedStart = getMonday(normalizedStartDate)
    
    // 週数差分計算の最適化
    const weeksDiff = Math.floor(
      (startOfWeek.getTime() - normalizedStart.getTime()) / WEEK_MS
    )
    
    // 曜日計算の最適化（事前計算）
    const dayOfWeek = (normalizedDate.getDay() + 6) % 7
    return weeksDiff * cellWidth * 7 + dayOfWeek * cellWidth
  } else {
    // 日数差分計算の最適化
    const diffDays = Math.floor(
      (normalizedDate.getTime() - normalizedStartDate.getTime()) / DAY_MS
    )
    return diffDays * cellWidth
  }
}

// getDatePositionのエイリアス（後方互換性）
export const getDatePosition = calculateDatePosition

// calculateScrollPositionのエイリアス（統合後）
export const calculateScrollPosition = calculateDatePosition

// ビューポート内判定の最適化版（インライン計算）
export const isElementInViewport = (
  elementLeft: number,
  elementWidth: number,
  viewportLeft: number,
  viewportWidth: number,
  margin: number = 0
): boolean => {
  // 変数定義を最小化し、直接比較で高速化
  return !(
    (elementLeft + elementWidth) < (viewportLeft - margin) ||
    elementLeft > (viewportLeft + viewportWidth + margin)
  )
}