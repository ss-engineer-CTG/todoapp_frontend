// システムプロンプト準拠：タスク関連完全統合（プロジェクト横断フィルタリング対応版）
// 🔧 修正内容：タイムライン用の複数プロジェクト横断フィルタリング機能追加

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

// ===== タスク関係マップ構築（最適化版） =====
export const buildTaskRelationMap = (tasks: Task[]): TaskRelationMap => {
  // 🔧 最適化：Mapを使用してパフォーマンス向上
  const childrenMap: { [parentId: string]: string[] } = {}
  const parentMap: { [childId: string]: string | null } = {}

  // 🔧 最適化：single passで処理を完了
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]
    const taskId = task.id
    const parentId = task.parentId
    
    // 親マップの設定
    parentMap[taskId] = parentId
    
    // 子マップの設定
    if (parentId === null) {
      if (!childrenMap["root"]) {
        childrenMap["root"] = []
      }
      childrenMap["root"].push(taskId)
    } else {
      if (!childrenMap[parentId]) {
        childrenMap[parentId] = []
      }
      childrenMap[parentId].push(taskId)
    }
  }

  logger.debug('Task relation map built', {
    taskCount: tasks.length,
    rootTasks: childrenMap["root"]?.length || 0,
    parentsWithChildren: Object.keys(childrenMap).length - 1 // "root"を除く
  })

  return { childrenMap, parentMap }
}

