// システムプロンプト準拠：タスク操作統合（useTaskDraft + taskOperations統合）
// 修正内容：フォーカス制御強化、草稿保存後の戻り値最適化

import { useState, useCallback } from 'react'
import { Task } from '@core/types'
import { TaskApiActions } from '@tasklist/types'
import { logger, handleError, isValidDate } from '@core/utils/core'
import { isDraftTask, createDraftTask, copyTasksWithHierarchy, filterValidTasksForBatch } from '@tasklist/utils/task'
import { DEFAULTS, BATCH_OPERATIONS } from '@core/config'

interface UseTaskOperationsProps {
  allTasks: Task[]
  setAllTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void
  selectedProjectId: string
  apiActions: TaskApiActions
}

export const useTaskOperations = ({ 
  allTasks, 
  setAllTasks, 
  selectedProjectId, 
  apiActions 
}: UseTaskOperationsProps) => {
  
  const [copiedTasks, setCopiedTasks] = useState<Task[]>([])

  // 草稿タスク作成
  const createDraft = useCallback((parentId: string | null = null, level = 0) => {
    try {
      if (!selectedProjectId) {
        logger.warn('No project selected for draft task creation')
        return null
      }

      const draft = createDraftTask(selectedProjectId, parentId, level)
      setAllTasks(prev => [...prev, draft])
      
      logger.info('Draft task created', { draftId: draft.id })
      return draft
    } catch (error) {
      logger.error('Draft task creation failed', { parentId, level, error })
      handleError(error, '草稿タスクの作成に失敗しました')
      return null
    }
  }, [selectedProjectId, setAllTasks])

  // 修正：草稿タスク保存 - フォーカス制御のための戻り値最適化
  const saveDraft = useCallback(async (draftId: string, updates: Partial<Task>) => {
    try {
      const draft = allTasks.find(t => t.id === draftId)
      if (!draft || !isDraftTask(draft)) {
        throw new Error('Not a draft task')
      }

      const finalName = updates.name?.trim() || draft.name?.trim()
      if (!finalName) {
        throw new Error('タスク名は必須です')
      }

      const { _isDraft, ...taskData } = { ...draft, ...updates }
      
      // 修正：日付がnullの場合は現在日時を設定
      if (!taskData.startDate || !isValidDate(taskData.startDate)) {
        taskData.startDate = new Date()
      }
      if (!taskData.dueDate || !isValidDate(taskData.dueDate)) {
        taskData.dueDate = new Date()
      }

      const savedTask = await apiActions.createTask(taskData)
      
      // 草稿をローカル状態から削除
      setAllTasks(prev => prev.filter(t => t.id !== draftId))
      
      logger.info('Draft task saved successfully', { 
        draftId, 
        newTaskId: savedTask.id,
        taskName: savedTask.name,
        // 修正：フォーカス制御のためのログ情報追加
        focusTarget: savedTask.id
      })
      
      return savedTask
    } catch (error) {
      logger.error('Draft task save failed', { draftId, error })
      handleError(error, '草稿タスクの保存に失敗しました')
      throw error
    }
  }, [allTasks, setAllTasks, apiActions])

  // 修正：草稿タスクキャンセル機能を追加
  const cancelDraft = useCallback((draftId: string) => {
    try {
      const draft = allTasks.find(t => t.id === draftId)
      if (!draft || !isDraftTask(draft)) {
        logger.warn('Attempted to cancel non-draft task', { draftId })
        return false
      }

      setAllTasks(prev => prev.filter(t => t.id !== draftId))
      logger.info('Draft task cancelled', { draftId })
      return true
    } catch (error) {
      logger.error('Draft task cancellation failed', { draftId, error })
      handleError(error, '草稿タスクのキャンセルに失敗しました')
      return false
    }
  }, [allTasks, setAllTasks])

  // タスク削除
  const deleteTask = useCallback(async (taskId: string, isMultiSelect = false, selectedTaskIds: string[] = []) => {
    try {
      const task = allTasks.find(t => t.id === taskId)
      if (!task) return

      if (isMultiSelect && selectedTaskIds.includes(taskId)) {
        // 一括削除
        const regularTaskIds = filterValidTasksForBatch(allTasks, selectedTaskIds)
        
        if (regularTaskIds.length > 0) {
          await apiActions.batchUpdateTasks(BATCH_OPERATIONS.DELETE, regularTaskIds)
        }
        
        // 草稿タスクはローカル削除
        const draftTaskIds = selectedTaskIds.filter(id => {
          const t = allTasks.find(task => task.id === id)
          return t && isDraftTask(t)
        })
        
        if (draftTaskIds.length > 0) {
          setAllTasks(prev => prev.filter(t => !draftTaskIds.includes(t.id)))
        }
      } else {
        // 単一削除
        if (isDraftTask(task)) {
          setAllTasks(prev => prev.filter(t => t.id !== taskId))
        } else {
          await apiActions.deleteTask(taskId)
        }
      }
      
      return true
    } catch (error) {
      logger.error('Task deletion failed', { taskId, error })
      handleError(error, 'タスクの削除に失敗しました')
      return false
    }
  }, [allTasks, setAllTasks, apiActions])

  // タスク完了状態切り替え
  const toggleTaskCompletion = useCallback(async (taskId: string, isMultiSelect = false, selectedTaskIds: string[] = []) => {
    try {
      const task = allTasks.find(t => t.id === taskId)
      if (!task || isDraftTask(task)) return false

      if (isMultiSelect && selectedTaskIds.includes(taskId)) {
        const validTaskIds = filterValidTasksForBatch(allTasks, selectedTaskIds)
        
        if (validTaskIds.length > 0) {
          const newCompletionState = !task.completed
          const operation = newCompletionState ? BATCH_OPERATIONS.COMPLETE : BATCH_OPERATIONS.INCOMPLETE
          await apiActions.batchUpdateTasks(operation, validTaskIds)
        }
      } else {
        const newCompletionState = !task.completed
        const completionDate = newCompletionState ? new Date() : null

        await apiActions.updateTask(taskId, {
          completed: newCompletionState,
          completionDate
        })
      }

      return true
    } catch (error) {
      logger.error('Task completion toggle failed', { taskId, error })
      handleError(error, 'タスクの完了状態切り替えに失敗しました')
      return false
    }
  }, [allTasks, apiActions])

  // タスク折りたたみ切り替え
  const toggleTaskCollapse = useCallback(async (taskId: string) => {
    try {
      const task = allTasks.find(t => t.id === taskId)
      if (!task || isDraftTask(task)) return false

      await apiActions.updateTask(taskId, { collapsed: !task.collapsed })
      return true
    } catch (error) {
      logger.error('Task collapse toggle failed', { taskId, error })
      handleError(error, 'タスクの折りたたみ切り替えに失敗しました')
      return false
    }
  }, [allTasks, apiActions])

  // タスクコピー
  const copyTasks = useCallback((taskIds: string[]) => {
    try {
      const copiedTaskList = copyTasksWithHierarchy(allTasks, taskIds)
      setCopiedTasks(copiedTaskList)
      
      logger.info('Tasks copied', { count: copiedTaskList.length })
      return copiedTaskList
    } catch (error) {
      logger.error('Task copy failed', { taskIds, error })
      handleError(error, 'タスクのコピーに失敗しました')
      return []
    }
  }, [allTasks])

  // タスク貼り付け
  const pasteTasks = useCallback(async (targetParentId: string | null, targetLevel: number) => {
    if (copiedTasks.length === 0 || !selectedProjectId) return false

    try {
      const rootTasks = copiedTasks.filter(task => 
        !task.parentId || !copiedTasks.some(t => t.id === task.parentId)
      )

      for (const rootTask of rootTasks) {
        const newTask = {
          ...rootTask,
          name: `${rootTask.name}${rootTasks.length === 1 ? DEFAULTS.COPY_SUFFIX : ''}`,
          projectId: selectedProjectId,
          parentId: targetParentId,
          level: targetLevel,
          startDate: isValidDate(rootTask.startDate) ? rootTask.startDate : new Date(),
          dueDate: isValidDate(rootTask.dueDate) ? rootTask.dueDate : new Date(),
          completionDate: null
        }

        await apiActions.createTask(newTask)
      }

      logger.info('Tasks pasted successfully', { count: copiedTasks.length })
      return true
    } catch (error) {
      logger.error('Task paste failed', { error })
      handleError(error, 'タスクの貼り付けに失敗しました')
      return false
    }
  }, [copiedTasks, selectedProjectId, apiActions])

  return {
    copiedTasks,
    createDraft,
    saveDraft,
    cancelDraft,
    deleteTask,
    toggleTaskCompletion,
    toggleTaskCollapse,
    copyTasks,
    pasteTasks
  }
}