// Daily Focus View データ型定義

// 学習カテゴリタイプ
export type LearningCategory = 'programming' | 'english' | 'health' | 'reading' | 'exercise' | 'other'

export interface LearningSession {
  id: string
  category?: LearningCategory
  tagIds?: string[] // タグシステム対応
  goalId?: string // 目標関連（削除済み機能の残存フィールド）
  startTime: Date
  endTime?: Date
  pausedTime: number // 一時停止時間の累計（ミリ秒）
  totalTime: number // 実際の学習時間（ミリ秒）
  isActive: boolean
  isPaused: boolean
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


// ユーティリティ型
export type ColorVariant = 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'rose'


// 学習カテゴリ定義
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