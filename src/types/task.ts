export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'overdue'

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
  milestone: boolean
  status: TaskStatus
  subtasks?: Task[]
  progress?: number
  priority?: 'low' | 'medium' | 'high'
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
  notes?: string
  assignee?: string
  level?: number
  milestone?: boolean
  priority?: 'low' | 'medium' | 'high'
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
  dateRange?: {
    start: Date
    end: Date
  }
}