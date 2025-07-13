// タイムライン専用タスク操作フック
// 既存のuseTaskOperationsをベースにタイムライン向けに最適化

import { useCallback } from 'react'
import { Task } from '@core/types'
import { logger, handleError } from '@core/utils'
import { apiService } from '@core/services/api'
import { isDraftTask } from '@tasklist/utils/task'

interface UseTimelineTaskOperationsProps {
  // データ
  tasks: Task[]
  selectedProjectId: string | null
  
  // データ更新コールバック
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>
  
  // タスクデータの再読み込み
  refreshTasks: () => Promise<void>
}

interface UseTimelineTaskOperationsReturn {
  // タスク作成（タスク名指定対応）
  createTaskWithName: (parentId: string | null, level: number, taskName: string) => Promise<void>
  createSubTaskWithName: (parentId: string, level: number, taskName: string) => Promise<void>
  
  // タスク作成（デフォルト名版・後方互換性）
  createTask: (parentId: string | null, level: number) => Promise<void>
  createSubTask: (parentId: string, level: number) => Promise<void>
  
  // タスク操作
  toggleTaskCompletion: (taskId: string) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  
  // 一括操作
  batchToggleCompletion: (taskIds: string[]) => Promise<void>
  batchDeleteTasks: (taskIds: string[]) => Promise<void>
}

