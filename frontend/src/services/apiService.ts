import { PROJECT_API_ENDPOINTS, TASK_API_ENDPOINTS } from '../config/constants'
import { logger } from '../utils/logger'
import { handleError } from '../utils/errorHandler'
import { convertApiResponseDates } from '../utils/dateUtils'
import { Project, Task, BatchOperationResult } from '../types'

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
      
      // システムプロンプト準拠：DRY原則で日付変換を一元化
      const convertedData = this.convertResponseDates(data)
      
      logger.debug('API response converted', { url, status: response.status })
      return convertedData
    } catch (error) {
      logger.error('API request failed', { url, error })
      handleError(error, 'API通信エラーが発生しました')
      throw error
    }
  }

  /**
   * システムプロンプト準拠：DRY原則による統一日付変換処理
   * API応答の日付文字列をDate型に自動変換
   */
  private convertResponseDates<T>(data: T): T {
    try {
      if (!data) return data

      // 配列の場合は各要素を変換
      if (Array.isArray(data)) {
        return data.map(item => this.convertResponseDates(item)) as T
      }

      // オブジェクトの場合は日付フィールドを変換
      if (typeof data === 'object' && data !== null) {
        const converted = { ...data } as any

        // タスクの日付フィールドを変換
        if ('start_date' in converted) {
          converted.startDate = convertApiResponseDates(converted.start_date)
          delete converted.start_date
        }
        if ('due_date' in converted) {
          converted.dueDate = convertApiResponseDates(converted.due_date)
          delete converted.due_date
        }
        if ('completion_date' in converted && converted.completion_date) {
          converted.completionDate = convertApiResponseDates(converted.completion_date)
          delete converted.completion_date
        }
        if ('created_at' in converted) {
          converted.createdAt = convertApiResponseDates(converted.created_at)
          delete converted.created_at
        }
        if ('updated_at' in converted) {
          converted.updatedAt = convertApiResponseDates(converted.updated_at)
          delete converted.updated_at
        }

        // プロジェクトの日付フィールドを変換
        if ('project_id' in converted) {
          converted.projectId = converted.project_id
          delete converted.project_id
        }
        if ('parent_id' in converted) {
          converted.parentId = converted.parent_id
          delete converted.parent_id
        }

        logger.trace('Date fields converted', { 
          hasStartDate: !!converted.startDate,
          hasDueDate: !!converted.dueDate,
          hasCompletionDate: !!converted.completionDate
        })

        return converted as T
      }

      return data
    } catch (error) {
      logger.error('Date conversion failed', { error })
      handleError(error, '日付データの変換に失敗しました')
      return data // フォールバック：元のデータを返す
    }
  }

  /**
   * リクエストデータの日付をバックエンド形式に変換
   */
  private convertRequestDates(data: any): any {
    try {
      if (!data || typeof data !== 'object') return data

      const converted = { ...data }

      // フロントエンドのDate型をISO文字列に変換
      if (converted.startDate instanceof Date) {
        converted.start_date = converted.startDate.toISOString()
        delete converted.startDate
      }
      if (converted.dueDate instanceof Date) {
        converted.due_date = converted.dueDate.toISOString()
        delete converted.dueDate
      }
      if (converted.completionDate instanceof Date) {
        converted.completion_date = converted.completionDate.toISOString()
        delete converted.completionDate
      }

      // フィールド名の変換
      if (converted.projectId) {
        converted.project_id = converted.projectId
        delete converted.projectId
      }
      if (converted.parentId !== undefined) {
        converted.parent_id = converted.parentId
        delete converted.parentId
      }

      return converted
    } catch (error) {
      logger.error('Request date conversion failed', { error })
      return data // フォールバック
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
    const convertedTask = this.convertRequestDates(task)
    return this.request<Task>(TASK_API_ENDPOINTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(convertedTask),
    })
  }

  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    const convertedTask = this.convertRequestDates(task)
    return this.request<Task>(TASK_API_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(convertedTask),
    })
  }

  async deleteTask(id: string): Promise<void> {
    return this.request<void>(TASK_API_ENDPOINTS.DELETE(id), {
      method: 'DELETE',
    })
  }

  async batchUpdateTasks(operation: string, taskIds: string[]): Promise<BatchOperationResult> {
    const response = await this.request<{
      message: string
      affected_count: number
      task_ids: string[]
    }>(TASK_API_ENDPOINTS.BATCH, {
      method: 'POST',
      body: JSON.stringify({ operation, task_ids: taskIds }),
    })

    return {
      success: true,
      message: response.message,
      affected_count: response.affected_count,
      task_ids: response.task_ids
    }
  }

  // ヘルスチェック
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/health')
  }
}

export const apiService = new ApiService()