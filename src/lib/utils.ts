import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 日付フォーマット関数
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year.toString())
    .replace('YY', year.toString().slice(-2))
    .replace('MM', month)
    .replace('M', (date.getMonth() + 1).toString())
    .replace('DD', day)
    .replace('D', date.getDate().toString())
    .replace('HH', hours)
    .replace('H', date.getHours().toString())
    .replace('mm', minutes)
    .replace('m', date.getMinutes().toString())
    .replace('ss', seconds)
    .replace('s', date.getSeconds().toString())
}

// 深いオブジェクトのコピー
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T
  if (typeof obj === 'object') {
    const copy = {} as { [key: string]: any }
    Object.keys(obj).forEach(key => {
      copy[key] = deepClone((obj as { [key: string]: any })[key])
    })
    return copy as T
  }
  return obj
}

// 配列のシャッフル
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// 配列から重複を除去
export function uniqueArray<T>(array: T[], keyFn?: (item: T) => any): T[] {
  if (!keyFn) {
    return [...new Set(array)]
  }
  
  const seen = new Set()
  return array.filter(item => {
    const key = keyFn(item)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

// オブジェクトの差分を取得
export function getObjectDiff<T extends Record<string, any>>(
  oldObj: T,
  newObj: T
): Partial<T> {
  const diff: Partial<T> = {}
  
  Object.keys(newObj).forEach(key => {
    if (oldObj[key] !== newObj[key]) {
      diff[key as keyof T] = newObj[key]
    }
  })
  
  return diff
}

// 文字列の省略
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - suffix.length) + suffix
}

// 数値のフォーマット
export function formatNumber(
  num: number,
  options: {
    decimals?: number
    thousandsSeparator?: string
    decimalSeparator?: string
  } = {}
): string {
  const {
    decimals = 0,
    thousandsSeparator = ',',
    decimalSeparator = '.'
  } = options

  const fixed = num.toFixed(decimals)
  const parts = fixed.split('.')
  
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator)
  
  return parts.join(decimalSeparator)
}

// 色の明度を計算
export function getColorBrightness(hexColor: string): number {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  return (r * 299 + g * 587 + b * 114) / 1000
}

// 色が明るいかどうかを判定
export function isLightColor(hexColor: string): boolean {
  return getColorBrightness(hexColor) > 127.5
}

// デバウンス関数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// スロットル関数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastTime >= wait) {
      lastTime = now
      func(...args)
    }
  }
}

// ローカルストレージのヘルパー関数
export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  },
  
  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to remove from localStorage:', error)
    }
  },
  
  clear(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  }
}

// URL関連のヘルパー関数
export function buildUrl(base: string, path: string, params?: Record<string, string>): string {
  const url = new URL(path, base)
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }
  
  return url.toString()
}

// 配列の安全な取得
export function safeArrayAccess<T>(array: T[], index: number, defaultValue: T): T {
  return array[index] !== undefined ? array[index] : defaultValue
}

// 範囲内の値にクランプ
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// パーセンテージの計算
export function calculatePercentage(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((value / total) * 100)
}