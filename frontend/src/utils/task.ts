// システムプロンプト準拠：タスク関連完全統合（taskUtils + hierarchySort + taskOperations）

import { Task, TaskRelationMap } from '../types'
import { logger } from './core'

// ===== 草稿タスク管理（簡素化） =====
export const isDraftTask = (task: Task): boolean => {
  return !!task._isDraft
}

export const canCompleteTask = (task: Task): boolean => {
  return !isDraftTask(task)
}

export const canCopyTask = (task: Task): boolean => {
  return !isDraftTask(task)
}

export const canCollapseTask = (task: Task): boolean => {
  return !isDraftTask(task)
}

export const filterValidTasksForBatch = (tasks: Task[], taskIds: string[]): string[] => {
  return taskIds.filter(id => {
    const task = tasks.find(t => t.id === id)
    return task && !isDraftTask(task)
  })
}

// ===== タスク関係マップ構築 =====
export const buildTaskRelationMap = (tasks: Task[]): TaskRelationMap => {
  const childrenMap: { [parentId: string]: string[] } = {}
  const parentMap: { [childId: string]: string | null } = {}

  tasks.forEach((task) => {
    if (task.parentId === null) {
      childrenMap["root"] = childrenMap["root"] || []
      childrenMap["root"].push(task.id)
      parentMap[task.id] = null
    } else {
      childrenMap[task.parentId] = childrenMap[task.parentId] || []
      childrenMap[task.parentId].push(task.id)
      parentMap[task.id] = task.parentId
    }
  })

  return { childrenMap, parentMap }
}

// ===== 階層ソート（簡素化） =====
export const sortTasksHierarchically = (tasks: Task[], relationMap: TaskRelationMap): Task[] => {
  try {
    if (tasks.length === 0) return []

    const sortedTasks: Task[] = []
    const rootTasks = tasks.filter(task => !task.parentId)

    const addTaskWithChildren = (task: Task) => {
      sortedTasks.push(task)
      const childTaskIds = relationMap.childrenMap[task.id] || []
      const childTasks = childTaskIds
        .map(childId => tasks.find(t => t.id === childId))
        .filter((child): child is Task => child !== undefined)
      
      childTasks.forEach(child => addTaskWithChildren(child))
    }

    rootTasks.forEach(rootTask => addTaskWithChildren(rootTask))

    // 孤立タスクの処理
    const addedTaskIds = new Set(sortedTasks.map(t => t.id))
    const orphanTasks = tasks.filter(task => !addedTaskIds.has(task.id))
    orphanTasks.forEach(orphan => sortedTasks.push(orphan))

    return sortedTasks
  } catch (error) {
    logger.error('Hierarchical sorting failed', { error })
    return tasks // フォールバック
  }
}

// ===== 草稿タスク作成（修正：日付初期値をnullに変更） =====
export const createDraftTask = (projectId: string, parentId: string | null = null, level: number = 0): Task => {
  return {
    id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    projectId,
    parentId,
    completed: false,
    startDate: null as any, // 修正：初期値をnullに変更
    dueDate: null as any,   // 修正：初期値をnullに変更
    completionDate: null,
    notes: '',
    assignee: '自分',
    level,
    collapsed: false,
    _isDraft: true
  }
}

// ===== タスクコピー処理 =====
export const copyTasksWithHierarchy = (tasks: Task[], taskIds: string[]): Task[] => {
  try {
    const validTaskIds = taskIds.filter(id => {
      const task = tasks.find(t => t.id === id)
      return task && !isDraftTask(task)
    })

    const tasksToCopy = tasks.filter(task => validTaskIds.includes(task.id))
    let allTasksToCopy: Task[] = [...tasksToCopy]

    // 子タスクも含める
    const getChildTasks = (parentId: string): Task[] => {
      const directChildren = tasks.filter(task => task.parentId === parentId && !isDraftTask(task))
      let allChildren: Task[] = [...directChildren]
      directChildren.forEach(child => {
        allChildren = [...allChildren, ...getChildTasks(child.id)]
      })
      return allChildren
    }

    tasksToCopy.forEach(task => {
      const childTasks = getChildTasks(task.id)
      const unselectedChildTasks = childTasks.filter(childTask => !validTaskIds.includes(childTask.id))
      allTasksToCopy = [...allTasksToCopy, ...unselectedChildTasks]
    })

    return allTasksToCopy
  } catch (error) {
    logger.error('Task copy failed', { taskIds, error })
    return []
  }
}

// ===== タスクフィルタリング =====
export const filterTasks = (
  tasks: Task[], 
  projectId: string, 
  showCompleted: boolean, 
  relationMap: TaskRelationMap
): Task[] => {
  return tasks.filter((task: Task) => {
    if (!task.id || !task.projectId) return false
    if (task.projectId !== projectId) return false
    if (!showCompleted && task.completed) return false
    if (isDraftTask(task)) return false // 草稿タスクは一覧に表示しない

    // 親タスクが折りたたまれている場合は非表示
    if (task.parentId) {
      let currentParentId: string | null = task.parentId
      while (currentParentId) {
        const currentParent = tasks.find((t: Task) => t.id === currentParentId)
        if (currentParent && currentParent.collapsed) return false
        currentParentId = relationMap.parentMap[currentParentId] || null
      }
    }

    return true
  })
}