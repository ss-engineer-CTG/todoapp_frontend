"use client"

import { useContext, useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { UIContext } from "../../contexts/UIContext"
import { TaskContext } from "../../contexts/TaskContext"
import { useTasks } from "../../hooks/useTasks"

export default function NoteDialog() {
  const { isNoteDialogOpen, setIsNoteDialogOpen } = useContext(UIContext)
  const { currentTask } = useContext(TaskContext)
  const { saveNotes } = useTasks()
  const [noteContent, setNoteContent] = useState("")

  useEffect(() => {
    if (currentTask && isNoteDialogOpen) {
      setNoteContent(currentTask.notes)
    }
  }, [currentTask, isNoteDialogOpen])

  const handleSave = () => {
    if (currentTask) {
      saveNotes(currentTask.id, noteContent)
      setIsNoteDialogOpen(false)
    }
  }

  return (
    <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{currentTask?.name} のメモ</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="ここにメモを入力..."
            className="min-h-[200px]"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}