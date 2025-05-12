import { DatabaseService } from "./types"
import { Task } from "../../types/Task"
import { initialMockTasks } from "../../constants/initialData"

export default class MockSQLiteService implements DatabaseService {
  private projects: Task[] = []
  private tasks: Task[] = []
  private localStorage: Storage | null = null

  constructor() {
    // ブラウザ環境でのみlocalStorageを使用
    if (typeof window !== 'undefined') {
      this.localStorage = window.localStorage
      this.loadFromLocalStorage()
    }
  }

  private loadFromLocalStorage() {
    try {
      const savedData = this.localStorage?.getItem('todo-app-data')
      if (savedData) {
        const data = JSON.parse(savedData)
        this.projects = data.projects || []
        this.tasks = data.tasks || []
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error)
    }
  }

  private saveToLocalStorage() {
    try {
      const data = {
        projects: this.projects,
        tasks: this.tasks
      }
      this.localStorage?.setItem('todo-app-data', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save data to localStorage:', error)
    }
  }

  async getProjects(): Promise<Task[]> {
    // 実際のSQLiteクエリの代わりに、プロジェクトを返す
    return this.projects.length > 0 ? this.projects : initialMockTasks.filter(t => t.isProject)
  }

  async getTasks(projectId?: number): Promise<Task[]> {
    // 実際のSQLiteクエリの代わりに、タスクを返す
    const allTasks = this.tasks.length > 0 ? this.tasks : initialMockTasks
    if (projectId) {
      return allTasks.filter(t => t.projectId === projectId)
    }
    return allTasks
  }

  async saveProject(project: Task): Promise<number> {
    // プロジェクトの保存処理
    const existingIndex = this.projects.findIndex(p => p.id === project.id)
    if (existingIndex >= 0) {
      this.projects[existingIndex] = project
    } else {
      this.projects.push(project)
    }
    this.saveToLocalStorage()
    return project.id
  }

  async saveTask(task: Task): Promise<number> {
    // タスクの保存処理
    const existingIndex = this.tasks.findIndex(t => t.id === task.id)
    if (existingIndex >= 0) {
      this.tasks[existingIndex] = task
    } else {
      this.tasks.push(task)
    }
    this.saveToLocalStorage()
    return task.id
  }

  async deleteProject(projectId: number): Promise<boolean> {
    // プロジェクトの削除
    this.projects = this.projects.filter(p => p.id !== projectId)
    // 関連するタスクも削除
    this.tasks = this.tasks.filter(t => t.projectId !== projectId)
    this.saveToLocalStorage()
    return true
  }

  async deleteTask(taskId: number): Promise<boolean> {
    // タスクの削除
    this.tasks = this.tasks.filter(t => t.id !== taskId)
    this.saveToLocalStorage()
    return true
  }

  async exportData(): Promise<string> {
    // データのエクスポート
    const data = {
      projects: this.projects,
      tasks: this.tasks
    }
    return JSON.stringify(data, null, 2)
  }

  async importData(data: string): Promise<boolean> {
    try {
      const parsedData = JSON.parse(data)
      if (parsedData.projects && Array.isArray(parsedData.projects) &&
          parsedData.tasks && Array.isArray(parsedData.tasks)) {
        this.projects = parsedData.projects
        this.tasks = parsedData.tasks
        this.saveToLocalStorage()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to import data:', error)
      return false
    }
  }
}