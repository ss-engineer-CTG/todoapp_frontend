export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'overdue'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  name: string
  projectId: string
  parentId: string | null
  completed: boolean
  startDate: Date
  dueDate: Date
  endDate: Date // タイムライン表示用の終了日
  completionDate: Date | null
  notes: string
  assignee: string
  level: number
  collapsed: boolean
  expanded: boolean // タイムライン表示用の展開状態
  milestone: boolean
  status: TaskStatus
  progress?: number
  priority?: TaskPriority
  tags?: string[]
  createdAt?: Date
  updatedAt?: Date
}

export interface TaskFormData {
  name: string
  projectId: string
  parentId: string | null
  startDate?: Date
  dueDate?: Date
  endDate?: Date
  notes?: string
  assignee?: string
  level?: number
  milestone?: boolean
  priority?: TaskPriority
  tags?: string[]
}

export interface TaskRelationMap {
  childrenMap: { [parentId: string]: string[] }
  parentMap: { [childId: string]: string | null }
}

export interface TaskState {
  tasks: Task[]
  selectedTaskId: string | null
  selectedTaskIds: string[]
  isMultiSelectMode: boolean
  lastSelectedTaskIndex: number
  copiedTasks: Task[]
  isAddingTask: boolean
  newTaskName: string
  newTaskParentId: string | null
  newTaskLevel: number
  taskRelationMap?: TaskRelationMap
  // エラー状態の追加
  error: string | null
  isLoading: boolean
}

export type TaskAction =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: TaskFormData }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASKS'; payload: string[] }
  | { type: 'SET_SELECTED_TASK'; payload: string | null }
  | { type: 'SET_SELECTED_TASKS'; payload: string[] }
  | { type: 'CLEAR_TASK_SELECTION' }
  | { type: 'TOGGLE_MULTI_SELECT_MODE' }
  | { type: 'SET_MULTI_SELECT_MODE'; payload: boolean }
  | { type: 'SET_COPIED_TASKS'; payload: Task[] }
  | { type: 'START_ADD_TASK'; payload: { parentId: string | null; level: number } }
  | { type: 'SET_NEW_TASK_NAME'; payload: string }
  | { type: 'CANCEL_ADD_TASK' }
  // エラー関連のアクションを追加
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' }

export interface TaskContextType {
  state: TaskState
  dispatch: React.Dispatch<TaskAction>
}

export interface TaskFilter {
  projectId?: string
  status?: TaskStatus[]
  completed?: boolean
  assignee?: string
  tags?: string[]
  priority?: TaskPriority[]
  dateRange?: {
    start: Date
    end: Date
  }
  searchQuery?: string
}

// タスクの統計情報
export interface TaskStats {
  total: number
  completed: number
  inProgress: number
  notStarted: number
  overdue: number
  completionRate: number
}

// タスクのバリデーション結果
export interface TaskValidationResult {
  isValid: boolean
  errors: {
    field: keyof Task
    message: string
  }[]
}

// タスクの操作結果
export interface TaskOperationResult {
  success: boolean
  message: string
  affectedTaskIds?: string[]
}

// タスクのエクスポート設定
export interface TaskExportOptions {
  format: 'json' | 'csv' | 'xlsx'
  includeSubtasks: boolean
  includeCompleted: boolean
  includeNotes: boolean
  dateFormat: string
}

// タスクのインポート結果
export interface TaskImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: string[]
}

// タスクのソート設定
export interface TaskSortOptions {
  field: keyof Task
  direction: 'asc' | 'desc'
  secondaryField?: keyof Task
  secondaryDirection?: 'asc' | 'desc'
}

// タスクの履歴
export interface TaskHistory {
  id: string
  taskId: string
  action: 'created' | 'updated' | 'deleted' | 'completed' | 'moved'
  changes: Partial<Task>
  timestamp: Date
  userId?: string
}

// 型ガード関数
export function isTask(obj: any): obj is Task {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.projectId === 'string' &&
    typeof obj.completed === 'boolean' &&
    obj.startDate instanceof Date &&
    obj.dueDate instanceof Date &&
    obj.endDate instanceof Date
  )
}

export function isTaskFormData(obj: any): obj is TaskFormData {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.name === 'string' &&
    typeof obj.projectId === 'string'
  )
}

// タスクのデフォルト値
export const DEFAULT_TASK: Omit<Task, 'id' | 'name' | 'projectId'> = {
  parentId: null,
  completed: false,
  startDate: new Date(),
  dueDate: new Date(),
  endDate: new Date(),
  completionDate: null,
  notes: '',
  assignee: '自分',
  level: 0,
  collapsed: false,
  expanded: false,
  milestone: false,
  status: 'not-started',
  progress: 0,
  priority: 'medium',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date()
}

// タスクステータスの表示名
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  'not-started': '未開始',
  'in-progress': '進行中',
  'completed': '完了',
  'overdue': '期限切れ'
}

// タスク優先度の表示名
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  'low': '低',
  'medium': '中',
  'high': '高'
}

// バリデーション設定
export const TASK_VALIDATION = {
  NAME_MAX_LENGTH: 200,
  NAME_MIN_LENGTH: 1,
  NOTES_MAX_LENGTH: 2000,
  ASSIGNEE_MAX_LENGTH: 50,
  TAGS_MAX_COUNT: 10,
  TAG_MAX_LENGTH: 20,
  MAX_LEVEL: 10
} as const