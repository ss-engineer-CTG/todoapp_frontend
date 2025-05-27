import type { Task, TaskStatus } from '@/types/task'

export function generateId(prefix: string): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function getChildTasks(parentId: string, tasks: Task[]): Task[] {
  const directChildren = tasks.filter(task => task.parentId === parentId)
  let allChildren: Task[] = [...directChildren]

  directChildren.forEach(child => {
    allChildren = [...allChildren, ...getChildTasks(child.id, tasks)]
  })

  return allChildren
}

export function getTaskDepth(task: Task, tasks: Task[]): number {
  let depth = 0
  let currentParentId = task.parentId

  while (currentParentId) {
    depth++
    const parent = tasks.find(t => t.id === currentParentId)
    currentParentId = parent?.parentId || null
  }

  return depth
}

export function getTaskPath(task: Task, tasks: Task[]): Task[] {
  const path: Task[] = [task]
  let currentParentId = task.parentId

  while (currentParentId) {
    const parent = tasks.find(t => t.id === currentParentId)
    if (parent) {
      path.unshift(parent)
      currentParentId = parent.parentId
    } else {
      break
    }
  }

  return path
}

export function isTaskOverdue(task: Task): boolean {
  if (task.completed) return false
  return new Date() > task.dueDate
}

export function getTaskStatusStyle(
  status: TaskStatus,
  projectColor: string,
  isMilestone = false,
  isSubtask = false
) {
  const zoomRatio = 1 // TODO: ズームレベルから取得

  const baseStyle = {
    borderWidth: isMilestone ? `${Math.max(1, Math.round(2 * zoomRatio))}px` : `${Math.max(1, Math.round(zoomRatio))}px`,
    borderStyle: isMilestone ? 'solid' : (isSubtask ? 'dashed' : 'solid')
  }

  const adjustColorForSubtask = (color: string) => {
    if (color.startsWith('#')) {
      const r = parseInt(color.substr(1, 2), 16)
      const g = parseInt(color.substr(3, 2), 16)
      const b = parseInt(color.substr(5, 2), 16)
      return `rgba(${r}, ${g}, ${b}, 0.4)`
    }
    return color
  }

  switch (status) {
    case 'completed':
      return {
        ...baseStyle,
        backgroundColor: isSubtask ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.65)',
        borderColor: isSubtask ? 'rgba(5, 150, 105, 0.45)' : 'rgba(5, 150, 105, 0.75)',
        textColor: isSubtask ? 'text-gray-700 dark:text-gray-300' : 'text-white',
        opacity: 1
      }
    case 'in-progress':
      const lightProjectColor = projectColor.startsWith('#') 
        ? (() => {
            const r = parseInt(projectColor.substr(1, 2), 16)
            const g = parseInt(projectColor.substr(3, 2), 16)
            const b = parseInt(projectColor.substr(5, 2), 16)
            return isSubtask 
              ? `rgba(${r}, ${g}, ${b}, 0.35)` 
              : `rgba(${r}, ${g}, ${b}, 0.65)`
          })()
        : (isSubtask ? adjustColorForSubtask(projectColor) : projectColor)
      
      return {
        ...baseStyle,
        backgroundColor: lightProjectColor,
        borderColor: lightProjectColor,
        textColor: isSubtask ? 'text-gray-700 dark:text-gray-300' : 'text-white',
        opacity: 1
      }
    case 'not-started':
      return {
        ...baseStyle,
        backgroundColor: isSubtask ? 'rgba(243, 244, 246, 0.4)' : 'rgba(243, 244, 246, 0.7)',
        borderColor: isSubtask ? 'rgba(156, 163, 175, 0.4)' : 'rgba(156, 163, 175, 0.6)',
        textColor: 'text-gray-600 dark:text-gray-400',
        opacity: 1
      }
    case 'overdue':
      return {
        ...baseStyle,
        backgroundColor: isSubtask ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.65)',
        borderColor: isSubtask ? 'rgba(220, 38, 38, 0.45)' : 'rgba(220, 38, 38, 0.75)',
        textColor: isSubtask ? 'text-gray-700 dark:text-gray-300' : 'text-white',
        opacity: 1
      }
    default:
      return {
        ...baseStyle,
        backgroundColor: isSubtask ? 'rgba(243, 244, 246, 0.4)' : 'rgba(243, 244, 246, 0.7)',
        borderColor: isSubtask ? 'rgba(156, 163, 175, 0.4)' : 'rgba(156, 163, 175, 0.6)',
        textColor: 'text-gray-600 dark:text-gray-400',
        opacity: 1
      }
  }
}

export function getDisplayText(text: string, zoomLevel: number, maxLength?: number): string {
  if (zoomLevel <= 30) return '' // 最小表示
  if (zoomLevel <= 50) return text.length > 5 ? text.substring(0, 3) + '…' : text
  if (zoomLevel <= 80) {
    const shortLength = maxLength || Math.floor(text.length * 0.7)
    return text.length > shortLength ? text.substring(0, shortLength - 1) + '…' : text
  }
  return text
}

export function calculateTaskProgress(task: Task, allTasks: Task[]): number {
  const childTasks = getChildTasks(task.id, allTasks)
  
  if (childTasks.length === 0) {
    return task.completed ? 1 : 0
  }

  const completedChildren = childTasks.filter(child => child.completed).length
  return completedChildren / childTasks.length
}

export function sortTasksByHierarchy(tasks: Task[]): Task[] {
  const taskMap = new Map<string, Task>()
  const rootTasks: Task[] = []
  const childrenMap = new Map<string, Task[]>()

  // マップを構築
  tasks.forEach(task => {
    taskMap.set(task.id, task)
    if (!task.parentId) {
      rootTasks.push(task)
    } else {
      if (!childrenMap.has(task.parentId)) {
        childrenMap.set(task.parentId, [])
      }
      childrenMap.get(task.parentId)!.push(task)
    }
  })

  const sortedTasks: Task[] = []

  function addTaskAndChildren(task: Task) {
    sortedTasks.push(task)
    const children = childrenMap.get(task.id) || []
    children
      .sort((a, b) => a.name.localeCompare(b.name)) // 名前でソート
      .forEach(child => addTaskAndChildren(child))
  }

  rootTasks
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(task => addTaskAndChildren(task))

  return sortedTasks
}