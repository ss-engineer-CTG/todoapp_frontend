// システムプロンプト準拠：基盤ユーティリティ統合（軽量化版）

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
}

// ===== ログ機能（簡素化：3レベルのみ） =====
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2
}

class SimpleLogger {
  private level: LogLevel = LogLevel.INFO

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
}

export const logger = new SimpleLogger()

// ===== エラーハンドリング（簡素化） =====
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

// ===== 日付ユーティリティ（統合・簡素化） =====
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
    return new Date() // フォールバック
  }
}

export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && isValid(date)
}

// ===== レイアウト計算 =====
export const calculateScrollPosition = (
  targetDate: Date,
  startDate: Date,
  cellWidth: number,
  viewUnit: 'day' | 'week' = 'week'
): number => {
  
  if (viewUnit === 'week') {
    // 週の開始日（月曜日）を取得
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
    // 日表示の場合
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