import { useState, useCallback } from 'react'
import { apiService } from '../services/apiService'
import { logger } from '../utils/logger'
import { handleError, handleDateConversionError } from '../utils/errorHandler'
import { Project, Task, BatchOperationResult } from '../types'
import { isValidDate } from '../utils/dateUtils'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export const useApi = () => {
  const [projectsState, setProjectsState] = useState<ApiState<Project[]>>({
    data: null,
    loading: false,
    error: null
  })

  const [tasksState, setTasksState] = useState<ApiState<Task[]>>({
    data: null,
    loading: false,
    error: null
  })

  // システムプロンプト準拠：データ検証の統一処理
  const validateTaskData = (tasks: Task[]): { valid: Task[], invalid: any[] } => {
    const valid: Task[] = []
    const invalid: any[] = []
    
    tasks.forEach((task, index) => {
      try {
        // 必須フィールドの検証
        if (!task.id || !task.name || !task.projectId) {
          logger.warn('Task missing required fields', { task, index })
          invalid.push({ task, reason: 'Missing required fields', index })
          return
        }
        
        // 日付フィールドの検証
        if (!isValidDate(task.startDate)) {
          logger.warn('Task has invalid startDate', { task, index })
          handleDateConversionError(new Error(`Invalid startDate for task ${task.id}`), { task })
          // フォールバック：現在日時を設定
          task.startDate = new Date()
        }
        
        if (!isValidDate(task.dueDate)) {
          logger.warn('Task has invalid dueDate', { task, index })
          handleDateConversionError(new Error(`Invalid dueDate for task ${task.id}`), { task })
          // フォールバック：現在日時を設定
          task.dueDate = new Date()
        }
        
        if (task.completionDate && !isValidDate(task.completionDate)) {
          logger.warn('Task has invalid completionDate', { task, index })
          task.completionDate = null // 無効な場合はnullに設定
        }
        
        valid.push(task)
      } catch (error) {
        logger.error('Task validation failed', { task, index, error })
        invalid.push({ task, reason: 'Validation error', error, index })
      }
    })
    
    if (invalid.length > 0) {
      logger.warn(`${invalid.length} tasks failed validation out of ${tasks.length} total`)
    }
    
    return { valid, invalid }
  }

  // プロジェクト関連API
  const loadProjects = useCallback(async () => {
    setProjectsState(prev => ({ ...prev, loading: true, error: null }))
    try {
      logger.info('Loading projects')
      const projects = await apiService.getProjects()
      setProjectsState({ data: projects, loading: false, error: null })
      logger.info('Projects loaded successfully', { count: projects.length })
      return projects
    } catch (error) {
      const errorMessage = 'プロジェクトの読み込みに失敗しました'
      setProjectsState(prev => ({ ...prev, loading: false, error: errorMessage }))
      handleError(error, errorMessage)
      throw error
    }
  }, [])

  const createProject = useCallback(async (projectData: Omit<Project, 'id'>) => {
    try {
      logger.info('Creating project', { name: projectData.name })
      const newProject = await apiService.createProject(projectData)
      setProjectsState(prev => ({
        ...prev,
        data: prev.data ? [...prev.data, newProject] : [newProject]
      }))
      logger.info('Project created successfully', { projectId: newProject.id })
      return newProject
    } catch (error) {
      const errorMessage = 'プロジェクトの作成に失敗しました'
      handleError(error, errorMessage)
      throw error
    }
  }, [])

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      logger.info('Updating project', { projectId: id, updates })
      const updatedProject = await apiService.updateProject(id, updates)
      setProjectsState(prev => ({
        ...prev,
        data: prev.data?.map(p => p.id === id ? updatedProject : p) || null
      }))
      logger.info('Project updated successfully', { projectId: id })
      return updatedProject
    } catch (error) {
      const errorMessage = 'プロジェクトの更新に失敗しました'
      handleError(error, errorMessage)
      throw error
    }
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    try {
      logger.info('Deleting project', { projectId: id })
      await apiService.deleteProject(id)
      setProjectsState(prev => ({
        ...prev,
        data: prev.data?.filter(p => p.id !== id) || null
      }))
      logger.info('Project deleted successfully', { projectId: id })
    } catch (error) {
      const errorMessage = 'プロジェクトの削除に失敗しました'
      handleError(error, errorMessage)
      throw error
    }
  }, [])

  // タスク関連API（システムプロンプト準拠：エラーハンドリング強化）
  const loadTasks = useCallback(async (projectId?: string) => {
    setTasksState(prev => ({ ...prev, loading: true, error: null }))
    try {
      logger.info('Loading tasks', { projectId })
      const rawTasks = await apiService.getTasks(projectId)
      
      // システムプロンプト準拠：データ検証の実行
      const { valid: tasks, invalid } = validateTaskData(rawTasks)
      
      if (invalid.length > 0) {
        logger.warn('Some tasks had validation issues', { 
          totalTasks: rawTasks.length,
          validTasks: tasks.length,
          invalidTasks: invalid.length
        })
      }
      
      setTasksState({ data: tasks, loading: false, error: null })
      logger.info('Tasks loaded successfully', { 
        count: tasks.length, 
        projectId,
        invalidCount: invalid.length
      })
      return tasks
    } catch (error) {
      const errorMessage = 'タスクの読み込みに失敗しました'
      setTasksState(prev => ({ ...prev, loading: false, error: errorMessage }))
      handleError(error, errorMessage)
      throw error
    }
  }, [])

  const createTask = useCallback(async (taskData: Omit<Task, 'id'>) => {
    try {
      logger.info('Creating task', { name: taskData.name, projectId: taskData.projectId })
      
      // 作成前のデータ検証
      if (!isValidDate(taskData.startDate)) {
        logger.warn('Invalid startDate provided for new task, using current date')
        taskData.startDate = new Date()
      }
      if (!isValidDate(taskData.dueDate)) {
        logger.warn('Invalid dueDate provided for new task, using current date')
        taskData.dueDate = new Date()
      }
      
      const newTask = await apiService.createTask(taskData)
      
      // 作成後のデータ検証
      const { valid: [validatedTask], invalid } = validateTaskData([newTask])
      
      if (invalid.length > 0) {
        logger.error('Created task failed validation', { task: newTask, invalid })
        throw new Error('作成されたタスクのデータが無効です')
      }
      
      setTasksState(prev => ({
        ...prev,
        data: prev.data ? [...prev.data, validatedTask] : [validatedTask]
      }))
      logger.info('Task created successfully', { taskId: validatedTask.id })
      return validatedTask
    } catch (error) {
      const errorMessage = 'タスクの作成に失敗しました'
      handleError(error, errorMessage)
      throw error
    }
  }, [])

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      logger.info('Updating task', { taskId: id, updates })
      
      // 更新前のデータ検証
      if (updates.startDate && !isValidDate(updates.startDate)) {
        logger.warn('Invalid startDate in updates, removing from update data')
        delete updates.startDate
      }
      if (updates.dueDate && !isValidDate(updates.dueDate)) {
        logger.warn('Invalid dueDate in updates, removing from update data')
        delete updates.dueDate
      }
      
      const updatedTask = await apiService.updateTask(id, updates)
      
      // 更新後のデータ検証
      const { valid: [validatedTask], invalid } = validateTaskData([updatedTask])
      
      if (invalid.length > 0) {
        logger.error('Updated task failed validation', { task: updatedTask, invalid })
        throw new Error('更新されたタスクのデータが無効です')
      }
      
      setTasksState(prev => ({
        ...prev,
        data: prev.data?.map(t => t.id === id ? validatedTask : t) || null
      }))
      logger.info('Task updated successfully', { taskId: id })
      return validatedTask
    } catch (error) {
      const errorMessage = 'タスクの更新に失敗しました'
      handleError(error, errorMessage)
      throw error
    }
  }, [])

  // 🎯 修正：deleteTask関数を追加
  const deleteTask = useCallback(async (id: string) => {
    try {
      logger.info('Deleting task', { taskId: id })
      await apiService.deleteTask(id)
      setTasksState(prev => ({
        ...prev,
        data: prev.data?.filter(t => t.id !== id) || null
      }))
      logger.info('Task deleted successfully', { taskId: id })
    } catch (error) {
      const errorMessage = 'タスクの削除に失敗しました'
      handleError(error, errorMessage)
      throw error
    }
  }, [])

  const batchUpdateTasks = useCallback(async (operation: string, taskIds: string[]): Promise<BatchOperationResult> => {
    try {
      logger.info('Starting batch task operation', { operation, taskCount: taskIds.length })
      const result = await apiService.batchUpdateTasks(operation, taskIds)
      logger.info('Batch task operation completed', { 
        operation, 
        count: taskIds.length,
        affectedCount: result.affected_count
      })
      return result
    } catch (error) {
      const errorMessage = 'タスクの一括操作に失敗しました'
      handleError(error, errorMessage)
      throw error
    }
  }, [])

  return {
    // 状態
    projects: projectsState,
    tasks: tasksState,
    // プロジェクト操作
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    // タスク操作
    loadTasks,
    createTask,
    updateTask,
    deleteTask, // 🎯 修正：deleteTaskを返り値に追加
    batchUpdateTasks
  }
}