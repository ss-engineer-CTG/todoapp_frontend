import { useState, useEffect, useContext } from "react"
import { TaskContext } from "../contexts/TaskContext"
import { toast } from "@/hooks/use-toast"  // 修正: @/components/ui/use-toast → @/hooks/use-toast
import { useTasks } from "./useTasks"
import { Task } from "../types/Task"

export function useDragAndDrop() {
  const { tasks } = useContext(TaskContext)
  const { updateTask } = useTasks()
  
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragTask, setDragTask] = useState<Task | null>(null)
  const [dragType, setDragType] = useState<"start" | "end" | "move" | "reorder" | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<number | null>(null)

  // ドラッグ操作の開始
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>, task: Task, type: "start" | "end" | "move" | "reorder") => {
    e.stopPropagation()
    setIsDragging(true)
    setDragStartX(e.clientX)
    setDragStartY(e.clientY)
    setDragTask(task)
    setDragType(type)

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

    if (dragType === "reorder") {
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

    if (dragType === "reorder" && dragOverTaskId !== null) {
      // タスクの順序を変更
      reorderTask(dragTask.id, dragOverTaskId)
    } else if (dragType !== "reorder") {
      // 移動した日数を計算（25pxを1日と仮定）
      const deltaX = e.clientX - dragStartX
      const daysDelta = Math.round(deltaX / 25)

      if (daysDelta !== 0) {
        // 日付を更新
        let updatedTask = { ...dragTask }

        if (dragType === "start" || dragType === "move") {
          // 開始日の更新
          const startDate = new Date(dragTask.startDate)
          startDate.setDate(startDate.getDate() + daysDelta)
          updatedTask.startDate = startDate.toISOString().split("T")[0]
        }

        if (dragType === "end" || dragType === "move") {
          // 終了日の更新
          const dueDate = new Date(dragTask.dueDate)
          dueDate.setDate(dueDate.getDate() + daysDelta)
          updatedTask.dueDate = dueDate.toISOString().split("T")[0]
        }
        
        // タスクを更新
        updateTask(updatedTask)

        toast({
          title: "タスク日程を更新しました",
          description: `${daysDelta > 0 ? `${daysDelta}日後` : `${Math.abs(daysDelta)}日前`}に移動しました`,
        })
      }
    }

    cleanupDrag()
  }

  // タスクの順序を変更
  const reorderTask = (sourceTaskId: number, targetTaskId: number) => {
    const sourceTask = tasks.find(t => t.id === sourceTaskId)
    const targetTask = tasks.find(t => t.id === targetTaskId)
    
    if (!sourceTask || !targetTask) return
    
    // 同じレベルかつ同じプロジェクト内でのみ順序変更を許可
    if (sourceTask.level !== targetTask.level || sourceTask.projectId !== targetTask.projectId) {
      toast({
        title: "順序変更できません",
        description: "同じレベルと同じプロジェクト内のタスクのみ順序変更できます",
      })
      return
    }
    
    // 順序フィールドの更新
    const updatedTask = { ...sourceTask, order: targetTask.order }
    updateTask(updatedTask)
    
    toast({
      title: "タスク順序を変更しました",
      description: `"${sourceTask.name}"の位置を更新しました`,
    })
  }

  // ドラッグ状態のクリーンアップ
  const cleanupDrag = () => {
    setIsDragging(false)
    setDragTask(null)
    setDragType(null)
    setDragOverTaskId(null)

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
    handleDragStart
  }
}