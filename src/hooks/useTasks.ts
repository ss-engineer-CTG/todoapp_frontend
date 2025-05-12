import { useContext } from "react"
import { TaskContext } from "../contexts/TaskContext"
import { UIContext } from "../contexts/UIContext"
import { toast } from "@/hooks/use-toast"  // 修正: @/components/ui/use-toast → @/hooks/use-toast
import { getRandomColor } from "../utils/colorUtils"
import { Task } from "../types/Task"

export function useTasks() {
  const { 
    tasks, 
    setTasks, 
    setClipboard, 
    clipboard, 
    currentTask, 
    dbServiceRef
  } = useContext(TaskContext)
  
  const { 
    setIsTaskDialogOpen, 
    setIsProjectDialogOpen, 
    setIsNoteDialogOpen, 
    setCurrentTask, 
    setNoteContent, 
    setSelectedTaskId, 
    setTaskToDelete, 
    setIsDeleteConfirmOpen, 
    setIsImportExportOpen, 
    selectedTaskId
  } = useContext(UIContext)

  // 新しいタスクを追加
  const addNewTask = (level: number, projectId: number, projectName: string, afterIndex: number) => {
    const newId = Math.max(...tasks.map((t) => t.id), 0) + 1
    const today = new Date().toISOString().split("T")[0]

    const newTask: Task = {
      id: newId,
      name: "",
      level,
      isProject: level === 0,
      startDate: today,
      dueDate: today,
      completed: false,
      assignee: "",
      notes: "",
      expanded: false,
      projectId,
      projectName,
      priority: "medium",
      tags: [],
      order: getNewTaskOrder(level, projectId, afterIndex),
    }

    const updatedTasks = [...tasks]
    updatedTasks.splice(afterIndex + 1, 0, newTask)
    setTasks(updatedTasks)
    setSelectedTaskId(newId)
    setCurrentTask(newTask)
    setIsTaskDialogOpen(true)
  }

  // 新しいタスクの順序を取得
  const getNewTaskOrder = (level: number, projectId: number, afterIndex: number) => {
    // 同じレベルと同じプロジェクトのタスクを取得
    const sameLevelTasks = tasks.filter(t => t.level === level && t.projectId === projectId)
    
    // タスクが存在しない場合は1を返す
    if (sameLevelTasks.length === 0) return 1
    
    // 挿入位置の次のタスクがある場合
    if (afterIndex < tasks.length - 1) {
      const nextTask = tasks[afterIndex + 1]
      if (nextTask.level === level && nextTask.projectId === projectId) {
        return (nextTask.order || 1) - 0.5
      }
    }
    
    // 最後に追加する場合は最大の順序 + 1
    return Math.max(...sameLevelTasks.map(t => t.order || 0)) + 1
  }

  // タスク削除の確認
  const confirmDeleteTask = (taskId: number) => {
    setTaskToDelete(taskId)
    setIsDeleteConfirmOpen(true)
  }

  // タスクとその子タスクを削除
  const deleteTask = (taskId: number) => {
    const taskIndex = tasks.findIndex((t) => t.id === taskId)
    if (taskIndex === -1) return

    const task = tasks[taskIndex]
    const taskLevel = task.level

    // 削除する子タスクを見つける
    const tasksToDelete = [taskId]

    // 子タスクを見つけるために後続のタスクをチェック
    for (let i = taskIndex + 1; i < tasks.length; i++) {
      if (tasks[i].level <= taskLevel) break
      tasksToDelete.push(tasks[i].id)
    }

    // データベースからタスクを削除
    tasksToDelete.forEach(id => {
      dbServiceRef.current.deleteTask(id)
    })

    setTasks(tasks.filter((task) => !tasksToDelete.includes(task.id)))
    if (selectedTaskId && tasksToDelete.includes(selectedTaskId)) {
      setSelectedTaskId(null)
    }

    toast({
      title: "タスクを削除しました",
      description: `${tasksToDelete.length}個のタスクを削除しました`,
    })
  }

  // タスクをコピー
  const copyTask = (taskId: number) => {
    const taskToCopy = tasks.find((t) => t.id === taskId)
    if (!taskToCopy) return

    const newId = Math.max(...tasks.map((t) => t.id), 0) + 1
    const newTask = { 
      ...taskToCopy, 
      id: newId, 
      name: `${taskToCopy.name} (コピー)`,
      order: getNewTaskOrder(taskToCopy.level, taskToCopy.projectId, tasks.findIndex(t => t.id === taskId))
    }

    const taskIndex = tasks.findIndex((t) => t.id === taskId)
    const updatedTasks = [...tasks]
    updatedTasks.splice(taskIndex + 1, 0, newTask)
    setTasks(updatedTasks)
    setSelectedTaskId(newId)

    // データベースにタスクを保存
    dbServiceRef.current.saveTask(newTask)

    toast({
      title: "タスクをコピーしました",
      description: `"${taskToCopy.name}"のコピーを作成しました`,
    })
  }

  // タスクをクリップボードにコピー
  const copyTaskToClipboard = (taskId: number) => {
    const taskToCopy = tasks.find((t) => t.id === taskId)
    if (!taskToCopy) return

    setClipboard(taskToCopy)

    toast({
      title: "クリップボードにコピーしました",
      description: `"${taskToCopy.name}"をクリップボードにコピーしました`,
    })
  }

  // タスクをクリップボードに切り取り
  const cutTask = (taskId: number) => {
    const taskToCut = tasks.find((t) => t.id === taskId)
    if (!taskToCut) return

    setClipboard(taskToCut)
    
    // 子タスクを含めて切り取るために削除関数を使用
    deleteTask(taskId)

    toast({
      title: "タスクを切り取りました",
      description: `"${taskToCut.name}"を切り取りました`,
    })
  }

  // クリップボードからタスクをペースト
  const pasteTask = () => {
    if (!clipboard || !selectedTaskId) return

    const selectedTaskIndex = tasks.findIndex((t) => t.id === selectedTaskId)
    if (selectedTaskIndex === -1) return

    const selectedTask = tasks[selectedTaskIndex]
    const newId = Math.max(...tasks.map((t) => t.id), 0) + 1
    const newTask = {
      ...clipboard,
      id: newId,
      name: `${clipboard.name} (コピー)`,
      // 選択されたタスクと同じプロジェクトに所属させる
      projectId: selectedTask.projectId,
      projectName: selectedTask.projectName,
      order: getNewTaskOrder(clipboard.level, selectedTask.projectId, selectedTaskIndex)
    }

    const updatedTasks = [...tasks]
    updatedTasks.splice(selectedTaskIndex + 1, 0, newTask)
    setTasks(updatedTasks)
    setSelectedTaskId(newId)

    // データベースにタスクを保存
    dbServiceRef.current.saveTask(newTask)

    toast({
      title: "タスクをペーストしました",
      description: `"${clipboard.name}"のコピーを作成しました`,
    })
  }

  // 優先度を上げる
  const increasePriority = (taskId: number) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const priorityMap: Record<string, "low" | "medium" | "high"> = {
          "low": "medium",
          "medium": "high",
          "high": "high",
          "undefined": "low"
        }
        const newPriority = priorityMap[task.priority || "undefined"]
        const updatedTask = { ...task, priority: newPriority }
        
        // データベースにタスクを保存
        dbServiceRef.current.saveTask(updatedTask)
        
        return updatedTask
      }
      return task
    })
    
    setTasks(updatedTasks)
    
    toast({
      title: "優先度を上げました",
      description: "タスクの優先度が上がりました",
    })
  }

  // 優先度を下げる
  const decreasePriority = (taskId: number) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const priorityMap: Record<string, "low" | "medium" | "high"> = {
          "low": "low",
          "medium": "low",
          "high": "medium",
          "undefined": "low"
        }
        const newPriority = priorityMap[task.priority || "undefined"]
        const updatedTask = { ...task, priority: newPriority }
        
        // データベースにタスクを保存
        dbServiceRef.current.saveTask(updatedTask)
        
        return updatedTask
      }
      return task
    })
    
    setTasks(updatedTasks)
    
    toast({
      title: "優先度を下げました",
      description: "タスクの優先度が下がりました",
    })
  }

  // メモダイアログを開く
  const openNotes = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      setCurrentTask(task)
      setNoteContent(task.notes)
      setIsNoteDialogOpen(true)
    }
  }

  // メモを保存
  const saveNotes = (taskId: number, content: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const updatedTask = { ...task, notes: content }
    
    const updatedTasks = tasks.map((t) => (t.id === taskId ? updatedTask : t))
    setTasks(updatedTasks)
    
    // データベースにタスクを保存
    dbServiceRef.current.saveTask(updatedTask)

    toast({
      title: "メモを保存しました",
      description: `"${task.name}"のメモを更新しました`,
    })
  }

  // タスク完了状態の切り替え
  const toggleTaskCompletion = (taskId: number) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        const completed = !task.completed
        const updatedTask = {
          ...task,
          completed,
          completionDate: completed ? new Date().toISOString().split("T")[0] : undefined,
        }
        
        // データベースにタスクを保存
        dbServiceRef.current.saveTask(updatedTask)
        
        return updatedTask
      }
      return task
    })
    
    setTasks(updatedTasks)
  }

  // 展開/折りたたみの切り替え
  const toggleExpand = (taskId: number) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return { ...task, expanded: !task.expanded }
      }
      return task
    })
    setTasks(updatedTasks)
  }

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

  // タスクを編集
  const editTask = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    setCurrentTask(task)
    if (task.isProject) {
      setIsProjectDialogOpen(true)
    } else {
      setIsTaskDialogOpen(true)
    }
  }

  // タスク詳細を保存
  const saveTaskDetails = (updatedTask: Task) => {
    const updatedTasks = tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    setTasks(updatedTasks)
    setIsTaskDialogOpen(false)
    
    // データベースにタスクを保存
    dbServiceRef.current.saveTask(updatedTask)

    toast({
      title: "タスクを保存しました",
      description: `"${updatedTask.name}"を更新しました`,
    })
  }

  // プロジェクト詳細を保存
  const saveProjectDetails = (updatedProject: Task) => {
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
    setIsProjectDialogOpen(false)
    
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
  
  // すべてのデータを保存
  const saveAllData = async () => {
    try {
      const projectSavePromises = tasks
        .filter(task => task.isProject)
        .map(project => dbServiceRef.current.saveProject(project))
      
      const taskSavePromises = tasks
        .filter(task => !task.isProject)
        .map(task => dbServiceRef.current.saveTask(task))
      
      await Promise.all([...projectSavePromises, ...taskSavePromises])
      
      toast({
        title: "データを保存しました",
        description: "すべてのプロジェクトとタスクを保存しました",
      })
    } catch (error) {
      console.error("データの保存に失敗しました:", error)
      toast({
        title: "エラー",
        description: "データの保存に失敗しました",
      })
    }
  }

  // 任意のタスクを更新
  const updateTask = (updatedTask: Task) => {
    const updatedTasks = tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    )
    setTasks(updatedTasks)
    
    // データベースにタスクを保存
    dbServiceRef.current.saveTask(updatedTask)
  }
  
  // インポート/エクスポートダイアログを開く
  const openImportExport = () => {
    setIsImportExportOpen(true)
  }
  
  // データをエクスポート
  const exportData = async () => {
    try {
      return await dbServiceRef.current.exportData()
    } catch (error) {
      console.error("データのエクスポートに失敗しました:", error)
      throw error
    }
  }
  
  // データをインポート
  const importDataFromText = async (data: string) => {
    try {
      const success = await dbServiceRef.current.importData(data)
      if (success) {
        // データを再読み込み
        const loadedTasks = await dbServiceRef.current.getTasks()
        setTasks(loadedTasks)
        return true
      }
      return false
    } catch (error) {
      console.error("データのインポートに失敗しました:", error)
      throw error
    }
  }

  return {
    addNewTask,
    confirmDeleteTask,
    deleteTask,
    copyTask,
    copyTaskToClipboard,
    cutTask,
    pasteTask,
    increasePriority,
    decreasePriority,
    openNotes,
    saveNotes,
    toggleTaskCompletion,
    toggleExpand,
    createNewProject,
    editTask,
    saveTaskDetails,
    saveProjectDetails,
    saveAllData,
    updateTask,
    openImportExport,
    exportData,
    importDataFromText
  }
}