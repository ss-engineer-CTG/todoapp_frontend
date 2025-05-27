// 2025年の日本の祝日データ
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
  
  export function isHoliday(date: Date): boolean {
    return HOLIDAYS_2025.some(holiday => 
      holiday.getFullYear() === date.getFullYear() &&
      holiday.getMonth() === date.getMonth() &&
      holiday.getDate() === date.getDate()
    )
  }
  
  export function getDateType(date: Date): 'weekday' | 'saturday' | 'sunday' | 'holiday' {
    if (isHoliday(date)) return 'holiday'
    if (date.getDay() === 0) return 'sunday'
    if (date.getDay() === 6) return 'saturday'
    return 'weekday'
  }
  
  export function getMonthName(date: Date): string {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    return months[date.getMonth()]
  }
  
  export function formatDate(date: Date, format: 'short' | 'long' = 'short'): string {
    if (format === 'long') {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    }
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
  
  export function addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }
  
  export function addWeeks(date: Date, weeks: number): Date {
    return addDays(date, weeks * 7)
  }
  
  export function getWeekStart(date: Date): Date {
    const result = new Date(date)
    const day = result.getDay()
    const diff = result.getDate() - day + (day === 0 ? -6 : 1) // 月曜日を週の開始とする
    result.setDate(diff)
    return result
  }
  
  export function getWeekEnd(date: Date): Date {
    const weekStart = getWeekStart(date)
    return addDays(weekStart, 6)
  }
  
  export function isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }
  
  export function isToday(date: Date): boolean {
    return isSameDay(date, new Date())
  }