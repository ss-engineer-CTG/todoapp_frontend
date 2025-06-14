// システムプロンプト準拠: 共通型定義（軽量化版）
// 🔧 修正内容：Timeline関連型統合、不要型削除

// UI関連型
export type AreaType = "projects" | "tasks" | "details" | "timeline"
export type BatchOperation = 'complete' | 'incomplete' | 'delete' | 'copy'
export type AppViewMode = 'tasklist' | 'timeline'

// 基本エンティティ型
export interface Project {
  id: string
  name: string
  color: string
  collapsed: boolean
  createdAt?: Date
  updatedAt?: Date
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
  _isDraft?: boolean
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

// フォーカス管理型
export interface FocusManagement {
  activeArea: AreaType
  lastFocusedTaskId: string | null
  shouldMaintainTaskFocus: boolean
  detailPanelAutoShow: boolean
  preventNextFocusChange: boolean
}

// タスク編集状態管理型
export interface TaskEditingState {
  name: string
  startDate: Date | null
  dueDate: Date | null
  assignee: string
  notes: string
  hasChanges: boolean
  isStartDateCalendarOpen: boolean
  isDueDateCalendarOpen: boolean
  focusTransitionMode: 'navigation' | 'calendar-selection'
  canSave: boolean
}

// 選択状態管理型
export interface SelectionState {
  selectedId: string | null
  selectedIds: string[]
  isMultiSelectMode: boolean
}