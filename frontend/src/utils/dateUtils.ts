import { format, parseISO, isValid } from 'date-fns'
import { ja } from 'date-fns/locale'

export const formatDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    
    if (!isValid(dateObj)) {
      return '無効な日付'
    }
    
    return format(dateObj, 'yyyy年M月d日', { locale: ja })
  } catch (error) {
    console.error('日付フォーマットエラー:', error)
    return '無効な日付'
  }
}

export const formatDateTime = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    
    if (!isValid(dateObj)) {
      return '無効な日付'
    }
    
    return format(dateObj, 'yyyy年M月d日 H:mm', { locale: ja })
  } catch (error) {
    console.error('日時フォーマットエラー:', error)
    return '無効な日付'
  }
}

export const isDatePast = (date: Date | string): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    const now = new Date()
    
    if (!isValid(dateObj)) {
      return false
    }
    
    return dateObj < now
  } catch (error) {
    console.error('日付比較エラー:', error)
    return false
  }
}

export const getDaysDifference = (date1: Date | string, date2: Date | string): number => {
  try {
    const dateObj1 = typeof date1 === 'string' ? parseISO(date1) : date1
    const dateObj2 = typeof date2 === 'string' ? parseISO(date2) : date2
    
    if (!isValid(dateObj1) || !isValid(dateObj2)) {
      return 0
    }
    
    const diffTime = Math.abs(dateObj2.getTime() - dateObj1.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  } catch (error) {
    console.error('日付差分計算エラー:', error)
    return 0
  }
}

export const addDays = (date: Date | string, days: number): Date => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
    
    if (!isValid(dateObj)) {
      return new Date()
    }
    
    const result = new Date(dateObj)
    result.setDate(result.getDate() + days)
    
    return result
  } catch (error) {
    console.error('日付加算エラー:', error)
    return new Date()
  }
}