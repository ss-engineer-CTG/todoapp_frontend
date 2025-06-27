// システムプロンプト準拠：エラーハンドリング機能
// 🔧 core.tsxから抽出

import { logger } from './logger'

// エラーメッセージ定数
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  VALIDATION_ERROR: '入力値に誤りがあります',
  SERVER_ERROR: 'サーバーエラーが発生しました',
  UNKNOWN_ERROR: '予期しないエラーが発生しました',
  TASK_OPERATION_ERROR: 'タスク操作でエラーが発生しました',
  TIMELINE_ERROR: 'タイムライン表示でエラーが発生しました',
  DRAG_ERROR: 'ドラッグ操作でエラーが発生しました',
}

export const handleError = (error: any, fallbackMessage: string = ERROR_MESSAGES.UNKNOWN_ERROR) => {
  let errorMessage = fallbackMessage
  
  if (error && typeof error === 'object') {
    if (error.message) {
      errorMessage = error.message
    } else if (error.error) {
      errorMessage = error.error
    }
  } else if (typeof error === 'string') {
    errorMessage = error
  }
  
  logger.error(errorMessage, error)
  
  return errorMessage
}