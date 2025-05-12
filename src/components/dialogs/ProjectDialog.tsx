"use client"

import { useContext, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UIContext } from "../../contexts/UIContext"
import { TaskContext } from "../../contexts/TaskContext"
import ProjectForm from "../forms/ProjectForm"
import { useTasks } from "../../hooks/useTasks"
import { logDebug, logWarning } from "../../utils/logUtils"

export default function ProjectDialog() {
  const { isProjectDialogOpen, setIsProjectDialogOpen, currentTask, setCurrentTask } = useContext(UIContext)
  const { tasks } = useContext(TaskContext)
  const { saveProjectDetails } = useTasks()
  
  // デバッグ用ログを追加
  useEffect(() => {
    if (isProjectDialogOpen) {
      logDebug(`ProjectDialog opened with currentTask: ${JSON.stringify(currentTask)}`)
      
      if (!currentTask) {
        logWarning("ProjectDialog: currentTask is null or undefined")
      } else if (!currentTask.isProject) {
        logWarning("ProjectDialog: currentTask is not a project, should use TaskDialog instead")
      }
    }
  }, [isProjectDialogOpen, currentTask])
  
  // 利用可能なタグのリストを取得
  const getAvailableTags = () => {
    const allTags = tasks.flatMap(task => task.tags || [])
    return [...new Set(allTags)]
  }

  // フォームが表示されない問題の修正
  // 条件を緩和してフォームを表示する
  const shouldShowForm = currentTask && currentTask.isProject

  return (
    <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>プロジェクト詳細</DialogTitle>
        </DialogHeader>

        {shouldShowForm ? (
          <ProjectForm
            project={currentTask}
            onSave={saveProjectDetails}
            onCancel={() => setIsProjectDialogOpen(false)}
            availableTags={getAvailableTags()}
          />
        ) : (
          <div className="py-4 text-center text-red-500">
            プロジェクト情報の読み込みに失敗しました。
            <button 
              className="block mx-auto mt-2 text-blue-500 underline"
              onClick={() => setIsProjectDialogOpen(false)}
            >
              閉じる
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}