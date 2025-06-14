// システムプロンプト準拠：タスク関連完全統合（Timeline用関数追加版）
// 🔧 修正内容：既存機能保持 + Timeline用ヘルパー関数追加
// DRY原則：Timelineでも同じ階層管理ロジックを活用

import { Task } from '@core/types'
import { TaskRelationMap } from '@tasklist/types'
import { logger } from '@core/utils/core'

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

// 🆕 ===== Timeline用ヘルパー関数（新規追加） =====

/**
 * Timeline用タスクフィルタリング
 * 既存のfilterTasksをベースに、Timeline固有の条件を追加
 */
export const filterTasksForTimeline = (
  tasks: Task[],
  projectId: string,
  showCompleted: boolean,
  relationMap: TaskRelationMap,
  maxLevel: number = 10
): Task[] => {
  try {
    const basicFiltered = filterTasks(tasks, projectId, showCompleted, relationMap)
    
    // Timeline固有のフィルタ条件
    return basicFiltered.filter(task => {
      // 階層レベル制限
      if (task.level > maxLevel) return false
      
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
 * Timeline表示での最大階層深度を取得
 */
export const calculateMaxTaskLevel = (tasks: Task[]): number => {
  try {
    if (tasks.length === 0) return 0
    
    const levels = tasks.map(task => task.level || 0)
    const maxLevel = Math.max(...levels)
    
    logger.info('Task level analysis', {
      taskCount: tasks.length,
      maxLevel,
      levelDistribution: levels.reduce((acc, level) => {
        acc[level] = (acc[level] || 0) + 1
        return acc
      }, {} as { [level: number]: number })
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
 * プロジェクト内タスクの階層統計情報取得
 */
export const getProjectTaskHierarchyStats = (
  tasks: Task[],
  projectId: string,
  relationMap: TaskRelationMap
): {
  totalTasks: number
  maxLevel: number
  levelCounts: { [level: number]: number }
  hasComplexHierarchy: boolean
} => {
  try {
    const projectTasks = tasks.filter(task => task.projectId === projectId)
    const maxLevel = calculateMaxTaskLevel(projectTasks)
    
    const levelCounts = projectTasks.reduce((acc, task) => {
      const level = task.level || 0
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as { [level: number]: number })
    
    // 複雑な階層かどうかの判定（3階層以上 or 50タスク以上）
    const hasComplexHierarchy = maxLevel >= 3 || projectTasks.length >= 50
    
    return {
      totalTasks: projectTasks.length,
      maxLevel,
      levelCounts,
      hasComplexHierarchy
    }
  } catch (error) {
    logger.error('Project hierarchy stats calculation failed', { projectId, error })
    return {
      totalTasks: 0,
      maxLevel: 0,
      levelCounts: {},
      hasComplexHierarchy: false
    }
  }
}

/**
 * Timeline表示最適化のためのタスク分析
 */
export const analyzeTasksForTimelineOptimization = (
  tasks: Task[],
  relationMap: TaskRelationMap
): {
  shouldUseVirtualization: boolean
  recommendedZoomLevel: number
  maxSafeHierarchyLevel: number
  performanceWarnings: string[]
} => {
  try {
    const warnings: string[] = []
    const totalTasks = tasks.length
    const maxLevel = calculateMaxTaskLevel(tasks)
    
    // 仮想化推奨条件
    const shouldUseVirtualization = totalTasks > 100 || maxLevel > 5
    
    // 推奨ズームレベル計算
    let recommendedZoomLevel = 100
    if (totalTasks > 200) {
      recommendedZoomLevel = 60
      warnings.push('大量タスクのため、ズームレベル60%以下を推奨')
    } else if (maxLevel > 4) {
      recommendedZoomLevel = 80
      warnings.push('深い階層のため、ズームレベル80%以下を推奨')
    }
    
    // 安全な階層レベル
    const maxSafeHierarchyLevel = totalTasks > 500 ? 2 : totalTasks > 200 ? 3 : 5
    
    if (maxLevel > maxSafeHierarchyLevel) {
      warnings.push(`パフォーマンスのため、階層${maxSafeHierarchyLevel}レベルまでの表示を推奨`)
    }
    
    logger.info('Timeline optimization analysis completed', {
      totalTasks,
      maxLevel,
      shouldUseVirtualization,
      recommendedZoomLevel,
      maxSafeHierarchyLevel,
      warningCount: warnings.length
    })
    
    return {
      shouldUseVirtualization,
      recommendedZoomLevel,
      maxSafeHierarchyLevel,
      performanceWarnings: warnings
    }
  } catch (error) {
    logger.error('Timeline optimization analysis failed', { error })
    return {
      shouldUseVirtualization: false,
      recommendedZoomLevel: 100,
      maxSafeHierarchyLevel: 3,
      performanceWarnings: ['分析エラーが発生しました']
    }
  }
}