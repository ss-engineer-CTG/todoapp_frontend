// Enterprise-grade Frontend Logging System
// エンタープライズレベルのフロントエンドロギングシステム

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: any
  sessionId: string
  userId?: string | undefined
  component?: string | undefined
  action?: string | undefined
  errorStack?: string
  userAgent: string
  url: string
  correlationId?: string | undefined
}

export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableLocalStorage: boolean
  enableServerLog: boolean
  maxLocalStorageEntries: number
  serverEndpoint?: string
  correlationHeader?: string
}

class EnterpriseLogger {
  private config: LoggerConfig
  private sessionId: string
  private userId?: string
  private logBuffer: LogEntry[] = []
  private readonly STORAGE_KEY = 'app_logs'
  private readonly MAX_BUFFER_SIZE = 100
  private flushTimer?: NodeJS.Timeout

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableLocalStorage: true,
      enableServerLog: false,
      maxLocalStorageEntries: 1000,
      serverEndpoint: '/api/logs',
      correlationHeader: 'X-Correlation-ID',
      ...config
    }
    
    this.sessionId = this.generateSessionId()
    this.initializeLogger()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  private initializeLogger(): void {
    // グローバルエラーハンドリング
    window.addEventListener('error', (event) => {
      this.error('Uncaught Error', {
        message: event.error?.message || event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
      })
    })

    // 定期的なログフラッシュ
    this.flushTimer = setInterval(() => {
      this.flushLogs()
    }, 30000) // 30秒ごと
  }

  setUserId(userId: string): void {
    this.userId = userId
  }

  setLogLevel(level: LogLevel): void {
    this.config.level = level
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: any,
    component?: string,
    action?: string
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      sessionId: this.sessionId,
      userId: this.userId,
      component,
      action,
      userAgent: navigator.userAgent,
      url: window.location.href,
      correlationId: this.getCorrelationId()
    }

    if (context instanceof Error) {
      entry.errorStack = context.stack
      entry.context = {
        name: context.name,
        message: context.message
      }
    }

    return entry
  }

  private getCorrelationId(): string | undefined {
    // HTTPヘッダーや他の方法で相関IDを取得
    return (window as any).__correlationId
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return

    // コンソール出力
    if (this.config.enableConsole) {
      this.writeToConsole(entry)
    }

    // ローカルストレージ保存
    if (this.config.enableLocalStorage) {
      this.writeToLocalStorage(entry)
    }

    // バッファに追加
    this.logBuffer.push(entry)
    if (this.logBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.flushLogs()
    }
  }

  private writeToConsole(entry: LogEntry): void {
    const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']
    const levelName = levelNames[entry.level]
    const timestamp = new Date(entry.timestamp).toLocaleTimeString()
    
    const message = `[${timestamp}][${levelName}][${entry.component || 'APP'}] ${entry.message}`
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(message, entry.context)
        break
      case LogLevel.WARN:
        console.warn(message, entry.context)
        break
      case LogLevel.INFO:
        console.info(message, entry.context)
        break
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        console.debug(message, entry.context)
        break
    }
  }

  private writeToLocalStorage(entry: LogEntry): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      const logs: LogEntry[] = stored ? JSON.parse(stored) : []
      
      logs.push(entry)
      
      // 最大件数制限
      if (logs.length > this.config.maxLocalStorageEntries) {
        logs.splice(0, logs.length - this.config.maxLocalStorageEntries)
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs))
    } catch (error) {
      console.warn('Failed to write log to localStorage:', error)
    }
  }

  private async flushLogs(): Promise<void> {
    if (!this.config.enableServerLog || this.logBuffer.length === 0) return

    const logsToSend = [...this.logBuffer]
    this.logBuffer = []

    try {
      await fetch(this.config.serverEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.correlationHeader && {
            [this.config.correlationHeader]: this.getCorrelationId() || ''
          })
        },
        body: JSON.stringify({ logs: logsToSend })
      })
    } catch (error) {
      // サーバー送信失敗時はバッファに戻す
      this.logBuffer.unshift(...logsToSend)
      console.warn('Failed to send logs to server:', error)
    }
  }

  // パブリックAPI
  error(message: string, context?: any, component?: string, action?: string): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, component, action)
    this.writeLog(entry)
  }

  warn(message: string, context?: any, component?: string, action?: string): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context, component, action)
    this.writeLog(entry)
  }

  info(message: string, context?: any, component?: string, action?: string): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context, component, action)
    this.writeLog(entry)
  }

  debug(message: string, context?: any, component?: string, action?: string): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context, component, action)
    this.writeLog(entry)
  }

  trace(message: string, context?: any, component?: string, action?: string): void {
    const entry = this.createLogEntry(LogLevel.TRACE, message, context, component, action)
    this.writeLog(entry)
  }

  // メトリクス追跡
  metric(name: string, value: number, tags?: Record<string, string>): void {
    this.info(`Metric: ${name}`, {
      type: 'metric',
      name,
      value,
      tags,
      timestamp: Date.now()
    })
  }

  // パフォーマンス追跡
  performance(operation: string, duration: number, success: boolean = true): void {
    this.info(`Performance: ${operation}`, {
      type: 'performance',
      operation,
      duration,
      success,
      timestamp: Date.now()
    })
  }

  // ユーザーアクション追跡
  userAction(action: string, component: string, details?: any): void {
    this.info(`User Action: ${action}`, {
      type: 'user_action',
      action,
      component,
      details,
      timestamp: Date.now()
    })
  }

  // ログ検索・エクスポート
  getLogs(filters?: {
    level?: LogLevel
    component?: string
    startTime?: Date
    endTime?: Date
  }): LogEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []
      
      let logs: LogEntry[] = JSON.parse(stored)
      
      if (filters) {
        logs = logs.filter(log => {
          if (filters.level !== undefined && log.level > filters.level) return false
          if (filters.component && log.component !== filters.component) return false
          if (filters.startTime && new Date(log.timestamp) < filters.startTime) return false
          if (filters.endTime && new Date(log.timestamp) > filters.endTime) return false
          return true
        })
      }
      
      return logs
    } catch (error) {
      console.warn('Failed to retrieve logs:', error)
      return []
    }
  }

  exportLogs(format: 'json' | 'csv' = 'json'): string {
    const logs = this.getLogs()
    
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'message', 'component', 'action', 'sessionId', 'userId']
      const rows = logs.map(log => [
        log.timestamp,
        LogLevel[log.level],
        log.message,
        log.component || '',
        log.action || '',
        log.sessionId,
        log.userId || ''
      ])
      
      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }
    
    return JSON.stringify(logs, null, 2)
  }

  clearLogs(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    this.logBuffer = []
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flushLogs()
  }
}

// 開発環境用の詳細ログ設定
const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = new EnterpriseLogger({
  level: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableLocalStorage: true,
  enableServerLog: !isDevelopment, // 本番環境のみサーバーログ有効
  maxLocalStorageEntries: isDevelopment ? 500 : 1000
})

// グローバルアクセス用
;(window as any).__logger = logger