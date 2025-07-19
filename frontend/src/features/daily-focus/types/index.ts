// Daily Focus View データ型定義

export interface Goal {
  id: string
  title: string
  description: string
  color: 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'rose'
  category: 'programming' | 'english' | 'health' | 'reading' | 'exercise' | 'other'
  createdAt: Date
  updatedAt: Date
  isCompleted: boolean
  completedAt?: Date
}

export interface CustomTag {
  id: string
  name: string
  emoji: string
  color: 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'rose'
  category: 'programming' | 'english' | 'health' | 'reading' | 'exercise' | 'other'
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface FocusTodo {
  id: string
  text: string
  completed: boolean
  goalId?: string
  tagId?: string
  category: 'programming' | 'english' | 'health' | 'reading' | 'exercise' | 'other'
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface LearningSession {
  id: string
  category: 'programming' | 'english' | 'reading' | 'exercise' | 'other'
  startTime: Date
  endTime?: Date
  pausedTime: number // 一時停止時間の累計（ミリ秒）
  totalTime: number // 実際の学習時間（ミリ秒）
  isActive: boolean
  isPaused: boolean
  goalId?: string
  notes?: string
}

export interface DailyStats {
  date: string // YYYY-MM-DD形式
  totalTime: number // 総学習時間（ミリ秒）
  categoryTimes: Record<string, number> // カテゴリ別学習時間
  completedTodos: number
  totalTodos: number
  sessionsCount: number
  notes?: string
}

export interface LearningHeatmapData {
  date: string
  hours: number
  intensity: number // 0-6の強度
  sessions: number
  categories: string[]
}

export interface SelectionState {
  selectedGoalId: string | null
  selectedTodoId: string | null
  selectedType: 'goal' | 'todo' | null
}

export interface PanelDimensions {
  leftWidth: number
  centerWidth: number
  rightWidth: number
}

export interface LearningSessionState {
  currentSession: LearningSession | null
  isActive: boolean
  isPaused: boolean
  currentCategory: string
  elapsedTime: number
  todayTotal: number
  categoryTotals: Record<string, number>
}

export interface TagSelectionModalState {
  isOpen: boolean
  todoText: string
  selectedTagIndex: number
  availableTags: CustomTag[]
  availableGoals: Goal[]
}

export interface TagEditModalState {
  isOpen: boolean
  editingFromTagSelection: boolean
  customTags: CustomTag[]
}

// ユーティリティ型
export type LearningCategory = 'programming' | 'english' | 'reading' | 'exercise' | 'other'
export type ColorVariant = 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'rose'
export type SelectionType = 'goal' | 'todo' | null

// デフォルト値
export const DEFAULT_GOALS: Goal[] = [
  {
    id: 'goal-1',
    title: 'プログラミングスキル向上',
    description: 'React + TypeScriptを使った実践的なアプリケーション開発をマスターする',
    color: 'blue',
    category: 'programming',
    createdAt: new Date(),
    updatedAt: new Date(),
    isCompleted: false
  },
  {
    id: 'goal-2',
    title: '英語学習',
    description: 'TOEIC 800点を目指して毎日30分の学習を継続する',
    color: 'green',
    category: 'english',
    createdAt: new Date(),
    updatedAt: new Date(),
    isCompleted: false
  },
  {
    id: 'goal-3',
    title: '健康管理',
    description: '週3回の運動習慣を身につけて体力向上を図る',
    color: 'purple',
    category: 'health',
    createdAt: new Date(),
    updatedAt: new Date(),
    isCompleted: false
  }
]

export const DEFAULT_CUSTOM_TAGS: CustomTag[] = [
  {
    id: 'tag-1',
    name: '読書',
    emoji: '📚',
    color: 'orange',
    category: 'reading',
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'tag-2',
    name: '家事',
    emoji: '🏠',
    color: 'teal',
    category: 'other',
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'tag-3',
    name: '趣味',
    emoji: '🎨',
    color: 'rose',
    category: 'other',
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export const LEARNING_CATEGORIES = [
  { value: 'programming', label: '📚 プログラミング', emoji: '📚' },
  { value: 'english', label: '🗣️ 英語学習', emoji: '🗣️' },
  { value: 'reading', label: '📖 読書', emoji: '📖' },
  { value: 'exercise', label: '🏃 運動', emoji: '🏃' },
  { value: 'other', label: '📝 その他', emoji: '📝' }
] as const

export const COLOR_VARIANTS = [
  { value: 'blue', name: 'Blue', class: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'green', name: 'Green', class: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'purple', name: 'Purple', class: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'orange', name: 'Orange', class: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'teal', name: 'Teal', class: 'bg-teal-100 text-teal-800 border-teal-200' },
  { value: 'rose', name: 'Rose', class: 'bg-rose-100 text-rose-800 border-rose-200' }
] as const