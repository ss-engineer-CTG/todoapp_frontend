// システムプロンプト準拠：ログ機能
// 🔧 core.tsxから抽出

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class SimpleLogger {
  private level: LogLevel = LogLevel.DEBUG

  error(message: string, context?: any): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, context)
    }
  }

  warn(message: string, context?: any): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, context)
    }
  }

  info(message: string, context?: any): void {
    if (this.level >= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, context)
    }
  }

  debug(message: string, context?: any): void {
    if (this.level >= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, context)
    }
  }
}

export const logger = new SimpleLogger()