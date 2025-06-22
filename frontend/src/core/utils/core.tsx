// システムプロンプト準拠：基盤ユーティリティ統合（ドラッグ機能対応版）
// 🔧 修正内容：ドラッグ用ユーティリティ関数の追加

import React from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { ja } from 'date-fns/locale'

// エラーメッセージ定数
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  VALIDATION_ERROR: '入力値に誤りがあります',
  SERVER_ERROR: 'サーバーエラーが発生しました',
  UNKNOWN_ERROR: '予期しないエラーが発生しました',
  TASK_OPERATION_ERROR: 'タスク操作でエラーが発生しました',
  TIMELINE_ERROR: 'タイムライン表示でエラーが発生しました',
  DRAG_ERROR: 'ドラッグ操作でエラーが発生しました', // 🆕 追加
}

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class SimpleLogger {
  private level: LogLevel = LogLevel.DEBUG

  error(message: string, context?: any): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, context)
    }
  }

  warn(message: string, context?: any): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, context)
    }
  }

  info(message: string, context?: any): void {
    if (this.level >= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, context)
    }
  }

  debug(message: string, context?: any): void {
    if (this.level >= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, context)
    }
  }
}

export const logger = new SimpleLogger()

// ===== エラーハンドリング =====
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class AppError extends Error {
  constructor(
    public readonly type: ErrorType,
    message: string,
    public readonly userMessage: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const handleError = (error: unknown, userMessage?: string): void => {
  let finalError: AppError

  if (error instanceof AppError) {
    finalError = error
  } else if (error instanceof Error) {
    let errorType = ErrorType.UNKNOWN_ERROR
    let finalUserMessage = userMessage || ERROR_MESSAGES.UNKNOWN_ERROR

    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      errorType = ErrorType.NETWORK_ERROR
      finalUserMessage = userMessage || ERROR_MESSAGES.NETWORK_ERROR
    } else if (error.message.includes('validation')) {
      errorType = ErrorType.VALIDATION_ERROR
      finalUserMessage = userMessage || ERROR_MESSAGES.VALIDATION_ERROR
    }

    finalError = new AppError(errorType, error.message, finalUserMessage)
  } else {
    finalError = new AppError(
      ErrorType.UNKNOWN_ERROR,
      String(error),
      userMessage || ERROR_MESSAGES.UNKNOWN_ERROR
    )
  }

  logger.error(`${finalError.type}: ${finalError.message}`)
  console.error('ユーザー向けエラー:', finalError.userMessage)
}

// ===== 日付ユーティリティ =====
export const formatDate = (date: Date | string | null | undefined): string => {
  try {
    if (!date) return '未設定'
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    
    if (!isValid(dateObj)) {
      logger.warn('Invalid date provided to formatDate', { date })
      return '無効な日付'
    }
    
    return format(dateObj, 'yyyy年M月d日', { locale: ja })
  } catch (error) {
    logger.error('日付フォーマットエラー:', { error, date })
    return '無効な日付'
  }
}

export const convertApiResponseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null

  try {
    const parsed = parseISO(dateString)
    if (!isValid(parsed)) {
      logger.warn('Unable to parse date string', { dateString })
      return null
    }
    return parsed
  } catch (error) {
    logger.error('Date conversion failed', { dateString, error })
    return new Date()
  }
}

export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && isValid(date)
}

// ===== Timeline日付ユーティリティ =====
export const getMonthName = (date: Date): string => {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  return months[date.getMonth()]
}

export const getWeekNumber = (date: Date): number => {
  const mondayOfWeek = new Date(date)
  const daysSinceMonday = (date.getDay() + 6) % 7
  mondayOfWeek.setDate(date.getDate() - daysSinceMonday)
  
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  return Math.ceil((mondayOfWeek.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
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
    // 日表示の場合、正確な日付位置を計算（1日ずれ修正）
    return diffDays * cellWidth
  }
}

// ===== レイアウト計算 =====
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
    // 日表示の場合も正確な位置計算（getDatePositionと一貫性保持）
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

// ===== ローディングスピナー =====
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
      <div className={`animate-spin rounded-full border-2 border-muted border-t-primary ${sizeClasses[size]}`} />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}

