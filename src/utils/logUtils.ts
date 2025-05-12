// src/utils/logUtils.ts
export enum LogLevel {
    ERROR = 'ERROR',
    WARN = 'WARN',
    INFO = 'INFO',
    DEBUG = 'DEBUG',
    TRACE = 'TRACE'
  }
  
  // 現在のログレベル（本番環境では INFO まで、開発環境では全て）
  export const currentLogLevel = process.env.NODE_ENV === 'production' 
    ? LogLevel.INFO 
    : LogLevel.TRACE;
  
  const shouldLog = (level: LogLevel): boolean => {
    const levels = Object.values(LogLevel);
    const currentIndex = levels.indexOf(currentLogLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex <= currentIndex;
  };
  
  export function logError(message: string, error?: any): void {
    if (shouldLog(LogLevel.ERROR)) {
      if (error) {
        console.error(`[ERROR] ${message}`, '\n', error);
      } else {
        console.error(`[ERROR] ${message}`);
      }
    }
  }
  
  export function logWarning(message: string, data?: any): void {
    if (shouldLog(LogLevel.WARN)) {
      if (data) {
        console.warn(`[WARN] ${message}`, '\n', data);
      } else {
        console.warn(`[WARN] ${message}`);
      }
    }
  }
  
  export function logInfo(message: string, data?: any): void {
    if (shouldLog(LogLevel.INFO)) {
      if (data) {
        console.info(`[INFO] ${message}`, '\n', data);
      } else {
        console.info(`[INFO] ${message}`);
      }
    }
  }
  
  export function logDebug(message: string, data?: any): void {
    if (shouldLog(LogLevel.DEBUG)) {
      if (data) {
        console.debug(`[DEBUG] ${message}`, '\n', data);
      } else {
        console.debug(`[DEBUG] ${message}`);
      }
    }
  }
  
  export function logTrace(message: string, data?: any): void {
    if (shouldLog(LogLevel.TRACE)) {
      if (data) {
        console.log(`[TRACE] ${message}`, '\n', data);
      } else {
        console.log(`[TRACE] ${message}`);
      }
    }
  }