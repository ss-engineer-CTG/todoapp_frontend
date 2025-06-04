// システムプロンプト準拠：tasklist機能専用型定義

import { Task, Project, BatchOperation } from '@core/types'

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