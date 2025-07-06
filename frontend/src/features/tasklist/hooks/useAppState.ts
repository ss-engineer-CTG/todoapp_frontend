// システムプロンプト準拠：アプリ状態管理統合（useApi + useMultiSelect + useScrollToTask）
// 🔧 修正内容：全タスクロード機能の明確化、ビューモード対応ログ追加

import { useState, useCallback, useEffect, useRef } from 'react'
import { Task, Project, BatchOperation } from '@core/types'
import { SelectionState, BatchOperationResult } from '@tasklist/types'
import { apiService } from '@core/services/api'
import { logger, handleError, isValidDate } from '@core/utils/core'

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

  // フォーカス管理状態を追加
  const [pendingFocusTaskId, setPendingFocusTaskId] = useState<string | null>(null)

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

  // フォーカス管理機能を追加
  const focusTaskById = useCallback((taskId: string) => {
    try {
      const taskElement = taskRefs.current[taskId]
      if (taskElement) {
        logger.info('Focusing task element', { taskId })
        
        // スクロールして表示
        taskElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        })
        
        // フォーカスを設定
        taskElement.focus()
        
        // ペンディング状態をクリア
        setPendingFocusTaskId(null)
        
        return true
      } else {
        logger.warn('Task element not found for focus', { taskId })
        return false
      }
    } catch (error) {
      logger.error('Focus task failed', { taskId, error })
      return false
    }
  }, [])

  // ペンディングフォーカスの自動実行
  useEffect(() => {
    if (pendingFocusTaskId && taskRefs.current[pendingFocusTaskId]) {
      logger.info('Executing pending focus', { taskId: pendingFocusTaskId })
      
      // DOM要素が確実に存在することを確認してからフォーカス
      const focusTimeout = setTimeout(() => {
        const success = focusTaskById(pendingFocusTaskId)
        if (success) {
          logger.info('Pending focus executed successfully', { taskId: pendingFocusTaskId })
        } else {
          logger.warn('Pending focus failed, retrying...', { taskId: pendingFocusTaskId })
          
          // 失敗した場合は少し後にリトライ
          const retryTimeout = setTimeout(() => {
            focusTaskById(pendingFocusTaskId)
          }, 200)
          
          return () => clearTimeout(retryTimeout)
        }
      }, 50)
      
      return () => clearTimeout(focusTimeout)
    }
  }, [pendingFocusTaskId, focusTaskById])

  // 選択されたタスクをスクロール表示（既存機能は維持）
  useEffect(() => {
    if (selection.selectedId && taskRefs.current[selection.selectedId]) {
      taskRefs.current[selection.selectedId].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      })
    }
  }, [selection.selectedId])

  // データ検証（期限順ソート対応で強化）
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
        
        // 期限順ソート対応のため日付検証を強化
        if (!isValidDate(task.startDate)) {
          logger.warn('Invalid start date, setting to current date', { taskId: task.id, startDate: task.startDate })
          task.startDate = new Date()
        }
        
        if (!isValidDate(task.dueDate)) {
          logger.warn('Invalid due date, setting to current date', { taskId: task.id, dueDate: task.dueDate })
          task.dueDate = new Date()
        }

        // 期限日が開始日より前の場合の警告
        if (task.startDate && task.dueDate && task.startDate > task.dueDate) {
          logger.warn('Due date is before start date', { 
            taskId: task.id, 
            startDate: task.startDate, 
            dueDate: task.dueDate 
          })
          // 自動修正はせず警告のみ（ユーザーの意図を尊重）
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

  // 🔧 修正：タスク操作（全タスクロード機能の明確化）
  const loadTasks = useCallback(async (projectId?: string) => {
    setTasks(prev => ({ ...prev, loading: true, error: null }))
    try {
      // 🔧 修正：ログでロード方式を明確化
      if (projectId) {
        logger.info('Loading tasks for specific project', { 
          projectId,
          loadType: 'project_specific'
        })
      } else {
        logger.info('Loading all tasks across all projects', { 
          loadType: 'all_projects'
        })
      }
      
      const rawTasks = await apiService.getTasks(projectId)
      const validTasks = validateTaskData(rawTasks)
      
      // 🔧 修正：ロード結果のログ強化
      logger.info('Tasks loaded and validated', {
        projectId: projectId || 'all_projects',
        rawCount: rawTasks.length,
        validCount: validTasks.length,
        loadType: projectId ? 'project_specific' : 'all_projects',
        sortMethod: 'backend_due_date_frontend_hierarchy'
      })
      
      setTasks({ data: validTasks, loading: false, error: null })
      return validTasks
    } catch (error) {
      const errorMessage = 'タスクの読み込みに失敗しました'
      setTasks(prev => ({ ...prev, loading: false, error: errorMessage }))
      
      // 🔧 修正：エラーログにロード方式情報を追加
      logger.error('Task loading failed', {
        projectId: projectId || 'all_projects',
        loadType: projectId ? 'project_specific' : 'all_projects',
        error
      })
      
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
      
      logger.info('Task created with due date validation', {
        taskId: validatedTasks[0].id,
        dueDate: validatedTasks[0].dueDate
      })
      
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
      
      logger.info('Task updated with due date validation', {
        taskId: validatedTasks[0].id,
        dueDate: validatedTasks[0].dueDate
      })
      
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
      setSelection((prev: SelectionState) => {
        const newIsMultiSelectMode = true
        const newSelectedIds = prev.selectedIds.includes(itemId)
          ? prev.selectedIds.filter((id: string) => id !== itemId)
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
    setSelection((prev: SelectionState) => ({
      selectedId: prev.selectedId || (items.length > 0 ? items[0].id : null),
      selectedIds: allIds,
      isMultiSelectMode: true
    }))
  }, [])

  const clearSelection = useCallback(() => {
    setSelection({
      selectedId: null,
      selectedIds: [],
      isMultiSelectMode: false
    })
  }, [])

  const setSelectedTaskId = useCallback((id: string | null) => {
    setSelection((prev: SelectionState) => ({
      ...prev,
      selectedId: id,
      selectedIds: id ? [id] : []
    }))
  }, [])

  const setIsMultiSelectMode = useCallback((mode: boolean) => {
    setSelection((prev: SelectionState) => ({ ...prev, isMultiSelectMode: mode }))
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
    setTaskRef,
    
    // フォーカス管理機能を追加
    focusTaskById,
    setPendingFocusTaskId
  }
}