export const useTimelineTaskOperations = (
  props: UseTimelineTaskOperationsProps
): UseTimelineTaskOperationsReturn => {
  const {
    tasks,
    selectedProjectId,
    onTaskUpdate,
    refreshTasks
  } = props

  // 新規タスク作成（タスク名指定版）
  const createTaskWithName = useCallback(async (parentId: string | null, level: number, taskName: string) => {
    try {
      if (!selectedProjectId) {
        logger.warn('No project selected for task creation')
        throw new Error('プロジェクトが選択されていません')
      }

      // 現在の日付をデフォルトとして使用
      const today = new Date()
      
      const newTaskData = {
        name: taskName.trim() || '新しいタスク',
        projectId: selectedProjectId,
        parentId,
        level,
        completed: false,
        collapsed: false,
        startDate: today,
        dueDate: today,
        completionDate: null,
        notes: '',
        priority: 1,
        assignee: ''
      }

      logger.info('Creating new task in timeline with custom name', {
        projectId: selectedProjectId,
        parentId,
        level,
        taskName: newTaskData.name,
        originalInput: taskName
      })

      const createdTask = await apiService.createTask(newTaskData)
      
      // タスクリストを再読み込み
      await refreshTasks()
      
      logger.info('Task created successfully in timeline with custom name', {
        taskId: createdTask.id,
        taskName: createdTask.name,
        originalInput: taskName
      })

    } catch (error) {
      logger.error('Task creation with custom name failed in timeline', {
        parentId,
        level,
        selectedProjectId,
        taskName,
        error
      })
      handleError(error, 'タスクの作成に失敗しました')
      throw error
    }
  }, [selectedProjectId, refreshTasks])

  // 新規タスク作成（デフォルト名版・後方互換性）
  const createTask = useCallback(async (parentId: string | null, level: number) => {
    await createTaskWithName(parentId, level, '新しいタスク')
  }, [createTaskWithName])

  // 子タスク作成（タスク名指定版）
  const createSubTaskWithName = useCallback(async (parentId: string, level: number, taskName: string) => {
    try {
      if (!selectedProjectId) {
        logger.warn('No project selected for sub task creation')
        throw new Error('プロジェクトが選択されていません')
      }

      const parentTask = tasks.find(t => t.id === parentId)
      if (!parentTask) {
        logger.warn('Parent task not found for sub task creation', { parentId })
        throw new Error('親タスクが見つかりません')
      }

      // 親タスクの日付を継承
      const newTaskData = {
        name: taskName.trim() || '新しいサブタスク',
        projectId: selectedProjectId,
        parentId,
        level,
        completed: false,
        collapsed: false,
        startDate: parentTask.startDate || new Date(),
        dueDate: parentTask.dueDate || new Date(),
        completionDate: null,
        notes: '',
        priority: 1,
        assignee: ''
      }

      logger.info('Creating new sub task in timeline with custom name', {
        projectId: selectedProjectId,
        parentId,
        level,
        parentTaskName: parentTask.name,
        taskName: newTaskData.name,
        originalInput: taskName
      })

      const createdTask = await apiService.createTask(newTaskData)
      
      // タスクリストを再読み込み
      await refreshTasks()
      
      logger.info('Sub task created successfully in timeline with custom name', {
        taskId: createdTask.id,
        taskName: createdTask.name,
        parentId,
        originalInput: taskName
      })

    } catch (error) {
      logger.error('Sub task creation with custom name failed in timeline', {
        parentId,
        level,
        selectedProjectId,
        taskName,
        error
      })
      handleError(error, 'サブタスクの作成に失敗しました')
      throw error
    }
  }, [selectedProjectId, tasks, refreshTasks])

  // 子タスク作成（デフォルト名版・後方互換性）
  const createSubTask = useCallback(async (parentId: string, level: number) => {
    await createSubTaskWithName(parentId, level, '新しいサブタスク')
  }, [createSubTaskWithName])

  // タスク完了状態切り替え
  const toggleTaskCompletion = useCallback(async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) {
        logger.warn('Task not found for completion toggle', { taskId })
        throw new Error('タスクが見つかりません')
      }

      if (isDraftTask(task)) {
        logger.warn('Cannot toggle completion for draft task', { taskId })
        return
      }

      const newCompletionState = !task.completed
      const completionDate = newCompletionState ? new Date() : null

      logger.info('Toggling task completion in timeline', {
        taskId,
        taskName: task.name,
        previousState: task.completed,
        newState: newCompletionState
      })

      // onTaskUpdateが利用可能な場合は使用
      if (onTaskUpdate) {
        await onTaskUpdate(taskId, {
          completed: newCompletionState,
          completionDate
        })
      } else {
        // 直接API呼び出し
        await apiService.updateTask(taskId, {
          completed: newCompletionState,
          completionDate
        })
        
        // タスクリストを再読み込み
        await refreshTasks()
      }

      logger.info('Task completion toggled successfully in timeline', {
        taskId,
        newState: newCompletionState
      })

    } catch (error) {
      logger.error('Task completion toggle failed in timeline', {
        taskId,
        error
      })
      handleError(error, 'タスクの完了状態切り替えに失敗しました')
      throw error
    }
  }, [tasks, onTaskUpdate, refreshTasks])

  // タスク削除
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) {
        logger.warn('Task not found for deletion', { taskId })
        throw new Error('タスクが見つかりません')
      }

      logger.info('Deleting task in timeline', {
        taskId,
        taskName: task.name,
        isDraft: isDraftTask(task)
      })

      if (isDraftTask(task)) {
        // 草稿タスクはローカル削除のみ
        logger.info('Draft task deletion skipped (handled by parent component)')
        return
      }

      // API経由で削除
      await apiService.deleteTask(taskId)
      
      // タスクリストを再読み込み
      await refreshTasks()
      
      logger.info('Task deleted successfully in timeline', {
        taskId
      })

    } catch (error) {
      logger.error('Task deletion failed in timeline', {
        taskId,
        error
      })
      handleError(error, 'タスクの削除に失敗しました')
      throw error
    }
  }, [tasks, refreshTasks])

  // 一括完了状態切り替え
  const batchToggleCompletion = useCallback(async (taskIds: string[]) => {
    try {
      if (taskIds.length === 0) return

      // 有効なタスクのみフィルタリング
      const validTasks = taskIds
        .map(id => tasks.find(t => t.id === id))
        .filter((task): task is Task => task !== undefined && !isDraftTask(task))

      if (validTasks.length === 0) {
        logger.warn('No valid tasks for batch completion toggle')
        return
      }

      // 最初のタスクの状態を基準にする
      const newCompletionState = !validTasks[0].completed

      logger.info('Batch toggling task completion in timeline', {
        taskIds: validTasks.map(t => t.id),
        taskCount: validTasks.length,
        newState: newCompletionState
      })

      // 各タスクを順次処理
      for (const task of validTasks) {
        await toggleTaskCompletion(task.id)
      }

      logger.info('Batch completion toggle completed in timeline', {
        taskCount: validTasks.length,
        newState: newCompletionState
      })

    } catch (error) {
      logger.error('Batch completion toggle failed in timeline', {
        taskIds,
        error
      })
      handleError(error, 'タスクの一括完了状態切り替えに失敗しました')
      throw error
    }
  }, [tasks, toggleTaskCompletion])

  // 一括削除
  const batchDeleteTasks = useCallback(async (taskIds: string[]) => {
    try {
      if (taskIds.length === 0) return

      // 有効なタスクのみフィルタリング
      const validTasks = taskIds
        .map(id => tasks.find(t => t.id === id))
        .filter((task): task is Task => task !== undefined && !isDraftTask(task))

      if (validTasks.length === 0) {
        logger.warn('No valid tasks for batch deletion')
        return
      }

      logger.info('Batch deleting tasks in timeline', {
        taskIds: validTasks.map(t => t.id),
        taskCount: validTasks.length
      })

      // 各タスクを順次削除
      for (const task of validTasks) {
        await deleteTask(task.id)
      }

      logger.info('Batch deletion completed in timeline', {
        taskCount: validTasks.length
      })

    } catch (error) {
      logger.error('Batch deletion failed in timeline', {
        taskIds,
        error
      })
      handleError(error, 'タスクの一括削除に失敗しました')
      throw error
    }
  }, [tasks, deleteTask])

  return {
    createTaskWithName,
    createSubTaskWithName,
    createTask,
    createSubTask,
    toggleTaskCompletion,
    deleteTask,
    batchToggleCompletion,
    batchDeleteTasks
  }
}