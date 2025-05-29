// 統一エラー処理ユーティリティ
import { logger } from './logger/logger'

export interface AppError extends Error {
  code?: string
  context?: Record<string, any>
  timestamp: Date
  transactionId?: string
}

export class TodoAppError extends Error implements AppError {
  code?: string
  context?: Record<string, any>
  timestamp: Date
  transactionId?: string

  constructor(
    message: string,
    code?: string,
    context?: Record<string, any>
  ) {
    super(message)
    this.name = 'TodoAppError'
    this.code = code
    this.context = context
    this.timestamp = new Date()
    this.transactionId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }
}

/**
 * エラーハンドリング統一関数
 */
export const handleError = (
  error: Error | AppError,
  context?: Record<string, any>
): void => {
  // ログ出力
  logger.error(error.message, {
    code: (error as AppError).code,
    context: { ...(error as AppError).context, ...context },
    stack: error.stack
  }, error)

  // 開発環境では詳細エラーを表示
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Error Details')
    console.error('Message:', error.message)
    console.error('Code:', (error as AppError).code)
    console.error('Context:', { ...(error as AppError).context, ...context })
    console.error('Stack:', error.stack)
    console.groupEnd()
  }
}

/**
 * 非同期エラーハンドラー
 */
export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T | null> => {
  try {
    return await asyncFn()
  } catch (error) {
    handleError(error as Error, context)
    return null
  }
}

/**
 * APIエラーハンドラー
 */
export const handleApiError = (
  error: any,
  endpoint: string,
  method: string = 'GET'
): TodoAppError => {
  const apiError = new TodoAppError(
    error.message || 'API request failed',
    'API_ERROR',
    {
      endpoint,
      method,
      status: error.status,
      response: error.response
    }
  )
  
  handleError(apiError)
  return apiError
}