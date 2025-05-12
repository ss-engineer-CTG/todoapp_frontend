// 日付操作のためのユーティリティ関数

// 日付文字列をDate型に変換
export function parseDate(dateString: string): Date {
    return new Date(dateString)
  }
  
  // 日付を指定されたフォーマット（YYYY-MM-DD）に変換
  export function formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // 今日の日付を取得
  export function getToday(): string {
    return formatDate(new Date())
  }
  
  // 指定された日付に日数を加算
  export function addDays(dateString: string, days: number): string {
    const date = parseDate(dateString)
    date.setDate(date.getDate() + days)
    return formatDate(date)
  }
  
  // 二つの日付の間の日数を計算
  export function daysBetween(startDate: string, endDate: string): number {
    const start = parseDate(startDate)
    const end = parseDate(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  
  // 日付が有効かチェック
  export function isValidDate(dateString: string): boolean {
    const date = parseDate(dateString)
    return !isNaN(date.getTime())
  }
  
  // 日付が別の日付より後か
  export function isAfter(date: string, compareDate: string): boolean {
    return parseDate(date) > parseDate(compareDate)
  }
  
  // 日付が別の日付より前か
  export function isBefore(date: string, compareDate: string): boolean {
    return parseDate(date) < parseDate(compareDate)
  }
  
  // 日付が期間内にあるか
  export function isWithinRange(date: string, startDate: string, endDate: string): boolean {
    const checkDate = parseDate(date)
    return checkDate >= parseDate(startDate) && checkDate <= parseDate(endDate)
  }