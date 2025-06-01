// システムプロンプト準拠：型定義簡素化（YAGNI原則・複雑な状態管理型削除）

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
    // 草稿フラグ（簡素化）
    _isDraft?: boolean
  }
  
  // UI関連型（簡素化）
  export type AreaType = "projects" | "tasks" | "details"
  export type BatchOperation = 'complete' | 'incomplete' | 'delete' | 'copy'
  
  // タスク関係マップ（簡素化）
  export interface TaskRelationMap {
    childrenMap: { [parentId: string]: string[] }
    parentMap: { [childId: string]: string | null }
  }
  
  // API操作結果
  export interface BatchOperationResult {
    success: boolean
    message: string
    affected_count: number
    task_ids: string[]
  }
  
  // API関数型
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
  
  // 選択状態管理（簡素化）
  export interface SelectionState {
    selectedId: string | null
    selectedIds: string[]
    isMultiSelectMode: boolean
  }