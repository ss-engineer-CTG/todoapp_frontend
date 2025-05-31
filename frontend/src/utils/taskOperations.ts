// システムプロンプト準拠：DRY原則による一時的タスク管理統合処理
import { Task, TaskApiActions, TemporaryTaskResult } from '../types'
import { logger } from './logger'
import { handleError, handleTemporaryTaskError, handleTemporaryTaskSaveError } from './errorHandler'
import { isValidDate } from './dateUtils'
import { TASK_OPERATION_CONSTANTS } from '../config/constants'

/**
 * 一時的タスク管理統合クラス
 * システムプロンプト準拠：ビジネスロジックの一元化
 */
export class TaskOperations {
  private apiActions: TaskApiActions
  private allTasks: Task[]
  private selectedProjectId: string
  private temporaryTasks: Map<string, Task> = new Map()

  constructor(apiActions: TaskApiActions, allTasks: Task[], selectedProjectId: string) {
    this.apiActions = apiActions
    this.allTasks = allTasks
    this.selectedProjectId = selectedProjectId
  }

  /**
   * 一時的タスクID生成（システムプロンプト準拠：一元化）
   */
  private generateTemporaryTaskId(): string {
    return `${TASK_OPERATION_CONSTANTS.TEMPORARY_TASK_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 通常タスクID生成（システムプロンプト準拠：一元化）
   */
  private generateTaskId(): string {
    return `t${Date.now()}`
  }

  /**
   * システムプロンプト準拠：一時的タスク作成処理（新機能）
   * KISS原則：シンプルな一時的タスク作成
   */
  createTemporaryTask(parentId: string | null = null, level = 0): TemporaryTaskResult {
    if (!this.selectedProjectId) {
      logger.warn('No project selected for temporary task creation')
      return {
        success: false,
        error: 'プロジェクトが選択されていません',
        action: 'created'
      }
    }

    try {
      const temporaryTaskId = this.generateTemporaryTaskId()
      
      logger.logTemporaryTaskLifecycle('creating', temporaryTaskId, 'unnamed', {
        parentId,
        level,
        projectId: this.selectedProjectId
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

      const temporaryTask: Task = {
        id: temporaryTaskId,
        name: TASK_OPERATION_CONSTANTS.TEMPORARY_TASK_DEFAULT_NAME,
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
        isTemporary: true
      }

      // 一時的タスクをメモリに保存
      this.temporaryTasks.set(temporaryTaskId, temporaryTask)
      
      logger.logTemporaryTaskLifecycle('created', temporaryTaskId, temporaryTask.name, {
        isTemporary: true,
        parentId,
        level
      })
      
      return {
        success: true,
        task: temporaryTask,
        action: 'created'
      }
    } catch (error) {
      logger.error('Temporary task creation failed', { parentId, level, error })
      handleTemporaryTaskError(error as Error, { parentId, level })
      return {
        success: false,
        error: '一時的タスクの作成に失敗しました',
        action: 'created'
      }
    }
  }

  /**
   * システムプロンプト準拠：一時的タスク保存処理（新機能）
   * 一時的タスクを正式なタスクとしてバックエンドに保存
   */
  async saveTemporaryTask(taskId: string, taskData: Partial<Task>): Promise<TemporaryTaskResult> {
    try {
      const temporaryTask = this.temporaryTasks.get(taskId)
      if (!temporaryTask) {
        throw new Error(`Temporary task not found: ${taskId}`)
      }

      // タスク名の必須チェック
      const taskName = taskData.name?.trim() || temporaryTask.name?.trim()
      if (!taskName) {
        logger.warn('Attempted to save temporary task without name', { taskId })
        return {
          success: false,
          error: 'タスク名を入力してから保存してください',
          action: 'saved'
        }
      }

      logger.logTemporaryTaskLifecycle('saving', taskId, taskName)

      // 正式なタスクデータを構築
      const taskToSave = {
        ...temporaryTask,
        ...taskData,
        name: taskName,
        // isTemporaryフラグを除去
        isTemporary: undefined
      }

      // システムプロンプト準拠：日付の安全な処理
      if (taskToSave.startDate && !isValidDate(taskToSave.startDate)) {
        taskToSave.startDate = new Date()
      }
      if (taskToSave.dueDate && !isValidDate(taskToSave.dueDate)) {
        taskToSave.dueDate = new Date()
      }

      // バックエンドにタスクを作成
      const createdTask = await this.apiActions.createTask(taskToSave)
      
      // 一時的タスクをメモリから削除
      this.temporaryTasks.delete(taskId)
      
      logger.logTemporaryTaskLifecycle('saved', taskId, createdTask.name, {
        newTaskId: createdTask.id,
        wasTemporary: true
      })
      
      return {
        success: true,
        task: createdTask,
        action: 'saved'
      }
    } catch (error) {
      logger.error('Temporary task save failed', { taskId, taskData, error })
      handleTemporaryTaskSaveError(error as Error, taskId, { taskData })
      return {
        success: false,
        error: '一時的タスクの保存に失敗しました',
        action: 'saved'
      }
    }
  }

  /**
   * システムプロンプト準拠：一時的タスク削除処理（新機能）
   */
  removeTemporaryTask(taskId: string): TemporaryTaskResult {
    try {
      const temporaryTask = this.temporaryTasks.get(taskId)
      if (!temporaryTask) {
        logger.warn('Temporary task not found for removal', { taskId })
        return {
          success: false,
          error: '一時的タスクが見つかりません',
          action: 'removed'
        }
      }

      this.temporaryTasks.delete(taskId)
      
      logger.logTemporaryTaskLifecycle('removed', taskId, temporaryTask.name, {
        wasTemporary: true,
        reason: 'cancelled'
      })
      
      return {
        success: true,
        task: temporaryTask,
        action: 'removed'
      }
    } catch (error) {
      logger.error('Temporary task removal failed', { taskId, error })
      handleTemporaryTaskError(error as Error, { taskId, operation: 'remove' })
      return {
        success: false,
        error: '一時的タスクの削除に失敗しました',
        action: 'removed'
      }
    }
  }

  /**
   * システムプロンプト準拠：すべてのタスクを取得（一時的タスク含む）
   */
  getAllTasksIncludingTemporary(): Task[] {
    const temporaryTasksArray = Array.from(this.temporaryTasks.values())
    return [...this.allTasks, ...temporaryTasksArray]
  }

  /**
   * システムプロンプト準拠：一時的タスクかどうかの判定
   */
  isTemporaryTask(taskId: string): boolean {
    return this.temporaryTasks.has(taskId)
  }

  /**
   * システムプロンプト準拠：一時的タスクの取得
   */
  getTemporaryTask(taskId: string): Task | undefined {
    return this.temporaryTasks.get(taskId)
  }

  /**
   * 既存の通常タスク追加処理（UI用）
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
      logger.info('Creating new task via UI', { 
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
        name: name || TASK_OPERATION_CONSTANTS.DEFAULT_TASK_NAME,
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
      
      logger.info('Task created successfully via UI', { 
        taskId: createdTask.id, 
        taskName: createdTask.name
      })
      
      return createdTask
    } catch (error) {
      logger.error('Task creation via UI failed', { parentId, level, error })
      handleError(error, 'タスクの作成に失敗しました')
      return null
    }
  }

  /**
   * タスク削除処理（一時的タスク対応）
   */
  async deleteTask(taskId: string): Promise<boolean> {
    try {
      // 一時的タスクの場合
      if (this.isTemporaryTask(taskId)) {
        const result = this.removeTemporaryTask(taskId)
        return result.success
      }

      // 通常タスクの場合
      logger.info('Deleting task', { taskId })

      const task = this.allTasks.find(t => t.id === taskId)
      if (!task) {
        logger.warn('Task not found for deletion', { taskId })
        return false
      }

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
   * タスク完了状態切り替え処理（一時的タスク対応）
   */
  async toggleTaskCompletion(taskId: string): Promise<boolean> {
    try {
      // 一時的タスクの場合は完了状態切り替えを無効化
      if (this.isTemporaryTask(taskId)) {
        logger.debug('Completion toggle skipped for temporary task', { taskId })
        return false
      }

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
   * タスク折りたたみ切り替え処理（一時的タスク対応）
   */
  async toggleTaskCollapse(taskId: string): Promise<boolean> {
    try {
      // 一時的タスクの場合は折りたたみを無効化
      if (this.isTemporaryTask(taskId)) {
        logger.debug('Collapse toggle skipped for temporary task', { taskId })
        return false
      }

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
   * タスクコピー処理（一時的タスクは除外）
   */
  async copyTasks(taskIds: string[]): Promise<Task[]> {
    try {
      logger.info('Copying tasks', { taskCount: taskIds.length, taskIds })

      // 一時的タスクを除外
      const validTaskIds = taskIds.filter(id => !this.isTemporaryTask(id))
      if (validTaskIds.length !== taskIds.length) {
        logger.warn('Some temporary tasks excluded from copy operation', {
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
          !validTaskIds.includes(childTask.id)
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