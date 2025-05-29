// フロントエンドログ機能
import { BaseLogger } from '../../../shared/utils/logger'
import type { LoggerConfig, LogEntry } from '../../types/logger'

export class FrontendLogger extends BaseLogger {
  constructor(config: LoggerConfig) {
    super(config)
  }

  protected output(entry: LogEntry): void {
    super.output(entry)
    
    // フロントエンド固有の出力処理
    if (this.config.enableFile && typeof window !== 'undefined') {
      // ローカルストレージへのログ保存（開発用）
      if (process.env.NODE_ENV === 'development') {
        this.saveToLocalStorage(entry)
      }
    }
  }

  private saveToLocalStorage(entry: LogEntry): void {
    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]')
      logs.push(entry)
      
      // 最新100件のみ保持
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100)
      }
      
      localStorage.setItem('app_logs', JSON.stringify(logs))
    } catch (error) {
      console.warn('Failed to save log to localStorage:', error)
    }
  }

  // ログクリア機能
  clearLogs(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('app_logs')
    }
  }

  // ログ取得機能
  getLogs(): LogEntry[] {
    if (typeof window === 'undefined') return []
    
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]')
    } catch {
      return []
    }
  }
}

// デフォルトロガーインスタンス
const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'development' ? 4 : 2,
  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'development',
  format: 'text'
}

export const logger = new FrontendLogger(defaultConfig)