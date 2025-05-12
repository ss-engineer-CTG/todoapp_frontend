"use client"

import { createContext, useState, useEffect, useRef, ReactNode } from "react"
import { Task } from "../types/Task"
import { DatabaseService } from "../services/database/types"
import MockSQLiteService from "../services/database/MockSQLiteService"
import { initialMockTasks } from "../constants/initialData"

interface TaskContextProps {
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  currentTask: Task | null
  setCurrentTask: (task: Task | null) => void
  clipboard: Task | null
  setClipboard: (task: Task | null) => void
  dbServiceRef: React.MutableRefObject<DatabaseService>
}

export const TaskContext = createContext<TaskContextProps>({
    tasks: [],
    setTasks: () => {},
    currentTask: null,
    setCurrentTask: () => {},
    clipboard: null,
    setClipboard: () => {},
    dbServiceRef: { current: {} as DatabaseService }
  })
  
  interface TaskProviderProps {
    children: ReactNode
  }
  
  export function TaskProvider({ children }: TaskProviderProps) {
    const [tasks, setTasks] = useState<Task[]>([])
    const [currentTask, setCurrentTask] = useState<Task | null>(null)
    const [clipboard, setClipboard] = useState<Task | null>(null)
    const [isDataLoaded, setIsDataLoaded] = useState(false)
    
    // データベースサービス
    const dbServiceRef = useRef<DatabaseService>(new MockSQLiteService())
  
    // データベースからタスクをロード
    useEffect(() => {
      const loadTasks = async () => {
        try {
          const loadedTasks = await dbServiceRef.current.getTasks()
          if (loadedTasks.length > 0) {
            setTasks(loadedTasks)
          } else {
            setTasks(initialMockTasks)
          }
          setIsDataLoaded(true)
        } catch (error) {
          console.error("タスクの読み込みに失敗しました:", error)
          // モックデータを使用
          setTasks(initialMockTasks)
          setIsDataLoaded(true)
        }
      }
  
      loadTasks()
    }, [])
  
    return (
      <TaskContext.Provider value={{
        tasks,
        setTasks,
        currentTask,
        setCurrentTask,
        clipboard,
        setClipboard,
        dbServiceRef
      }}>
        {isDataLoaded && children}
      </TaskContext.Provider>
    )
  }