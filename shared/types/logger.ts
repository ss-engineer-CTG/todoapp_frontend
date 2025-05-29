import type { LogLevel, LogLevelValue } from '../constants/logger'

export interface LogEntry {
  level: LogLevelValue
  levelName: string
  message: string
  timestamp: string
  transactionId?: string
  context?: Record<string, any>
  error?: Error
}

export interface LoggerConfig {
  level: LogLevelValue
  enableConsole: boolean
  enableFile: boolean
  filePath?: string
  format: 'json' | 'text'
}

export interface Logger {
  error(message: string, context?: Record<string, any>, error?: Error): void
  warn(message: string, context?: Record<string, any>): void
  info(message: string, context?: Record<string, any>): void
  debug(message: string, context?: Record<string, any>): void
  trace(message: string, context?: Record<string, any>): void
}