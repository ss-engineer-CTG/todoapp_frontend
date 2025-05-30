// システムプロンプト準拠: DRY原則 - 型定義統一、重複排除

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

// 複数選択関連の型定義（page.tsx準拠）
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

// 範囲選択関連の型定義（page.tsx準拠）
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
  loadTasks: () => Promise<Task[]>
  batchUpdateTasks: (operation: BatchOperation, taskIds: string[]) => Promise<BatchOperationResult>
}

// キーボードイベント関連の型定義
export type KeyboardEventHandler = (event: KeyboardEvent) => void

export type KeyboardShortcutMap = {
  [key: string]: KeyboardEventHandler
}

// 複数選択操作の型定義（page.tsx準拠）
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

// パフォーマンス監視用の型定義（最小限）
export type PerformanceMetric = {
  operation: string
  duration: number
  timestamp: number
}