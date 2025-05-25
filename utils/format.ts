import { format, formatDistanceToNow, isToday, isYesterday, isTomorrow } from "date-fns"
import { ja } from "date-fns/locale"

// 日付フォーマット関数
export const formatDate = (date: Date, pattern = "yyyy/MM/dd"): string => {
  return format(date, pattern, { locale: ja })
}

export const formatDateTime = (date: Date): string => {
  return format(date, "yyyy/MM/dd HH:mm", { locale: ja })
}

export const formatTime = (date: Date): string => {
  return format(date, "HH:mm", { locale: ja })
}

// 相対日付フォーマット
export const formatRelativeDate = (date: Date): string => {
  if (isToday(date)) return "今日"
  if (isYesterday(date)) return "昨日"
  if (isTomorrow(date)) return "明日"
  
  return formatDistanceToNow(date, { 
    addSuffix: true, 
    locale: ja 
  })
}

// 短縮日付フォーマット
export const formatDateShort = (date: Date): string => {
  if (isToday(date)) return "今日"
  if (isYesterday(date)) return "昨日"
  if (isTomorrow(date)) return "明日"
  
  const now = new Date()
  if (date.getFullYear() === now.getFullYear()) {
    return format(date, "M/d", { locale: ja })
  }
  
  return format(date, "yyyy/M/d", { locale: ja })
}

// 数値フォーマット関数
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ja-JP').format(num)
}

export const formatPercent = (num: number, decimals = 0): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num / 100)
}

export const formatCurrency = (amount: number, currency = 'JPY'): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

// ファイルサイズフォーマット
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  
  return `${size.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
}

// 期間フォーマット
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}日`
  if (hours > 0) return `${hours}時間`
  if (minutes > 0) return `${minutes}分`
  return `${seconds}秒`
}

// テキストフォーマット関数
export const truncateText = (text: string, maxLength: number, suffix = '...'): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}

export const capitalizeFirst = (text: string): string => {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export const camelToKebab = (text: string): string => {
  return text.replace(/([A-Z])/g, '-$1').toLowerCase()
}

export const kebabToCamel = (text: string): string => {
  return text.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
}

// URLフォーマット
export const formatURL = (url: string): string => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`
  }
  return url
}

// 電話番号フォーマット
export const formatPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, '')
  
  if (cleaned.length === 11) {
    // 090-1234-5678 形式
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  } else if (cleaned.length === 10) {
    // 03-1234-5678 形式
    return cleaned.replace(/(\d{2,4})(\d{4})(\d{4})/, '$1-$2-$3')
  }
  
  return phoneNumber
}

// 郵便番号フォーマット
export const formatPostalCode = (postalCode: string): string => {
  const cleaned = postalCode.replace(/\D/g, '')
  
  if (cleaned.length === 7) {
    return cleaned.replace(/(\d{3})(\d{4})/, '$1-$2')
  }
  
  return postalCode
}

// 配列を文字列にフォーマット
export const formatArray = (
  array: string[], 
  separator = '、', 
  lastSeparator = '、'
): string => {
  if (array.length === 0) return ''
  if (array.length === 1) return array[0]
  if (array.length === 2) return array.join(lastSeparator)
  
  return array.slice(0, -1).join(separator) + lastSeparator + array[array.length - 1]
}

// HTMLエスケープ
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// マークダウンの簡単なフォーマット
export const formatMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

// 色のフォーマット
export const formatColor = (color: string): string => {
  // HEXコードを正規化
  if (color.startsWith('#')) {
    return color.toUpperCase()
  }
  
  // RGB/RGBa値をHEXに変換
  if (color.startsWith('rgb')) {
    const values = color.match(/\d+/g)
    if (values && values.length >= 3) {
      const hex = values.slice(0, 3)
        .map(v => parseInt(v).toString(16).padStart(2, '0'))
        .join('')
      return `#${hex.toUpperCase()}`
    }
  }
  
  return color
}

// CSVエスケープ
export const escapeCSV = (text: string): string => {
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

// 検索ハイライト
export const highlightSearch = (text: string, query: string): string => {
  if (!query.trim()) return text
  
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  
  return text.replace(regex, '<mark>$1</mark>')
}