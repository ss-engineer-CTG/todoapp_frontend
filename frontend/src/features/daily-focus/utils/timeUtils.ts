// 時間管理ユーティリティ関数

export const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export const formatDuration = (milliseconds: number): string => {
  const totalMinutes = Math.floor(milliseconds / (1000 * 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  if (hours > 0) {
    return `${hours}時間 ${minutes}分`
  } else {
    return `${minutes}分`
  }
}

export const formatHours = (milliseconds: number): string => {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60))
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}時間 ${minutes}分`
  } else {
    return `${minutes}分`
  }
}

export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0] || ''
}

export const formatDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayNames = ['日', '月', '火', '水', '木', '金', '土']
  const dayName = dayNames[date.getDay()]
  
  return `${year}年${month}月${day}日 (${dayName})`
}

export const isToday = (date: Date): boolean => {
  const today = new Date()
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear()
}

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear()
}

export const getWeekStart = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

export const getWeekEnd = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + 6
  return new Date(d.setDate(diff))
}

export const getMonthStart = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export const getMonthEnd = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export const generateDateRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

export const generateLast365Days = (): Date[] => {
  const today = new Date()
  const dates: Date[] = []
  
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date)
  }
  
  return dates
}

export const calculateSessionTime = (
  startTime: Date,
  endTime: Date | null,
  pausedTime: number
): number => {
  if (!endTime) {
    return Date.now() - startTime.getTime() - pausedTime
  }
  return endTime.getTime() - startTime.getTime() - pausedTime
}

export const calculateTotalTimeToday = (sessions: Array<{
  startTime: Date
  endTime?: Date
  pausedTime: number
  totalTime: number
}>): number => {
  const today = getTodayDateString()
  
  return sessions
    .filter(session => {
      const sessionDate = new Date(session.startTime).toISOString().split('T')[0] || ''
      return sessionDate === today
    })
    .reduce((total, session) => total + session.totalTime, 0)
}

export const calculateCategoryTimes = (sessions: Array<{
  startTime: Date
  endTime?: Date
  pausedTime: number
  totalTime: number
  category?: string
}>): Record<string, number> => {
  const today = getTodayDateString()
  const categoryTimes: Record<string, number> = {}
  
  sessions
    .filter(session => {
      const sessionDate = new Date(session.startTime).toISOString().split('T')[0] || ''
      return sessionDate === today
    })
    .forEach(session => {
      const categoryKey = session.category || 'other'
      if (!categoryTimes[categoryKey]) {
        categoryTimes[categoryKey] = 0
      }
      categoryTimes[categoryKey] += session.totalTime
    })
  
  return categoryTimes
}

export const calculateTagTimes = (sessions: Array<{
  startTime: Date
  endTime?: Date
  pausedTime: number
  totalTime: number
  tagIds?: string[]
}>): Record<string, number> => {
  const today = getTodayDateString()
  const tagTimes: Record<string, number> = {}
  
  sessions
    .filter(session => {
      const sessionDate = new Date(session.startTime).toISOString().split('T')[0] || ''
      return sessionDate === today
    })
    .forEach(session => {
      if (session.tagIds && session.tagIds.length > 0) {
        session.tagIds.forEach(tagId => {
          if (!tagTimes[tagId]) {
            tagTimes[tagId] = 0
          }
          // セッション時間を関連するタグ数で等分
          tagTimes[tagId] += session.totalTime / session.tagIds!.length
        })
      } else {
        // タグが設定されていないセッションは 'untagged' として分類
        if (!tagTimes['untagged']) {
          tagTimes['untagged'] = 0
        }
        tagTimes['untagged'] += session.totalTime
      }
    })
  
  return tagTimes
}

// タイマー関連のユーティリティ
export const createTimer = (
  callback: () => void,
  interval: number = 1000
): (() => void) => {
  const timer = setInterval(callback, interval)
  return () => clearInterval(timer)
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let lastCallTime = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCallTime >= delay) {
      lastCallTime = now
      func(...args)
    }
  }
}

// PCロック検知用の関数
export const createVisibilityHandler = (
  onVisible: () => void,
  onHidden: () => void
): (() => void) => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      onHidden()
    } else {
      onVisible()
    }
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}

// ヒートマップ用のユーティリティ
export const getHeatmapIntensity = (hours: number): number => {
  if (hours === 0) return 0
  if (hours <= 1) return 1
  if (hours <= 2) return 2
  if (hours <= 3) return 3
  if (hours <= 4) return 4
  if (hours <= 5) return 5
  return 6
}

export const getHeatmapColor = (intensity: number, theme: 'light' | 'dark'): string => {
  const lightColors = [
    'bg-gray-100',
    'bg-green-100',
    'bg-green-200',
    'bg-green-300',
    'bg-green-400',
    'bg-green-500',
    'bg-green-600'
  ]
  
  const darkColors = [
    'bg-gray-600',
    'bg-green-900/30',
    'bg-green-800/50',
    'bg-green-700/70',
    'bg-green-600',
    'bg-green-500',
    'bg-green-400'
  ]
  
  const colors = theme === 'dark' ? darkColors : lightColors
  const index = Math.min(intensity, colors.length - 1)
  return colors[index] || 'bg-gray-100'
}

// 統計計算のユーティリティ
export const calculateStreak = (dailyStats: Array<{ date: string; totalTime: number }>): number => {
  if (dailyStats.length === 0) return 0
  
  const sortedStats = dailyStats
    .filter(stat => stat.totalTime > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
  
  let streak = 0
  const today = getTodayDateString()
  const currentDate = new Date(today)
  
  for (const stat of sortedStats) {
    const statDate = stat.date
    const expectedDate = currentDate.toISOString().split('T')[0]
    
    if (statDate === expectedDate) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }
  
  return streak
}

export const calculateWeeklyAverage = (dailyStats: Array<{ date: string; totalTime: number }>): number => {
  if (dailyStats.length === 0) return 0
  
  const last7Days = dailyStats.slice(-7)
  const totalTime = last7Days.reduce((sum, stat) => sum + stat.totalTime, 0)
  
  return totalTime / 7
}

export const calculateMonthlyTotal = (dailyStats: Array<{ date: string; totalTime: number }>): number => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  return dailyStats
    .filter(stat => {
      const statDate = new Date(stat.date)
      return statDate.getMonth() === currentMonth && statDate.getFullYear() === currentYear
    })
    .reduce((sum, stat) => sum + stat.totalTime, 0)
}