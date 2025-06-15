// システムプロンプト準拠：タスク関連完全統合（Timeline折りたたみ対応強化版）
// 🔧 修正内容：isTaskVisibleInTimeline関数の折りたたみ対応強化

import { Task } from '@core/types'
import { TaskRelationMap } from '@tasklist/types'
import { logger } from '@core/utils'

// ===== 草稿タスク管理（既存維持） =====
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

// ===== タスク関係マップ構築（既存維持） =====
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

// ===== 期限順ソート処理（既存維持） =====
export const sortTasksByDueDate = (tasks: Task[]): Task[] => {
  try {
    return tasks.sort((a, b) => {
      const dueDateA = new Date(a.dueDate).getTime()
      const dueDateB = new Date(b.dueDate).getTime()
      
      if (dueDateA === dueDateB) {
        const createdA = new Date(a.createdAt || 0).getTime()
        const createdB = new Date(b.createdAt || 0).getTime()
        return createdA - createdB
      }
      
      return dueDateA - dueDateB
    })
  } catch (error) {
    logger.error('Due date sorting failed', { taskCount: tasks.length, error })
    return tasks
  }
}

// ===== 階層ソート（既存維持） =====
export const sortTasksHierarchically = (tasks: Task[], relationMap: TaskRelationMap): Task[] => {
  try {
    if (tasks.length === 0) return []

    const sortedTasks: Task[] = []
    const rootTasks = tasks.filter(task => !task.parentId)
    const sortedRootTasks = sortTasksByDueDate(rootTasks)
    
    logger.info('Hierarchical sorting with due date priority', {
      totalTasks: tasks.length,
      rootTasks: rootTasks.length,
      sortMethod: 'due_date_hierarchical'
    })

    const addTaskWithChildren = (task: Task) => {
      sortedTasks.push(task)
      
      const childTaskIds = relationMap.childrenMap[task.id] || []
      const childTasks = childTaskIds
        .map(childId => tasks.find(t => t.id === childId))
        .filter((child): child is Task => child !== undefined)
      
      const sortedChildTasks = sortTasksByDueDate(childTasks)
      sortedChildTasks.forEach(child => addTaskWithChildren(child))
    }

    sortedRootTasks.forEach(rootTask => addTaskWithChildren(rootTask))

    const addedTaskIds = new Set(sortedTasks.map(t => t.id))
    const orphanTasks = tasks.filter(task => !addedTaskIds.has(task.id))
    const sortedOrphans = sortTasksByDueDate(orphanTasks)
    sortedOrphans.forEach(orphan => sortedTasks.push(orphan))

    logger.info('Hierarchical sorting completed', {
      inputCount: tasks.length,
      outputCount: sortedTasks.length,
      orphanCount: orphanTasks.length
    })

    return sortedTasks
  } catch (error) {
    logger.error('Hierarchical sorting failed', { error })
    return tasks
  }
}

// ===== 草稿タスク作成（既存維持） =====
export const createDraftTask = (projectId: string, parentId: string | null = null, level: number = 0): Task => {
  return {
    id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    projectId,
    parentId,
    completed: false,
    startDate: null as any,
    dueDate: null as any,
    completionDate: null,
    notes: '',
    assignee: '自分',
    level,
    collapsed: false,
    _isDraft: true
  }
}

