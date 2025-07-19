// Daily Focus View ローカルストレージ管理

import { 
  Goal, 
  CustomTag, 
  FocusTodo, 
  LearningSession, 
  DailyStats, 
  DEFAULT_GOALS, 
  DEFAULT_CUSTOM_TAGS,
  LearningHeatmapData 
} from '../types'

// ローカルストレージのキー定義
const STORAGE_KEYS = {
  GOALS: 'daily-focus-goals',
  CUSTOM_TAGS: 'daily-focus-custom-tags',
  FOCUS_TODOS: 'daily-focus-todos',
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
    const parsed = JSON.parse(item)
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

// 目標管理
export const goalStorage = {
  getAll: (): Goal[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.GOALS)
    return safeJSONParse(stored, DEFAULT_GOALS)
  },

  save: (goals: Goal[]): void => {
    localStorage.setItem(STORAGE_KEYS.GOALS, safeJSONStringify(goals))
  },

  add: (goal: Goal): Goal[] => {
    const goals = goalStorage.getAll()
    const newGoals = [...goals, goal]
    goalStorage.save(newGoals)
    return newGoals
  },

  update: (goalId: string, updates: Partial<Goal>): Goal[] => {
    const goals = goalStorage.getAll()
    const updatedGoals = goals.map(goal => 
      goal.id === goalId 
        ? { ...goal, ...updates, updatedAt: new Date() }
        : goal
    )
    goalStorage.save(updatedGoals)
    return updatedGoals
  },

  delete: (goalId: string): Goal[] => {
    const goals = goalStorage.getAll()
    const filteredGoals = goals.filter(goal => goal.id !== goalId)
    goalStorage.save(filteredGoals)
    return filteredGoals
  },

  getById: (goalId: string): Goal | null => {
    const goals = goalStorage.getAll()
    return goals.find(goal => goal.id === goalId) || null
  }
}

// カスタムタグ管理
export const tagStorage = {
  getAll: (): CustomTag[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_TAGS)
    return safeJSONParse(stored, DEFAULT_CUSTOM_TAGS)
  },

  save: (tags: CustomTag[]): void => {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TAGS, safeJSONStringify(tags))
  },

  add: (tag: CustomTag): CustomTag[] => {
    const tags = tagStorage.getAll()
    const newTags = [...tags, tag]
    tagStorage.save(newTags)
    return newTags
  },

  update: (tagId: string, updates: Partial<CustomTag>): CustomTag[] => {
    const tags = tagStorage.getAll()
    const updatedTags = tags.map(tag => 
      tag.id === tagId 
        ? { ...tag, ...updates, updatedAt: new Date() }
        : tag
    )
    tagStorage.save(updatedTags)
    return updatedTags
  },

  delete: (tagId: string): CustomTag[] => {
    const tags = tagStorage.getAll()
    const filteredTags = tags.filter(tag => tag.id !== tagId)
    tagStorage.save(filteredTags)
    return filteredTags
  },

  getById: (tagId: string): CustomTag | null => {
    const tags = tagStorage.getAll()
    return tags.find(tag => tag.id === tagId) || null
  }
}

// ToDo管理
export const todoStorage = {
  getAll: (): FocusTodo[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.FOCUS_TODOS)
    return safeJSONParse(stored, [])
  },

  save: (todos: FocusTodo[]): void => {
    localStorage.setItem(STORAGE_KEYS.FOCUS_TODOS, safeJSONStringify(todos))
  },

  add: (todo: FocusTodo): FocusTodo[] => {
    const todos = todoStorage.getAll()
    const newTodos = [...todos, todo]
    todoStorage.save(newTodos)
    return newTodos
  },

  update: (todoId: string, updates: Partial<FocusTodo>): FocusTodo[] => {
    const todos = todoStorage.getAll()
    const updatedTodos = todos.map(todo => 
      todo.id === todoId 
        ? { ...todo, ...updates, updatedAt: new Date() }
        : todo
    )
    todoStorage.save(updatedTodos)
    return updatedTodos
  },

  delete: (todoId: string): FocusTodo[] => {
    const todos = todoStorage.getAll()
    const filteredTodos = todos.filter(todo => todo.id !== todoId)
    todoStorage.save(filteredTodos)
    return filteredTodos
  },

  getById: (todoId: string): FocusTodo | null => {
    const todos = todoStorage.getAll()
    return todos.find(todo => todo.id === todoId) || null
  },

  getByGoalId: (goalId: string): FocusTodo[] => {
    const todos = todoStorage.getAll()
    return todos.filter(todo => todo.goalId === goalId)
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
    
    if (existingIndex >= 0) {
      // 既存の統計を更新
      stats[existingIndex] = { ...stats[existingIndex], ...updates }
    } else {
      // 新しい統計を作成
      const newStat: DailyStats = {
        date,
        totalTime: 0,
        categoryTimes: {},
        completedTodos: 0,
        totalTodos: 0,
        sessionsCount: 0,
        ...updates
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
    const dateStr = date.toISOString().split('T')[0]
    
    const stat = stats.find(s => s.date === dateStr)
    const hours = stat ? Math.floor(stat.totalTime / (1000 * 60 * 60)) : 0
    
    heatmapData.push({
      date: dateStr,
      hours,
      intensity: Math.min(6, Math.floor(hours / 1)),
      sessions: stat?.sessionsCount || 0,
      categories: stat ? Object.keys(stat.categoryTimes).filter(cat => stat.categoryTimes[cat] > 0) : []
    })
  }
  
  return heatmapData
}

// データ初期化
export const initializeStorage = (): void => {
  // 初回起動時にデフォルトデータを設定
  if (!localStorage.getItem(STORAGE_KEYS.GOALS)) {
    goalStorage.save(DEFAULT_GOALS)
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOM_TAGS)) {
    tagStorage.save(DEFAULT_CUSTOM_TAGS)
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.FOCUS_TODOS)) {
    todoStorage.save([])
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.LEARNING_SESSIONS)) {
    sessionStorage.save([])
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.DAILY_STATS)) {
    statsStorage.save([])
  }
}

// データクリア（デバッグ用）
export const clearAllStorage = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}