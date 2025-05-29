// ログレベル定数（システムプロンプト準拠）
export const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4
  } as const
  
  export const LOG_LEVEL_NAMES = {
    [LOG_LEVELS.ERROR]: 'ERROR',
    [LOG_LEVELS.WARN]: 'WARN',
    [LOG_LEVELS.INFO]: 'INFO',
    [LOG_LEVELS.DEBUG]: 'DEBUG',
    [LOG_LEVELS.TRACE]: 'TRACE'
  } as const
  
  export type LogLevel = keyof typeof LOG_LEVELS
  export type LogLevelValue = typeof LOG_LEVELS[LogLevel]