// ===== Timeline表示制御 =====
export const getDisplayText = (text: string, zoomLevel: number, maxLength?: number): string => {
  if (zoomLevel <= 30) return ''
  if (zoomLevel <= 50) return text.length > 5 ? text.substring(0, 3) + '…' : text
  if (zoomLevel <= 80) {
    const shortLength = maxLength || Math.floor(text.length * 0.7)
    return text.length > shortLength ? text.substring(0, shortLength - 1) + '…' : text
  }
  return text
}

export const calculateDynamicSizes = (zoomLevel: number, viewUnit: 'day' | 'week') => {
  const zoomRatio = zoomLevel / 100
  
  const baseSizes = {
    cellWidth: { day: 30, week: 20 },
    rowHeight: { project: 48, task: 40, subtask: 32 },
    fontSize: { base: 14, small: 12, large: 16 }
  }
  
  return {
    cellWidth: Math.round(baseSizes.cellWidth[viewUnit] * zoomRatio),
    rowHeight: {
      project: Math.round(baseSizes.rowHeight.project * zoomRatio),
      task: Math.round(baseSizes.rowHeight.task * zoomRatio),
      subtask: Math.round(baseSizes.rowHeight.subtask * zoomRatio)
    },
    fontSize: {
      base: Math.max(8, Math.round(baseSizes.fontSize.base * zoomRatio)),
      small: Math.max(7, Math.round(baseSizes.fontSize.small * zoomRatio)),
      large: Math.max(9, Math.round(baseSizes.fontSize.large * zoomRatio))
    },
    taskBarHeight: Math.round(32 * zoomRatio),
    zoomRatio
  }
}

// ===== Timeline追加ユーティリティ =====

export const getProjectNamePosition = (scrollLeft: number, timelineWidth = 1200): number => {
  const visibleAreaWidth = Math.min(timelineWidth, 800)
  const nameWidth = 200
  
  return Math.max(8, Math.min(scrollLeft + 8, scrollLeft + visibleAreaWidth - nameWidth - 8))
}

export const getDateCellClass = (date: Date, today: Date, theme: string): string => {
  const isToday = date.toDateString() === today.toDateString()
  if (isToday) return theme === 'dark' ? 'bg-yellow-900/40 border-yellow-400' : 'bg-yellow-100 border-yellow-400'
  
  if (isWeekend(date)) {
    return theme === 'dark' ? 'bg-gray-800/40' : 'bg-gray-200/60'
  }
  return ''
}

