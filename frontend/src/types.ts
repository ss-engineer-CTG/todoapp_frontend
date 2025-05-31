// システムプロンプト準拠: 軽量化された型定義

export type Project = {
  id: string
  name: string
  color: string
  collapsed: boolean
}

export type Task = {
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
}

export type TaskRelationMap = {
  childrenMap: { [parentId: string]: string[] }
  parentMap: { [childId: string]: string | null }
}

export type KeyboardShortcut = {
  key: string
  description: string
}

export type ProjectColor = {
  name: string
  value: string
}

export type AreaType = "projects" | "tasks" | "details"

// 複数選択関連の型定義
export type SelectionState = {
  selectedId: string | null
  selectedIds: string[]
  isMultiSelectMode: boolean
  lastSelectedIndex: number
}

export type KeyboardNavigationProps = {
  activeArea: AreaType
  setActiveArea: (area: AreaType) => void
  isDetailPanelVisible: boolean
}

// 一括操作関連の型定義
export type BatchOperation = 'complete' | 'incomplete' | 'delete' | 'copy'

export type BatchOperationResult = {
  success: boolean
  message: string
  affected_count: number
  task_ids: string[]
  errors?: string[]
}

// 範囲選択関連の型定義
export type RangeSelectionState = {
  startIndex: number
  endIndex: number
  direction: 'up' | 'down' | null
}

// タブナビゲーション関連の型定義
export type TabNavigationRefs = {
  taskNameInputRef: React.RefObject<HTMLInputElement>
  startDateButtonRef: React.RefObject<HTMLButtonElement>
  dueDateButtonRef: React.RefObject<HTMLButtonElement>
  taskNotesRef: React.RefObject<HTMLTextAreaElement>
  saveButtonRef: React.RefObject<HTMLButtonElement>
}

// 編集状態管理用の型定義
export type TaskEditingState = {
  name: string
  startDate: Date | null
  dueDate: Date | null
  assignee: string
  notes: string
  hasChanges: boolean
  isStartDateCalendarOpen: boolean
  isDueDateCalendarOpen: boolean
  focusTransitionMode: 'navigation' | 'calendar-selection'
}

// API関連の型定義
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface ApiError {
  message: string
  code?: string
  details?: any
}

// バックエンドから返される日付フィールド形式
export interface ApiTaskResponse {
  id: string
  name: string
  project_id: string
  parent_id: string | null
  completed: boolean
  start_date: string
  due_date: string
  completion_date: string | null
  notes: string
  assignee: string
  level: number
  collapsed: boolean
  created_at: string
  updated_at: string
}

export interface ApiProjectResponse {
  id: string
  name: string
  color: string
  collapsed: boolean
  created_at: string
  updated_at: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface ProjectApiActions {
  createProject: (project: Omit<Project, 'id'>) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
}

export interface TaskApiActions {
  createTask: (task: Omit<Task, 'id'>) => Promise<Task>
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>
  deleteTask: (id: string) => Promise<void>
  loadTasks: () => Promise<Task[]>
  batchUpdateTasks: (operation: BatchOperation, taskIds: string[]) => Promise<BatchOperationResult>
}

// キーボードイベント関連の型定義
export type KeyboardEventHandler = (event: KeyboardEvent) => void

export type KeyboardShortcutMap = {
  [key: string]: KeyboardEventHandler
}

// 複数選択操作の型定義
export type MultiSelectActions = {
  handleSelect: (itemId: string, event?: React.MouseEvent) => void
  handleKeyboardRangeSelect: (direction: 'up' | 'down') => void
  selectAll: () => void
  clearSelection: () => void
  toggleMultiSelectMode: () => void
}

// コピー&ペースト関連の型定義
export type ClipboardData = {
  tasks: Task[]
  timestamp: number
  sourceProjectId: string
}

// パフォーマンス監視用の型定義
export type PerformanceMetric = {
  operation: string
  duration: number
  timestamp: number
}

// データ変換エラー用の型定義
export interface DateConversionError {
  field: string
  originalValue: any
  convertedValue: Date | null
  error: string
}

export interface DataValidationResult {
  isValid: boolean
  errors: DateConversionError[]
  data: any
}

// タスク作成フロー管理用型定義
export type TaskCreationFlow = {
  isActive: boolean
  parentId: string | null
  level: number
  source: 'shortcut' | 'ui' | 'api'
  createdTaskId: string | null
  shouldFocusOnCreation: boolean
}

// フォーカス管理用型定義（軽量化）
export type FocusManagement = {
  activeArea: AreaType
  lastFocusedTaskId: string | null
  shouldMaintainTaskFocus: boolean
  detailPanelAutoShow: boolean
  preventNextFocusChange: boolean
}