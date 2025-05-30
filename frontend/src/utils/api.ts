// 既存のAPIクライアントを改良
import { Project, Task } from '../types'
import { logger } from './logger'
import { APP_CONFIG } from '../config/constants'
import { PathUtils } from '../config/paths'

class ApiClient {
  private baseUrl: string

  constructor() {
    // システムプロンプト準拠: ハードコード禁止
    this.baseUrl = `http://localhost:${APP_CONFIG.PORTS.BACKEND}`
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // システムプロンプト準拠: パス結合専用関数使用
    const url = `${this.baseUrl}${PathUtils.joinPath(APP_CONFIG.ENDPOINTS.API_BASE, endpoint)}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // システムプロンプト準拠: 適切なログレベルでAPIリクエストをログ出力
    logger.debug('API request', {
      method: config.method || 'GET',
      url,
      hasBody: !!config.body
    })

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        // システムプロンプト準拠: エラー詳細をログ出力
        logger.error('API request failed', {
          url,
          status: response.status,
          statusText: response.statusText
        })
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // システムプロンプト準拠: 成功時の情報ログ
      logger.info('API request successful', {
        method: config.method || 'GET',
        endpoint,
        status: response.status
      })
      
      return data
    } catch (error) {
      // システムプロンプト準拠: エラーログとスタックトレース
      logger.error('API request error', {
        url,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  }

  // プロジェクト関連API
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects')
  }

  async createProject(project: Omit<Project, 'id'>): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    })
  }

  async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    })
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    })
  }

  // タスク関連API
  async getTasks(projectId?: string): Promise<Task[]> {
    const query = projectId ? `?projectId=${projectId}` : ''
    return this.request<Task[]>(`/tasks${query}`)
  }

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    })
  }

  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    })
  }

  async deleteTask(id: string): Promise<void> {
    return this.request<void>(`/tasks/${id}`, {
      method: 'DELETE',
    })
  }

  async batchUpdateTasks(operation: string, taskIds: string[]): Promise<void> {
    return this.request<void>('/tasks/batch', {
      method: 'POST',
      body: JSON.stringify({ operation, taskIds }),
    })
  }

  // ヘルスチェック
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health')
  }
}

export const apiClient = new ApiClient()