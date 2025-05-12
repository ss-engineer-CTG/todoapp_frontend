import { Task } from "../types/Task"

// タスクをステータスでフィルタリング
export function filterByStatus(tasks: Task[], status: "all" | "active" | "completed"): Task[] {
  if (status === "all") return tasks
  return tasks.filter(task => 
    status === "active" ? !task.completed : task.completed
  )
}

// タスクをタグでフィルタリング
export function filterByTags(tasks: Task[], tags: string[]): Task[] {
  if (!tags.length) return tasks
  return tasks.filter(task => 
    task.tags?.some(tag => tags.includes(tag))
  )
}

// タスクを優先度でフィルタリング
export function filterByPriority(tasks: Task[], priority: "all" | "low" | "medium" | "high"): Task[] {
  if (priority === "all") return tasks
  return tasks.filter(task => task.priority === priority)
}

// タスクを検索クエリでフィルタリング
export function filterBySearchQuery(tasks: Task[], query: string): Task[] {
  if (!query) return tasks
  const lowercaseQuery = query.toLowerCase()
  
  return tasks.filter(task => 
    task.name.toLowerCase().includes(lowercaseQuery) ||
    task.assignee.toLowerCase().includes(lowercaseQuery) ||
    task.notes.toLowerCase().includes(lowercaseQuery) ||
    task.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  )
}

// 高度な検索条件でフィルタリング
export function filterByAdvancedCriteria(tasks: Task[], criteria: {
  name: string
  assignee: string
  startDateFrom: string
  startDateTo: string
  dueDateFrom: string
  dueDateTo: string
  tags: string
  priority: string
}): Task[] {
  return tasks.filter(task => {
    // 名前でフィルタリング
    if (criteria.name && !task.name.toLowerCase().includes(criteria.name.toLowerCase())) {
      return false
    }
    
    // 担当者でフィルタリング
    if (criteria.assignee && !task.assignee.toLowerCase().includes(criteria.assignee.toLowerCase())) {
      return false
    }
    
    // 開始日の範囲でフィルタリング
    if (criteria.startDateFrom && task.startDate < criteria.startDateFrom) {
      return false
    }
    if (criteria.startDateTo && task.startDate > criteria.startDateTo) {
      return false
    }
    
    // 期限日の範囲でフィルタリング
    if (criteria.dueDateFrom && task.dueDate < criteria.dueDateFrom) {
      return false
    }
    if (criteria.dueDateTo && task.dueDate > criteria.dueDateTo) {
      return false
    }
    
    // タグでフィルタリング
    if (criteria.tags) {
      if (!task.tags || !task.tags.some(tag => 
        tag.toLowerCase().includes(criteria.tags.toLowerCase())
      )) {
        return false
      }
    }
    
    // 優先度でフィルタリング
    if (criteria.priority && (!task.priority || !task.priority.includes(criteria.priority))) {
      return false
    }
    
    return true
  })
}

// タスクを今日のタスクにフィルタリング
export function filterTodayTasks(tasks: Task[]): Task[] {
  const today = new Date().toISOString().split("T")[0]
  return tasks.filter(task => 
    !task.isProject && 
    task.startDate <= today && 
    task.dueDate >= today
  )
}

// 期限切れのタスクをフィルタリング
export function filterOverdueTasks(tasks: Task[]): Task[] {
  const today = new Date().toISOString().split("T")[0]
  return tasks.filter(task => 
    !task.isProject && 
    !task.completed && 
    task.dueDate < today
  )
}

// 今後のタスクをフィルタリング（7日以内）
export function filterUpcomingTasks(tasks: Task[]): Task[] {
  const today = new Date().toISOString().split("T")[0]
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextWeekStr = nextWeek.toISOString().split("T")[0]
  
  return tasks.filter(task => 
    !task.isProject && 
    task.startDate > today && 
    task.startDate <= nextWeekStr
  )
}