// ===== タスクコピー処理（既存維持） =====
export const copyTasksWithHierarchy = (tasks: Task[], taskIds: string[]): Task[] => {
  try {
    const validTaskIds = taskIds.filter(id => {
      const task = tasks.find(t => t.id === id)
      return task && !isDraftTask(task)
    })

    const tasksToCopy = tasks.filter(task => validTaskIds.includes(task.id))
    let allTasksToCopy: Task[] = [...tasksToCopy]

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

// ===== タスクフィルタリング（既存維持） =====
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
    if (isDraftTask(task)) return false

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

// ===== Timeline用ヘルパー関数（既存維持） =====

/**
 * Timeline用タスクフィルタリング
 */
export const filterTasksForTimeline = (
  tasks: Task[],
  projectId: string,
  showCompleted: boolean,
  relationMap: TaskRelationMap
): Task[] => {
  try {
    const basicFiltered = filterTasks(tasks, projectId, showCompleted, relationMap)
    
    // Timeline固有のフィルタ条件
    return basicFiltered.filter(task => {
      // 無効な日付のタスクを除外（Timeline表示に必須）
      if (!task.startDate || !task.dueDate) return false
      
      return true
    })
  } catch (error) {
    logger.error('Timeline task filtering failed', { projectId, error })
    return []
  }
}

/**
 * タスクの階層深度計算
 */
export const calculateMaxTaskLevel = (tasks: Task[]): number => {
  try {
    if (tasks.length === 0) return 0
    
    const levels = tasks.map(task => task.level || 0)
    const maxLevel = Math.max(...levels)
    
    logger.info('Task level analysis', {
      taskCount: tasks.length,
      maxLevel
    })
    
    return maxLevel
  } catch (error) {
    logger.error('Max task level calculation failed', { error })
    return 0
  }
}

/**
 * Timeline用タスクステータス計算
 */
export const calculateTimelineTaskStatus = (task: Task): 'completed' | 'in-progress' | 'not-started' | 'overdue' => {
  try {
    if (task.completed) return 'completed'
    
    const now = new Date()
    const dueDate = new Date(task.dueDate)
    const startDate = new Date(task.startDate)
    
    if (now > dueDate) return 'overdue'
    if (now >= startDate) return 'in-progress'
    
    return 'not-started'
  } catch (error) {
    logger.error('Timeline task status calculation failed', { taskId: task.id, error })
    return 'not-started'
  }
}

/**
 * 🔧 修正：タスクの表示可否判定（Timeline用・折りたたみ完全対応）
 */
export const isTaskVisibleInTimeline = (
  task: Task,
  allTasks: Task[],
  relationMap: TaskRelationMap
): boolean => {
  try {
    // 基本チェック：草稿タスクは非表示
    if (isDraftTask(task)) {
      return false
    }
    
    // 🔧 修正：親タスクが存在しない場合は表示
    if (!task.parentId) {
      return true
    }
    
    // 🔧 修正：親タスクの折りたたみ状態を階層的にチェック
    let currentParentId: string | null = task.parentId
    
    while (currentParentId) {
      const parentTask = allTasks.find(t => t.id === currentParentId)
      
      // 親タスクが見つからない場合はエラーログを出すが表示はする
      if (!parentTask) {
        logger.warn('Parent task not found', { 
          taskId: task.id, 
          taskName: task.name,
          missingParentId: currentParentId 
        })
        break
      }
      
      // 🆕 新規追加：親タスクが折りたたまれている場合は非表示
      if (parentTask.collapsed) {
        logger.debug('Task hidden due to collapsed parent', {
          taskId: task.id,
          taskName: task.name,
          parentId: currentParentId,
          parentName: parentTask.name,
          parentCollapsed: parentTask.collapsed
        })
        return false
      }
      
      // 次の親へ移動
      currentParentId = relationMap.parentMap[currentParentId] || null
    }
    
    // 🔧 修正：すべての親タスクが展開されている場合は表示
    return true
    
  } catch (error) {
    logger.error('Task visibility check failed', { 
      taskId: task.id, 
      taskName: task.name,
      error 
    })
    // エラー時はデフォルトで表示（安全側に倒す）
    return true
  }
}

// 🆕 新規追加：Timeline用子タスク取得（折りたたみ対応）
export const getVisibleChildTasks = (
  parentTaskId: string,
  allTasks: Task[],
  relationMap: TaskRelationMap
): Task[] => {
  try {
    const parentTask = allTasks.find(t => t.id === parentTaskId)
    
    // 親タスクが折りたたまれている場合は空配列を返す
    if (!parentTask || parentTask.collapsed) {
      return []
    }
    
    const childrenIds = relationMap.childrenMap[parentTaskId] || []
    const childTasks = childrenIds
      .map(childId => allTasks.find(t => t.id === childId))
      .filter((child): child is Task => child !== undefined)
    
    // 再帰的に子タスクの子タスクも取得（展開されている場合のみ）
    const allVisibleChildren: Task[] = [...childTasks]
    
    childTasks.forEach(child => {
      if (!child.collapsed) {
        const grandChildren = getVisibleChildTasks(child.id, allTasks, relationMap)
        allVisibleChildren.push(...grandChildren)
      }
    })
    
    return allVisibleChildren
    
  } catch (error) {
    logger.error('Get visible child tasks failed', { parentTaskId, error })
    return []
  }
}

// 🆕 新規追加：Timeline用タスク数カウント（折りたたみ対応）
export const countVisibleTasksInProject = (
  projectId: string,
  allTasks: Task[],
  relationMap: TaskRelationMap
): number => {
  try {
    const projectTasks = allTasks.filter(task => 
      task.projectId === projectId && !isDraftTask(task)
    )
    
    return projectTasks.filter(task => 
      isTaskVisibleInTimeline(task, allTasks, relationMap)
    ).length
    
  } catch (error) {
    logger.error('Count visible tasks failed', { projectId, error })
    return 0
  }
}