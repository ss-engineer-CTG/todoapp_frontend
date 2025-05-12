import { Task } from "../../types/Task"

export interface DatabaseService {
  getProjects: () => Promise<Task[]>
  getTasks: (projectId?: number) => Promise<Task[]>
  saveProject: (project: Task) => Promise<number>
  saveTask: (task: Task) => Promise<number>
  deleteProject: (projectId: number) => Promise<boolean>
  deleteTask: (taskId: number) => Promise<boolean>
  exportData: () => Promise<string>
  importData: (data: string) => Promise<boolean>
}