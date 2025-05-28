import type { Task, TaskStatus, TaskStats, TaskValidationResult } from '@/types/task'
import { TASK_VALIDATION } from '@/types/task'

export function generateId(prefix: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `${prefix}${timestamp}_${random}`
}

export function getChildTasks(parentId: string, tasks: Task[]): Task[] {
  try {
    if (!Array.isArray(tasks)) {
      console.warn('getChildTasks: tasks is not an array:', tasks)
      return []
    }

    const directChildren = tasks.filter(task => task?.parentId === parentId)
    let allChildren: Task[] = [...directChildren]

    directChildren.forEach(child => {
      if (child?.id) {
        allChildren = [...allChildren, ...getChildTasks(child.id, tasks)]
      }
    })

    return allChildren
  } catch (error) {
    console.error('Error getting child tasks:', error)
    return []
  }
}

export function getTaskDepth(task: Task, tasks: Task[]): number {
  try {
    if (!task || !Array.isArray(tasks)) {
      console.warn('getTaskDepth: invalid arguments:', { task, tasks })
      return 0
    }

    let depth = 0
    let currentParentId = task.parentId

    while (currentParentId && depth < 20) { // 無限ループ防止
      depth++
      const parent = tasks.find(t => t?.id === currentParentId)
      currentParentId = parent?.parentId || null
    }

    return depth
  } catch (error) {
    console.error('Error calculating task depth:', error)
    return 0
  }
}

export function getTaskPath(task: Task, tasks: Task[]): Task[] {
  try {
    if (!task || !Array.isArray(tasks)) {
      console.warn('getTaskPath: invalid arguments:', { task, tasks })
      return []
    }

    const path: Task[] = [task]
    let currentParentId = task.parentId
    let iterations = 0

    while (currentParentId && iterations < 20) { // 無限ループ防止
      iterations++
      const parent = tasks.find(t => t?.id === currentParentId)
      if (parent) {
        path.unshift(parent)
        currentParentId = parent.parentId
      } else {
        break
      }
    }

    return path
  } catch (error) {
    console.error('Error getting task path:', error)
    return []
  }
}

export function isTaskOverdue(task: Task): boolean {
  try {
    if (!task || task.completed) return false
    
    const now = new Date()
    const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate)
    
    if (isNaN(dueDate.getTime())) {
      console.warn('Invalid due date for task:', task.id)
      return false
    }

    return now > dueDate
  } catch (error) {
    console.error('Error checking if task is overdue:', error)
    return false
  }
}

