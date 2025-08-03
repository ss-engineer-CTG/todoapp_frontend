// Daily Focus View ローカルストレージ管理

import { 
  LearningSession, 
  DailyStats, 
  LearningHeatmapData
} from '../types'

// ローカルストレージのキー定義
const STORAGE_KEYS = {
  LEARNING_SESSIONS: 'daily-focus-sessions',
  DAILY_STATS: 'daily-focus-daily-stats',
  LEARNING_MEMO: 'daily-focus-learning-memo',
  PANEL_DIMENSIONS: 'daily-focus-panel-dimensions',
  CURRENT_SESSION: 'daily-focus-current-session'
} as const

// ユーティリティ関数
const safeJSONParse = <T>(item: string | null, defaultValue: T): T => {
  if (!item) return defaultValue
  try {
    // 日付文字列をDateオブジェクトに変換
    return JSON.parse(item, (key, value) => {
      if (key.endsWith('At') || key.endsWith('Time')) {
        return value ? new Date(value) : value
      }
      return value
    })
  } catch (error) {
    console.error('JSON parse error:', error)
    return defaultValue
  }
}

const safeJSONStringify = (value: any): string => {
  try {
    return JSON.stringify(value, null, 2)
  } catch (error) {
    console.error('JSON stringify error:', error)
    return '{}'
  }
}


// 学習セッション管理
export const sessionStorage = {
  getAll: (): LearningSession[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.LEARNING_SESSIONS)
    return safeJSONParse(stored, [])
  },

  save: (sessions: LearningSession[]): void => {
    localStorage.setItem(STORAGE_KEYS.LEARNING_SESSIONS, safeJSONStringify(sessions))
  },

  add: (session: LearningSession): LearningSession[] => {
    const sessions = sessionStorage.getAll()
    const newSessions = [...sessions, session]
    sessionStorage.save(newSessions)
    return newSessions
  },

  update: (sessionId: string, updates: Partial<LearningSession>): LearningSession[] => {
    const sessions = sessionStorage.getAll()
    const updatedSessions = sessions.map(session => 
      session.id === sessionId 
        ? { ...session, ...updates }
        : session
    )
    sessionStorage.save(updatedSessions)
    return updatedSessions
  },

  getCurrentSession: (): LearningSession | null => {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION)
    return safeJSONParse(stored, null)
  },

  setCurrentSession: (session: LearningSession | null): void => {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, safeJSONStringify(session))
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION)
    }
  },

  getTodaySessions: (): LearningSession[] => {
    const sessions = sessionStorage.getAll()
    const today = new Date().toISOString().split('T')[0]
    return sessions.filter(session => {
      const sessionDate = new Date(session.startTime).toISOString().split('T')[0]
      return sessionDate === today
    })
  }
}

// 日次統計管理
export const statsStorage = {
  getAll: (): DailyStats[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.DAILY_STATS)
    return safeJSONParse(stored, [])
  },

  save: (stats: DailyStats[]): void => {
    localStorage.setItem(STORAGE_KEYS.DAILY_STATS, safeJSONStringify(stats))
  },

  getByDate: (date: string): DailyStats | null => {
    const stats = statsStorage.getAll()
    return stats.find(stat => stat.date === date) || null
  },

  updateOrCreate: (date: string, updates: Partial<DailyStats>): DailyStats => {
    const stats = statsStorage.getAll()
    const existingIndex = stats.findIndex(stat => stat.date === date)
    
    if (existingIndex >= 0 && stats[existingIndex]) {
      // 既存の統計を更新
      const existingStat = stats[existingIndex]
      stats[existingIndex] = {
        date: existingStat.date,
        totalTime: updates.totalTime ?? existingStat.totalTime,
        categoryTimes: updates.categoryTimes ?? existingStat.categoryTimes,
        completedTodos: updates.completedTodos ?? existingStat.completedTodos,
        totalTodos: updates.totalTodos ?? existingStat.totalTodos,
        sessionsCount: updates.sessionsCount ?? existingStat.sessionsCount,
        notes: updates.notes ?? existingStat.notes
      }
    } else {
      // 新しい統計を作成
      const newStat: DailyStats = {
        date,
        totalTime: updates.totalTime ?? 0,
        categoryTimes: updates.categoryTimes ?? {},
        completedTodos: updates.completedTodos ?? 0,
        totalTodos: updates.totalTodos ?? 0,
        sessionsCount: updates.sessionsCount ?? 0,
        notes: updates.notes
      }
      stats.push(newStat)
    }
    
    statsStorage.save(stats)
    return stats.find(stat => stat.date === date)!
  },

  getLast365Days: (): DailyStats[] => {
    const stats = statsStorage.getAll()
    const today = new Date()
    const oneYearAgo = new Date(today)
    oneYearAgo.setFullYear(today.getFullYear() - 1)
    
    return stats.filter(stat => {
      const statDate = new Date(stat.date)
      return statDate >= oneYearAgo && statDate <= today
    }).sort((a, b) => a.date.localeCompare(b.date))
  }
}

// 学習メモ管理
export const memoStorage = {
  get: (): string => {
    return localStorage.getItem(STORAGE_KEYS.LEARNING_MEMO) || ''
  },

  save: (memo: string): void => {
    localStorage.setItem(STORAGE_KEYS.LEARNING_MEMO, memo)
  },

  clear: (): void => {
    localStorage.removeItem(STORAGE_KEYS.LEARNING_MEMO)
  }
}

// パネル寸法管理
export const panelStorage = {
  get: (): { leftWidth: number; centerWidth: number; rightWidth: number } => {
    const stored = localStorage.getItem(STORAGE_KEYS.PANEL_DIMENSIONS)
    return safeJSONParse(stored, { leftWidth: 25, centerWidth: 50, rightWidth: 25 })
  },

  save: (dimensions: { leftWidth: number; centerWidth: number; rightWidth: number }): void => {
    localStorage.setItem(STORAGE_KEYS.PANEL_DIMENSIONS, safeJSONStringify(dimensions))
  }
}

// ヒートマップデータ生成
export const generateHeatmapData = (stats: DailyStats[]): LearningHeatmapData[] => {
  const heatmapData: LearningHeatmapData[] = []
  const today = new Date()
  
  // 過去365日のデータを生成
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0] || ''
    
    const stat = stats.find(s => s.date === dateStr)
    const hours = stat ? Math.floor(stat.totalTime / (1000 * 60 * 60)) : 0
    
    heatmapData.push({
      date: dateStr,
      hours,
      intensity: Math.min(6, Math.floor(hours / 1)),
      sessions: stat?.sessionsCount || 0,
      categories: stat?.categoryTimes ? Object.keys(stat.categoryTimes).filter(cat => {
        return stat?.categoryTimes?.[cat] && stat.categoryTimes[cat] > 0
      }) : []
    })
  }
  
  return heatmapData
}

// データ初期化
export const initializeStorage = (): void => {
  console.log('initializeStorage: Starting initialization...')
  
  if (!localStorage.getItem(STORAGE_KEYS.LEARNING_SESSIONS)) {
    console.log('initializeStorage: Initializing sessions')
    sessionStorage.save([])
  } else {
    console.log('initializeStorage: Sessions already exist')
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.DAILY_STATS)) {
    console.log('initializeStorage: Initializing stats')
    statsStorage.save([])
  } else {
    console.log('initializeStorage: Stats already exist')
  }
  
  console.log('initializeStorage: Initialization complete')
}


// データクリア（デバッグ用）
export const clearAllStorage = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}