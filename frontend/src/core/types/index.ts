// システムプロンプト準拠: 共通型定義（タイムライン機能拡張版）

// UI関連型（簡素化）
export type AreaType = "projects" | "tasks" | "details" | "timeline" // timeline追加
export type BatchOperation = 'complete' | 'incomplete' | 'delete' | 'copy'

// 基本エンティティ型（全機能で共有）
export interface Project {
  id: string
  name: string
  color: string
  collapsed: boolean
  createdAt?: Date
  updatedAt?: Date
  // タイムライン拡張フィールド
  expanded?: boolean
  process?: string
  line?: string
}

export interface Task {
  id: string
  name: string
  projectId: string
  parentId: string | null
  completed: boolean
  startDate: Date
  dueDate: Date
  completionDate: Date | null
  notes: string
  assignee: string
  level: number
  collapsed: boolean
  createdAt?: Date
  updatedAt?: Date
  // 草稿フラグ（簡素化）
  _isDraft?: boolean
  // タイムライン拡張フィールド
  expanded?: boolean
  milestone?: boolean
  process?: string
  line?: string
  subtasks?: Task[]
  status?: 'completed' | 'in-progress' | 'not-started' | 'overdue'
}

// 設定・定数型
export interface ProjectColor {
  name: string
  value: string
}

export interface KeyboardShortcut {
  key: string
  description: string
}

// アプリビューモード
export type AppViewMode = 'tasklist' | 'timeline'