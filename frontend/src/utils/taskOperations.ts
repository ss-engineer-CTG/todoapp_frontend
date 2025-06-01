// システムプロンプト準拠：統合フラグアプローチによる大幅簡素化
// KISS原則：シンプルな統一処理
// DRY原則：重複削除、統一されたAPI呼び出し

import { Task, TaskApiActions } from '../types'
import { isDraftTask } from './taskUtils'
import { logger } from './logger'
import { handleError } from './errorHandler'
import { isValidDate } from './dateUtils'

/**
 * 統合タスク操作クラス（統合フラグアプローチで簡素化版）
 */
export class TaskOperations {
  private apiActions: TaskApiActions
  private allTasks: Task[]
  private selectedProjectId: string

  constructor(apiActions: TaskApiActions, allTasks: Task[], selectedProjectId: string) {
    this.apiActions = apiActions
    this.allTasks = allTasks
    this.selectedProjectId = selectedProjectId
  }

  /**
   * タスク削除処理（統合フラグ対応）
   */
  async deleteTask(taskId: string): Promise<boolean> {
    try {
      const task = this.allTasks.find(t => t.id === taskId)
      if (!task) {
        logger.warn('Task not found for deletion', { taskId })
        return false
      }

      // 統合フラグアプローチ：草稿タスクは単純に無視（状態管理は上位で処理）
      if (isDraftTask(task)) {
        logger.debug('Draft task deletion handled by state management', { taskId })
        return true
      }

      // 確定タスクの場合：API削除
      logger.info('Deleting confirmed task', { taskId })
      await this.apiActions.deleteTask(taskId)
      
      logger.info('Task deleted successfully', { taskId, taskName: task.name })
      return true
    } catch (error) {
      logger.error('Task deletion failed', { taskId, error })
      handleError(error, 'タスクの削除に失敗しました')
      return false
    }
  }

  /**
   * タスク完了状態切り替え処理（統合フラグ対応）
   */
  async toggleTaskCompletion(taskId: string): Promise<boolean> {
    try {
      const task = this.allTasks.find(t => t.id === taskId)
      if (!task) {
        logger.warn('Task not found for completion toggle', { taskId })
        return false
      }

      // 統合フラグアプローチ：草稿タスクは完了状態切り替え無効
      if (isDraftTask(task)) {
        logger.debug('Completion toggle skipped for draft task', { taskId })
        return false
      }

      logger.info('Toggling task completion', { taskId })

      const newCompletionState = !task.completed
      const completionDate = newCompletionState ? new Date() : null

      await this.apiActions.updateTask(taskId, {
        completed: newCompletionState,
        completionDate
      })

      logger.info('Task completion toggled successfully', { 
        taskId, 
        newState: newCompletionState 
      })
      return true
    } catch (error) {
      logger.error('Task completion toggle failed', { taskId, error })
      handleError(error, 'タスクの完了状態切り替えに失敗しました')
      return false
    }
  }

  /**
   * タスク折りたたみ切り替え処理（統合フラグ対応）
   */
  async toggleTaskCollapse(taskId: string): Promise<boolean> {
    try {
      const task = this.allTasks.find(t => t.id === taskId)
      if (!task) {
        logger.warn('Task not found for collapse toggle', { taskId })
        return false
      }

      // 統合フラグアプローチ：草稿タスクは折りたたみ無効
      if (isDraftTask(task)) {
        logger.debug('Collapse toggle skipped for draft task', { taskId })
        return false
      }

      logger.debug('Toggling task collapse', { taskId })

      await this.apiActions.updateTask(taskId, { collapsed: !task.collapsed })

      logger.debug('Task collapse toggled successfully', { 
        taskId, 
        newState: !task.collapsed 
      })
      return true
    } catch (error) {
      logger.error('Task collapse toggle failed', { taskId, error })
      handleError(error, 'タスクの折りたたみ切り替えに失敗しました')
      return false
    }
  }

  /**
   * すべての子タスクを取得（階層構造用）
   */
  getChildTasks(parentId: string, taskList: Task[]): Task[] {
    try {
      const directChildren = taskList.filter(task => task.parentId === parentId)
      let allChildren: Task[] = [...directChildren]

      directChildren.forEach(child => {
        allChildren = [...allChildren, ...this.getChildTasks(child.id, taskList)]
      })

      return allChildren
    } catch (error) {
      logger.error('Error getting child tasks', { parentId, error })
      return []
    }
  }

