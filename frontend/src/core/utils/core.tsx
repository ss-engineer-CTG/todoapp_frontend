// システムプロンプト準拠：基盤ユーティリティ統合（分割後）
// 🔧 修正内容：機能別ファイルへの分割実施

import React from 'react'
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
  calculateDateHeaderFontSize
} from './timelineUtils'
export { 
  calculatePreciseDateDifference, 
  validateDragBounds, 
  calculateDragPreview, 
  calculateTimelinePosition, 
  getDragStyle, 
  shouldCancelDrag,
  calculateDateFromPosition
} from './dragUtils'

// 残存ユーティリティ（分割対象外）

export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && isValid(date)
}

export const isWeekend = (date: Date): boolean => {
  return date.getDay() === 0 || date.getDay() === 6
}

export const getDatePosition = (
  date: Date,
  startDate: Date,
  cellWidth: number,
  viewUnit: 'day' | 'week' = 'week'
): number => {
  // 日付を正規化（時刻を00:00:00に設定してずれを防ぐ）
  const normalizeDate = (d: Date): Date => {
    const normalized = new Date(d)
    normalized.setHours(0, 0, 0, 0)
    return normalized
  }
  
  const normalizedDate = normalizeDate(date)
  const normalizedStartDate = normalizeDate(startDate)
  
  if (viewUnit === 'week') {
    // 週の開始日（月曜日）を取得
    const getMonday = (d: Date): Date => {
      const monday = new Date(d)
      const day = monday.getDay()
      const diff = day === 0 ? -6 : 1 - day // 日曜日は-6、それ以外は1-day
      monday.setDate(monday.getDate() + diff)
      return monday
    }
    
    const startOfWeek = getMonday(normalizedDate)
    const normalizedStart = getMonday(normalizedStartDate)
    
    // 週数差分を計算
    const weeksDiff = Math.floor(
      (startOfWeek.getTime() - normalizedStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
    )
    
    // 週内での日数（月曜日=0, 火曜日=1, ..., 日曜日=6）
    const dayOfWeek = (normalizedDate.getDay() + 6) % 7
    
    return weeksDiff * cellWidth * 7 + dayOfWeek * cellWidth
  } else {
    // 日表示の場合は単純な日数差分
    const diffDays = Math.floor(
      (normalizedDate.getTime() - normalizedStartDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    return diffDays * cellWidth
  }
}

export const calculateScrollPosition = (
  targetDate: Date,
  startDate: Date,
  cellWidth: number,
  viewUnit: 'day' | 'week' = 'week'
): number => {
  // getDatePositionと同じ正規化ロジックを使用
  const normalizeDate = (d: Date): Date => {
    const normalized = new Date(d)
    normalized.setHours(0, 0, 0, 0)
    return normalized
  }
  
  const normalizedTarget = normalizeDate(targetDate)
  const normalizedStart = normalizeDate(startDate)
  
  if (viewUnit === 'week') {
    // 週の開始日（月曜日）を取得
    const getMonday = (d: Date): Date => {
      const monday = new Date(d)
      const day = monday.getDay()
      const diff = day === 0 ? -6 : 1 - day
      monday.setDate(monday.getDate() + diff)
      return monday
    }
    
    const startOfWeek = getMonday(normalizedTarget)
    const normalizedStartWeek = getMonday(normalizedStart)
    
    const weeksDiff = Math.floor(
      (startOfWeek.getTime() - normalizedStartWeek.getTime()) / (7 * 24 * 60 * 60 * 1000)
    )
    const dayOfWeek = (normalizedTarget.getDay() + 6) % 7
    
    return weeksDiff * cellWidth * 7 + dayOfWeek * cellWidth
  } else {
    const diffDays = Math.floor(
      (normalizedTarget.getTime() - normalizedStart.getTime()) / (1000 * 60 * 60 * 24)
    )
    return diffDays * cellWidth
  }
}

export const isElementInViewport = (
  elementLeft: number,
  elementWidth: number,
  viewportLeft: number,
  viewportWidth: number,
  margin: number = 0
): boolean => {
  const elementRight = elementLeft + elementWidth
  const viewportRight = viewportLeft + viewportWidth
  
  return !(
    elementRight < viewportLeft - margin ||
    elementLeft > viewportRight + margin
  )
}

// ローディングスピナーコンポーネント
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-200 border-t-blue-600`}
        role="status"
        aria-label="読み込み中"
      />
      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}
    </div>
  )
}