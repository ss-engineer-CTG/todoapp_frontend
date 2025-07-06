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
  if (viewUnit === 'week') {
    const startOfWeek = new Date(date)
    while (startOfWeek.getDay() !== 1) {
      startOfWeek.setDate(startOfWeek.getDate() - 1)
    }
    
    const weeksDiff = Math.round(
      (startOfWeek.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    )
    const daysInWeek = (date.getDay() + 6) % 7
    
    return weeksDiff * cellWidth * 7 + daysInWeek * cellWidth
  } else {
    const diffDays = Math.round(
      (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
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
  
  if (viewUnit === 'week') {
    const startOfWeek = new Date(targetDate)
    while (startOfWeek.getDay() !== 1) {
      startOfWeek.setDate(startOfWeek.getDate() - 1)
    }
    
    const weeksDiff = Math.round(
      (startOfWeek.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    )
    const daysInWeek = (targetDate.getDay() + 6) % 7
    
    return weeksDiff * cellWidth * 7 + daysInWeek * cellWidth
  } else {
    const diffDays = Math.round(
      (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
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