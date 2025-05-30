import { PROJECT_API_ENDPOINTS, TASK_API_ENDPOINTS } from '../config/constants'
import { logger } from '../utils/logger'
import { Project, Task } from '../types'

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `http://localhost:8000${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    logger.debug('API request', { method: config.method || 'GET', url, data: config.body })

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      logger.debug('API response', { url, status: response.status })
      return data
    } catch (error) {
      logger.error('API request failed', { url, error })
      throw error
    }
  }

  // プロジェクト関連API
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>(PROJECT_API_ENDPOINTS.LIST)
  }

  async createProject(project: Omit<Project, 'id'>): Promise<Project> {
    return this.request<Project>(PROJECT_API_ENDPOINTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(project),
    })
  }

  async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    return this.request<Project>(PROJECT_API_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(project),
    })
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(PROJECT_API_ENDPOINTS.DELETE(id), {
      method: 'DELETE',
    })
  }

  // タスク関連API
  async getTasks(projectId?: string): Promise<Task[]> {
    const endpoint = projectId 
      ? `${TASK_API_ENDPOINTS.LIST}?projectId=${projectId}`
      : TASK_API_ENDPOINTS.LIST
    return this.request<Task[]>(endpoint)
  }

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    return this.request<Task>(TASK_API_ENDPOINTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(task),
    })
  }

  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    return this.request<Task>(TASK_API_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(task),
    })
  }

  async deleteTask(id: string): Promise<void> {
    return this.request<void>(TASK_API_ENDPOINTS.DELETE(id), {
      method: 'DELETE',
    })
  }

  async batchUpdateTasks(operation: string, taskIds: string[]): Promise<void> {
    return this.request<void>(TASK_API_ENDPOINTS.BATCH, {
      method: 'POST',
      body: JSON.stringify({ operation, task_ids: taskIds }),
    })
  }

  // ヘルスチェック
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/health')
  }
}

export const apiService = new ApiService()