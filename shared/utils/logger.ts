// ログ基盤（システムプロンプト準拠：統一フォーマット）
import type { Logger, LogEntry, LoggerConfig } from '../types/logger'
import { LOG_LEVELS, LOG_LEVEL_NAMES } from '../constants/logger'

export class BaseLogger implements Logger {
  private config: LoggerConfig
  private transactionId: string

  constructor(config: LoggerConfig) {
    this.config = config
    this.transactionId = this.generateTransactionId()
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private createLogEntry(
    level: number,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      level,
      levelName: LOG_LEVEL_NAMES[level],
      message,
      timestamp: new Date().toISOString(),
      transactionId: this.transactionId,
      context,
      error
    }
  }

  private shouldLog(level: number): boolean {
    return level <= this.config.level
  }

  private formatLogEntry(entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify(entry)
    }
    
    const timestamp = entry.timestamp
    const level = entry.levelName.padEnd(5)
    const txnId = entry.transactionId ? `[${entry.transactionId}]` : ''
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
    const error = entry.error ? ` ERROR: ${entry.error.message}` : ''
    
    return `${timestamp} - ${level} ${txnId} - ${entry.message}${context}${error}`
  }

  private output(entry: LogEntry): void {
    const formattedMessage = this.formatLogEntry(entry)
    
    if (this.config.enableConsole) {
      const consoleMethod = entry.level <= LOG_LEVELS.ERROR ? 'error' :
                           entry.level <= LOG_LEVELS.WARN ? 'warn' : 'log'
      console[consoleMethod](formattedMessage)
    }
    
    // ファイル出力は環境依存のため、各実装で拡張
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      const entry = this.createLogEntry(LOG_LEVELS.ERROR, message, context, error)
      this.output(entry)
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      const entry = this.createLogEntry(LOG_LEVELS.WARN, message, context)
      this.output(entry)
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      const entry = this.createLogEntry(LOG_LEVELS.INFO, message, context)
      this.output(entry)
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      const entry = this.createLogEntry(LOG_LEVELS.DEBUG, message, context)
      this.output(entry)
    }
  }

  trace(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LOG_LEVELS.TRACE)) {
      const entry = this.createLogEntry(LOG_LEVELS.TRACE, message, context)
      this.output(entry)
    }
  }
}