export const getWeekBackground = (date: Date, startDate: Date, theme: string): string => {
  const mondayOfWeek = new Date(date)
  const daysSinceMonday = (date.getDay() + 6) % 7
  mondayOfWeek.setDate(date.getDate() - daysSinceMonday)
  
  const weekNumber = Math.floor((mondayOfWeek.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return weekNumber % 2 === 0 ? 
    (theme === 'dark' ? 'bg-gray-900/60' : 'bg-gray-50/60') : 
    (theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/60')
}

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

export const isFirstDayOfMonth = (date: Date, index: number, visibleDates: Date[]): boolean => {
  return index === 0 || (index > 0 && visibleDates[index - 1].getMonth() !== date.getMonth())
}

export const isFirstDayOfWeek = (date: Date): boolean => {
  return date.getDay() === 1
}

// 🆕 追加：ドラッグ用ユーティリティ関数

/**
 * ドラッグ距離から日付差を計算（高精度版）
 */
export const calculatePreciseDateDifference = (
  startX: number,
  endX: number,
  cellWidth: number,
  viewUnit: 'day' | 'week'
): number => {
  try {
    const distance = endX - startX
    
    if (viewUnit === 'week') {
      // 週表示：7日単位での計算
      const weeksDiff = distance / (cellWidth * 7)
      return Math.round(weeksDiff) * 7
    } else {
      // 日表示：1日単位での計算
      return Math.round(distance / cellWidth)
    }
  } catch (error) {
    logger.error('Precise date difference calculation failed', { 
      startX, 
      endX, 
      cellWidth, 
      viewUnit, 
      error 
    })
    return 0
  }
}

/**
 * ドラッグ操作の閾値チェック
 */
export const isDragDistanceSignificant = (
  startX: number,
  currentX: number,
  threshold: number = 5
): boolean => {
  return Math.abs(currentX - startX) > threshold
}

/**
 * 座標からタイムライン位置を正規化
 */
export const normalizeTimelinePosition = (
  clientX: number,
  timelineElement: HTMLElement,
  scrollLeft: number
): number => {
  try {
    const rect = timelineElement.getBoundingClientRect()
    const relativeX = clientX - rect.left
    return relativeX + scrollLeft
  } catch (error) {
    logger.error('Timeline position normalization failed', { 
      clientX, 
      scrollLeft, 
      error 
    })
    return clientX
  }
}

/**
 * ドラッグ可能範囲の検証
 */
export const validateDragBounds = (
  newDate: Date,
  minDate: Date,
  maxDate: Date
): { isValid: boolean; adjustedDate?: Date; message?: string } => {
  try {
    if (newDate < minDate) {
      return {
        isValid: false,
        adjustedDate: minDate,
        message: `最小日付（${formatDate(minDate)}）より前には設定できません`
      }
    }
    
    if (newDate > maxDate) {
      return {
        isValid: false,
        adjustedDate: maxDate,
        message: `最大日付（${formatDate(maxDate)}）より後には設定できません`
      }
    }
    
    return { isValid: true }
  } catch (error) {
    logger.error('Drag bounds validation failed', { newDate, minDate, maxDate, error })
    return {
      isValid: false,
      message: '日付範囲の検証中にエラーが発生しました'
    }
  }
}

/**
 * ドラッグ中のスナップ位置計算
 */
export const calculateSnapPosition = (
  mouseX: number,
  cellWidth: number,
  viewUnit: 'day' | 'week',
  snapThreshold: number = 0.3
): number => {
  try {
    const cellSize = viewUnit === 'week' ? cellWidth * 7 : cellWidth
    const cellIndex = mouseX / cellSize
    const remainder = cellIndex % 1
    
    // スナップ閾値内なら最近のグリッドにスナップ
    if (remainder < snapThreshold) {
      return Math.floor(cellIndex) * cellSize
    } else if (remainder > (1 - snapThreshold)) {
      return Math.ceil(cellIndex) * cellSize
    } else {
      // 閾値外なら現在位置をそのまま使用
      return mouseX
    }
  } catch (error) {
    logger.error('Snap position calculation failed', { 
      mouseX, 
      cellWidth, 
      viewUnit, 
      snapThreshold, 
      error 
    })
    return mouseX
  }
}

/**
 * ドラッグプレビューの境界計算
 */
export const calculateDragPreviewBounds = (
  originalStartPos: number,
  originalEndPos: number,
  dragDelta: number,
  timelineWidth: number
): { 
  previewStartPos: number
  previewEndPos: number
  isOutOfBounds: boolean
} => {
  try {
    const previewStartPos = Math.max(0, originalStartPos + dragDelta)
    const previewEndPos = originalEndPos + dragDelta
    
    const isOutOfBounds = previewStartPos < 0 || previewEndPos > timelineWidth
    
    return {
      previewStartPos: Math.max(0, previewStartPos),
      previewEndPos: Math.min(timelineWidth, previewEndPos),
      isOutOfBounds
    }
  } catch (error) {
    logger.error('Drag preview bounds calculation failed', { 
      originalStartPos, 
      originalEndPos, 
      dragDelta, 
      timelineWidth, 
      error 
    })
    return {
      previewStartPos: originalStartPos,
      previewEndPos: originalEndPos,
      isOutOfBounds: false
    }
  }
}

/**
 * ドラッグ操作のパフォーマンス最適化用デバウンス
 */
export const createDragDebouncer = (
  callback: (value: any) => void,
  delay: number = 16 // 60fps相当
): ((value: any) => void) => {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (value: any) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      callback(value)
      timeoutId = null
    }, delay)
  }
}

/**
 * マウス位置からタイムライングリッド座標への変換
 */
