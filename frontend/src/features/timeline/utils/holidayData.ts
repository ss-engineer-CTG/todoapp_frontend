// システムプロンプト準拠：祝日データ管理（2025年日本祝日）
// KISS原則：シンプルなデータ構造、DRY原則：一元管理

export interface Holiday {
  date: Date
  name: string
  type: 'national' | 'substitute'
}

// 2025年日本の祝日データ
export const holidays2025: Holiday[] = [
  { date: new Date(2025, 0, 1), name: '元日', type: 'national' },
  { date: new Date(2025, 0, 13), name: '成人の日', type: 'national' },
  { date: new Date(2025, 1, 11), name: '建国記念の日', type: 'national' },
  { date: new Date(2025, 1, 23), name: '天皇誕生日', type: 'national' },
  { date: new Date(2025, 2, 20), name: '春分の日', type: 'national' },
  { date: new Date(2025, 3, 29), name: '昭和の日', type: 'national' },
  { date: new Date(2025, 4, 3), name: '憲法記念日', type: 'national' },
  { date: new Date(2025, 4, 4), name: 'みどりの日', type: 'national' },
  { date: new Date(2025, 4, 5), name: 'こどもの日', type: 'national' },
  { date: new Date(2025, 6, 21), name: '海の日', type: 'national' },
  { date: new Date(2025, 7, 11), name: '山の日', type: 'national' },
  { date: new Date(2025, 8, 15), name: '敬老の日', type: 'national' },
  { date: new Date(2025, 8, 23), name: '秋分の日', type: 'national' },
  { date: new Date(2025, 9, 13), name: 'スポーツの日', type: 'national' },
  { date: new Date(2025, 10, 3), name: '文化の日', type: 'national' },
  { date: new Date(2025, 10, 23), name: '勤労感謝の日', type: 'national' }
]

// 祝日判定関数
export const isHoliday = (date: Date): boolean => {
  return holidays2025.some(holiday => 
    holiday.date.getFullYear() === date.getFullYear() &&
    holiday.date.getMonth() === date.getMonth() &&
    holiday.date.getDate() === date.getDate()
  )
}

// 土日祝日判定関数
export type DateType = 'weekday' | 'saturday' | 'sunday' | 'holiday'

export const getDateType = (date: Date): DateType => {
  if (isHoliday(date)) return 'holiday'
  if (date.getDay() === 0) return 'sunday'
  if (date.getDay() === 6) return 'saturday'
  return 'weekday'
}

// 週番号計算（日付計算エラー修正）
export const getWeekNumber = (date: Date): number => {
  const mondayOfWeek = new Date(date)
  const daysSinceMonday = (date.getDay() + 6) % 7
  mondayOfWeek.setDate(date.getDate() - daysSinceMonday)
  
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  return Math.ceil((mondayOfWeek.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
}