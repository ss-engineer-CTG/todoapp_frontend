// システムプロンプト準拠: 統一例外処理
import { logger } from './logger'
import { ERROR_MESSAGES } from '../config/constants'

// エラー型定義
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  API_ERROR = 'API_ERROR',
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

    if (error.name === 'TypeError' || error.message.includes('fetch')) {
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
      { originalError: error.name, stack: error.stack }
    )
  } else {
    // 不明なエラー
    finalError = new AppError(
      ErrorType.UNKNOWN_ERROR,
      String(error),
      userMessage || ERROR_MESSAGES.UNKNOWN_ERROR,
      { originalError: error }
    )
  }

  // ログ出力
  logger.error(`${finalError.type}: ${finalError.message}`, finalError.context)

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