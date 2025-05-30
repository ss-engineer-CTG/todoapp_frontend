import { useState, useCallback } from 'react'
import { apiService } from '../services/apiService'
import { logger } from '../utils/logger'
import { handleError } from '../utils/errorHandler'
import { Project, Task } from '../types'

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

  // プロジェクト関連API
  const loadProjects = useCallback(async () => {
    setProjectsState(prev => ({ ...prev, loading: true, error: null }))
    try {
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

  // タスク関連API
  const loadTasks = useCallback(async (projectId?: string) => {
    setTasksState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const tasks = await apiService.getTasks(projectId)
      setTasksState({ data: tasks, loading: false, error: null })
      logger.info('Tasks loaded successfully', { count: tasks.length, projectId })
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
      const newTask = await apiService.createTask(taskData)
      setTasksState(prev => ({
        ...prev,
        data: prev.data ? [...prev.data, newTask] : [newTask]
      }))
      logger.info('Task created successfully', { taskId: newTask.id })
      return newTask
    } catch (error) {
      const errorMessage = 'タスクの作成に失敗しました'
      handleError(error, errorMessage)
      throw error
    }
  }, [])

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      const updatedTask = await apiService.updateTask(id, updates)
      setTasksState(prev => ({
        ...prev,
        data: prev.data?.map(t => t.id === id ? updatedTask : t) || null
      }))
      logger.info('Task updated successfully', { taskId: id })
      return updatedTask
    } catch (error) {
      const errorMessage = 'タスクの更新に失敗しました'
      handleError(error, errorMessage)
      throw error
    }
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    try {
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

  const batchUpdateTasks = useCallback(async (operation: string, taskIds: string[]) => {
    try {
      await apiService.batchUpdateTasks(operation, taskIds)
      // 楽観的更新を避け、データを再取得
      logger.info('Batch task operation completed', { operation, count: taskIds.length })
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
    deleteTask,
    batchUpdateTasks
  }
}