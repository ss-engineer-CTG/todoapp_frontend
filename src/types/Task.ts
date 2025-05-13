export interface Task {
  id: number
  name: string
  level: number
  isProject: boolean
  startDate: string
  dueDate: string
  completed: boolean
  completionDate?: string
  assignee: string
  notes: string
  expanded: boolean
  projectId: number
  projectName: string
  priority?: "low" | "medium" | "high"
  tags?: string[]
  order?: number
  // カラー分類用
  color?: string
  // 階層構造の明示的な管理のために追加
  parentId?: number | null
}