import { useContext } from "react"
import { TaskContext } from "../contexts/TaskContext"
import { UIContext } from "../contexts/UIContext"
import { toast } from "@/hooks/use-toast"  // 修正: @/components/ui/use-toast → @/hooks/use-toast
import { getRandomColor } from "../utils/colorUtils"
import { Task } from "../types/Task"

export function useProjects() {
  const { 
    tasks, 
    setTasks, 
    dbServiceRef 
  } = useContext(TaskContext)
  
  const { 
    setIsProjectDialogOpen, 
    setCurrentTask, 
    setSelectedTaskId
  } = useContext(UIContext)

  // 新しいプロジェクトを作成
  const createNewProject = () => {
    const newId = Math.max(...tasks.map((t) => t.id), 0) + 1
    const projectId = Math.max(...tasks.filter((t) => t.isProject).map((t) => t.projectId), 0) + 1
    const today = new Date().toISOString().split("T")[0]

    const newProject: Task = {
      id: newId,
      name: "新しいプロジェクト",
      level: 0,
      isProject: true,
      startDate: today,
      dueDate: today,
      completed: false,
      assignee: "",
      notes: "",
      expanded: true,
      projectId,
      projectName: "新しいプロジェクト",
      priority: "medium",
      tags: [],
      color: getRandomColor()
    }

    setTasks([...tasks, newProject])
    setSelectedTaskId(newId)
    setCurrentTask(newProject)
    setIsProjectDialogOpen(true)
  }

  // プロジェクト詳細を更新
  const updateProject = (updatedProject: Task) => {
    // プロジェクト自体を更新
    const updatedTasks = tasks.map((task) => {
      if (task.id === updatedProject.id) {
        return updatedProject
      }
      // このプロジェクトに属するタスクのプロジェクト名も更新
      if (task.projectId === updatedProject.projectId) {
        return {
          ...task,
          projectName: updatedProject.name,
        }
      }
      return task
    })

    setTasks(updatedTasks)
    
    // データベースにプロジェクトとタスクを保存
    dbServiceRef.current.saveProject(updatedProject)
    updatedTasks.forEach(task => {
      if (task.projectId === updatedProject.projectId && task.id !== updatedProject.id) {
        dbServiceRef.current.saveTask(task)
      }
    })

    toast({
      title: "プロジェクトを保存しました",
      description: `"${updatedProject.name}"を更新しました`,
    })
  }

  // プロジェクトを削除
  const deleteProject = async (projectId: number) => {
    try {
      // このプロジェクトのすべてのタスクを取得
      const tasksToRemove = tasks.filter(task => task.projectId === projectId)
      
      // データベースからプロジェクトを削除
      await dbServiceRef.current.deleteProject(projectId)
      
      // ローカル状態からも削除
      setTasks(tasks.filter(task => task.projectId !== projectId))
      
      toast({
        title: "プロジェクトを削除しました",
        description: `プロジェクトと関連する${tasksToRemove.length}個のタスクを削除しました`,
      })
      
      return true
    } catch (error) {
      console.error("プロジェクトの削除に失敗しました:", error)
      
      toast({
        title: "エラー",
        description: "プロジェクトの削除に失敗しました",
        variant: "destructive"
      })
      
      return false
    }
  }

  // プロジェクトの進捗率を計算
  const getProjectProgress = (projectId: number) => {
    const projectTasks = tasks.filter(task => task.projectId === projectId && !task.isProject)
    if (projectTasks.length === 0) return 0
    
    const completedTasks = projectTasks.filter(task => task.completed)
    return Math.round((completedTasks.length / projectTasks.length) * 100)
  }

  // プロジェクトの期間を計算
  const getProjectDuration = (projectId: number) => {
    const project = tasks.find(task => task.isProject && task.projectId === projectId)
    if (!project) return 0
    
    const startDate = new Date(project.startDate)
    const dueDate = new Date(project.dueDate)
    
    const timeDiff = dueDate.getTime() - startDate.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) // 日数で返す
  }

  // すべてのプロジェクトを取得
  const getAllProjects = () => {
    return tasks.filter(task => task.isProject)
  }

  // プロジェクト内のタスクを取得
  const getProjectTasks = (projectId: number) => {
    return tasks.filter(task => task.projectId === projectId && !task.isProject)
  }

  return {
    createNewProject,
    updateProject,
    deleteProject,
    getProjectProgress,
    getProjectDuration,
    getAllProjects,
    getProjectTasks
  }
}