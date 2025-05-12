"use client"

import { useContext } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UIContext } from "../../contexts/UIContext"
import { TaskContext } from "../../contexts/TaskContext"
import ProjectForm from "../forms/ProjectForm"
import { useTasks } from "../../hooks/useTasks"

export default function ProjectDialog() {
  const { isProjectDialogOpen, setIsProjectDialogOpen } = useContext(UIContext)
  const { currentTask, tasks } = useContext(TaskContext)
  const { saveProjectDetails } = useTasks()
  
  // 利用可能なタグのリストを取得
  const getAvailableTags = () => {
    const allTags = tasks.flatMap(task => task.tags || [])
    return [...new Set(allTags)]
  }

  return (
    <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>プロジェクト詳細</DialogTitle>
        </DialogHeader>

        {currentTask && currentTask.isProject && (
          <ProjectForm
            project={currentTask}
            onSave={saveProjectDetails}
            onCancel={() => setIsProjectDialogOpen(false)}
            availableTags={getAvailableTags()}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}