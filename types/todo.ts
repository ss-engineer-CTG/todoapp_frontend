export interface Project {
  id: string
  name: string
  color: string
  collapsed: boolean
  expanded: boolean // 追加
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
  expanded: boolean // 追加
  status?: 'not-started' | 'in-progress' | 'completed' | 'overdue'
  milestone?: boolean
}

export interface TaskRelationMap {
  childrenMap: { [parentId: string]: string[] }
  parentMap: { [childId: string]: string | null }
}

export interface TodoState {
  projects: Project[]
  tasks: Task[]
  selectedProjectId: string
  selectedTaskIds: string[]
  isMultiSelectMode: boolean
  showCompleted: boolean
  isDetailPanelVisible: boolean
  activeArea: 'projects' | 'tasks' | 'details'
  copiedTasks: Task[]
  taskRelationMap: TaskRelationMap
  isAddingProject: boolean
  isAddingTask: boolean
  isEditingProject: boolean
}

export type TodoAction = 
  | { type: 'LOAD_DATA'; payload: TodoState }
  | { type: 'ADD_PROJECT'; payload: Omit<Project, 'id'> }
  | { type: 'UPDATE_PROJECT'; payload: { id: string; updates: Partial<Project> } }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SELECT_PROJECT'; payload: string }
  | { type: 'TOGGLE_PROJECT_COLLAPSE'; payload: string }
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id'> }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'DELETE_TASKS'; payload: string[] }
  | { type: 'SELECT_TASK'; payload: { id: string; event?: React.MouseEvent } }
  | { type: 'TOGGLE_TASK_COMPLETION'; payload: string }
  | { type: 'TOGGLE_TASK_COLLAPSE'; payload: { id: string; forceState?: boolean } }
  | { type: 'COPY_TASK'; payload: string }
  | { type: 'COPY_TASKS'; payload: string[] }
  | { type: 'PASTE_TASK' }
  | { type: 'TOGGLE_SHOW_COMPLETED' }
  | { type: 'TOGGLE_DETAIL_PANEL' }
  | { type: 'SET_ACTIVE_AREA'; payload: 'projects' | 'tasks' | 'details' }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'TOGGLE_MULTI_SELECT_MODE' }

// CheckedState型をRadix UIに合わせて定義
export type CheckedState = boolean | 'indeterminate'