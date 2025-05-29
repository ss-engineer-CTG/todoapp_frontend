// フロントエンドログ機能
import { useMemo } from 'react'
import { BaseLogger } from '@/utils/logger/logger'
import type { LoggerConfig } from '@/types/logger'

const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'development' ? 4 : 2, // DEV: TRACE, PROD: INFO
  enableConsole: true,
  enableFile: false,
  format: 'text'
}

export const useLogger = (config?: Partial<LoggerConfig>) => {
  const logger = useMemo(() => {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config }
    return new BaseLogger(mergedConfig)
  }, [config])

  return logger
}