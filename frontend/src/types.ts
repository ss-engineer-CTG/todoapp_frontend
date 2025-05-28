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