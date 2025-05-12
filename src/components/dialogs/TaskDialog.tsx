"use client"

import { useContext, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UIContext } from "../../contexts/UIContext"
import { TaskContext } from "../../contexts/TaskContext"
import TaskForm from "../forms/TaskForm"
import { useTasks } from "../../hooks/useTasks"
import { logDebug, logWarning } from "../../utils/logUtils"

export default function TaskDialog() {
  const { isTaskDialogOpen, setIsTaskDialogOpen, currentTask, setCurrentTask } = useContext(UIContext)
  const { tasks } = useContext(TaskContext)
  const { saveTaskDetails } = useTasks()
  
  // デバッグ用ログを追加
  useEffect(() => {
    if (isTaskDialogOpen) {
      logDebug(`TaskDialog opened with currentTask: ${JSON.stringify(currentTask)}`)
      
      if (!currentTask) {
        logWarning("TaskDialog: currentTask is null or undefined")
      } else if (currentTask.isProject) {
        logWarning("TaskDialog: currentTask is a project, should use ProjectDialog instead")
      }
    }
  }, [isTaskDialogOpen, currentTask])
  
  // 利用可能なタグのリストを取得
  const getAvailableTags = () => {
    const allTags = tasks.flatMap(task => task.tags || [])
    return [...new Set(allTags)]
  }

  // フォームが表示されない問題の修正
  // 条件を緩和してフォームを表示する
  const shouldShowForm = currentTask && !currentTask.isProject
  const availableProjects = tasks.filter((t) => t.isProject)

  return (
    <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>タスク詳細</DialogTitle>
        </DialogHeader>

        {shouldShowForm ? (
          <TaskForm
            task={currentTask}
            onSave={saveTaskDetails}
            onCancel={() => setIsTaskDialogOpen(false)}
            projects={availableProjects}
            availableTags={getAvailableTags()}
          />
        ) : (
          <div className="py-4 text-center text-red-500">
            タスク情報の読み込みに失敗しました。
            <button 
              className="block mx-auto mt-2 text-blue-500 underline"
              onClick={() => setIsTaskDialogOpen(false)}
            >
              閉じる
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}