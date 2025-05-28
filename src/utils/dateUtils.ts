// 2025年の日本の祝日データ（エラーハンドリング強化）
const HOLIDAYS_2025 = [
  new Date(2025, 0, 1),   // 元日
  new Date(2025, 0, 13),  // 成人の日
  new Date(2025, 1, 11),  // 建国記念の日
  new Date(2025, 1, 23),  // 天皇誕生日
  new Date(2025, 2, 20),  // 春分の日
  new Date(2025, 3, 29),  // 昭和の日
  new Date(2025, 4, 3),   // 憲法記念日
  new Date(2025, 4, 4),   // みどりの日
  new Date(2025, 4, 5),   // こどもの日
  new Date(2025, 6, 21),  // 海の日
  new Date(2025, 7, 11),  // 山の日
  new Date(2025, 8, 15),  // 敬老の日
  new Date(2025, 8, 23),  // 秋分の日
  new Date(2025, 9, 13),  // スポーツの日
  new Date(2025, 10, 3),  // 文化の日
  new Date(2025, 10, 23), // 勤労感謝の日
]

export function isHoliday(date: Date | string | number): boolean {
  try {
    const normalizedDate = date instanceof Date ? date : new Date(date)
    
    if (isNaN(normalizedDate.getTime())) {
      console.warn('isHoliday: invalid date provided:', date)
      return false
    }

    return HOLIDAYS_2025.some(holiday => 
      holiday.getFullYear() === normalizedDate.getFullYear() &&
      holiday.getMonth() === normalizedDate.getMonth() &&
      holiday.getDate() === normalizedDate.getDate()
    )
  } catch (error) {
    console.error('Error checking if date is holiday:', error)
    return false
  }
}

export function getDateType(date: Date | string | number): 'weekday' | 'saturday' | 'sunday' | 'holiday' {
  try {
    const normalizedDate = date instanceof Date ? date : new Date(date)
    
    if (isNaN(normalizedDate.getTime())) {
      console.warn('getDateType: invalid date provided:', date)
      return 'weekday'
    }

    if (isHoliday(normalizedDate)) return 'holiday'
    
    const dayOfWeek = normalizedDate.getDay()
    if (dayOfWeek === 0) return 'sunday'
    if (dayOfWeek === 6) return 'saturday'
    return 'weekday'
  } catch (error) {
    console.error('Error getting date type:', error)
    return 'weekday'
  }
}

export function getMonthName(date: Date | string | number): string {
  try {
    const normalizedDate = date instanceof Date ? date : new Date(date)
    
    if (isNaN(normalizedDate.getTime())) {
      console.warn('getMonthName: invalid date provided:', date)
      return '不明'
    }

    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const monthIndex = normalizedDate.getMonth()
    
    if (monthIndex < 0 || monthIndex >= months.length) {
      console.warn('getMonthName: invalid month index:', monthIndex)
      return '不明'
    }
    
    return months[monthIndex] || '不明'
  } catch (error) {
    console.error('Error getting month name:', error)
    return '不明'
  }
}

export function formatDate(date: Date | string | number, format: 'short' | 'long' = 'short'): string {
  try {
    const normalizedDate = date instanceof Date ? date : new Date(date)
    
    if (isNaN(normalizedDate.getTime())) {
      console.warn('formatDate: invalid date provided:', date)
      return '無効な日付'
    }

    if (format === 'long') {
      return `${normalizedDate.getFullYear()}年${normalizedDate.getMonth() + 1}月${normalizedDate.getDate()}日`
    }
    return `${normalizedDate.getMonth() + 1}/${normalizedDate.getDate()}`
  } catch (error) {
    console.error('Error formatting date:', error)
    return '無効な日付'
  }
}

export function addDays(date: Date | string | number, days: number): Date {
  try {
    const normalizedDate = date instanceof Date ? new Date(date) : new Date(date)
    
    if (isNaN(normalizedDate.getTime())) {
      console.warn('addDays: invalid date provided:', date)
      return new Date()
    }

    if (typeof days !== 'number' || isNaN(days)) {
      console.warn('addDays: invalid days provided:', days)
      return normalizedDate
    }

    normalizedDate.setDate(normalizedDate.getDate() + days)
    return normalizedDate
  } catch (error) {
    console.error('Error adding days to date:', error)
    return new Date()
  }
}

