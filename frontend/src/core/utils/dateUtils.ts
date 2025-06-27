// システムプロンプト準拠：日付ユーティリティ機能
// 🔧 core.tsxから抽出

import { format, parseISO, isValid } from 'date-fns'
import { ja } from 'date-fns/locale'
import { logger } from './logger'

export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''
    return format(dateObj, 'yyyy-MM-dd', { locale: ja })
  } catch (error) {
    logger.error('Date formatting failed', { date, error })
    return ''
  }
}

export const formatDateDisplay = (date: Date | string | null | undefined): string => {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''
    return format(dateObj, 'M月d日', { locale: ja })
  } catch (error) {
    logger.error('Date display formatting failed', { date, error })
    return ''
  }
}

export const getMonthName = (monthIndex: number): string => {
  const months = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ]
  return months[monthIndex] || ''
}

export const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

export const convertApiResponseDate = (dateValue: any): Date | null => {
  if (!dateValue) return null
  
  try {
    if (dateValue instanceof Date) return dateValue
    if (typeof dateValue === 'string') {
      const parsed = parseISO(dateValue)
      return isValid(parsed) ? parsed : null
    }
    return null
  } catch (error) {
    logger.error('API response date conversion failed', { dateValue, error })
    return null
  }
}