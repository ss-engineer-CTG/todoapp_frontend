import { useTaskContext } from '@/context/TaskContext'
import { useProjectContext } from '@/context/ProjectContext'
import { useAppContext } from '@/context/AppProvider'
import { useMemo } from 'react'
import type { Task, TaskFormData } from '@/types/task'
import { getChildTasks } from '@/utils/taskUtils'

export function useTasks() {
  const { state: taskState, dispatch: taskDispatch } = useTaskContext()
  const { state: projectState } = useProjectContext()
  const { state: appState } = useAppContext()

  // フィルタリングされたタスク一覧
  const filteredTasks = useMemo(() => {
    return taskState.tasks.filter(task => {
      if (task.projectId !== projectState.selectedProjectId) return false
      if (!appState.showCompleted && task.completed) return false

      // 折りたたまれた親タスクの子タスクは非表示
      if (task.parentId) {
        let currentParentId = task.parentId
        while (currentParentId) {
          const currentParent = taskState.tasks.find(t => t.id === currentParentId)
          if (currentParent && currentParent.collapsed) return false
          currentParentId = currentParent?.parentId || null
        }
      }

      return true
    })
  }, [taskState.tasks, projectState.selectedProjectId, appState.showCompleted])

  const selectedTask = taskState.selectedTaskId
    ? taskState.tasks.find(task => task.id === taskState.selectedTaskId)
    : null

  const addTask = (parentId: string | null = null, level = 0) => {
    taskDispatch({
      type: 'START_ADD_TASK',
      payload: { parentId, level }
    })
  }

  const saveNewTask = () => {
    if (taskState.newTaskName.trim() && projectState.selectedProjectId) {
      const parentTask = taskState.newTaskParentId
        ? taskState.tasks.find(task => task.id === taskState.newTaskParentId)
        : null

      taskDispatch({
        type: 'ADD_TASK',
        payload: {
          name: taskState.newTaskName.trim(),
          projectId: projectState.selectedProjectId,
          parentId: taskState.newTaskParentId,
          level: taskState.newTaskLevel,
          startDate: parentTask?.startDate || new Date(),
          dueDate: parentTask?.dueDate || new Date(),
        }
      })

      taskDispatch({ type: 'CANCEL_ADD_TASK' })
    }
  }

  const cancelAddTask = () => {
    taskDispatch({ type: 'CANCEL_ADD_TASK' })
  }

  const updateTask = (id: string, updates: Partial<Task>) => {
    taskDispatch({ type: 'UPDATE_TASK', payload: { id, updates } })
  }

  const selectTask = (taskId: string, event?: React.MouseEvent) => {
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
      
      const currentIndex = filteredTasks.findIndex(t => t.id === taskId)
      const lastIndex = filteredTasks.findIndex(t => t.id === taskState.selectedTaskId)
      
      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex)
        const end = Math.max(currentIndex, lastIndex)
        const tasksInRange = filteredTasks.slice(start, end + 1).map(t => t.id)
        taskDispatch({ type: 'SET_SELECTED_TASKS', payload: tasksInRange })
      }
    } else {
      // 通常の単一選択
      taskDispatch({ type: 'SET_SELECTED_TASK', payload: taskId })
    }
  }

  const clearTaskSelection = () => {
    taskDispatch({ type: 'CLEAR_TASK_SELECTION' })
  }

  const toggleTaskCompleted = (taskId: string) => {
    const task = taskState.tasks.find(t => t.id === taskId)
    if (!task) return

    const isCompleting = !task.completed
    
    // タスク自身を更新
    updateTask(taskId, {
      completed: isCompleting,
      completionDate: isCompleting ? new Date() : null,
      status: isCompleting ? 'completed' : 'not-started',
    })

    // 子タスクも同時に更新
    const childTasks = getChildTasks(taskId, taskState.tasks)
    childTasks.forEach(childTask => {
      updateTask(childTask.id, {
        completed: isCompleting,
        completionDate: isCompleting ? new Date() : null,
        status: isCompleting ? 'completed' : 'not-started',
      })
    })
  }

  const toggleMultipleTasksCompleted = (taskIds: string[]) => {
    const firstTask = taskState.tasks.find(t => taskIds.includes(t.id))
    if (!firstTask) return

    const newCompletionState = !firstTask.completed

    taskIds.forEach(taskId => {
      toggleTaskCompleted(taskId)
    })
  }

  const toggleTaskCollapsed = (taskId: string) => {
    const task = taskState.tasks.find(t => t.id === taskId)
    if (!task) return

    updateTask(taskId, { collapsed: !task.collapsed })
  }

  const copyTasks = (taskIds: string[]) => {
    const tasksToCopy = taskState.tasks.filter(task => taskIds.includes(task.id))
    
    // 子タスクも含めてコピー
    let allTasksToCopy: Task[] = [...tasksToCopy]
    tasksToCopy.forEach(task => {
      const childTasks = getChildTasks(task.id, taskState.tasks)
      const unselectedChildTasks = childTasks.filter(childTask => !taskIds.includes(childTask.id))
      allTasksToCopy = [...allTasksToCopy, ...unselectedChildTasks]
    })

    taskDispatch({ type: 'SET_COPIED_TASKS', payload: allTasksToCopy })
  }

  const pasteTasks = () => {
    // TODO: 貼り付け機能の実装
  }

  const deleteTasks = (taskIds: string[]) => {
    // 子タスクも含めて削除
    let allTaskIdsToDelete: string[] = []
    
    taskIds.forEach(taskId => {
      const childTaskIds = getChildTasks(taskId, taskState.tasks).map(task => task.id)
      allTaskIdsToDelete = [...allTaskIdsToDelete, taskId, ...childTaskIds]
    })

    // 重複を削除
    allTaskIdsToDelete = [...new Set(allTaskIdsToDelete)]
    
    taskDispatch({ type: 'DELETE_TASKS', payload: allTaskIdsToDelete })
  }

  const setNewTaskName = (name: string) => {
    taskDispatch({ type: 'SET_NEW_TASK_NAME', payload: name })
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