// システムプロンプト準拠: 統一例外処理
import { logger } from './logger'
import { ERROR_MESSAGES } from '../config/constants'

// エラー型定義
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  API_ERROR = 'API_ERROR',
  DATE_CONVERSION_ERROR = 'DATE_CONVERSION_ERROR',
  // システムプロンプト準拠：一時的タスク関連エラータイプ追加
  TEMPORARY_TASK_ERROR = 'TEMPORARY_TASK_ERROR',
  TEMPORARY_TASK_SAVE_ERROR = 'TEMPORARY_TASK_SAVE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class AppError extends Error {
  public readonly type: ErrorType
  public readonly userMessage: string
  public readonly context?: any

  constructor(
    type: ErrorType,
    message: string,
    userMessage: string,
    context?: any
  ) {
    super(message)
    this.type = type
    this.userMessage = userMessage
    this.context = context
    this.name = 'AppError'
  }
}

// エラーハンドリング関数
export const handleError = (
  error: Error | AppError | unknown,
  userMessage?: string
): void => {
  let finalError: AppError

  if (error instanceof AppError) {
    finalError = error
  } else if (error instanceof Error) {
    // 既知のエラータイプを判定
    let errorType = ErrorType.UNKNOWN_ERROR
    let finalUserMessage = userMessage || ERROR_MESSAGES.UNKNOWN_ERROR

    // システムプロンプト準拠：日付変換エラーの詳細処理
    if (error.message.includes('Invalid time value') || 
        error.message.includes('Date conversion') ||
        error.message.includes('date') ||
        error.name === 'RangeError') {
      errorType = ErrorType.DATE_CONVERSION_ERROR
      finalUserMessage = userMessage || '日付データの処理でエラーが発生しました'
      
      logger.warn('Date conversion error detected', {
        originalError: error.message,
        stack: error.stack
      })
    } 
    // システムプロンプト準拠：一時的タスク関連エラーの処理
    else if (error.message.includes('temporary task') || 
             error.message.includes('一時的タスク')) {
      errorType = ErrorType.TEMPORARY_TASK_ERROR
      finalUserMessage = userMessage || ERROR_MESSAGES.TEMPORARY_TASK_ERROR
      
      logger.warn('Temporary task error detected', {
        originalError: error.message,
        stack: error.stack
      })
    }
    else if (error.message.includes('temporary task save') || 
             error.message.includes('一時的タスクの保存')) {
      errorType = ErrorType.TEMPORARY_TASK_SAVE_ERROR
      finalUserMessage = userMessage || ERROR_MESSAGES.TEMPORARY_TASK_SAVE_ERROR
      
      logger.warn('Temporary task save error detected', {
        originalError: error.message,
        stack: error.stack
      })
    }
    else if (error.name === 'TypeError' || error.message.includes('fetch')) {
      errorType = ErrorType.NETWORK_ERROR
      finalUserMessage = userMessage || ERROR_MESSAGES.NETWORK_ERROR
    } else if (error.message.includes('validation')) {
      errorType = ErrorType.VALIDATION_ERROR
      finalUserMessage = userMessage || ERROR_MESSAGES.VALIDATION_ERROR
    } else if (error.message.includes('HTTP error')) {
      errorType = ErrorType.API_ERROR
      finalUserMessage = userMessage || ERROR_MESSAGES.SERVER_ERROR
    }

    finalError = new AppError(
      errorType,
      error.message,
      finalUserMessage,
      { 
        originalError: error.name, 
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    )
  } else {
    // 不明なエラー
    finalError = new AppError(
      ErrorType.UNKNOWN_ERROR,
      String(error),
      userMessage || ERROR_MESSAGES.UNKNOWN_ERROR,
      { 
        originalError: error,
        timestamp: new Date().toISOString()
      }
    )
  }

  // システムプロンプト準拠：適切なログレベルでの出力
  if (finalError.type === ErrorType.DATE_CONVERSION_ERROR || 
      finalError.type === ErrorType.TEMPORARY_TASK_ERROR) {
    logger.warn(`${finalError.type}: ${finalError.message}`, finalError.context)
  } else {
    logger.error(`${finalError.type}: ${finalError.message}`, finalError.context)
  }

  // ユーザー通知（現在はconsole.error、将来的にはToast等）
  console.error('ユーザー向けエラー:', finalError.userMessage)
  
  // 開発環境では詳細なエラー情報も表示
  if (import.meta.env.DEV) {
    console.error('詳細エラー情報:', finalError)
  }
}

// 特定のエラータイプのハンドラー
export const handleNetworkError = (error: Error): void => {
  handleError(error, ERROR_MESSAGES.NETWORK_ERROR)
}

export const handleValidationError = (error: Error): void => {
  handleError(error, ERROR_MESSAGES.VALIDATION_ERROR)
}

export const handleApiError = (error: Error): void => {
  handleError(error, ERROR_MESSAGES.SERVER_ERROR)
}

// システムプロンプト準拠：日付変換エラー専用ハンドラー（既存）
export const handleDateConversionError = (error: Error, context?: any): void => {
  const dateError = new AppError(
    ErrorType.DATE_CONVERSION_ERROR,
    error.message,
    '日付データの処理中にエラーが発生しました。データ形式を確認してください。',
    {
      ...context,
      originalError: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }
  )
  
  handleError(dateError)
}

// システムプロンプト準拠：一時的タスクエラー専用ハンドラー（新規追加）
export const handleTemporaryTaskError = (error: Error, context?: any): void => {
  const tempTaskError = new AppError(
    ErrorType.TEMPORARY_TASK_ERROR,
    error.message,
    '一時的タスクの操作中にエラーが発生しました。再試行してください。',
    {
      ...context,
      originalError: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }
  )
  
  handleError(tempTaskError)
}

export const handleTemporaryTaskSaveError = (error: Error, taskId: string, context?: any): void => {
  const tempTaskSaveError = new AppError(
    ErrorType.TEMPORARY_TASK_SAVE_ERROR,
    error.message,
    'タスクの保存に失敗しました。タスク名を確認して再試行してください。',
    {
      ...context,
      taskId,
      originalError: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }
  )
  
  handleError(tempTaskSaveError)
}

/**
 * システムプロンプト準拠：エラー境界で使用する安全なエラー情報取得
 */
export const getSafeErrorInfo = (error: unknown): { message: string; details?: string } => {
  try {
    if (error instanceof AppError) {
      return {
        message: error.userMessage,
        details: import.meta.env.DEV ? error.message : undefined
      }
    }
    
    if (error instanceof Error) {
      return {
        message: '予期しないエラーが発生しました',
        details: import.meta.env.DEV ? error.message : undefined
      }
    }
    
    return {
      message: '不明なエラーが発生しました',
      details: import.meta.env.DEV ? String(error) : undefined
    }
  } catch (safetyError) {
    logger.error('Error in getSafeErrorInfo', { safetyError })
    return {
      message: 'エラー情報の取得に失敗しました'
    }
  }
}