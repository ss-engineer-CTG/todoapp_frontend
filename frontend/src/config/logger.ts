// ログ設定
import type { LoggerConfig } from '../types/logger'
import { LOG_LEVELS } from '../utils/logger/levels'

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

export const LOGGER_CONFIG: LoggerConfig = {
  level: isDevelopment ? LOG_LEVELS.TRACE : 
         isProduction ? LOG_LEVELS.WARN : LOG_LEVELS.INFO,
  
  enableConsole: !isProduction,
  enableFile: isDevelopment,
  format: isDevelopment ? 'text' : 'json'
}

// 環境別設定
export const ENVIRONMENT_CONFIGS = {
  development: {
    level: LOG_LEVELS.TRACE,
    enableConsole: true,
    enableFile: true,
    format: 'text' as const
  },
  
  production: {
    level: LOG_LEVELS.WARN,
    enableConsole: false,
    enableFile: false,
    format: 'json' as const
  },
  
  test: {
    level: LOG_LEVELS.ERROR,
    enableConsole: false,
    enableFile: false,
    format: 'json' as const
  }
} as const