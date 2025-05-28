import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 日付フォーマット関数（エラーハンドリング強化）
export function formatDate(date: Date | string | number, format: string = 'YYYY-MM-DD'): string {
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDate:', date)
      return 'Invalid Date'
    }

    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    const hours = String(dateObj.getHours()).padStart(2, '0')
    const minutes = String(dateObj.getMinutes()).padStart(2, '0')
    const seconds = String(dateObj.getSeconds()).padStart(2, '0')

    return format
      .replace('YYYY', year.toString())
      .replace('YY', year.toString().slice(-2))
      .replace('MM', month)
      .replace('M', (dateObj.getMonth() + 1).toString())
      .replace('DD', day)
      .replace('D', dateObj.getDate().toString())
      .replace('HH', hours)
      .replace('H', dateObj.getHours().toString())
      .replace('mm', minutes)
      .replace('m', dateObj.getMinutes().toString())
      .replace('ss', seconds)
      .replace('s', dateObj.getSeconds().toString())
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Format Error'
  }
}

// 深いオブジェクトのコピー（型安全性向上）
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

// 配列のシャッフル（型安全性向上）
export function shuffleArray<T>(array: readonly T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]
    const tempJ = result[j]
    if (temp !== undefined && tempJ !== undefined) {
      result[i] = tempJ
      result[j] = temp
    }
  }
  return result
}

// 配列から重複を除去（改善版）
export function uniqueArray<T>(array: readonly T[], keyFn?: (item: T) => any): T[] {
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
  if (typeof text !== 'string') {
    console.warn('truncateText: text is not a string:', text)
    return String(text)
  }
  
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - suffix.length) + suffix
}

// 数値のフォーマット（エラーハンドリング強化）
export function formatNumber(
  num: number,
  options: {
    decimals?: number
    thousandsSeparator?: string
    decimalSeparator?: string
  } = {}
): string {
  try {
    if (typeof num !== 'number' || isNaN(num)) {
      console.warn('formatNumber: invalid number provided:', num)
      return '0'
    }

    const {
      decimals = 0,
      thousandsSeparator = ',',
      decimalSeparator = '.'
    } = options

    const fixed = num.toFixed(decimals)
    const parts = fixed.split('.')
    
    const integerPart = parts[0]
    if (integerPart) {
      parts[0] = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator)
    }
    
    return parts.join(decimalSeparator)
  } catch (error) {
    console.error('Error formatting number:', error)
    return '0'
  }
}

// 色の明度を計算（エラーハンドリング強化）
export function getColorBrightness(hexColor: string): number {
  try {
    if (typeof hexColor !== 'string') {
      console.warn('getColorBrightness: invalid color provided:', hexColor)
      return 0
    }

    const hex = hexColor.replace('#', '')
    
    if (hex.length !== 6) {
      console.warn('getColorBrightness: invalid hex color length:', hexColor)
      return 0
    }

    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      console.warn('getColorBrightness: failed to parse color:', hexColor)
      return 0
    }
    
    return (r * 299 + g * 587 + b * 114) / 1000
  } catch (error) {
    console.error('Error calculating color brightness:', error)
    return 0
  }
}

// 色が明るいかどうかを判定
export function isLightColor(hexColor: string): boolean {
  return getColorBrightness(hexColor) > 127.5
}

// デバウンス関数（型安全性向上）
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

// スロットル関数（型安全性向上）
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

// ローカルストレージのヘルパー関数（エラーハンドリング強化）
export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      if (typeof window === 'undefined') {
        console.warn('localStorage not available (SSR)')
        return defaultValue
      }

      const item = localStorage.getItem(key)
      if (item === null) return defaultValue
      
      return JSON.parse(item)
    } catch (error) {
      console.error('Failed to get from localStorage:', error)
      return defaultValue
    }
  },
  
  set<T>(key: string, value: T): boolean {
    try {
      if (typeof window === 'undefined') {
        console.warn('localStorage not available (SSR)')
        return false
      }

      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
      return false
    }
  },
  
  remove(key: string): boolean {
    try {
      if (typeof window === 'undefined') {
        console.warn('localStorage not available (SSR)')
        return false
      }

      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Failed to remove from localStorage:', error)
      return false
    }
  },
  
  clear(): boolean {
    try {
      if (typeof window === 'undefined') {
        console.warn('localStorage not available (SSR)')
        return false
      }

      localStorage.clear()
      return true
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
      return false
    }
  }
}

// URL関連のヘルパー関数（エラーハンドリング強化）
export function buildUrl(base: string, path: string, params?: Record<string, string>): string {
  try {
    const url = new URL(path, base)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }
    
    return url.toString()
  } catch (error) {
    console.error('Error building URL:', error)
    return base
  }
}

// 配列の安全な取得（型安全性向上）
export function safeArrayAccess<T>(array: readonly T[], index: number, defaultValue: T): T {
  if (!Array.isArray(array)) {
    console.warn('safeArrayAccess: provided value is not an array:', array)
    return defaultValue
  }

  if (index < 0 || index >= array.length) {
    return defaultValue
  }

  const value = array[index]
  return value !== undefined ? value : defaultValue
}

// 範囲内の値にクランプ
export function clamp(value: number, min: number, max: number): number {
  if (typeof value !== 'number' || isNaN(value)) {
    console.warn('clamp: invalid value provided:', value)
    return min
  }
  
  return Math.min(Math.max(value, min), max)
}

// パーセンテージの計算（エラーハンドリング強化）
export function calculatePercentage(value: number, total: number): number {
  try {
    if (typeof value !== 'number' || typeof total !== 'number') {
      console.warn('calculatePercentage: invalid arguments:', { value, total })
      return 0
    }

    if (total === 0) return 0
    if (isNaN(value) || isNaN(total)) return 0
    
    return Math.round((value / total) * 100)
  } catch (error) {
    console.error('Error calculating percentage:', error)
    return 0
  }
}

// 型安全なキー取得
export function getKeys<T extends Record<string, any>>(obj: T): (keyof T)[] {
  return Object.keys(obj)
}

// 安全な文字列変換
export function safeString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  
  try {
    return String(value)
  } catch (error) {
    console.error('Error converting to string:', error)
    return ''
  }
}

// 空の値チェック
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

// 安全な JSON パース
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.warn('Failed to parse JSON:', error)
    return defaultValue
  }
}