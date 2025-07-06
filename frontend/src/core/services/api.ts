// システムプロンプト準拠：API通信統合（apiService + 日付変換）

import { Project, Task, BatchOperationResult } from '@core/types'
import { APP_CONFIG, APP_PATHS, joinPath } from '@core/config'
import { logger, handleError, convertApiResponseDate } from '@core/utils/core'

class ApiService {
  private baseUrl = `http://localhost:${APP_CONFIG.PORTS.BACKEND}`

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = joinPath(this.baseUrl, endpoint)
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return this.convertResponseDates(data)
    } catch (error) {
      logger.error('API request failed', { url, error })
      handleError(error, 'API通信エラーが発生しました')
      throw error
    }
  }

  // 日付フィールド変換（DRY原則）
  private convertResponseDates<T>(data: T): T {
    if (!data) return data

    if (Array.isArray(data)) {
      return data.map(item => this.convertResponseDates(item)) as T
    }

    if (typeof data === 'object' && data !== null) {
      const converted = { ...data } as any

      // タスクの日付フィールドを変換
      if ('start_date' in converted) {
        converted.startDate = convertApiResponseDate(converted.start_date)
        delete converted.start_date
      }
      if ('due_date' in converted) {
        converted.dueDate = convertApiResponseDate(converted.due_date)
        delete converted.due_date
      }
      if ('completion_date' in converted && converted.completion_date) {
        converted.completionDate = convertApiResponseDate(converted.completion_date)
        delete converted.completion_date
      }
      if ('created_at' in converted) {
        converted.createdAt = convertApiResponseDate(converted.created_at)
        delete converted.created_at
      }
      if ('updated_at' in converted) {
        converted.updatedAt = convertApiResponseDate(converted.updated_at)
        delete converted.updated_at
      }

      // フィールド名変換
      if ('project_id' in converted) {
        converted.projectId = converted.project_id
        delete converted.project_id
      }
      if ('parent_id' in converted) {
        converted.parentId = converted.parent_id
        delete converted.parent_id
      }

      return converted as T
    }

    return data
  }

  // リクエストデータの変換
  private convertRequestDates(data: any): any {
    if (!data || typeof data !== 'object') return data

    const converted = { ...data }

    // Date型をISO文字列に変換、undefined/nullは除去
    if (converted.startDate instanceof Date) {
      converted.start_date = converted.startDate.toISOString()
      delete converted.startDate
    } else if (converted.startDate === undefined || converted.startDate === null) {
      delete converted.startDate
    }
    
    if (converted.dueDate instanceof Date) {
      converted.due_date = converted.dueDate.toISOString()
      delete converted.dueDate
    } else if (converted.dueDate === undefined || converted.dueDate === null) {
      delete converted.dueDate
    }
    
    if (converted.completionDate instanceof Date) {
      converted.completion_date = converted.completionDate.toISOString()
      delete converted.completionDate
    } else if (converted.completionDate === undefined || converted.completionDate === null) {
      delete converted.completionDate
    }

    // フィールド名変換
    if (converted.projectId) {
      converted.project_id = converted.projectId
      delete converted.projectId
    }
    if (converted.parentId !== undefined) {
      converted.parent_id = converted.parentId
      delete converted.parentId
    }

    // 草稿フラグ除去
    if (converted._isDraft !== undefined) {
      delete converted._isDraft
    }

    return converted
  }

  // プロジェクト関連API
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>(APP_PATHS.API.PROJECTS)
  }

  async createProject(project: Omit<Project, 'id'>): Promise<Project> {
    return this.request<Project>(APP_PATHS.API.PROJECTS, {
      method: 'POST',
      body: JSON.stringify(project),
    })
  }

  async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    return this.request<Project>(joinPath(APP_PATHS.API.PROJECTS, id), {
      method: 'PUT',
      body: JSON.stringify(project),
    })
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(joinPath(APP_PATHS.API.PROJECTS, id), {
      method: 'DELETE',
    })
  }

  // タスク関連API
  async getTasks(projectId?: string): Promise<Task[]> {
    const endpoint = projectId 
      ? `${APP_PATHS.API.TASKS}?projectId=${projectId}`
      : APP_PATHS.API.TASKS
    return this.request<Task[]>(endpoint)
  }

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    const convertedTask = this.convertRequestDates(task)
    
    if (!convertedTask.name || !convertedTask.name.trim()) {
      throw new Error('タスク名は必須です')
    }
    
    // バックエンドが必須とする日付フィールドのデフォルト値設定
    if (!convertedTask.start_date) {
      convertedTask.start_date = new Date().toISOString()
    }
    if (!convertedTask.due_date) {
      convertedTask.due_date = new Date().toISOString()
    }
    
    // デバッグログ: 送信データを詳細確認
    logger.info('Sending task data to backend', {
      originalTask: task,
      convertedTask: convertedTask,
      requestBody: JSON.stringify(convertedTask)
    })
    
    return this.request<Task>(APP_PATHS.API.TASKS, {
      method: 'POST',
      body: JSON.stringify(convertedTask),
    })
  }

  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    const convertedTask = this.convertRequestDates(task)
    
    if (convertedTask.name !== undefined && (!convertedTask.name || !convertedTask.name.trim())) {
      throw new Error('タスク名は必須です')
    }
    
    return this.request<Task>(joinPath(APP_PATHS.API.TASKS, id), {
      method: 'PUT',
      body: JSON.stringify(convertedTask),
    })
  }

  async deleteTask(id: string): Promise<void> {
    return this.request<void>(joinPath(APP_PATHS.API.TASKS, id), {
      method: 'DELETE',
    })
  }

  async batchUpdateTasks(operation: string, taskIds: string[]): Promise<BatchOperationResult> {
    const response = await this.request<{
      message: string
      affected_count: number
      task_ids: string[]
    }>(APP_PATHS.API.BATCH, {
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
}

export const apiService = new ApiService()