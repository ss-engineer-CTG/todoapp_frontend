"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import type { Task } from "@/types/todo"

interface TaskFormProps {
  task?: Task
  projectId: string
  parentId?: string | null
  isOpen: boolean
  onClose: () => void
  onSave: (taskData: Omit<Task, 'id'>) => void
}

export default function TaskForm({ 
  task, 
  projectId, 
  parentId = null, 
  isOpen, 
  onClose, 
  onSave 
}: TaskFormProps) {
  const [name, setName] = useState(task?.name || "")
  const [startDate, setStartDate] = useState(task?.startDate || new Date())
  const [dueDate, setDueDate] = useState(task?.dueDate || new Date(Date.now() + 86400000 * 7))
  const [assignee, setAssignee] = useState(task?.assignee || "自分")
  const [notes, setNotes] = useState(task?.notes || "")

  const handleSave = () => {
    if (name.trim()) {
      onSave({
        name: name.trim(),
        projectId,
        parentId,
        completed: task?.completed || false,
        startDate,
        dueDate,
        completionDate: task?.completionDate || null,
        notes,
        assignee,
        level: task?.level || (parentId ? 1 : 0),
        collapsed: task?.collapsed || false
      })
      onClose()
    }
  }

  const handleClose = () => {
    setName(task?.name || "")
    setStartDate(task?.startDate || new Date())
    setDueDate(task?.dueDate || new Date(Date.now() + 86400000 * 7))
    setAssignee(task?.assignee || "自分")
    setNotes(task?.notes || "")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {task ? "タスクを編集" : parentId ? "新しいサブタスク" : "新しいタスク"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">タスク名</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="タスク名を入力"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave()
                if (e.key === "Escape") handleClose()
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">開始日</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "M月d日", { locale: ja })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => setStartDate(date || new Date())}
                    initialFocus
                    locale={ja}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">期限日</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dueDate, "M月d日", { locale: ja })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => setDueDate(date || new Date())}
                    initialFocus
                    locale={ja}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">担当者</label>
            <Input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="担当者名"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">メモ</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="メモを入力（任意）"
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {task ? "更新" : "作成"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}