export function getTaskStatusStyle(
  status: TaskStatus,
  projectColor: string,
  isMilestone = false,
  isSubtask = false
) {
  try {
    const zoomRatio = 1 // TODO: ズームレベルから取得

    const baseStyle = {
      borderWidth: isMilestone ? `${Math.max(1, Math.round(2 * zoomRatio))}px` : `${Math.max(1, Math.round(zoomRatio))}px`,
      borderStyle: isMilestone ? 'solid' : (isSubtask ? 'dashed' : 'solid')
    }

    const adjustColorForSubtask = (color: string) => {
      if (!color || typeof color !== 'string') return '#9ca3af'
      
      if (color.startsWith('#')) {
        try {
          const r = parseInt(color.substr(1, 2), 16)
          const g = parseInt(color.substr(3, 2), 16)
          const b = parseInt(color.substr(5, 2), 16)
          
          if (isNaN(r) || isNaN(g) || isNaN(b)) {
            return '#9ca3af'
          }
          
          return `rgba(${r}, ${g}, ${b}, 0.4)`
        } catch (error) {
          console.warn('Error parsing color:', color)
          return '#9ca3af'
        }
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
        const lightProjectColor = projectColor?.startsWith('#') 
          ? (() => {
              try {
                const r = parseInt(projectColor.substr(1, 2), 16)
                const g = parseInt(projectColor.substr(3, 2), 16)
                const b = parseInt(projectColor.substr(5, 2), 16)
                
                if (isNaN(r) || isNaN(g) || isNaN(b)) {
                  return isSubtask ? 'rgba(59, 130, 246, 0.35)' : 'rgba(59, 130, 246, 0.65)'
                }
                
                return isSubtask 
                  ? `rgba(${r}, ${g}, ${b}, 0.35)` 
                  : `rgba(${r}, ${g}, ${b}, 0.65)`
              } catch (error) {
                console.warn('Error processing project color:', projectColor)
                return isSubtask ? 'rgba(59, 130, 246, 0.35)' : 'rgba(59, 130, 246, 0.65)'
              }
            })()
          : (isSubtask ? adjustColorForSubtask(projectColor) : projectColor)
        
        return {
          ...baseStyle,
          backgroundColor: lightProjectColor,
          borderColor: lightProjectColor,
          textColor: isSubtask ? 'text-gray-700 dark:text-gray-300' : 'text-white',
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
      case 'not-started':
      default:
        return {
          ...baseStyle,
          backgroundColor: isSubtask ? 'rgba(243, 244, 246, 0.4)' : 'rgba(243, 244, 246, 0.7)',
          borderColor: isSubtask ? 'rgba(156, 163, 175, 0.4)' : 'rgba(156, 163, 175, 0.6)',
          textColor: 'text-gray-600 dark:text-gray-400',
          opacity: 1
        }
    }
  } catch (error) {
    console.error('Error getting task status style:', error)
    return {
      borderWidth: '1px',
      borderStyle: 'solid',
      backgroundColor: 'rgba(243, 244, 246, 0.7)',
      borderColor: 'rgba(156, 163, 175, 0.6)',
      textColor: 'text-gray-600 dark:text-gray-400',
      opacity: 1
    }
  }
}

export function getDisplayText(text: string, zoomLevel: number, maxLength?: number): string {
  try {
    if (typeof text !== 'string') {
      console.warn('getDisplayText: text is not a string:', text)
      return String(text || '')
    }

    if (typeof zoomLevel !== 'number' || zoomLevel < 0) {
      console.warn('getDisplayText: invalid zoom level:', zoomLevel)
      zoomLevel = 100
    }

    if (zoomLevel <= 30) return '' // 最小表示
    if (zoomLevel <= 50) return text.length > 5 ? text.substring(0, 3) + '…' : text
    if (zoomLevel <= 80) {
      const shortLength = maxLength || Math.floor(text.length * 0.7)
      return text.length > shortLength ? text.substring(0, shortLength - 1) + '…' : text
    }
    return text
  } catch (error) {
    console.error('Error getting display text:', error)
    return ''
  }
}

export function calculateTaskProgress(task: Task, allTasks: Task[]): number {
  try {
    if (!task || !Array.isArray(allTasks)) {
      console.warn('calculateTaskProgress: invalid arguments:', { task, allTasks })
      return 0
    }

    const childTasks = getChildTasks(task.id, allTasks)
    
    if (childTasks.length === 0) {
      return task.completed ? 1 : 0
    }

    const completedChildren = childTasks.filter(child => child?.completed).length
    return completedChildren / childTasks.length
  } catch (error) {
    console.error('Error calculating task progress:', error)
    return 0
  }
}

export function sortTasksByHierarchy(tasks: Task[]): Task[] {
  try {
    if (!Array.isArray(tasks)) {
      console.warn('sortTasksByHierarchy: tasks is not an array:', tasks)
      return []
    }

    const taskMap = new Map<string, Task>()
    const rootTasks: Task[] = []
    const childrenMap = new Map<string, Task[]>()

    // マップを構築
    tasks.forEach(task => {
      if (!task?.id) return
      
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
  } catch (error) {
    console.error('Error sorting tasks by hierarchy:', error)
    return tasks || []
  }
}

// タスクの統計情報を計算
export function calculateTaskStats(tasks: Task[]): TaskStats {
  try {
    if (!Array.isArray(tasks)) {
      console.warn('calculateTaskStats: tasks is not an array:', tasks)
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        overdue: 0,
        completionRate: 0
      }
    }

    const stats = {
      total: tasks.length,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      overdue: 0,
      completionRate: 0
    }

    tasks.forEach(task => {
      if (!task) return
      
      switch (task.status) {
        case 'completed':
          stats.completed++
          break
        case 'in-progress':
          stats.inProgress++
          break
        case 'overdue':
          stats.overdue++
          break
        case 'not-started':
        default:
          stats.notStarted++
          break
      }
    })

    stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

    return stats
  } catch (error) {
    console.error('Error calculating task stats:', error)
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      overdue: 0,
      completionRate: 0
    }
  }
}

// タスクのバリデーション
export function validateTask(task: Partial<Task>): TaskValidationResult {
  const errors: { field: keyof Task; message: string }[] = []

  try {
    // 名前のバリデーション
    if (!task.name || typeof task.name !== 'string') {
      errors.push({ field: 'name', message: 'タスク名は必須です' })
    } else if (task.name.length < TASK_VALIDATION.NAME_MIN_LENGTH) {
      errors.push({ field: 'name', message: 'タスク名は1文字以上で入力してください' })
    } else if (task.name.length > TASK_VALIDATION.NAME_MAX_LENGTH) {
      errors.push({ field: 'name', message: `タスク名は${TASK_VALIDATION.NAME_MAX_LENGTH}文字以下で入力してください` })
    }

    // プロジェクトIDのバリデーション
    if (!task.projectId || typeof task.projectId !== 'string') {
      errors.push({ field: 'projectId', message: 'プロジェクトを選択してください' })
    }

    // 日付のバリデーション
    if (task.startDate && task.dueDate) {
      const startDate = task.startDate instanceof Date ? task.startDate : new Date(task.startDate)
      const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate)
      
      if (!isNaN(startDate.getTime()) && !isNaN(dueDate.getTime()) && startDate > dueDate) {
        errors.push({ field: 'dueDate', message: '期限日は開始日以降を設定してください' })
      }
    }

    // メモの長さチェック
    if (task.notes && typeof task.notes === 'string' && task.notes.length > TASK_VALIDATION.NOTES_MAX_LENGTH) {
      errors.push({ field: 'notes', message: `メモは${TASK_VALIDATION.NOTES_MAX_LENGTH}文字以下で入力してください` })
    }

    // 担当者の長さチェック
    if (task.assignee && typeof task.assignee === 'string' && task.assignee.length > TASK_VALIDATION.ASSIGNEE_MAX_LENGTH) {
      errors.push({ field: 'assignee', message: `担当者は${TASK_VALIDATION.ASSIGNEE_MAX_LENGTH}文字以下で入力してください` })
    }

    // レベルのチェック
    if (task.level !== undefined && (typeof task.level !== 'number' || task.level < 0 || task.level > TASK_VALIDATION.MAX_LEVEL)) {
      errors.push({ field: 'level', message: `レベルは0から${TASK_VALIDATION.MAX_LEVEL}の間で設定してください` })
    }

    // タグのチェック
    if (task.tags && Array.isArray(task.tags)) {
      if (task.tags.length > TASK_VALIDATION.TAGS_MAX_COUNT) {
        errors.push({ field: 'tags', message: `タグは${TASK_VALIDATION.TAGS_MAX_COUNT}個以下で設定してください` })
      }
      
      task.tags.forEach(tag => {
        if (typeof tag === 'string' && tag.length > TASK_VALIDATION.TAG_MAX_LENGTH) {
          errors.push({ field: 'tags', message: `タグは${TASK_VALIDATION.TAG_MAX_LENGTH}文字以下で入力してください` })
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  } catch (error) {
    console.error('Error validating task:', error)
    return {
      isValid: false,
      errors: [{ field: 'name', message: 'バリデーションエラーが発生しました' }]
    }
  }
}

// タスクの検索
export function searchTasks(tasks: Task[], query: string): Task[] {
  try {
    if (!Array.isArray(tasks) || typeof query !== 'string') {
      console.warn('searchTasks: invalid arguments:', { tasks, query })
      return []
    }

    if (query.trim() === '') return tasks

    const searchQuery = query.toLowerCase().trim()

    return tasks.filter(task => {
      if (!task) return false
      
      return (
        task.name?.toLowerCase().includes(searchQuery) ||
        task.notes?.toLowerCase().includes(searchQuery) ||
        task.assignee?.toLowerCase().includes(searchQuery) ||
        task.tags?.some(tag => tag?.toLowerCase().includes(searchQuery))
      )
    })
  } catch (error) {
    console.error('Error searching tasks:', error)
    return []
  }
}