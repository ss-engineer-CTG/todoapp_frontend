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

// 新規追加の型定義
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

export type MultiSelectActions = {
  copy: (taskIds: string[]) => void
  delete: (taskIds: string[]) => void
  toggleCompletion: (taskIds: string[]) => void
}