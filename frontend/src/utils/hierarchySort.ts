// システムプロンプト準拠：階層タスク表示順序問題解決
// KISS原則：シンプルで理解しやすい階層ソート機能のみ
// YAGNI原則：現在必要な機能のみ実装

import { Task, TaskRelationMap } from '../types'
import { logger } from './logger'

/**
 * システムプロンプト準拠：階層構造を維持したタスクソート
 * KISS原則：単一機能のみ - 親タスクの直下に子タスクを表示
 */
export const sortTasksHierarchically = (
  tasks: Task[], 
  relationMap: TaskRelationMap
): Task[] => {
  try {
    if (tasks.length === 0) {
      return []
    }

    logger.debug('Starting hierarchy sort', { 
      taskCount: tasks.length,
      hasRelationMap: Object.keys(relationMap.childrenMap).length > 0
    })

    // システムプロンプト準拠：DRY原則 - 既存のuseTaskRelationsを活用
    const sortedTasks: Task[] = []

    // ルートタスクを取得（parentId が null のタスク）
    const rootTasks = tasks.filter(task => !task.parentId)
    
    logger.debug('Root tasks identified', { 
      rootCount: rootTasks.length,
      totalTasks: tasks.length
    })

    // 再帰的に子タスクを追加する関数
    const addTaskWithChildren = (task: Task) => {
      try {
        // 現在のタスクを追加
        sortedTasks.push(task)

        // 子タスクを取得
        const childTaskIds = relationMap.childrenMap[task.id] || []
        const childTasks = childTaskIds
          .map(childId => tasks.find(t => t.id === childId))
          .filter((child): child is Task => child !== undefined)

        // 子タスクを再帰的に処理
        childTasks.forEach(child => {
          addTaskWithChildren(child)
        })
      } catch (error) {
        logger.error('Error adding task with children', { 
          taskId: task.id, 
          error 
        })
        // エラーが発生してもタスク自体は追加済みなので処理続行
      }
    }

    // ルートタスクから階層構造を構築
    rootTasks.forEach(rootTask => {
      addTaskWithChildren(rootTask)
    })

    // 孤立タスクの処理（親が存在しないが parent_id が設定されているタスク）
    const addedTaskIds = new Set(sortedTasks.map(t => t.id))
    const orphanTasks = tasks.filter(task => !addedTaskIds.has(task.id))

    if (orphanTasks.length > 0) {
      logger.warn('Orphan tasks detected and added to end', { 
        orphanCount: orphanTasks.length,
        orphanIds: orphanTasks.map(t => t.id)
      })
      orphanTasks.forEach(orphan => sortedTasks.push(orphan))
    }

    logger.debug('Hierarchy sort completed', {
      originalCount: tasks.length,
      sortedCount: sortedTasks.length,
      rootTasks: rootTasks.length,
      orphanTasks: orphanTasks.length
    })

    return sortedTasks

  } catch (error) {
    logger.error('Hierarchical sorting failed', { 
      taskCount: tasks.length, 
      error 
    })
    
    // システムプロンプト準拠：フォールバック処理
    logger.warn('Falling back to original task order due to sorting error')
    return tasks
  }
}