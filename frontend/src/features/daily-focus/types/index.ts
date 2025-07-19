// Daily Focus View データ型定義

export interface Goal {
  id: string
  title: string
  description: string
  color: 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'rose'
  tagIds?: string[]         // 新: 複数タグ対応
  
  // 移行期間中の互換性（段階的に削除予定）
  category?: 'programming' | 'english' | 'health' | 'reading' | 'exercise' | 'other'
  
  createdAt: Date
  updatedAt: Date
  isCompleted: boolean
  completedAt?: Date
}

// 従来のカテゴリタイプ（移行中の互換性のため）
export type LearningCategory = 'programming' | 'english' | 'health' | 'reading' | 'exercise' | 'other'

// 拡張されたCustomTag（カテゴリ統合版）
export interface CustomTag {
  id: string
  name: string
  emoji: string
  color: 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'rose'
  
  // 新しいタグシステム機能
  isCategory: boolean        // カテゴリタグかどうか
  parentTagId?: string      // 親タグ（階層構造）
  aliases: string[]         // エイリアス（従来のカテゴリ値を含む）
  
  // メタデータ
  isDefault: boolean
  isSystem: boolean         // システム予約タグ
  
  // 統計用
  usageCount: number        // 使用回数
  lastUsed?: Date          // 最終使用日
  
  // 移行期間中の互換性（段階的に削除予定）
  category?: LearningCategory
  
  // 既存フィールド
  createdAt: Date
  updatedAt: Date
}

export interface FocusTodo {
  id: string
  text: string
  completed: boolean
  goalId?: string
  tagId?: string
  tagIds?: string[]         // 新: 複数タグ対応
  
  // 移行期間中の互換性（段階的に削除予定）
  category?: LearningCategory
  
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface LearningSession {
  id: string
  tagIds?: string[]         // 新: 複数タグ対応
  
  // 移行期間中の互換性（段階的に削除予定）
  category?: 'programming' | 'english' | 'reading' | 'exercise' | 'other'
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
    isCategory: false,
    parentTagId: 'category-reading',
    aliases: [],
    isSystem: false,
    usageCount: 0,
    lastUsed: undefined,
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
    isCategory: false,
    parentTagId: 'category-other',
    aliases: [],
    isSystem: false,
    usageCount: 0,
    lastUsed: undefined,
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
    isCategory: false,
    parentTagId: 'category-other',
    aliases: [],
    isSystem: false,
    usageCount: 0,
    lastUsed: undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// 従来のカテゴリ定義（移行期間中の互換性のため）
export const LEARNING_CATEGORIES = [
  { value: 'programming', label: '📚 プログラミング', emoji: '📚' },
  { value: 'english', label: '🗣️ 英語学習', emoji: '🗣️' },
  { value: 'reading', label: '📖 読書', emoji: '📖' },
  { value: 'exercise', label: '🏃 運動', emoji: '🏃' },
  { value: 'other', label: '📝 その他', emoji: '📝' }
] as const

// カテゴリをタグに変換するためのマッピング
export const getCategoryColor = (category: LearningCategory): 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'rose' => {
  switch (category) {
    case 'programming': return 'blue'
    case 'english': return 'green'
    case 'reading': return 'purple'
    case 'exercise': return 'orange'
    case 'other': return 'teal'
    default: return 'teal'
  }
}

// デフォルトのカテゴリタグ定義
export const createCategoryTags = (): CustomTag[] => {
  return LEARNING_CATEGORIES.map(cat => ({
    id: `category-${cat.value}`,
    name: cat.label.replace(/📚|🗣️|📖|🏃|📝\s*/, '').trim(),
    emoji: cat.emoji,
    color: getCategoryColor(cat.value as LearningCategory),
    isCategory: true,
    parentTagId: undefined,
    aliases: [cat.value],
    isDefault: true,
    isSystem: true,
    usageCount: 0,
    lastUsed: undefined,
    category: cat.value as LearningCategory, // 移行期間中の互換性
    createdAt: new Date(),
    updatedAt: new Date()
  }))
}

export const COLOR_VARIANTS = [
  { value: 'blue', name: 'Blue', class: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'green', name: 'Green', class: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'purple', name: 'Purple', class: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'orange', name: 'Orange', class: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'teal', name: 'Teal', class: 'bg-teal-100 text-teal-800 border-teal-200' },
  { value: 'rose', name: 'Rose', class: 'bg-rose-100 text-rose-800 border-rose-200' }
] as const