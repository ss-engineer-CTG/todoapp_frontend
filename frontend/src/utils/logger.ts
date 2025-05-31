// システムプロンプト準拠: 統一ログ機能

// ログレベル定義（システムプロンプト準拠）
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

// ログエントリ型定義
interface LogEntry {
  timestamp: string
  level: string
  transactionId: string
  message: string
  context?: any
  source: 'frontend'
}

// システムプロンプト準拠: 統一ログシステム
class Logger {
  private static instance: Logger
  private level: LogLevel = LogLevel.INFO
  private transactionCounter = 0

  private constructor() {
    // 環境変数からログレベルを設定
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

  // システムプロンプト準拠: ERROR - アプリケーションの停止につながる重大な問題
  error(message: string, context?: any): void {
    this.log(LogLevel.ERROR, message, context)
  }

  // システムプロンプト準拠: WARN - 将来的に問題になる可能性がある警告
  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context)
  }

  // システムプロンプト準拠: INFO - 一般的な情報（起動・終了、重要な処理など）
  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context)
  }

  // システムプロンプト準拠: DEBUG - 詳細なデバッグ情報
  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  // システムプロンプト準拠: TRACE - 最も詳細なレベル
  trace(message: string, context?: any): void {
    this.log(LogLevel.TRACE, message, context)
  }

  // システムプロンプト準拠：新規追加 - データ変換専用ログメソッド
  logDataConversion(operation: string, input: any, output: any, success: boolean): void {
    const context = {
      operation,
      input: this.sanitizeLogData(input),
      output: this.sanitizeLogData(output),
      success,
      timestamp: new Date().toISOString()
    }
    
    if (success) {
      this.debug(`Data conversion successful: ${operation}`, context)
    } else {
      this.warn(`Data conversion failed: ${operation}`, context)
    }
  }

  // システムプロンプト準拠：新規追加 - API通信専用ログメソッド
  logApiOperation(method: string, url: string, success: boolean, duration?: number, error?: any): void {
    const context = {
      method,
      url,
      success,
      duration: duration ? `${duration}ms` : undefined,
      error: error ? this.sanitizeLogData(error) : undefined,
      timestamp: new Date().toISOString()
    }
    
    if (success) {
      this.info(`API operation completed: ${method} ${url}`, context)
    } else {
      this.error(`API operation failed: ${method} ${url}`, context)
    }
  }

  private log(level: LogLevel, message: string, context?: any): void {
    if (level <= this.level) {
      // システムプロンプト準拠: タイムスタンプを含める
      const timestamp = new Date().toISOString()
      const levelName = LogLevel[level]
      
      // システムプロンプト準拠: トランザクションIDなどの相関情報を含める
      const transactionId = this.generateTransactionId()
      
      const logEntry: LogEntry = {
        timestamp,
        level: levelName,
        transactionId,
        message,
        context: this.sanitizeLogData(context),
        source: 'frontend'
      }

      // システムプロンプト準拠: 一貫したフォーマットを使用する
      const formattedMessage = this.formatLogMessage(logEntry)
      
      // レベルに応じてコンソール出力を分ける
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

  // システムプロンプト準拠: 明確で具体的なメッセージを記述する
  private formatLogMessage(entry: LogEntry): string {
    return `[${entry.timestamp}] ${entry.level} [${entry.transactionId}] [${entry.source}] ${entry.message}`
  }

  // システムプロンプト準拠: トランザクションIDなどの相関情報を含める
  private generateTransactionId(): string {
    this.transactionCounter++
    return `tx_${Date.now()}_${this.transactionCounter.toString().padStart(4, '0')}`
  }

  // システムプロンプト準拠：新規追加 - ログデータの安全化（機密情報除去）
  private sanitizeLogData(data: any): any {
    if (!data) return data
    
    try {
      // 循環参照を避けるため、JSONで一度変換
      const serialized = JSON.stringify(data, (key, value) => {
        // 機密情報の可能性があるフィールドをマスク
        if (typeof key === 'string' && 
            (key.toLowerCase().includes('password') || 
             key.toLowerCase().includes('token') || 
             key.toLowerCase().includes('secret'))) {
          return '***MASKED***'
        }
        
        // 大きすぎるデータを制限
        if (typeof value === 'string' && value.length > 1000) {
          return value.substring(0, 1000) + '...[TRUNCATED]'
        }
        
        return value
      })
      
      return JSON.parse(serialized)
    } catch (error) {
      // JSON化に失敗した場合は安全な文字列として返す
      return String(data).substring(0, 500)
    }
  }

  // ログレベル設定
  setLevel(level: LogLevel): void {
    this.level = level
    this.info('Log level changed', { newLevel: LogLevel[level] })
  }

  // ログレベル取得
  getLevel(): LogLevel {
    return this.level
  }
}

// シングルトンインスタンスをエクスポート
export const logger = Logger.getInstance()

// ログフォーマッター（システムプロンプト準拠）
export class LogFormatter {
  // システムプロンプト準拠: エラー詳細や例外スタックトレースを記録する
  static formatError(error: Error): string {
    return `${error.name}: ${error.message}\nStack: ${error.stack || 'No stack trace available'}`
  }

  // API呼び出しのログフォーマット
  static formatApiCall(method: string, url: string, data?: any): string {
    const dataInfo = data ? ` with data: ${JSON.stringify(data)}` : ''
    return `API ${method} ${url}${dataInfo}`
  }

  // パフォーマンス測定のログフォーマット
  static formatPerformance(operation: string, duration: number): string {
    return `Performance: ${operation} completed in ${duration}ms`
  }

  // システムプロンプト準拠：新規追加 - データ変換ログフォーマット
  static formatDataConversion(operation: string, inputType: string, outputType: string, recordCount?: number): string {
    const countInfo = recordCount ? ` (${recordCount} records)` : ''
    return `Data conversion: ${operation} - ${inputType} → ${outputType}${countInfo}`
  }
}