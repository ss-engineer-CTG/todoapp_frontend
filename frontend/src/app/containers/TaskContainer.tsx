// システムプロンプト準拠：タスク関連ロジック統合（リファクタリング：責任分離）
// リファクタリング対象：AppContainer.tsx からタスク関連処理を抽出

import React, { useCallback } from 'react'
import { Task, AppViewMode, AreaType } from '@core/types'
import { isDraftTask } from '@tasklist'
import { logger } from '@core/utils'

export interface TaskContainerProps {
  tasks: Task[]
  allTasksWithDrafts: Task[]
  selectedProjectId: string
  selectedTaskId: string | null
  viewMode: AppViewMode
  selection: any
  onToggleTask: (taskId: string) => Promise<void>
  onTaskUpdateViaDrag: (taskId: string, updates: Partial<Task>) => Promise<void>
  taskOperations: {
    createDraft: any
    saveDraft: any
    cancelDraft: any
    deleteTask: any
    toggleTaskCompletion: any
    copyTasks: any
    pasteTasks: any
  }
  apiActions: any
  selectionOperations: {
    handleSelect: any
    selectAll: any
    clearSelection: any
    focusTaskById: any
    setPendingFocusTaskId: any
  }
  setSelectedTaskId: (id: string | null) => void
  setActiveArea: (area: AreaType) => void
  setIsDetailPanelVisible: (visible: boolean) => void
  setIsMultiSelectMode: (mode: boolean) => void
}

export interface TaskContainerReturn {
  // タスク操作ハンドラー
  handleAddDraftTask: (parentId: string | null, level?: number) => Promise<void>
  handleCancelDraft: (taskId: string) => void
  handleDeleteTask: (taskId: string) => Promise<void>
  handleCopyTask: (taskId: string) => void
  handlePasteTask: () => Promise<void>
  handleToggleTaskCompletion: (taskId: string) => Promise<void>
  handleToggleTaskCollapse: (taskId: string) => Promise<void>
  handleSaveTask: (taskId: string, updates: any) => Promise<Task | null>
  handleTaskSelectWrapper: (taskId: string, event?: React.MouseEvent) => void
  handleTaskUpdateViaDrag: (taskId: string, updates: Partial<Task>) => Promise<void>
  
  // API Actions
  taskApiActions: any
}

