import { Task } from "../types/Task"

// タスクを名前で並べ替え
export function sortByName(tasks: Task[], direction: "asc" | "desc" = "asc"): Task[] {
  return [...tasks].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name)
    return direction === "asc" ? comparison : -comparison
  })
}

// タスクを期限日で並べ替え
export function sortByDueDate(tasks: Task[], direction: "asc" | "desc" = "asc"): Task[] {
  return [...tasks].sort((a, b) => {
    const comparison = a.dueDate.localeCompare(b.dueDate)
    return direction === "asc" ? comparison : -comparison
  })
}

// タスクを開始日で並べ替え
export function sortByStartDate(tasks: Task[], direction: "asc" | "desc" = "asc"): Task[] {
  return [...tasks].sort((a, b) => {
    const comparison = a.startDate.localeCompare(b.startDate)
    return direction === "asc" ? comparison : -comparison
  })
}

// タスクを担当者で並べ替え
export function sortByAssignee(tasks: Task[], direction: "asc" | "desc" = "asc"): Task[] {
  return [...tasks].sort((a, b) => {
    const comparison = a.assignee.localeCompare(b.assignee)
    return direction === "asc" ? comparison : -comparison
  })
}

// タスクを優先度で並べ替え
export function sortByPriority(tasks: Task[], direction: "asc" | "desc" = "asc"): Task[] {
  const priorityOrder = { high: 3, medium: 2, low: 1, undefined: 0 }
  
  return [...tasks].sort((a, b) => {
    const aPriority = a.priority ? priorityOrder[a.priority] : 0
    const bPriority = b.priority ? priorityOrder[b.priority] : 0
    const comparison = bPriority - aPriority // 高い優先度が先に来るように逆順
    
    return direction === "asc" ? comparison : -comparison
  })
}

// タスクを複数の条件で並べ替え
export function sortTasks(
  tasks: Task[], 
  sortBy: "name" | "dueDate" | "startDate" | "assignee" | "priority",
  direction: "asc" | "desc" = "asc"
): Task[] {
  const sortedTasks = [...tasks]
  
  switch (sortBy) {
    case "name":
      return sortByName(sortedTasks, direction)
    case "dueDate":
      return sortByDueDate(sortedTasks, direction)
    case "startDate":
      return sortByStartDate(sortedTasks, direction)
    case "assignee":
      return sortByAssignee(sortedTasks, direction)
    case "priority":
      return sortByPriority(sortedTasks, direction)
    default:
      return sortedTasks
  }
}

// 順序フィールドを使用して並べ替え（同じ値の場合）
export function applyOrderField(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order
    }
    return 0
  })
}