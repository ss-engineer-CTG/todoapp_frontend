"use client"

import { useContext } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UIContext } from "../../contexts/UIContext"
import { TaskContext } from "../../contexts/TaskContext"
import TaskForm from "../forms/TaskForm"
import { useTasks } from "../../hooks/useTasks"

export default function TaskDialog() {
  const { isTaskDialogOpen, setIsTaskDialogOpen } = useContext(UIContext)
  const { currentTask, tasks } = useContext(TaskContext)
  const { saveTaskDetails } = useTasks()
  
  // 利用可能なタグのリストを取得
  const getAvailableTags = () => {
    const allTags = tasks.flatMap(task => task.tags || [])
    return [...new Set(allTags)]
  }

  return (
    <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>タスク詳細</DialogTitle>
        </DialogHeader>

        {currentTask && !currentTask.isProject && (
          <TaskForm
            task={currentTask}
            onSave={saveTaskDetails}
            onCancel={() => setIsTaskDialogOpen(false)}
            projects={tasks.filter((t) => t.isProject)}
            availableTags={getAvailableTags()}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}