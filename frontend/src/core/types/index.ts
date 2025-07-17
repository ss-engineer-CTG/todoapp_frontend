// システムプロンプト準拠: 統合型定義ファイル
// 🔧 修正内容：types.tsの内容を統合、重複排除実施

// UI関連型（型安全性向上）
export type AreaType = "projects" | "tasks" | "details" | "timeline"
export type BatchOperation = 'complete' | 'incomplete' | 'delete' | 'copy'
export type AppViewMode = 'tasklist' | 'timeline' | 'daily-focus'

// より厳密な型制約（リテラル型の活用）
export const AREA_TYPES = {
  PROJECTS: 'projects',
  TASKS: 'tasks', 
  DETAILS: 'details',
  TIMELINE: 'timeline'
} as const

export const BATCH_OPERATIONS = {
  COMPLETE: 'complete',
  INCOMPLETE: 'incomplete', 
  DELETE: 'delete',
  COPY: 'copy'
} as const

export const APP_VIEW_MODES = {
  TASKLIST: 'tasklist',
  TIMELINE: 'timeline',
  DAILY_FOCUS: 'daily-focus'
} as const

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

// 🆕 追加：ドラッグ制限設定型
export interface DragRestrictions {
  PREVENT_PAST_DATES: boolean
  ENFORCE_DATE_ORDER: boolean
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

// 選択状態管理型（基本版）
export interface SelectionState {
  selectedId: string | null
  selectedIds: string[]
  isMultiSelectMode: boolean
}

// API関連型（types.tsから統合）
export interface TaskRelationMap {
  childrenMap: { [parentId: string]: string[] }
  parentMap: { [childId: string]: string | null }
}

export interface BatchOperationResult {
  success: boolean
  message: string
  affected_count: number
  task_ids: string[]
}

export interface TaskApiActions {
  createTask: (task: Omit<Task, 'id'>) => Promise<Task>
  updateTask: (id: string, task: Partial<Task>) => Promise<Task>
  deleteTask: (id: string) => Promise<void>
  loadTasks: () => Promise<Task[]>
  batchUpdateTasks: (operation: BatchOperation, taskIds: string[]) => Promise<BatchOperationResult>
}

export interface ProjectApiActions {
  createProject: (project: Omit<Project, 'id'>) => Promise<Project>
  updateProject: (id: string, project: Partial<Project>) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
}