export const useTaskContainer = (props: TaskContainerProps): TaskContainerReturn => {
  const {
    tasks,
    allTasksWithDrafts,
    selectedProjectId,
    selectedTaskId,
    viewMode,
    selection,
    onToggleTask,
    onTaskUpdateViaDrag,
    taskOperations,
    apiActions,
    selectionOperations,
    setSelectedTaskId,
    setActiveArea,
    setIsDetailPanelVisible,
    setIsMultiSelectMode
  } = props

  // ===== タスク草稿ハンドラー =====
  const handleAddDraftTask = useCallback(async (parentId: string | null = null, level = 0) => {
    try {
      if (!selectedProjectId) {
        logger.warn('No project selected for draft task creation')
        return
      }

      logger.info('Creating draft task', { 
        parentId, 
        level, 
        selectedProjectId,
        source: 'task_container'
      })

      const draft = taskOperations.createDraft(parentId, level)
      if (draft) {
        setSelectedTaskId(draft.id)
        setActiveArea("details")
        setIsDetailPanelVisible(true)
      }
    } catch (error) {
      logger.error('Draft task creation failed', { parentId, level, error })
    }
  }, [selectedProjectId, taskOperations.createDraft, setSelectedTaskId, setActiveArea, setIsDetailPanelVisible])

  const handleCancelDraft = useCallback((taskId: string) => {
    try {
      const success = taskOperations.cancelDraft(taskId)
      if (success) {
        logger.info('Draft task cancelled successfully', { taskId })
        setSelectedTaskId(null)
        setActiveArea("tasks")
      }
    } catch (error) {
      logger.error('Draft task cancellation failed', { taskId, error })
    }
  }, [taskOperations.cancelDraft, setSelectedTaskId, setActiveArea])

  // ===== タスク削除ハンドラー =====
  const handleDeleteTask = useCallback(async (taskId: string) => {
    const success = await taskOperations.deleteTask(
      taskId, 
      selection.isMultiSelectMode, 
      selection.selectedIds
    )
    
    if (success) {
      if (selection.selectedId === taskId) {
        setSelectedTaskId(null)
      }
      if (selection.isMultiSelectMode) {
        selectionOperations.clearSelection()
        setIsMultiSelectMode(false)
      }
      
      if (viewMode === 'timeline') {
        await apiActions.loadTasks()
      } else {
        await apiActions.loadTasks(selectedProjectId)
      }
    }
  }, [taskOperations.deleteTask, selection, setSelectedTaskId, selectionOperations.clearSelection, setIsMultiSelectMode, apiActions.loadTasks, selectedProjectId, viewMode])

  // ===== タスクコピー・ペーストハンドラー =====
  const handleCopyTask = useCallback((taskId: string) => {
    const taskIds = selection.isMultiSelectMode && selection.selectedIds.includes(taskId)
      ? selection.selectedIds
      : [taskId]
    taskOperations.copyTasks(taskIds)
    logger.info('Tasks copied to clipboard', { taskIds })
  }, [selection, taskOperations.copyTasks])

  const handlePasteTask = useCallback(async () => {
    const currentTask = selectedTaskId ? allTasksWithDrafts.find(t => t.id === selectedTaskId) : null
    const targetParentId = currentTask ? currentTask.parentId : null
    const targetLevel = currentTask ? currentTask.level : 0

    const success = await taskOperations.pasteTasks(targetParentId, targetLevel)
    if (success) {
      if (viewMode === 'timeline') {
        await apiActions.loadTasks()
      } else {
        await apiActions.loadTasks(selectedProjectId)
      }
      logger.info('Tasks pasted successfully', { targetParentId, targetLevel })
    }
  }, [selectedTaskId, allTasksWithDrafts, taskOperations.pasteTasks, apiActions.loadTasks, selectedProjectId, viewMode])

  // ===== タスク完了切り替えハンドラー =====
  const handleToggleTaskCompletion = useCallback(async (taskId: string) => {
    const success = await taskOperations.toggleTaskCompletion(
      taskId, 
      selection.isMultiSelectMode, 
      selection.selectedIds
    )
    if (success) {
      if (viewMode === 'timeline') {
        await apiActions.loadTasks()
      } else {
        await apiActions.loadTasks(selectedProjectId)
      }
      logger.info('Task completion toggled', { taskId, multiSelect: selection.isMultiSelectMode })
    }
  }, [taskOperations.toggleTaskCompletion, selection, apiActions.loadTasks, selectedProjectId, viewMode])

  // ===== タスク折りたたみハンドラー =====
  const handleToggleTaskCollapse = useCallback(async (taskId: string) => {
    await onToggleTask(taskId)
    logger.info('Task collapse toggled', { taskId })
  }, [onToggleTask])

  // ===== タスク保存ハンドラー =====
  const handleSaveTask = useCallback(async (taskId: string, updates: any): Promise<Task | null> => {
    try {
      const task = allTasksWithDrafts.find(t => t.id === taskId)
      if (!task) return null

      let savedTask: Task | null = null

      if (isDraftTask(task)) {
        logger.info('Saving draft task', { 
          draftId: taskId,
          projectId: selectedProjectId,
          viewMode 
        })
        
        savedTask = await taskOperations.saveDraft(taskId, updates)
        
        // データの再読み込みで確実に最新状態を反映
        logger.info('Reloading tasks after draft save')
        viewMode === 'timeline' 
          ? await apiActions.loadTasks()
          : await apiActions.loadTasks(selectedProjectId)
        
        if (savedTask) {
          logger.info('Initiating post-save UI transition', { 
            oldDraftId: taskId, 
            newTaskId: savedTask.id
          })
          
          // UI遷移: タスク一覧にフォーカス -> 詳細パネル非表示 -> 新タスク選択
          setActiveArea("tasks")
          setIsDetailPanelVisible(false)
          setSelectedTaskId(savedTask.id)
          selectionOperations.setPendingFocusTaskId(savedTask.id)
          
          // DOM更新後にフォーカス設定
          setTimeout(() => {
            if (savedTask) {
              logger.info('Focusing newly created task', { taskId: savedTask.id })
              selectionOperations.focusTaskById(savedTask.id)
            }
          }, 150)
        }
        
        return savedTask
      } else {
        // 既存タスク更新
        logger.info('Updating existing task', { taskId, projectId: selectedProjectId, viewMode })
        
        await apiActions.updateTask(taskId, updates)
        
        // 既存タスク更新時も同様にリロード
        logger.info('Executing automatic reload for existing task update')
        viewMode === 'timeline' 
          ? await apiActions.loadTasks()
          : await apiActions.loadTasks(selectedProjectId)
        
        logger.info('Initiating post-update UI transition', { taskId })
        
        // UI遷移（新規作成時と同様）
        setActiveArea("tasks")
        setIsDetailPanelVisible(false)
        setSelectedTaskId(taskId)
        selectionOperations.setPendingFocusTaskId(taskId)
        
        setTimeout(() => {
          logger.info('Focusing updated task', { taskId })
          selectionOperations.focusTaskById(taskId)
        }, 150)
        
        return task
      }
    } catch (error) {
      logger.error('Task save failed', { taskId, error })
      return null
    }
  }, [
    allTasksWithDrafts, 
    taskOperations.saveDraft, 
    apiActions.updateTask, 
    apiActions.loadTasks, 
    selectedProjectId,
    viewMode,
    selectionOperations.setPendingFocusTaskId,
    setSelectedTaskId, 
    setActiveArea,
    setIsDetailPanelVisible,
    selectionOperations.focusTaskById
  ])

  // ===== タスク選択ハンドラー =====
  const handleTaskSelectWrapper = useCallback((taskId: string, event?: React.MouseEvent) => {
    selectionOperations.handleSelect(taskId, tasks, event)
    setActiveArea("tasks")
    setIsDetailPanelVisible(true)
    logger.info('Task selected', { taskId, multiSelectMode: selection.isMultiSelectMode })
  }, [selectionOperations.handleSelect, tasks, setActiveArea, setIsDetailPanelVisible, selection.isMultiSelectMode])

  return {
    // タスク操作ハンドラー
    handleAddDraftTask,
    handleCancelDraft,
    handleDeleteTask,
    handleCopyTask,
    handlePasteTask,
    handleToggleTaskCompletion,
    handleToggleTaskCollapse,
    handleSaveTask,
    handleTaskSelectWrapper,
    handleTaskUpdateViaDrag: onTaskUpdateViaDrag,
    
    // API Actions
    taskApiActions: apiActions
  }
}