// ログフォーマッター（タイムスタンプ・トランザクションID対応）
import type { LogEntry } from '../../types/logger'

/**
 * ブラウザ用ログフォーマッター
 */
export const formatBrowserLog = (entry: LogEntry): string => {
  const timestamp = new Date(entry.timestamp).toLocaleString('ja-JP')
  const level = `[${entry.levelName}]`.padEnd(7)
  const txnId = entry.transactionId ? `[TXN:${entry.transactionId.slice(-6)}]` : ''
  const context = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
  const error = entry.error ? `\nERROR: ${entry.error.message}\nSTACK: ${entry.error.stack}` : ''
  
  return `${timestamp} ${level} ${txnId} ${entry.message}${context}${error}`
}

/**
 * コンソール用カラーフォーマッター
 */
export const formatColorLog = (entry: LogEntry): { message: string; styles: string[] } => {
  const styles: string[] = []
  
  // レベル別カラー
  const levelColors = {
    ERROR: 'color: #ef4444; font-weight: bold;',
    WARN: 'color: #f59e0b; font-weight: bold;',
    INFO: 'color: #3b82f6;',
    DEBUG: 'color: #6b7280;',
    TRACE: 'color: #9ca3af;'
  }
  
  const timestamp = new Date(entry.timestamp).toLocaleTimeString('ja-JP')
  const levelStyle = levelColors[entry.levelName] || 'color: #000;'
  
  const message = `%c${timestamp} [${entry.levelName}] %c${entry.message}`
  styles.push('color: #6b7280;', levelStyle)
  
  return { message, styles }
}

/**
 * JSON形式でのログフォーマット
 */
export const formatJsonLog = (entry: LogEntry): string => {
  return JSON.stringify({
    ...entry,
    timestamp: new Date(entry.timestamp).toISOString()
  }, null, 2)
}