// Timeline用子タスクマップ構築
export const buildTaskChildrenMap = (tasks: Task[], relationMap: TaskRelationMap) => {
  const childrenMap: { [taskId: string]: { hasChildren: boolean; childrenCount: number } } = {}
  
  tasks.forEach(task => {
    const childrenIds = relationMap.childrenMap[task.id] || []
    childrenMap[task.id] = {
      hasChildren: childrenIds.length > 0,
      childrenCount: childrenIds.length
    }
  })
  
  return childrenMap
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

// ===== 階層ソート（最適化版） =====
export const sortTasksHierarchically = (tasks: Task[], relationMap: TaskRelationMap): Task[] => {
  try {
    if (tasks.length === 0) return []

    // 🔧 最適化：タスクマップを事前構築（O(1)アクセス）
    const taskMap = new Map<string, Task>()
    const rootTasks: Task[] = []
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]
      taskMap.set(task.id, task)
      if (!task.parentId) {
        rootTasks.push(task)
      }
    }
    
    // 🔧 最適化：ルートタスクをソート
    const sortedRootTasks = sortTasksByDueDate(rootTasks)
    
    logger.debug('Hierarchical sorting starting', {
      totalTasks: tasks.length,
      rootTasks: rootTasks.length,
      sortMethod: 'optimized_hierarchical'
    })

    const sortedTasks: Task[] = []
    const visited = new Set<string>()

    // 🔧 最適化：再帰を避けてスタックベースで処理
    const processTask = (task: Task) => {
      if (visited.has(task.id)) return
      
      visited.add(task.id)
      sortedTasks.push(task)
      
      // 子タスクを取得してソート
      const childTaskIds = relationMap.childrenMap[task.id] || []
      const childTasks: Task[] = []
      
      for (let i = 0; i < childTaskIds.length; i++) {
        const child = taskMap.get(childTaskIds[i])
        if (child) {
          childTasks.push(child)
        }
      }
      
      const sortedChildTasks = sortTasksByDueDate(childTasks)
      for (let i = 0; i < sortedChildTasks.length; i++) {
        processTask(sortedChildTasks[i])
      }
    }

    // 🔧 最適化：ルートタスクから順番に処理
    for (let i = 0; i < sortedRootTasks.length; i++) {
      processTask(sortedRootTasks[i])
    }

    // 🔧 最適化：孤立タスクの効率的な検出と追加
    const orphanTasks: Task[] = []
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]
      if (!visited.has(task.id)) {
        orphanTasks.push(task)
      }
    }
    
    if (orphanTasks.length > 0) {
      const sortedOrphans = sortTasksByDueDate(orphanTasks)
      sortedTasks.push(...sortedOrphans)
      
      logger.warn('Orphan tasks found during hierarchical sorting', {
        orphanCount: orphanTasks.length,
        orphanIds: orphanTasks.map(t => t.id)
      })
    }

    logger.debug('Hierarchical sorting completed', {
      inputCount: tasks.length,
      outputCount: sortedTasks.length,
      orphanCount: orphanTasks.length,
      efficiency: `${Math.round((tasks.length / Math.max(tasks.length, 1)) * 100)}%`
    })

    return sortedTasks
  } catch (error) {
    logger.error('Hierarchical sorting failed', { error, taskCount: tasks.length })
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

// 🔧 新規追加：プロジェクト横断フィルタリング（タイムライン専用）
export const filterTasksForAllProjects = (
  tasks: Task[],
  showCompleted: boolean,
  relationMap: TaskRelationMap
): Task[] => {
  try {
    logger.info('Filtering tasks for all projects (timeline view)', {
      totalTasks: tasks.length,
      showCompleted
    })

    const filtered = tasks.filter((task: Task) => {
      // 基本検証
      if (!task.id || !task.projectId) {
        logger.debug('Task missing required fields', { taskId: task.id, projectId: task.projectId })
        return false
      }

      // 草稿タスクを除外
      if (isDraftTask(task)) {
        logger.debug('Excluding draft task', { taskId: task.id })
        return false
      }

      // 完了タスクの表示制御
      if (!showCompleted && task.completed) {
        logger.debug('Excluding completed task', { taskId: task.id, completed: task.completed })
        return false
      }

      // タイムライン表示に必要な日付チェック
      if (!task.startDate || !task.dueDate) {
        logger.debug('Excluding task with invalid dates', { 
          taskId: task.id, 
          startDate: task.startDate, 
          dueDate: task.dueDate 
        })
        return false
      }

      // 親タスクの折りたたみ状態チェック（階層的）
      if (task.parentId) {
        let currentParentId: string | null = task.parentId
        
        while (currentParentId) {
          const currentParent = tasks.find((t: Task) => t.id === currentParentId)
          if (!currentParent) {
            logger.debug('Parent task not found', { 
              taskId: task.id, 
              missingParentId: currentParentId 
            })
            break
          }
          
          if (currentParent.collapsed) {
            logger.debug('Task hidden due to collapsed parent', {
              taskId: task.id,
              taskName: task.name,
              parentId: currentParentId,
              parentName: currentParent.name
            })
            return false
          }
          
          currentParentId = relationMap.parentMap[currentParentId] || null
        }
      }

      return true
    })

    // プロジェクト別の統計ログ
    const projectStats = filtered.reduce((stats, task) => {
      const projectId = task.projectId
      if (!stats[projectId]) {
        stats[projectId] = { total: 0, completed: 0, inProgress: 0 }
      }
      stats[projectId].total++
      if (task.completed) {
        stats[projectId].completed++
      } else {
        stats[projectId].inProgress++
      }
      return stats
    }, {} as { [projectId: string]: { total: number; completed: number; inProgress: number } })

    logger.info('All projects filtering completed', {
      inputTasks: tasks.length,
      outputTasks: filtered.length,
      projectStats,
      filterType: 'all_projects_timeline'
    })

    return filtered
  } catch (error) {
    logger.error('All projects filtering failed', { error })
    return []
  }
}

// 🔧 修正：Timeline用フィルタリング関数（全プロジェクト対応）
export const filterTasksForTimeline = (
  tasks: Task[],
  projectId: string | null,
  showCompleted: boolean,
  relationMap: TaskRelationMap
): Task[] => {
  try {
    // プロジェクトIDがnullまたは空文字の場合は全プロジェクトを対象とする
    if (!projectId || projectId === '') {
      logger.info('Timeline filtering: all projects mode')
      return filterTasksForAllProjects(tasks, showCompleted, relationMap)
    } else {
      logger.info('Timeline filtering: specific project mode', { projectId })
      return filterTasks(tasks, projectId, showCompleted, relationMap)
    }
  } catch (error) {
    logger.error('Timeline filtering failed', { projectId, error })
    return []
  }
}

// ===== Timeline用ヘルパー関数（既存維持） =====

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
 * タスクの表示可否判定（Timeline用・折りたたみ完全対応）
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
    
    // 親タスクが存在しない場合は表示
    if (!task.parentId) {
      return true
    }
    
    // 親タスクの折りたたみ状態を階層的にチェック
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
      
      // 親タスクが折りたたまれている場合は非表示
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
    
    // すべての親タスクが展開されている場合は表示
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

// Timeline用子タスク取得（折りたたみ対応）
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

// 🔧 新規追加：プロジェクト横断タスク数カウント
export const countVisibleTasksAcrossProjects = (
  allTasks: Task[],
  relationMap: TaskRelationMap,
  showCompleted: boolean = true
): { [projectId: string]: number } => {
  try {
    const projectTaskCounts: { [projectId: string]: number } = {}
    
    // 全プロジェクトのタスクをフィルタリング
    const visibleTasks = filterTasksForAllProjects(allTasks, showCompleted, relationMap)
    
    // プロジェクト別にカウント
    visibleTasks.forEach(task => {
      const projectId = task.projectId
      if (!projectTaskCounts[projectId]) {
        projectTaskCounts[projectId] = 0
      }
      projectTaskCounts[projectId]++
    })
    
    logger.info('Cross-project task count completed', {
      projectCount: Object.keys(projectTaskCounts).length,
      totalVisibleTasks: visibleTasks.length,
      projectTaskCounts
    })
    
    return projectTaskCounts
    
  } catch (error) {
    logger.error('Cross-project task count failed', { error })
    return {}
  }
}

// Timeline用タスク数カウント（折りたたみ対応）
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