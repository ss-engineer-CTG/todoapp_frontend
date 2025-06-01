// システムプロンプト準拠：アプリ状態管理統合（useApi + useMultiSelect + useScrollToTask）

import { useState, useCallback, useEffect, useRef } from 'react'
import { Task, Project, SelectionState, BatchOperation, BatchOperationResult } from '../types'
import { apiService } from '../services/api'
import { logger, handleError, isValidDate } from '../utils/core'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export const useAppState = () => {
  // API状態管理
  const [projects, setProjects] = useState<ApiState<Project[]>>({
    data: null,
    loading: false,
    error: null
  })

  const [tasks, setTasks] = useState<ApiState<Task[]>>({
    data: null,
    loading: false,
    error: null
  })

  // 選択状態管理
  const [selection, setSelection] = useState<SelectionState>({
    selectedId: null,
    selectedIds: [],
    isMultiSelectMode: false
  })

  // スクロール管理
  const taskRefs = useRef<{ [key: string]: HTMLDivElement }>({})

  // タスクRefを設定
  const setTaskRef = useCallback((taskId: string, element: HTMLDivElement | null) => {
    if (element) {
      taskRefs.current[taskId] = element
    } else {
      delete taskRefs.current[taskId]
    }
  }, [])

  // 選択されたタスクをスクロール表示
  useEffect(() => {
    if (selection.selectedId && taskRefs.current[selection.selectedId]) {
      taskRefs.current[selection.selectedId].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      })
    }
  }, [selection.selectedId])

  // データ検証
  const validateTaskData = useCallback((tasks: Task[]): Task[] => {
    return tasks.filter((task, index) => {
      try {
        if (!task.id || !task.projectId) {
          logger.warn('Task missing required fields', { task, index })
          return false
        }
        
        if (!task._isDraft && !task.name?.trim()) {
          logger.warn('Confirmed task missing name', { task, index })
          return false
        }
        
        if (!isValidDate(task.startDate)) {
          task.startDate = new Date()
        }
        
        if (!isValidDate(task.dueDate)) {
          task.dueDate = new Date()
        }
        
        return true
      } catch (error) {
        logger.error('Task validation failed', { task, index, error })
        return false
      }
    })
  }, [])

  // プロジェクト操作
  const loadProjects = useCallback(async () => {
    setProjects(prev => ({ ...prev, loading: true, error: null }))
    try {
      const projectsData = await apiService.getProjects()
      setProjects({ data: projectsData, loading: false, error: null })
      return projectsData
    } catch (error) {
      const errorMessage = 'プロジェクトの読み込みに失敗しました'
      setProjects(prev => ({ ...prev, loading: false, error: errorMessage }))
      handleError(error, errorMessage)
      throw error
    }
  }, [])

  const createProject = useCallback(async (projectData: Omit<Project, 'id'>) => {
    try {
      const newProject = await apiService.createProject(projectData)
      setProjects(prev => ({
        ...prev,
        data: prev.data ? [...prev.data, newProject] : [newProject]
      }))
      return newProject
    } catch (error) {
      handleError(error, 'プロジェクトの作成に失敗しました')
      throw error
    }
  }, [])

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      const updatedProject = await apiService.updateProject(id, updates)
      setProjects(prev => ({
        ...prev,
        data: prev.data?.map(p => p.id === id ? updatedProject : p) || null
      }))
      return updatedProject
    } catch (error) {
      handleError(error, 'プロジェクトの更新に失敗しました')
      throw error
    }
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    try {
      await apiService.deleteProject(id)
      setProjects(prev => ({
        ...prev,
        data: prev.data?.filter(p => p.id !== id) || null
      }))
    } catch (error) {
      handleError(error, 'プロジェクトの削除に失敗しました')
      throw error
    }
  }, [])

  // タスク操作
  const loadTasks = useCallback(async (projectId?: string) => {
    setTasks(prev => ({ ...prev, loading: true, error: null }))
    try {
      const rawTasks = await apiService.getTasks(projectId)
      const validTasks = validateTaskData(rawTasks)
      setTasks({ data: validTasks, loading: false, error: null })
      return validTasks
    } catch (error) {
      const errorMessage = 'タスクの読み込みに失敗しました'
      setTasks(prev => ({ ...prev, loading: false, error: errorMessage }))
      handleError(error, errorMessage)
      throw error
    }
  }, [validateTaskData])

  const createTask = useCallback(async (taskData: Omit<Task, 'id'>) => {
    try {
      if (!taskData.name?.trim()) {
        throw new Error('タスク名は必須です')
      }

      const { _isDraft, ...cleanTaskData } = taskData as Task
      const newTask = await apiService.createTask(cleanTaskData)
      const validatedTasks = validateTaskData([newTask])
      
      if (validatedTasks.length === 0) {
        throw new Error('作成されたタスクのデータが無効です')
      }

      setTasks(prev => ({
        ...prev,
        data: prev.data ? [...prev.data, validatedTasks[0]] : [validatedTasks[0]]
      }))
      
      return validatedTasks[0]
    } catch (error) {
      handleError(error, 'タスクの作成に失敗しました')
      throw error
    }
  }, [validateTaskData])

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      const { _isDraft, ...cleanUpdates } = updates as Task
      const updatedTask = await apiService.updateTask(id, cleanUpdates)
      const validatedTasks = validateTaskData([updatedTask])
      
      if (validatedTasks.length === 0) {
        throw new Error('更新されたタスクのデータが無効です')
      }

      setTasks(prev => ({
        ...prev,
        data: prev.data?.map(t => t.id === id ? validatedTasks[0] : t) || null
      }))
      
      return validatedTasks[0]
    } catch (error) {
      handleError(error, 'タスクの更新に失敗しました')
      throw error
    }
  }, [validateTaskData])

  const deleteTask = useCallback(async (id: string) => {
    try {
      await apiService.deleteTask(id)
      setTasks(prev => ({
        ...prev,
        data: prev.data?.filter(t => t.id !== id) || null
      }))
    } catch (error) {
      handleError(error, 'タスクの削除に失敗しました')
      throw error
    }
  }, [])

  const batchUpdateTasks = useCallback(async (operation: BatchOperation, taskIds: string[]): Promise<BatchOperationResult> => {
    try {
      if (taskIds.length === 0) {
        return {
          success: true,
          message: '処理対象のタスクがありませんでした',
          affected_count: 0,
          task_ids: []
        }
      }
      
      const result = await apiService.batchUpdateTasks(operation, taskIds)
      return result
    } catch (error) {
      handleError(error, 'タスクの一括操作に失敗しました')
      throw error
    }
  }, [])

  // 選択操作
  const handleSelect = useCallback((itemId: string, items: Task[], event?: React.MouseEvent) => {
    const currentIndex = items.findIndex(item => item.id === itemId)

    if (event && (event.ctrlKey || event.metaKey)) {
      // Ctrl/Cmd + クリック: 個別選択/選択解除
      setSelection(prev => {
        const newIsMultiSelectMode = true
        const newSelectedIds = prev.selectedIds.includes(itemId)
          ? prev.selectedIds.filter(id => id !== itemId)
          : [...prev.selectedIds, itemId]
        
        return {
          selectedId: itemId,
          selectedIds: newSelectedIds,
          isMultiSelectMode: newIsMultiSelectMode
        }
      })
    } else if (event && event.shiftKey && selection.selectedId && items.length > 0) {
      // Shift + クリック: 範囲選択
      const lastIndex = items.findIndex(item => item.id === selection.selectedId)
      
      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex)
        const end = Math.max(currentIndex, lastIndex)
        const rangeIds = items.slice(start, end + 1).map(item => item.id)
        
        setSelection({
          selectedId: itemId,
          selectedIds: rangeIds,
          isMultiSelectMode: true
        })
      }
    } else {
      // 通常のクリック: 単一選択
      setSelection({
        selectedId: itemId,
        selectedIds: [itemId],
        isMultiSelectMode: false
      })
    }
  }, [selection.selectedId])

  const selectAll = useCallback((items: Task[]) => {
    const allIds = items.map(item => item.id)
    setSelection({
      selectedId: selection.selectedId || (items.length > 0 ? items[0].id : null),
      selectedIds: allIds,
      isMultiSelectMode: true
    })
  }, [selection.selectedId])

  const clearSelection = useCallback(() => {
    setSelection({
      selectedId: null,
      selectedIds: [],
      isMultiSelectMode: false
    })
  }, [])

  const setSelectedTaskId = useCallback((id: string | null) => {
    setSelection(prev => ({
      ...prev,
      selectedId: id,
      selectedIds: id ? [id] : []
    }))
  }, [])

  const setIsMultiSelectMode = useCallback((mode: boolean) => {
    setSelection(prev => ({ ...prev, isMultiSelectMode: mode }))
  }, [])

  return {
    // 状態
    projects,
    tasks,
    selection,
    
    // プロジェクト操作
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    
    // タスク操作
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    batchUpdateTasks,
    
    // 選択操作
    handleSelect,
    selectAll,
    clearSelection,
    setSelectedTaskId,
    setIsMultiSelectMode,
    
    // スクロール
    setTaskRef
  }
}