export function addWeeks(date: Date | string | number, weeks: number): Date {
  try {
    if (typeof weeks !== 'number' || isNaN(weeks)) {
      console.warn('addWeeks: invalid weeks provided:', weeks)
      return date instanceof Date ? new Date(date) : new Date(date)
    }

    return addDays(date, weeks * 7)
  } catch (error) {
    console.error('Error adding weeks to date:', error)
    return new Date()
  }
}

export function getWeekStart(date: Date | string | number): Date {
  try {
    const normalizedDate = date instanceof Date ? new Date(date) : new Date(date)
    
    if (isNaN(normalizedDate.getTime())) {
      console.warn('getWeekStart: invalid date provided:', date)
      return new Date()
    }

    const day = normalizedDate.getDay()
    const diff = normalizedDate.getDate() - day + (day === 0 ? -6 : 1) // 月曜日を週の開始とする
    
    const weekStart = new Date(normalizedDate)
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0) // 時刻を00:00:00にリセット
    
    return weekStart
  } catch (error) {
    console.error('Error getting week start:', error)
    return new Date()
  }
}

export function getWeekEnd(date: Date | string | number): Date {
  try {
    const weekStart = getWeekStart(date)
    return addDays(weekStart, 6)
  } catch (error) {
    console.error('Error getting week end:', error)
    return new Date()
  }
}

export function isSameDay(date1: Date | string | number, date2: Date | string | number): boolean {
  try {
    const normalizedDate1 = date1 instanceof Date ? date1 : new Date(date1)
    const normalizedDate2 = date2 instanceof Date ? date2 : new Date(date2)
    
    if (isNaN(normalizedDate1.getTime()) || isNaN(normalizedDate2.getTime())) {
      console.warn('isSameDay: invalid dates provided:', { date1, date2 })
      return false
    }

    return (
      normalizedDate1.getFullYear() === normalizedDate2.getFullYear() &&
      normalizedDate1.getMonth() === normalizedDate2.getMonth() &&
      normalizedDate1.getDate() === normalizedDate2.getDate()
    )
  } catch (error) {
    console.error('Error comparing dates:', error)
    return false
  }
}

export function isToday(date: Date | string | number): boolean {
  try {
    return isSameDay(date, new Date())
  } catch (error) {
    console.error('Error checking if date is today:', error)
    return false
  }
}

// 日付の妥当性チェック
export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime())
}

// 安全な日付変換
export function safeDate(date: Date | string | number): Date {
  try {
    const result = date instanceof Date ? date : new Date(date)
    return isValidDate(result) ? result : new Date()
  } catch (error) {
    console.error('Error creating safe date:', error)
    return new Date()
  }
}

// 月の開始日を取得
export function getMonthStart(date: Date | string | number): Date {
  try {
    const normalizedDate = safeDate(date)
    const monthStart = new Date(normalizedDate.getFullYear(), normalizedDate.getMonth(), 1)
    monthStart.setHours(0, 0, 0, 0)
    return monthStart
  } catch (error) {
    console.error('Error getting month start:', error)
    return new Date()
  }
}

// 月の終了日を取得
export function getMonthEnd(date: Date | string | number): Date {
  try {
    const normalizedDate = safeDate(date)
    const monthEnd = new Date(normalizedDate.getFullYear(), normalizedDate.getMonth() + 1, 0)
    monthEnd.setHours(23, 59, 59, 999)
    return monthEnd
  } catch (error) {
    console.error('Error getting month end:', error)
    return new Date()
  }
}

// 日付の差分を計算（日数）
export function getDaysDifference(date1: Date | string | number, date2: Date | string | number): number {
  try {
    const normalizedDate1 = safeDate(date1)
    const normalizedDate2 = safeDate(date2)
    
    const timeDiff = normalizedDate2.getTime() - normalizedDate1.getTime()
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
  } catch (error) {
    console.error('Error calculating days difference:', error)
    return 0
  }
}

// 営業日のチェック
export function isWorkingDay(date: Date | string | number): boolean {
  try {
    const dateType = getDateType(date)
    return dateType === 'weekday'
  } catch (error) {
    console.error('Error checking if working day:', error)
    return false
  }
}

// 次の営業日を取得
export function getNextWorkingDay(date: Date | string | number): Date {
  try {
    let nextDay = addDays(date, 1)
    
    // 最大7日まで検索（無限ループ防止）
    for (let i = 0; i < 7; i++) {
      if (isWorkingDay(nextDay)) {
        return nextDay
      }
      nextDay = addDays(nextDay, 1)
    }
    
    // 営業日が見つからない場合は元の日付を返す
    return safeDate(date)
  } catch (error) {
    console.error('Error getting next working day:', error)
    return new Date()
  }
}