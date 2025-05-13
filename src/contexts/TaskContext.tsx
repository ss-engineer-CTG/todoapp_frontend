"use client"

import { createContext, useState, useEffect, useRef, ReactNode } from "react"
import { Task } from "../types/Task"
import { DatabaseService } from "../services/database/types"
import MockSQLiteService from "../services/database/MockSQLiteService"
import { initialMockTasks } from "../constants/initialData"
import { logError, logInfo, logWarning } from "../utils/logUtils"
import { showErrorToast, showInfoToast } from "../utils/notificationUtils"
import { adjustTaskExpansion } from "../utils/taskUtils"
import { needsMigration, performDataMigration } from "../utils/migrationUtils"

interface TaskContextProps {
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  currentTask: Task | null
  setCurrentTask: (task: Task | null) => void
  clipboard: Task | null
  setClipboard: (task: Task | null) => void
  dbServiceRef: React.MutableRefObject<DatabaseService>
  isLoading: boolean
  error: string | null
  resetToInitialData: () => Promise<void>
}

export const TaskContext = createContext<TaskContextProps>({
  tasks: [],
  setTasks: () => {},
  currentTask: null,
  setCurrentTask: () => {},
  clipboard: null,
  setClipboard: () => {},
  dbServiceRef: { current: {} as DatabaseService },
  isLoading: true,
  error: null,
  resetToInitialData: async () => {}
})
  
interface TaskProviderProps {
  children: ReactNode
}
  
export function TaskProvider({ children }: TaskProviderProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [clipboard, setClipboard] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // データベースサービス
  const dbServiceRef = useRef<DatabaseService>(new MockSQLiteService())

  // 初期データにリセット
  const resetToInitialData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // MockSQLiteServiceの拡張メソッドを呼び出す
      if ('resetToInitialData' in dbServiceRef.current) {
        const success = await (dbServiceRef.current as MockSQLiteService).resetToInitialData()
        if (success) {
          // 初期データを再読み込み
          const loadedTasks = await dbServiceRef.current.getTasks()
          
          // 親ID参照を追加するために移行処理を実行
          const migratedTasks = await performDataMigration(
            loadedTasks,
            async (task) => await dbServiceRef.current.saveProject(task),
            async (task) => await dbServiceRef.current.saveTask(task)
          )
          
          setTasks(adjustTaskExpansion(migratedTasks))
          showInfoToast("データをリセットしました", "全てのデータが初期状態に戻されました")
          logInfo("Data reset to initial state")
        } else {
          throw new Error("データのリセットに失敗しました")
        }
      }
    } catch (error) {
      const errorMessage = "初期データのリセットに失敗しました"
      logError(errorMessage, error)
      setError(errorMessage)
      showErrorToast("エラー", errorMessage)
      
      // エラー時でも初期データは表示する
      setTasks(initialMockTasks)
    } finally {
      setIsLoading(false)
    }
  }

  // データベースからタスクをロード
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const loadedTasks = await dbServiceRef.current.getTasks()
        
        if (loadedTasks.length > 0) {
          let tasksToUse = loadedTasks;
          
          // 親ID参照の移行が必要か確認
          if (needsMigration(loadedTasks)) {
            logInfo("既存のタスクデータを新しい構造に移行します...");
            
            tasksToUse = await performDataMigration(
              loadedTasks,
              async (task) => await dbServiceRef.current.saveProject(task),
              async (task) => await dbServiceRef.current.saveTask(task)
            );
            
            logInfo("タスクデータの移行が完了しました");
          }
          
          // タスクの展開状態を確認して調整
          const adjustedTasks = adjustTaskExpansion(tasksToUse);
          setTasks(adjustedTasks);
          logInfo("Tasks loaded successfully");
        } else {
          logWarning("No tasks returned from database, using initial data");
          // 初期データを使用して親ID参照を追加
          const migratedInitialData = await performDataMigration(
            initialMockTasks,
            async (task) => await dbServiceRef.current.saveProject(task),
            async (task) => await dbServiceRef.current.saveTask(task)
          );
          setTasks(migratedInitialData);
        }
      } catch (error) {
        const errorMessage = "タスクデータのロードに失敗しました";
        logError(errorMessage, error);
        setError(errorMessage);
        showErrorToast("エラー", errorMessage);
        
        // エラー時でも初期データは表示する
        const migratedInitialData = await performDataMigration(
          initialMockTasks,
          async (task) => await dbServiceRef.current.saveProject(task),
          async (task) => await dbServiceRef.current.saveTask(task)
        );
        setTasks(migratedInitialData);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []);

  return (
    <TaskContext.Provider value={{
      tasks,
      setTasks,
      currentTask,
      setCurrentTask,
      clipboard,
      setClipboard,
      dbServiceRef,
      isLoading,
      error,
      resetToInitialData
    }}>
      {!isLoading && children}
    </TaskContext.Provider>
  )
}