import { format, isAfter, isBefore, addDays, startOfWeek, endOfWeek } from "date-fns"
import { ja } from "date-fns/locale"

// 日付フォーマット関数
export const formatDate = (date: Date, pattern = "yyyy/MM/dd"): string => {
  return format(date, pattern, { locale: ja })
}

export const formatDateJapanese = (date: Date): string => {
  return format(date, "yyyy年M月d日", { locale: ja })
}

export const formatDateShort = (date: Date): string => {
  return format(date, "M/d", { locale: ja })
}

// 日付比較関数
export const isOverdue = (dueDate: Date): boolean => {
  const today = new Date()
  today.setHours(23, 59, 59, 999) // 今日の終了時刻
  return isBefore(dueDate, today)
}

export const isDueToday = (dueDate: Date): boolean => {
  const today = new Date()
  return (
    dueDate.getFullYear() === today.getFullYear() &&
    dueDate.getMonth() === today.getMonth() &&
    dueDate.getDate() === today.getDate()
  )
}

export const isDueSoon = (dueDate: Date, days = 3): boolean => {
  const targetDate = addDays(new Date(), days)
  return isBefore(dueDate, targetDate) && !isOverdue(dueDate)
}

// 期間計算関数
export const getDaysBetween = (startDate: Date, endDate: Date): number => {
  const timeDiff = endDate.getTime() - startDate.getTime()
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}

export const getWorkingDaysBetween = (startDate: Date, endDate: Date): number => {
  let workingDays = 0
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 日曜日(0)と土曜日(6)以外
      workingDays++
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return workingDays
}

// 週の開始・終了日取得
export const getWeekStart = (date: Date): Date => {
  return startOfWeek(date, { weekStartsOn: 1 }) // 月曜日開始
}

export const getWeekEnd = (date: Date): Date => {
  return endOfWeek(date, { weekStartsOn: 1 }) // 月曜日開始
}

// 月の開始・終了日取得
export const getMonthStart = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export const getMonthEnd = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

// 相対日付取得
export const getRelativeDateString = (date: Date): string => {
  const today = new Date()
  const diffDays = getDaysBetween(today, date)
  
  if (diffDays === 0) return "今日"
  if (diffDays === 1) return "明日"
  if (diffDays === -1) return "昨日"
  if (diffDays > 0 && diffDays <= 7) return `${diffDays}日後`
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)}日前`
  
  return formatDate(date, "M/d")
}

// 日付の妥当性チェック
export const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime())
}

// 日付範囲のチェック
export const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  return !isBefore(date, startDate) && !isAfter(date, endDate)
}

// 時間を含む日付の作成
export const createDateWithTime = (date: Date, hours: number, minutes = 0): Date => {
  const newDate = new Date(date)
  newDate.setHours(hours, minutes, 0, 0)
  return newDate
}

// 営業日かどうかの判定
export const isWorkingDay = (date: Date): boolean => {
  const dayOfWeek = date.getDay()
  return dayOfWeek !== 0 && dayOfWeek !== 6 // 日曜日と土曜日以外
}

// 次の営業日を取得
export const getNextWorkingDay = (date: Date): Date => {
  const nextDay = addDays(date, 1)
  return isWorkingDay(nextDay) ? nextDay : getNextWorkingDay(nextDay)
}

// 日付配列の生成
export const generateDateRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = []
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dates
}