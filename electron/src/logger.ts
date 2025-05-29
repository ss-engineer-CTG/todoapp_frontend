// Electronログ管理（システムプロンプト準拠）
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

interface LogEntry {
  timestamp: string
  level: string
  category: string
  message: string
  context?: any
}

class ElectronLogger {
  private logFile: string
  private isDev: boolean
  
  constructor(category: string) {
    this.isDev = process.env.NODE_ENV === 'development'
    
    const logDir = this.isDev 
      ? path.join(__dirname, '..', '..', 'logs')
      : path.join(app.getPath('userData'), 'logs')
    
    // ログディレクトリ作成
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    
    this.logFile = path.join(logDir, 'electron.log')
  }
  
  private writeLog(level: string, message: string, context?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      category: 'electron',
      message,
      context
    }
    
    // コンソール出力
    if (this.isDev) {
      const logMethod = level === 'error' ? console.error : 
                       level === 'warn' ? console.warn : console.log
      
      logMethod(`[${entry.timestamp}] [${entry.level}] ${entry.message}`)
      
      if (context) {
        console.log('Context:', context)
      }
    }
    
    // ファイル出力
    try {
      const logLine = JSON.stringify(entry) + '\n'
      fs.appendFileSync(this.logFile, logLine, 'utf8')
    } catch (error) {
      console.error('Failed to write log:', error)
    }
  }
  
  error(message: string, context?: any): void {
    this.writeLog('error', message, context)
  }
  
  warn(message: string, context?: any): void {
    this.writeLog('warn', message, context)
  }
  
  info(message: string, context?: any): void {
    this.writeLog('info', message, context)
  }
  
  debug(message: string, context?: any): void {
    if (this.isDev) {
      this.writeLog('debug', message, context)
    }
  }
}

// ロガーファクトリー
export function getLogger(category: string): ElectronLogger {
  return new ElectronLogger(category)
}