// ログレベル定義（フロントエンド用）
export { 
    LOG_LEVELS, 
    LOG_LEVEL_NAMES,
    type LogLevel,
    type LogLevelValue 
  } from '../../../shared/constants/logger'
  
  // フロントエンド固有のログレベル設定
  export const FRONTEND_LOG_CONFIG = {
    DEVELOPMENT: {
      LEVEL: LOG_LEVELS.TRACE,
      ENABLE_CONSOLE: true,
      ENABLE_STORAGE: true
    },
    PRODUCTION: {
      LEVEL: LOG_LEVELS.INFO,
      ENABLE_CONSOLE: false,
      ENABLE_STORAGE: false
    },
    TEST: {
      LEVEL: LOG_LEVELS.ERROR,
      ENABLE_CONSOLE: false,
      ENABLE_STORAGE: false
    }
  } as const