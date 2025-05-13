import { useState, useEffect, useContext } from "react"
import { TaskContext } from "../contexts/TaskContext"
import { toast } from "@/hooks/use-toast"  // 修正: @/components/ui/use-toast → @/hooks/use-toast
import { useTasks } from "./useTasks"
import { Task } from "../types/Task"
import { logDebug, logError } from "../utils/logUtils"
import { showSuccessToast, showErrorToast } from "../utils/notificationUtils"

export function useDragAndDrop(daysPerPixel: number = 0.04) {
  const { tasks } = useContext(TaskContext)
  const { updateTask } = useTasks()
  
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragTask, setDragTask] = useState<Task | null>(null)
  const [dragType, setDragType] = useState<"start" | "end" | "move" | "reorder" | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<number | null>(null)
  // ドラッグ中のプレビュー情報
  const [dragPreview, setDragPreview] = useState<{
    taskId: number;
    type: "start" | "end" | "move";
    daysDelta: number;
  } | null>(null)

  // ドラッグ操作の開始
  const handleDragStart = (
    e: React.MouseEvent<HTMLDivElement>, 
    task: Task, 
    type: "start" | "end" | "move" | "reorder",
    customDaysPerPixel?: number
  ) => {
    e.stopPropagation()
    setIsDragging(true)
    setDragStartX(e.clientX)
    setDragStartY(e.clientY)
    setDragTask(task)
    setDragType(type)
    
    // カスタムスケールがあれば使用
    if (customDaysPerPixel) {
      daysPerPixel = customDaysPerPixel;
    }

    logDebug(`ドラッグ開始: タスク="${task.name}", タイプ=${type}, スケール=${daysPerPixel}`)

    // グローバルマウスイベントリスナーを追加
    document.addEventListener("mousemove", handleDragMove)
    document.addEventListener("mouseup", handleDragEnd)
    
    // フィードバック用のスタイルを追加
    if (type === "reorder") {
      const element = e.currentTarget
      element.classList.add("opacity-50", "cursor-grabbing")
    }
  }

  // ドラッグ中の移動
  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging || !dragTask) return

    if (dragType === "start" || dragType === "end" || dragType === "move") {
      const deltaX = e.clientX - dragStartX
      // より正確な日数を計算
      const daysDelta = Math.round(deltaX * daysPerPixel)
      
      // プレビュー情報を更新
      setDragPreview({
        taskId: dragTask.id,
        type: dragType as "start" | "end" | "move",
        daysDelta
      })
    } else if (dragType === "reorder") {
      // タスクの上にマウスが来た場合のハイライト処理
      const targetElements = document.elementsFromPoint(e.clientX, e.clientY)
      let foundTaskElement = false
      
      for (const element of targetElements) {
        const taskIdStr = element.getAttribute("data-task-id")
        if (taskIdStr) {
          const taskId = parseInt(taskIdStr, 10)
          if (taskId !== dragTask.id) {
            setDragOverTaskId(taskId)
            foundTaskElement = true
            break
          }
        }
      }
      
      if (!foundTaskElement) {
        setDragOverTaskId(null)
      }
    }
  }

  // ドラッグ操作の終了
  const handleDragEnd = (e: MouseEvent) => {
    if (!isDragging || !dragTask) {
      cleanupDrag()
      return
    }

    if (dragType === "start" || dragType === "end" || dragType === "move") {
      const deltaX = e.clientX - dragStartX
      // 正確な日数を計算
      const daysDelta = Math.round(deltaX * daysPerPixel)

      if (daysDelta !== 0) {
        let updatedTask = { ...dragTask }
        
        try {
          if (dragType === "start" || dragType === "move") {
            // 日付を更新する前に有効性をチェック
            const startDate = new Date(dragTask.startDate)
            startDate.setDate(startDate.getDate() + daysDelta)
            // ISO形式のYYYY-MM-DD部分のみを使用
            const newStartDate = startDate.toISOString().substring(0, 10)
            
            // 終了日より後にならないことを確認（startタイプの場合）
            if (dragType === "start" && newStartDate > updatedTask.dueDate) {
              throw new Error("開始日は終了日より後にできません")
            }
            
            updatedTask.startDate = newStartDate
          }

          if (dragType === "end" || dragType === "move") {
            const dueDate = new Date(dragTask.dueDate)
            dueDate.setDate(dueDate.getDate() + daysDelta)
            const newDueDate = dueDate.toISOString().substring(0, 10)
            
            // 開始日より前にならないことを確認（endタイプの場合）
            if (dragType === "end" && newDueDate < updatedTask.startDate) {
              throw new Error("終了日は開始日より前にできません")
            }
            
            updatedTask.dueDate = newDueDate
          }
          
          // タスクを更新
          updateTask(updatedTask)
          
          showSuccessToast(
            "タスク日程を更新しました",
            `${daysDelta > 0 ? `${daysDelta}日後` : `${Math.abs(daysDelta)}日前`}に移動しました`
          )
          
          logDebug(`タスク "${dragTask.name}" の日程を ${daysDelta}日 移動しました`)
        } catch (error) {
          logError(`日程更新中にエラーが発生しました: ${error}`)
          showErrorToast("日程更新エラー", (error as Error).message)
        }
      }
    } else if (dragType === "reorder" && dragOverTaskId !== null) {
      // タスクの順序を変更 - このロジックは実装する必要があります
      // ここでは簡略化のためスキップします
      logDebug(`タスク "${dragTask.name}" の順序を変更しました（ターゲット: ${dragOverTaskId}）`)
    }

    cleanupDrag()
  }

  // ドラッグ状態のクリーンアップ
  const cleanupDrag = () => {
    setIsDragging(false)
    setDragTask(null)
    setDragType(null)
    setDragOverTaskId(null)
    setDragPreview(null)

    // グローバルイベントリスナーを削除
    document.removeEventListener("mousemove", handleDragMove)
    document.removeEventListener("mouseup", handleDragEnd)
    
    // ドラッグ中の要素から追加したスタイルを削除
    document.querySelectorAll(".opacity-50.cursor-grabbing").forEach(el => {
      el.classList.remove("opacity-50", "cursor-grabbing")
    })
  }

  // コンポーネントのアンマウント時にイベントリスナーをクリーンアップ
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleDragMove)
      document.removeEventListener("mouseup", handleDragEnd)
    }
  }, [])

  return {
    isDragging,
    dragTask,
    dragType,
    dragOverTaskId,
    dragPreview,
    handleDragStart
  }
}