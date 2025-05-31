// システムプロンプト準拠：DRY原則によるタスク操作共通処理
import { Task, TaskApiActions } from '../types'
import { logger } from './logger'
import { handleError } from './errorHandler'
import { isValidDate } from './dateUtils'

/**
 * タスク操作の共通処理ユーティリティ
 * システムプロンプト準拠：ビジネスロジックの一元化
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
   * ID生成（システムプロンプト準拠：一元化）
   */
  private generateTaskId(): string {
    return `t${Date.now()}`
  }

  /**
   * システムプロンプト準拠：タスク追加処理（ショートカット・UI共通）
   * KISS原則：空名前対応の最小限修正
   */
  async addTask(
    parentId: string | null = null, 
    level = 0, 
    name?: string
  ): Promise<Task | null> {
    if (!this.selectedProjectId) {
      logger.warn('No project selected for task creation')
      return null
    }

    try {
      logger.info('Creating new task', { 
        parentId, 
        level, 
        projectId: this.selectedProjectId,
        hasName: !!name,
        source: name ? 'UI' : 'shortcut'
      })

      // 親タスクの情報を取得（日付継承用）
      const parentTask = parentId ? this.allTasks.find(task => task.id === parentId) : null

      // システムプロンプト準拠：日付フィールドの安全な処理
      const startDate = parentTask?.startDate && isValidDate(parentTask.startDate) 
        ? parentTask.startDate 
        : new Date()
      const dueDate = parentTask?.dueDate && isValidDate(parentTask.dueDate) 
        ? parentTask.dueDate 
        : new Date()

      const newTaskData = {
        // システムプロンプト準拠：KISS原則 - 1行修正で空名前対応
        name: name || '',
        projectId: this.selectedProjectId,
        parentId,
        completed: false,
        startDate,
        dueDate,
        completionDate: null,
        notes: '',
        assignee: '自分',
        level,
        collapsed: false,
      }

      const createdTask = await this.apiActions.createTask(newTaskData)
      
      logger.info('Task created successfully', { 
        taskId: createdTask.id, 
        taskName: createdTask.name,
        isEmpty: !createdTask.name.trim()
      })
      
      return createdTask
    } catch (error) {
      logger.error('Task creation failed', { parentId, level, error })
      handleError(error, 'タスクの作成に失敗しました')
      return null
    }
  }

  /**
   * タスク削除処理（ショートカット・UI共通）
   * システムプロンプト準拠：KISS原則 - 正しいAPI呼び出し
   */
  async deleteTask(taskId: string): Promise<boolean> {
    try {
      logger.info('Deleting task', { taskId })

      const task = this.allTasks.find(t => t.id === taskId)
      if (!task) {
        logger.warn('Task not found for deletion', { taskId })
        return false
      }

      // システムプロンプト準拠：正しい削除API呼び出し
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
   * タスク完了状態切り替え処理（ショートカット・UI共通）
   */
  async toggleTaskCompletion(taskId: string): Promise<boolean> {
    try {
      logger.info('Toggling task completion', { taskId })

      const task = this.allTasks.find(t => t.id === taskId)
      if (!task) {
        logger.warn('Task not found for completion toggle', { taskId })
        return false
      }

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
   * タスク折りたたみ切り替え処理
   */
  async toggleTaskCollapse(taskId: string): Promise<boolean> {
    try {
      logger.debug('Toggling task collapse', { taskId })

      const task = this.allTasks.find(t => t.id === taskId)
      if (!task) {
        logger.warn('Task not found for collapse toggle', { taskId })
        return false
      }

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
   * タスクコピー処理
   */
  async copyTasks(taskIds: string[]): Promise<Task[]> {
    try {
      logger.info('Copying tasks', { taskCount: taskIds.length, taskIds })

      const tasksToCopy = this.allTasks.filter(task => taskIds.includes(task.id))
      let allTasksToCopy: Task[] = [...tasksToCopy]

      // 子タスクも含める
      tasksToCopy.forEach(task => {
        const childTasks = this.getChildTasks(task.id, this.allTasks)
        const unselectedChildTasks = childTasks.filter(childTask => 
          !taskIds.includes(childTask.id)
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
   * タスク貼り付け処理（システムプロンプト準拠：日付安全処理）
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
          // システムプロンプト準拠：日付の安全な処理
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
          // システムプロンプト準拠：日付の安全な処理
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