  /**
   * タスクコピー処理（統合フラグ対応：草稿タスクは除外）
   */
  async copyTasks(taskIds: string[]): Promise<Task[]> {
    try {
      logger.info('Copying tasks', { taskCount: taskIds.length, taskIds })

      // 統合フラグアプローチ：草稿タスクを除外
      const validTaskIds = taskIds.filter(id => {
        const task = this.allTasks.find(t => t.id === id)
        return task && !isDraftTask(task)
      })

      if (validTaskIds.length !== taskIds.length) {
        logger.warn('Some draft tasks excluded from copy operation', {
          originalCount: taskIds.length,
          validCount: validTaskIds.length
        })
      }

      const tasksToCopy = this.allTasks.filter(task => validTaskIds.includes(task.id))
      let allTasksToCopy: Task[] = [...tasksToCopy]

      // 子タスクも含める
      tasksToCopy.forEach(task => {
        const childTasks = this.getChildTasks(task.id, this.allTasks)
        const unselectedChildTasks = childTasks.filter(childTask => 
          !validTaskIds.includes(childTask.id) && !isDraftTask(childTask)
        )
        allTasksToCopy = [...allTasksToCopy, ...unselectedChildTasks]
      })

      logger.info('Tasks copied to clipboard', { 
        originalCount: taskIds.length,
        totalCount: allTasksToCopy.length 
      })

      return allTasksToCopy
    } catch (error) {
      logger.error('Task copy failed', { taskIds, error })
      handleError(error, 'タスクのコピーに失敗しました')
      return []
    }
  }

  /**
   * タスク貼り付け処理
   */
  async pasteTasks(
    copiedTasks: Task[], 
    targetParentId: string | null, 
    targetLevel: number
  ): Promise<boolean> {
    if (copiedTasks.length === 0 || !this.selectedProjectId) {
      return false
    }

    try {
      logger.info('Pasting tasks', { 
        count: copiedTasks.length, 
        targetParentId, 
        targetLevel,
        projectId: this.selectedProjectId 
      })

      // ルートタスクを処理
      const rootTasks = copiedTasks.filter(task => 
        !task.parentId || !copiedTasks.some(t => t.id === task.parentId)
      )

      const idMap: { [key: string]: string } = {}

      // ルートタスクを先に作成
      for (const rootTask of rootTasks) {
        const newTaskId = this.generateTaskId()
        idMap[rootTask.id] = newTaskId

        const newTask = {
          ...rootTask,
          name: `${rootTask.name}${rootTasks.length === 1 ? ' (コピー)' : ''}`,
          projectId: this.selectedProjectId,
          parentId: targetParentId,
          level: targetLevel,
          startDate: isValidDate(rootTask.startDate) ? rootTask.startDate : new Date(),
          dueDate: isValidDate(rootTask.dueDate) ? rootTask.dueDate : new Date(),
          completionDate: null // コピー時は未完了に設定
        }

        await this.apiActions.createTask(newTask)
      }

      // 子タスクを作成
      const childTasks = copiedTasks.filter(task => 
        task.parentId && copiedTasks.some(t => t.id === task.parentId)
      )

      for (const childTask of childTasks) {
        const newChildId = this.generateTaskId()
        idMap[childTask.id] = newChildId

        const newParentId = childTask.parentId ? idMap[childTask.parentId] : null
        const parentLevel = rootTasks.find(t => idMap[t.id] === newParentId)?.level || 0

        const newTask = {
          ...childTask,
          name: childTask.name,
          projectId: this.selectedProjectId,
          parentId: newParentId,
          level: parentLevel + 1,
          startDate: isValidDate(childTask.startDate) ? childTask.startDate : new Date(),
          dueDate: isValidDate(childTask.dueDate) ? childTask.dueDate : new Date(),
          completionDate: null
        }

        await this.apiActions.createTask(newTask)
      }

      logger.info('Tasks pasted successfully', { count: copiedTasks.length })
      return true
    } catch (error) {
      logger.error('Task paste failed', { error })
      handleError(error, 'タスクの貼り付けに失敗しました')
      return false
    }
  }

  /**
   * 通常タスクID生成
   */
  private generateTaskId(): string {
    return `t${Date.now()}`
  }
}

/**
 * TaskOperationsインスタンスを作成するファクトリー関数
 */
export const createTaskOperations = (
  apiActions: TaskApiActions,
  allTasks: Task[],
  selectedProjectId: string
): TaskOperations => {
  return new TaskOperations(apiActions, allTasks, selectedProjectId)
}