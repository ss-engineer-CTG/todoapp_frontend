import { format, parseISO, isValid, parse } from 'date-fns'
import { ja } from 'date-fns/locale'
import { logger } from './logger'
import { handleError } from './errorHandler'

export const formatDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    
    if (!isValid(dateObj)) {
      logger.warn('Invalid date provided to formatDate', { date })
      return '無効な日付'
    }
    
    return format(dateObj, 'yyyy年M月d日', { locale: ja })
  } catch (error) {
    logger.error('日付フォーマットエラー:', { error, date })
    return '無効な日付'
  }
}

export const formatDateTime = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    
    if (!isValid(dateObj)) {
      logger.warn('Invalid date provided to formatDateTime', { date })
      return '無効な日付'
    }
    
    return format(dateObj, 'yyyy年M月d日 H:mm', { locale: ja })
  } catch (error) {
    logger.error('日時フォーマットエラー:', { error, date })
    return '無効な日付'
  }
}

export const isDatePast = (date: Date | string): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    const now = new Date()
    
    if (!isValid(dateObj)) {
      logger.warn('Invalid date provided to isDatePast', { date })
      return false
    }
    
    return dateObj < now
  } catch (error) {
    logger.error('日付比較エラー:', { error, date })
    return false
  }
}

export const getDaysDifference = (date1: Date | string, date2: Date | string): number => {
  try {
    const dateObj1 = typeof date1 === 'string' ? parseISO(date1) : date1
    const dateObj2 = typeof date2 === 'string' ? parseISO(date2) : date2
    
    if (!isValid(dateObj1) || !isValid(dateObj2)) {
      logger.warn('Invalid dates provided to getDaysDifference', { date1, date2 })
      return 0
    }
    
    const diffTime = Math.abs(dateObj2.getTime() - dateObj1.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  } catch (error) {
    logger.error('日付差分計算エラー:', { error, date1, date2 })
    return 0
  }
}

export const addDays = (date: Date | string, days: number): Date => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
    
    if (!isValid(dateObj)) {
      logger.warn('Invalid date provided to addDays', { date, days })
      return new Date()
    }
    
    const result = new Date(dateObj)
    result.setDate(result.getDate() + days)
    
    return result
  } catch (error) {
    logger.error('日付加算エラー:', { error, date, days })
    return new Date()
  }
}

/**
 * システムプロンプト準拠：DRY原則による統一日付変換関数
 * API応答の日付文字列をDate型に変換（エラーハンドリング付き）
 */
export const convertApiResponseDates = (dateString: string | null | undefined): Date | null => {
  if (!dateString) {
    return null
  }

  try {
    // ISO 8601 形式の文字列をパース
    const parsed = parseISO(dateString)
    
    if (!isValid(parsed)) {
      // フォールバック：別の形式を試行
      const fallbackFormats = [
        'yyyy-MM-dd HH:mm:ss',
        'yyyy-MM-dd',
        'MM/dd/yyyy',
        'yyyy/MM/dd'
      ]
      
      for (const formatStr of fallbackFormats) {
        try {
          const fallbackParsed = parse(dateString, formatStr, new Date())
          if (isValid(fallbackParsed)) {
            logger.debug('Date parsed with fallback format', { 
              original: dateString, 
              format: formatStr 
            })
            return fallbackParsed
          }
        } catch (fallbackError) {
          // 次の形式を試行
          continue
        }
      }
      
      logger.warn('Unable to parse date string', { dateString })
      return null
    }
    
    logger.trace('Date conversion successful', { 
      input: dateString, 
      output: parsed.toISOString() 
    })
    
    return parsed
  } catch (error) {
    logger.error('Date conversion failed', { 
      dateString, 
      error: error instanceof Error ? error.message : String(error) 
    })
    
    // フォールバック：現在日時を返す（アプリクラッシュを防ぐ）
    return new Date()
  }
}

/**
 * Date型の安全な検証
 */
export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && isValid(date)
}

/**
 * 安全な日付フォーマット（フォールバック付き）
 */
export const safeFormatDate = (date: Date | string | null | undefined, fallback = '未設定'): string => {
  if (!date) return fallback
  
  try {
    return formatDate(date)
  } catch (error) {
    logger.warn('Safe date format fallback used', { date, error })
    return fallback
  }
}

/**
 * 安全な日時フォーマット（フォールバック付き）
 */
export const safeFormatDateTime = (date: Date | string | null | undefined, fallback = '未設定'): string => {
  if (!date) return fallback
  
  try {
    return formatDateTime(date)
  } catch (error) {
    logger.warn('Safe datetime format fallback used', { date, error })
    return fallback
  }
}