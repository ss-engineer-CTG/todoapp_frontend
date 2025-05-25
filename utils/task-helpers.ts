import type { Task, Project } from "@/types/todo"
import { isOverdue, isDueToday, isDueSoon } from "./date-helpers"

// タスクのステータス判定
export const determineTaskStatus = (task: Task): Task['status'] => {
  if (task.completed) return 'completed'
  if (isOverdue(task.dueDate)) return 'overdue'
  if (isDueToday(task.dueDate) || isDueSoon(task.dueDate, 1)) return 'in-progress'
  return 'not-started'
}

// タスクの優先度計算
export const calculateTaskPriority = (task: Task): 'high' | 'medium' | 'low' => {
  if (isOverdue(task.dueDate)) return 'high'
  if (isDueToday(task.dueDate)) return 'high'
  if (isDueSoon(task.dueDate, 3)) return 'medium'
  return 'low'
}

// タスクの完了率計算
export const calculateTaskProgress = (task: Task, allTasks: Task[]): number => {
  const childTasks = allTasks.filter(t => t.parentId === task.id)
  
  if (childTasks.length === 0) {
    return task.completed ? 100 : 0
  }
  
  const completedChildren = childTasks.filter(t => t.completed).length
  return Math.round((completedChildren / childTasks.length) * 100)
}

// プロジェクトの完了率計算
export const calculateProjectProgress = (project: Project, tasks: Task[]): number => {
  const projectTasks = tasks.filter(t => t.projectId === project.id)
  
  if (projectTasks.length === 0) return 0
  
  const completedTasks = projectTasks.filter(t => t.completed).length
  return Math.round((completedTasks / projectTasks.length) * 100)
}

// タスクの階層構造を構築
export const buildTaskHierarchy = (tasks: Task[]): Task[] => {
  const taskMap = new Map<string, Task>()
  const rootTasks: Task[] = []
  
  // まずすべてのタスクをマップに追加
  tasks.forEach(task => {
    taskMap.set(task.id, { ...task })
  })
  
  // 階層構造を構築
  tasks.forEach(task => {
    if (task.parentId === null) {
      rootTasks.push(taskMap.get(task.id)!)
    }
  })
  
  return rootTasks
}

// タスクの深度を計算
export const calculateTaskDepth = (task: Task, allTasks: Task[]): number => {
  if (task.parentId === null) return 0
  
  const parent = allTasks.find(t => t.id === task.parentId)
  if (!parent) return 0
  
  return 1 + calculateTaskDepth(parent, allTasks)
}

// タスクのパスを取得（親から子への経路）
export const getTaskPath = (task: Task, allTasks: Task[]): Task[] => {
  const path: Task[] = [task]
  
  let currentTask = task
  while (currentTask.parentId !== null) {
    const parent = allTasks.find(t => t.id === currentTask.parentId)
    if (!parent) break
    
    path.unshift(parent)
    currentTask = parent
  }
  
  return path
}

// タスクのフィルタリング
export const filterTasks = (
  tasks: Task[],
  filters: {
    projectId?: string
    completed?: boolean
    overdue?: boolean
    dueToday?: boolean
    assignee?: string
    searchText?: string
  }
): Task[] => {
  return tasks.filter(task => {
    if (filters.projectId && task.projectId !== filters.projectId) return false
    if (filters.completed !== undefined && task.completed !== filters.completed) return false
    if (filters.overdue && !isOverdue(task.dueDate)) return false
    if (filters.dueToday && !isDueToday(task.dueDate)) return false
    if (filters.assignee && task.assignee !== filters.assignee) return false
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      if (!task.name.toLowerCase().includes(searchLower) && 
          !task.notes.toLowerCase().includes(searchLower)) return false
    }
    
    return true
  })
}

// タスクのソート
export const sortTasks = (
  tasks: Task[],
  sortBy: 'name' | 'dueDate' | 'startDate' | 'priority' | 'status',
  order: 'asc' | 'desc' = 'asc'
): Task[] => {
  return [...tasks].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name, 'ja')
        break
      case 'dueDate':
        comparison = a.dueDate.getTime() - b.dueDate.getTime()
        break
      case 'startDate':
        comparison = a.startDate.getTime() - b.startDate.getTime()
        break
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const aPriority = priorityOrder[calculateTaskPriority(a)]
        const bPriority = priorityOrder[calculateTaskPriority(b)]
        comparison = bPriority - aPriority // 高い優先度を先に
        break
      case 'status':
        const statusOrder = { overdue: 4, 'in-progress': 3, 'not-started': 2, completed: 1 }
        const aStatus = statusOrder[determineTaskStatus(a)]
        const bStatus = statusOrder[determineTaskStatus(b)]
        comparison = bStatus - aStatus
        break
    }
    
    return order === 'asc' ? comparison : -comparison
  })
}

// タスクの複製
export const duplicateTask = (task: Task, newName?: string): Omit<Task, 'id'> => {
  return {
    ...task,
    name: newName || `${task.name} (コピー)`,
    completed: false,
    completionDate: null,
    startDate: new Date(),
    dueDate: new Date(Date.now() + (task.dueDate.getTime() - task.startDate.getTime()))
  }
}

// タスクの統計情報
export const getTaskStatistics = (tasks: Task[]) => {
  const total = tasks.length
  const completed = tasks.filter(t => t.completed).length
  const overdue = tasks.filter(t => !t.completed && isOverdue(t.dueDate)).length
  const dueToday = tasks.filter(t => !t.completed && isDueToday(t.dueDate)).length
  const dueSoon = tasks.filter(t => !t.completed && isDueSoon(t.dueDate)).length
  
  return {
    total,
    completed,
    pending: total - completed,
    overdue,
    dueToday,
    dueSoon,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
  }
}

// タスクの検索
export const searchTasks = (tasks: Task[], query: string): Task[] => {
  if (!query.trim()) return tasks
  
  const lowercaseQuery = query.toLowerCase()
  
  return tasks.filter(task => 
    task.name.toLowerCase().includes(lowercaseQuery) ||
    task.notes.toLowerCase().includes(lowercaseQuery) ||
    task.assignee.toLowerCase().includes(lowercaseQuery)
  )
}