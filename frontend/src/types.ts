// システムプロンプト準拠: タスク・プロジェクト関連の型定義

// 基本型
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
  // システムプロンプト準拠：一時的タスク管理機能追加
  isTemporary?: boolean
}

// UI関連型
export type AreaType = "projects" | "tasks" | "details"

export interface TaskRelationMap {
  childrenMap: { [parentId: string]: string[] }
  parentMap: { [childId: string]: string | null }
}

// API関連型
export type BatchOperation = 'complete' | 'incomplete' | 'delete' | 'copy'

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
  // システムプロンプト準拠：一時的タスク管理機能追加
  createTemporaryTask: (parentId: string | null, level: number) => Task
  removeTemporaryTask: (taskId: string) => void
  saveTemporaryTask: (taskId: string, taskData: Partial<Task>) => Promise<Task>
}

export interface ProjectApiActions {
  createProject: (project: Omit<Project, 'id'>) => Promise<Project>
  updateProject: (id: string, project: Partial<Project>) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
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

// システムプロンプト準拠：タスク作成フロー管理型
export interface TaskCreationFlow {
  isActive: boolean
  parentId: string | null
  level: number
  source: 'shortcut' | 'ui'
  createdTaskId: string | null
  shouldFocusOnCreation: boolean
}

// システムプロンプト準拠：フォーカス管理型
export interface FocusManagement {
  activeArea: AreaType
  lastFocusedTaskId: string | null
  shouldMaintainTaskFocus: boolean
  detailPanelAutoShow: boolean
  preventNextFocusChange: boolean
}

// システムプロンプト準拠：タスク編集状態管理型（一時的タスク対応強化）
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
  // システムプロンプト準拠：一時的タスク管理機能追加
  isTemporaryTask: boolean
  canSave: boolean
}

// システムプロンプト準拠：一時的タスク操作結果型
export interface TemporaryTaskResult {
  success: boolean
  task?: Task
  error?: string
  action: 'created' | 'saved' | 'cancelled' | 'removed'
}