export const convertMouseToGridCoordinates = (
  mouseEvent: MouseEvent,
  timelineElement: HTMLElement,
  cellWidth: number,
  viewUnit: 'day' | 'week',
  scrollLeft: number
): {
  gridX: number
  cellIndex: number
  datePosition: number
} => {
  try {
    const rect = timelineElement.getBoundingClientRect()
    const relativeX = mouseEvent.clientX - rect.left + scrollLeft
    
    const cellSize = viewUnit === 'week' ? cellWidth * 7 : cellWidth
    const cellIndex = Math.floor(relativeX / cellSize)
    const gridX = cellIndex * cellSize
    
    return {
      gridX,
      cellIndex,
      datePosition: relativeX
    }
  } catch (error) {
    logger.error('Mouse to grid coordinates conversion failed', { 
      mouseEvent, 
      cellWidth, 
      viewUnit, 
      scrollLeft, 
      error 
    })
    return {
      gridX: 0,
      cellIndex: 0,
      datePosition: 0
    }
  }
}

/**
 * ドラッグ操作中の視覚的フィードバック用のスタイル計算
 */
export const calculateDragFeedbackStyles = (
  isDragging: boolean,
  isValidDrop: boolean,
  theme: 'light' | 'dark'
): {
  cursor: string
  opacity: number
  borderStyle: string
  backgroundColor: string
} => {
  try {
    if (!isDragging) {
      return {
        cursor: 'grab',
        opacity: 1,
        borderStyle: 'solid',
        backgroundColor: 'transparent'
      }
    }
    
    if (isValidDrop) {
      return {
        cursor: 'grabbing',
        opacity: 0.8,
        borderStyle: 'solid',
        backgroundColor: theme === 'dark' 
          ? 'rgba(34, 197, 94, 0.1)' 
          : 'rgba(34, 197, 94, 0.05)'
      }
    } else {
      return {
        cursor: 'no-drop',
        opacity: 0.6,
        borderStyle: 'dashed',
        backgroundColor: theme === 'dark' 
          ? 'rgba(239, 68, 68, 0.1)' 
          : 'rgba(239, 68, 68, 0.05)'
      }
    }
  } catch (error) {
    logger.error('Drag feedback styles calculation failed', { 
      isDragging, 
      isValidDrop, 
      theme, 
      error 
    })
    return {
      cursor: 'default',
      opacity: 1,
      borderStyle: 'solid',
      backgroundColor: 'transparent'
    }
  }
}

/**
 * ドラッグ操作のキャンセル条件チェック
 */
export const shouldCancelDrag = (
  startTime: number,
  currentTime: number,
  startPosition: { x: number; y: number },
  currentPosition: { x: number; y: number },
  options: {
    maxDuration?: number // 最大ドラッグ時間（ms）
    maxDistance?: number // 最大ドラッグ距離（px）
    verticalThreshold?: number // 垂直方向の閾値（px）
  } = {}
): { shouldCancel: boolean; reason?: string } => {
  try {
    const {
      maxDuration = 30000, // 30秒
      maxDistance = 2000,   // 2000px
      verticalThreshold = 100 // 100px
    } = options
    
    const duration = currentTime - startTime
    const horizontalDistance = Math.abs(currentPosition.x - startPosition.x)
    const verticalDistance = Math.abs(currentPosition.y - startPosition.y)
    const totalDistance = Math.sqrt(
      Math.pow(horizontalDistance, 2) + Math.pow(verticalDistance, 2)
    )
    
    if (duration > maxDuration) {
      return {
        shouldCancel: true,
        reason: 'ドラッグ時間が長すぎます'
      }
    }
    
    if (totalDistance > maxDistance) {
      return {
        shouldCancel: true,
        reason: 'ドラッグ距離が長すぎます'
      }
    }
    
    if (verticalDistance > verticalThreshold) {
      return {
        shouldCancel: true,
        reason: '垂直方向への移動が検出されました'
      }
    }
    
    return { shouldCancel: false }
    
  } catch (error) {
    logger.error('Drag cancellation check failed', { 
      startTime, 
      currentTime, 
      startPosition, 
      currentPosition, 
      options, 
      error 
    })
    return {
      shouldCancel: true,
      reason: 'ドラッグ操作の検証中にエラーが発生しました'
    }
  }
}