import { useTaskContext } from '@/context/TaskContext'
import { useProjectContext } from '@/context/ProjectContext'
import { useAppContext } from '@/context/AppProvider'
import { useMemo } from 'react'
import type { Task, TaskFormData, TaskOperationResult } from '@/types/task'
import { getChildTasks, validateTask } from '@/utils/taskUtils'

export function useTasks() {
  const { state: taskState, dispatch: taskDispatch } = useTaskContext()
  const { state: projectState } = useProjectContext()
  const { state: appState } = useAppContext()

  // フィルタリングされたタスク一覧（エラーハンドリング強化）
  const filteredTasks = useMemo(() => {
    try {
      return taskState.tasks.filter(task => {
        if (!task) return false
        
        // プロジェクトフィルタ
        if (task.projectId !== projectState.selectedProjectId) return false
        
        // 完了状態フィルタ
        if (!appState.showCompleted && task.completed) return false

        // 折りたたまれた親タスクの子タスクは非表示
        if (task.parentId) {
          let currentParentId: string | null = task.parentId
          let depth = 0
          
          while (currentParentId && depth < 20) { // 無限ループ防止
            const currentParent = taskState.tasks.find(t => t?.id === currentParentId)
            if (currentParent && currentParent.collapsed) return false
            currentParentId = currentParent?.parentId || null
            depth++
          }
        }

        return true
      })
    } catch (error) {
      console.error('Error filtering tasks:', error)
      return []
    }
  }, [taskState.tasks, projectState.selectedProjectId, appState.showCompleted])

  const selectedTask = useMemo(() => {
    try {
      return taskState.selectedTaskId
        ? taskState.tasks.find(task => task?.id === taskState.selectedTaskId) || null
        : null
    } catch (error) {
      console.error('Error getting selected task:', error)
      return null
    }
  }, [taskState.selectedTaskId, taskState.tasks])

  const addTask = (parentId: string | null = null, level = 0): TaskOperationResult => {
    try {
      if (level < 0 || level > 10) {
        return { success: false, message: 'タスクのレベルが無効です' }
      }

      // 親タスクの存在チェック
      if (parentId) {
        const parentExists = taskState.tasks.some(task => task?.id === parentId)
        if (!parentExists) {
          return { success: false, message: '親タスクが見つかりません' }
        }
      }

      taskDispatch({
        type: 'START_ADD_TASK',
        payload: { parentId, level }
      })

      return { success: true, message: 'タスクの追加を開始しました' }
    } catch (error) {
      console.error('Error adding task:', error)
      return { success: false, message: 'タスクの追加中にエラーが発生しました' }
    }
  }

  const saveNewTask = (): TaskOperationResult => {
    try {
      if (!taskState.newTaskName.trim()) {
        return { success: false, message: 'タスク名を入力してください' }
      }

      if (!projectState.selectedProjectId) {
        return { success: false, message: 'プロジェクトが選択されていません' }
      }

      const parentTask = taskState.newTaskParentId
        ? taskState.tasks.find(task => task?.id === taskState.newTaskParentId)
        : null

      const newTaskData: TaskFormData = {
        name: taskState.newTaskName.trim(),
        projectId: projectState.selectedProjectId,
        parentId: taskState.newTaskParentId,
        level: taskState.newTaskLevel,
        startDate: parentTask?.startDate || new Date(),
        dueDate: parentTask?.dueDate || new Date(),
        endDate: parentTask?.endDate || new Date(),
      }

      // バリデーション
      const validation = validateTask(newTaskData)
      if (!validation.isValid) {
        const errorMessage = validation.errors[0]?.message || 'タスクの情報が正しくありません'
        return { success: false, message: errorMessage }
      }

      taskDispatch({ type: 'ADD_TASK', payload: newTaskData })
      taskDispatch({ type: 'CANCEL_ADD_TASK' })

      return { success: true, message: 'タスクを作成しました' }
    } catch (error) {
      console.error('Error saving new task:', error)
      return { success: false, message: 'タスクの保存中にエラーが発生しました' }
    }
  }

  const cancelAddTask = (): TaskOperationResult => {
    try {
      taskDispatch({ type: 'CANCEL_ADD_TASK' })
      return { success: true, message: 'タスクの追加をキャンセルしました' }
    } catch (error) {
      console.error('Error canceling add task:', error)
      return { success: false, message: 'キャンセル処理中にエラーが発生しました' }
    }
  }

  const updateTask = (id: string, updates: Partial<Task>): TaskOperationResult => {
    try {
      if (!id) {
        return { success: false, message: 'タスクIDが指定されていません' }
      }

      // タスクの存在チェック
      const taskExists = taskState.tasks.some(task => task?.id === id)
      if (!taskExists) {
        return { success: false, message: 'タスクが見つかりません' }
      }

      // バリデーション（更新データに対して）
      const currentTask = taskState.tasks.find(task => task?.id === id)
      if (currentTask) {
        const updatedTask = { ...currentTask, ...updates }
        const validation = validateTask(updatedTask)
        if (!validation.isValid) {
          const errorMessage = validation.errors[0]?.message || 'タスクの情報が正しくありません'
          return { success: false, message: errorMessage }
        }
      }

      taskDispatch({ type: 'UPDATE_TASK', payload: { id, updates } })
      return { success: true, message: 'タスクを更新しました', affectedTaskIds: [id] }
    } catch (error) {
      console.error('Error updating task:', error)
      return { success: false, message: 'タスクの更新中にエラーが発生しました' }
    }
  }

  const selectTask = (taskId: string, event?: React.MouseEvent): TaskOperationResult => {
    try {
      if (!taskId) {
        return { success: false, message: 'タスクIDが指定されていません' }
      }

      // タスクの存在チェック
      const taskExists = filteredTasks.some(task => task?.id === taskId)
      if (!taskExists) {
        return { success: false, message: 'タスクが見つかりません' }
      }

      if (event && (event.ctrlKey || event.metaKey)) {
        // Ctrl/Cmd + クリック：複数選択モード
        taskDispatch({ type: 'SET_MULTI_SELECT_MODE', payload: true })
        
        const currentIds = taskState.selectedTaskIds
        if (currentIds.includes(taskId)) {
          // 選択解除
          const newIds = currentIds.filter(id => id !== taskId)
          taskDispatch({ type: 'SET_SELECTED_TASKS', payload: newIds })
        } else {
          // 選択追加
          taskDispatch({ type: 'SET_SELECTED_TASKS', payload: [...currentIds, taskId] })
        }
      } else if (event && event.shiftKey && taskState.selectedTaskId) {
        // Shift + クリック：範囲選択
        taskDispatch({ type: 'SET_MULTI_SELECT_MODE', payload: true })
        
        const currentIndex = filteredTasks.findIndex(t => t?.id === taskId)
        const lastIndex = filteredTasks.findIndex(t => t?.id === taskState.selectedTaskId)
        
        if (currentIndex !== -1 && lastIndex !== -1) {
          const start = Math.min(currentIndex, lastIndex)
          const end = Math.max(currentIndex, lastIndex)
          const tasksInRange = filteredTasks.slice(start, end + 1)
            .map(t => t?.id)
            .filter((id): id is string => Boolean(id))
          
          taskDispatch({ type: 'SET_SELECTED_TASKS', payload: tasksInRange })
        }
      } else {
        // 通常の単一選択
        taskDispatch({ type: 'SET_SELECTED_TASK', payload: taskId })
      }

      return { success: true, message: 'タスクを選択しました', affectedTaskIds: [taskId] }
    } catch (error) {
      console.error('Error selecting task:', error)
      return { success: false, message: 'タスクの選択中にエラーが発生しました' }
    }
  }

  const clearTaskSelection = (): TaskOperationResult => {
    try {
      taskDispatch({ type: 'CLEAR_TASK_SELECTION' })
      return { success: true, message: 'タスクの選択を解除しました' }
    } catch (error) {
      console.error('Error clearing task selection:', error)
      return { success: false, message: '選択解除中にエラーが発生しました' }
    }
  }

  const toggleTaskCompleted = (taskId: string): TaskOperationResult => {
    try {
      if (!taskId) {
        return { success: false, message: 'タスクIDが指定されていません' }
      }

      const task = taskState.tasks.find(t => t?.id === taskId)
      if (!task) {
        return { success: false, message: 'タスクが見つかりません' }
      }

      const isCompleting = !task.completed
      const affectedTaskIds: string[] = [taskId]
      
      // タスク自身を更新
      const result = updateTask(taskId, {
        completed: isCompleting,
        completionDate: isCompleting ? new Date() : null,
        status: isCompleting ? 'completed' : 'not-started',
      })

      if (!result.success) {
        return result
      }

      // 子タスクも同時に更新
      const childTasks = getChildTasks(taskId, taskState.tasks)
      childTasks.forEach(childTask => {
        if (childTask?.id) {
          updateTask(childTask.id, {
            completed: isCompleting,
            completionDate: isCompleting ? new Date() : null,
            status: isCompleting ? 'completed' : 'not-started',
          })
          affectedTaskIds.push(childTask.id)
        }
      })

      return { 
        success: true, 
        message: `タスクを${isCompleting ? '完了' : '未完了'}にしました`,
        affectedTaskIds 
      }
    } catch (error) {
      console.error('Error toggling task completed:', error)
      return { success: false, message: 'タスクの完了状態切り替え中にエラーが発生しました' }
    }
  }

  const toggleMultipleTasksCompleted = (taskIds: string[]): TaskOperationResult => {
    try {
      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return { success: false, message: 'タスクが選択されていません' }
      }

      const affectedTaskIds: string[] = []
      const errors: string[] = []

      taskIds.forEach(taskId => {
        const result = toggleTaskCompleted(taskId)
        if (result.success && result.affectedTaskIds) {
          affectedTaskIds.push(...result.affectedTaskIds)
        } else {
          errors.push(`${taskId}: ${result.message}`)
        }
      })

      if (errors.length > 0) {
        console.warn('Some tasks failed to update:', errors)
      }

      return {
        success: affectedTaskIds.length > 0,
        message: `${affectedTaskIds.length}個のタスクの完了状態を切り替えました`,
        affectedTaskIds: [...new Set(affectedTaskIds)] // 重複を除去
      }
    } catch (error) {
      console.error('Error toggling multiple tasks completed:', error)
      return { success: false, message: '複数タスクの完了状態切り替え中にエラーが発生しました' }
    }
  }

  const toggleTaskCollapsed = (taskId: string): TaskOperationResult => {
    try {
      if (!taskId) {
        return { success: false, message: 'タスクIDが指定されていません' }
      }

      const task = taskState.tasks.find(t => t?.id === taskId)
      if (!task) {
        return { success: false, message: 'タスクが見つかりません' }
      }

      const result = updateTask(taskId, { collapsed: !task.collapsed })
      if (result.success) {
        return {
          ...result,
          message: `タスクを${task.collapsed ? '展開' : '折りたたみ'}ました`
        }
      }
      
      return result
    } catch (error) {
      console.error('Error toggling task collapsed:', error)
      return { success: false, message: 'タスクの展開状態切り替え中にエラーが発生しました' }
    }
  }

  const copyTasks = (taskIds: string[]): TaskOperationResult => {
    try {
      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return { success: false, message: 'コピーするタスクが選択されていません' }
      }

      const tasksToCopy = taskState.tasks.filter(task => task && taskIds.includes(task.id))
      
      if (tasksToCopy.length === 0) {
        return { success: false, message: 'コピー対象のタスクが見つかりません' }
      }

      // 子タスクも含めてコピー
      let allTasksToCopy: Task[] = [...tasksToCopy]
      tasksToCopy.forEach(task => {
        const childTasks = getChildTasks(task.id, taskState.tasks)
        const unselectedChildTasks = childTasks.filter(childTask => 
          childTask && !taskIds.includes(childTask.id)
        )
        allTasksToCopy = [...allTasksToCopy, ...unselectedChildTasks]
      })

      taskDispatch({ type: 'SET_COPIED_TASKS', payload: allTasksToCopy })
      
      return { 
        success: true, 
        message: `${allTasksToCopy.length}個のタスクをコピーしました`,
        affectedTaskIds: allTasksToCopy.map(t => t.id)
      }
    } catch (error) {
      console.error('Error copying tasks:', error)
      return { success: false, message: 'タスクのコピー中にエラーが発生しました' }
    }
  }

  const pasteTasks = (): TaskOperationResult => {
    try {
      if (taskState.copiedTasks.length === 0) {
        return { success: false, message: 'コピーされたタスクがありません' }
      }

      // TODO: 貼り付け機能の実装
      return { success: false, message: '貼り付け機能は実装中です' }
    } catch (error) {
      console.error('Error pasting tasks:', error)
      return { success: false, message: 'タスクの貼り付け中にエラーが発生しました' }
    }
  }

  const deleteTasks = (taskIds: string[]): TaskOperationResult => {
    try {
      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return { success: false, message: '削除するタスクが選択されていません' }
      }

      // 子タスクも含めて削除
      let allTaskIdsToDelete: string[] = []
      
      taskIds.forEach(taskId => {
        const childTaskIds = getChildTasks(taskId, taskState.tasks).map(task => task?.id).filter((id): id is string => Boolean(id))
        allTaskIdsToDelete = [...allTaskIdsToDelete, taskId, ...childTaskIds]
      })

      // 重複を削除
      allTaskIdsToDelete = [...new Set(allTaskIdsToDelete)]
      
      taskDispatch({ type: 'DELETE_TASKS', payload: allTaskIdsToDelete })
      
      return { 
        success: true, 
        message: `${allTaskIdsToDelete.length}個のタスクを削除しました`,
        affectedTaskIds: allTaskIdsToDelete
      }
    } catch (error) {
      console.error('Error deleting tasks:', error)
      return { success: false, message: 'タスクの削除中にエラーが発生しました' }
    }
  }

  const setNewTaskName = (name: string): TaskOperationResult => {
    try {
      if (typeof name !== 'string') {
        return { success: false, message: 'タスク名は文字列である必要があります' }
      }

      taskDispatch({ type: 'SET_NEW_TASK_NAME', payload: name })
      return { success: true, message: 'タスク名を設定しました' }
    } catch (error) {
      console.error('Error setting new task name:', error)
      return { success: false, message: 'タスク名の設定中にエラーが発生しました' }
    }
  }

  return {
    tasks: taskState.tasks,
    filteredTasks,
    selectedTask,
    selectedTaskId: taskState.selectedTaskId,
    selectedTaskIds: taskState.selectedTaskIds,
    isMultiSelectMode: taskState.isMultiSelectMode,
    copiedTasks: taskState.copiedTasks,
    isAddingTask: taskState.isAddingTask,
    newTaskName: taskState.newTaskName,
    newTaskLevel: taskState.newTaskLevel,
    error: taskState.error,
    isLoading: taskState.isLoading,
    addTask,
    saveNewTask,
    cancelAddTask,
    updateTask,
    selectTask,
    clearTaskSelection,
    toggleTaskCompleted,
    toggleMultipleTasksCompleted,
    toggleTaskCollapsed,
    copyTasks,
    pasteTasks,
    deleteTasks,
    setNewTaskName,
  }
}