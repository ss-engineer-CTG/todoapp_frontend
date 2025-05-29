// フロントエンド用ログ関連型定義
export {
    type LogEntry,
    type LoggerConfig,
    type Logger
  } from '../../shared/types/logger'
  
  // フロントエンド固有の型
  export interface FrontendLogEntry extends LogEntry {
    url?: string
    userAgent?: string
    userId?: string
  }
  
  export interface BrowserLoggerConfig extends LoggerConfig {
    enableLocalStorage?: boolean
    maxStorageEntries?: number
  }