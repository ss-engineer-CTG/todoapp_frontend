"use client"

import { useContext } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UIContext } from "../../contexts/UIContext"
import { TaskContext } from "../../contexts/TaskContext"
import { useTasks } from "../../hooks/useTasks"

export default function DeleteConfirmDialog() {
  const { isDeleteConfirmOpen, setIsDeleteConfirmOpen, taskToDelete } = useContext(UIContext)
  const { tasks } = useContext(TaskContext)
  const { deleteTask } = useTasks()

  const handleDelete = () => {
    if (taskToDelete !== null) {
      deleteTask(taskToDelete)
      setIsDeleteConfirmOpen(false)
    }
  }

  const taskName = taskToDelete !== null 
    ? tasks.find(t => t.id === taskToDelete)?.name || "" 
    : ""

  return (
    <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>削除の確認</DialogTitle>
          <DialogDescription>
            このタスクとその子タスクをすべて削除します。この操作は元に戻せません。
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {taskToDelete !== null && (
            <p>「{taskName}」を削除しますか？</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
            キャンセル
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
          >
            削除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}