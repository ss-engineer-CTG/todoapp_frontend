// システムプロンプト準拠: 軽量化されたログ機能（統合フラグアプローチで簡素化）

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

interface LogEntry {
  timestamp: string
  level: string
  transactionId: string
  message: string
  context?: any
  source: 'frontend'
}

// システムプロンプト準拠: 軽量化されたログシステム
class Logger {
  private static instance: Logger
  private level: LogLevel = LogLevel.INFO
  private transactionCounter = 0

  private constructor() {
    const envLevel = import.meta.env.VITE_LOG_LEVEL
    if (envLevel && envLevel in LogLevel) {
      this.level = LogLevel[envLevel as keyof typeof LogLevel]
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  // システムプロンプト準拠: 基本ログメソッドのみ
  error(message: string, context?: any): void {
    this.log(LogLevel.ERROR, message, context)
  }

  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context)
  }

  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context)
  }

  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  trace(message: string, context?: any): void {
    this.log(LogLevel.TRACE, message, context)
  }

  // システムプロンプト準拠：フォーカス関連ログ専用メソッド
  logFocusEvent(event: string, details?: any): void {
    this.debug(`Focus Event: ${event}`, {
      type: 'focus',
      event,
      details,
      activeElement: document.activeElement?.tagName,
      activeElementId: document.activeElement?.id,
      timestamp: new Date().toISOString()
    })
  }

  logKeyboardEvent(key: string, handled: boolean, context?: any): void {
    this.debug(`Keyboard Event: ${key}`, {
      type: 'keyboard',
      key,
      handled,
      activeElement: document.activeElement?.tagName,
      context,
      timestamp: new Date().toISOString()
    })
  }

  logAreaTransition(from: string, to: string, reason?: string): void {
    this.debug(`Area Transition: ${from} → ${to}`, {
      type: 'area_transition',
      from,
      to,
      reason,
      timestamp: new Date().toISOString()
    })
  }

  // 統合フラグアプローチ：軽量化されたタスク操作ログ
  logTaskOperation(operation: string, taskId: string, isDraft: boolean, details?: any): void {
    this.debug(`Task Operation: ${operation}`, {
      type: 'task_operation',
      operation,
      taskId,
      isDraft,
      details,
      timestamp: new Date().toISOString()
    })
  }

  private log(level: LogLevel, message: string, context?: any): void {
    if (level <= this.level) {
      const timestamp = new Date().toISOString()
      const levelName = LogLevel[level]
      const transactionId = this.generateTransactionId()
      
      const logEntry: LogEntry = {
        timestamp,
        level: levelName,
        transactionId,
        message,
        context: this.sanitizeLogData(context),
        source: 'frontend'
      }

      const formattedMessage = this.formatLogMessage(logEntry)
      
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedMessage, context)
          break
        case LogLevel.WARN:
          console.warn(formattedMessage, context)
          break
        case LogLevel.INFO:
          console.info(formattedMessage, context)
          break
        case LogLevel.DEBUG:
        case LogLevel.TRACE:
          console.log(formattedMessage, context)
          break
      }
    }
  }

  private formatLogMessage(entry: LogEntry): string {
    return `[${entry.timestamp}] ${entry.level} [${entry.transactionId}] [${entry.source}] ${entry.message}`
  }

  private generateTransactionId(): string {
    this.transactionCounter++
    return `tx_${Date.now()}_${this.transactionCounter.toString().padStart(4, '0')}`
  }

  // システムプロンプト準拠: 簡素化されたデータサニタイズ
  private sanitizeLogData(data: any): any {
    if (!data) return data
    
    try {
      const serialized = JSON.stringify(data, (key, value) => {
        // 機密情報のマスク
        if (typeof key === 'string' && 
            (key.toLowerCase().includes('password') || 
             key.toLowerCase().includes('token') || 
             key.toLowerCase().includes('secret'))) {
          return '***MASKED***'
        }
        
        // 大きすぎるデータを制限
        if (typeof value === 'string' && value.length > 500) {
          return value.substring(0, 500) + '...[TRUNCATED]'
        }
        
        return value
      })
      
      return JSON.parse(serialized)
    } catch (error) {
      return String(data).substring(0, 300)
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level
    this.info('Log level changed', { newLevel: LogLevel[level] })
  }

  getLevel(): LogLevel {
    return this.level
  }
}

export const logger = Logger.getInstance()