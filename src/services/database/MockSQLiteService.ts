import { DatabaseService } from "./types"
import { Task } from "../../types/Task"
import { initialMockTasks } from "../../constants/initialData"
import { logError, logInfo, logWarning } from "../../utils/logUtils"

export default class MockSQLiteService implements DatabaseService {
  private projects: Task[] = []
  private tasks: Task[] = []
  private localStorage: Storage | null = null
  private initialized: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.localStorage = window.localStorage
      this.loadFromLocalStorage()
    } else {
      logWarning("MockSQLiteService: window is not defined, running in a non-browser environment")
    }
  }

  private loadFromLocalStorage() {
    try {
      const savedData = this.localStorage?.getItem('todo-app-data')
      if (savedData) {
        const data = JSON.parse(savedData)
        
        if (this.isValidData(data)) {
          this.projects = data.projects || []
          this.tasks = data.tasks || []
          this.initialized = true
          logInfo("Data loaded successfully from localStorage")
        } else {
          logWarning("Invalid data structure in localStorage, using initial data")
          this.resetToInitialData()
        }
      } else {
        logInfo("No data found in localStorage, using initial data")
        this.resetToInitialData()
      }
    } catch (error) {
      logError("Failed to load data from localStorage", error)
      this.resetToInitialData()
    }
  }

  private isValidData(data: any): boolean {
    return (
      data &&
      Array.isArray(data.projects) &&
      Array.isArray(data.tasks) &&
      // Minimum validation of task structure
      (!data.tasks.length || (data.tasks[0] && typeof data.tasks[0].id === 'number'))
    )
  }

  private saveToLocalStorage() {
    try {
      const data = {
        projects: this.projects,
        tasks: this.tasks
      }
      this.localStorage?.setItem('todo-app-data', JSON.stringify(data))
      logInfo("Data saved to localStorage")
    } catch (error) {
      logError("Failed to save data to localStorage", error)
    }
  }

  async getProjects(): Promise<Task[]> {
    if (!this.initialized) {
      await this.resetToInitialData()
    }
    return this.projects.length > 0 ? this.projects : initialMockTasks.filter(t => t.isProject)
  }

  async getTasks(projectId?: number): Promise<Task[]> {
    if (!this.initialized) {
      await this.resetToInitialData()
    }
    
    let allTasks = this.tasks.length > 0 ? this.tasks : initialMockTasks.filter(t => !t.isProject)
    
    if (projectId) {
      return allTasks.filter(t => t.projectId === projectId)
    }
    return [...this.projects, ...allTasks]
  }

  async resetToInitialData(): Promise<boolean> {
    try {
      this.projects = initialMockTasks.filter(t => t.isProject)
      this.tasks = initialMockTasks.filter(t => !t.isProject)
      this.saveToLocalStorage()
      this.initialized = true
      logInfo("Data reset to initial state")
      return true
    } catch (error) {
      logError("Failed to reset to initial data", error)
      return false
    }
  }

  async saveProject(project: Task): Promise<number> {
    try {
      const existingIndex = this.projects.findIndex(p => p.id === project.id)
      if (existingIndex >= 0) {
        this.projects[existingIndex] = project
      } else {
        this.projects.push(project)
      }
      this.saveToLocalStorage()
      return project.id
    } catch (error) {
      logError(`Failed to save project ${project.id}`, error)
      throw error
    }
  }

  async saveTask(task: Task): Promise<number> {
    try {
      const existingIndex = this.tasks.findIndex(t => t.id === task.id)
      if (existingIndex >= 0) {
        this.tasks[existingIndex] = task
      } else {
        this.tasks.push(task)
      }
      this.saveToLocalStorage()
      return task.id
    } catch (error) {
      logError(`Failed to save task ${task.id}`, error)
      throw error
    }
  }

  async deleteProject(projectId: number): Promise<boolean> {
    try {
      this.projects = this.projects.filter(p => p.id !== projectId)
      // Delete all tasks belonging to this project
      this.tasks = this.tasks.filter(t => t.projectId !== projectId)
      this.saveToLocalStorage()
      return true
    } catch (error) {
      logError(`Failed to delete project ${projectId}`, error)
      return false
    }
  }

  async deleteTask(taskId: number): Promise<boolean> {
    try {
      this.tasks = this.tasks.filter(t => t.id !== taskId)
      this.saveToLocalStorage()
      return true
    } catch (error) {
      logError(`Failed to delete task ${taskId}`, error)
      return false
    }
  }

  async exportData(): Promise<string> {
    try {
      const data = {
        projects: this.projects,
        tasks: this.tasks
      }
      return JSON.stringify(data, null, 2)
    } catch (error) {
      logError("Failed to export data", error)
      throw error
    }
  }

  async importData(data: string): Promise<boolean> {
    try {
      const parsedData = JSON.parse(data)
      if (this.isValidData(parsedData)) {
        this.projects = parsedData.projects || []
        this.tasks = parsedData.tasks || []
        this.saveToLocalStorage()
        this.initialized = true
        logInfo("Data successfully imported")
        return true
      }
      logWarning("Invalid data format in import")
      return false
    } catch (error) {
      logError("Failed to import data", error)
      return false
    }
  }
}