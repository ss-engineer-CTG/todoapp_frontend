"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTodoContext } from "@/hooks/use-todo-context"
import { CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

export default function TaskDetailPanel() {
  const {
    tasks,
    projects,
    selectedTaskIds,
    activeArea,
    updateTask,
    toggleDetailPanel
  } = useTodoContext()

  // 選択されたタスクを取得（複数選択時は最初のタスク）
  const selectedTask = selectedTaskIds.length > 0 
    ? tasks.find(task => task.id === selectedTaskIds[0])
    : null

  if (!selectedTask) {
    return (
      <div className={cn(
        "h-full flex flex-col",
        activeArea === "details" ? "bg-accent/40" : ""
      )}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">タスク詳細</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDetailPanel}
            title="詳細パネルを非表示"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>タスクを選択して詳細を表示</p>
        </div>
      </div>
    )
  }

  const selectedProject = projects.find(p => p.id === selectedTask.projectId)

  const handleUpdateTask = (updates: Partial<typeof selectedTask>) => {
    updateTask(selectedTask.id, updates)
  }

  return (
    <div className={cn(
      "h-full flex flex-col",
      activeArea === "details" ? "bg-accent/40" : ""
    )}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">タスク詳細</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDetailPanel}
          title="詳細パネルを非表示"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 詳細内容 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* タスク名 */}
        <div>
          <label className="text-sm font-medium mb-1 block">タスク名</label>
          <Input
            value={selectedTask.name}
            onChange={(e) => handleUpdateTask({ name: e.target.value })}
          />
        </div>

        {/* 開始日・期限日 */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium mb-1 block">開始日</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedTask.startDate, "yyyy年M月d日", { locale: ja })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedTask.startDate}
                  onSelect={(date) => handleUpdateTask({ startDate: date || new Date() })}
                  initialFocus
                  locale={ja}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">期限日</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedTask.dueDate, "yyyy年M月d日", { locale: ja })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedTask.dueDate}
                  onSelect={(date) => handleUpdateTask({ dueDate: date || new Date() })}
                  initialFocus
                  locale={ja}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* 完了日（完了している場合のみ表示） */}
        {selectedTask.completionDate && (
          <div>
            <label className="text-sm font-medium mb-1 block">完了日</label>
            <div className="text-sm p-2 border rounded-md bg-muted/50">
              {format(selectedTask.completionDate, "yyyy年M月d日", { locale: ja })}
            </div>
          </div>
        )}

        {/* プロジェクト */}
        <div>
          <label className="text-sm font-medium mb-1 block">プロジェクト</label>
          <div className="text-sm p-2 border rounded-md bg-muted/50 flex items-center">
            <span
              className="inline-block w-3 h-3 mr-2 rounded-full"
              style={{
                backgroundColor: selectedProject?.color || "#ccc",
              }}
            />
            {selectedProject?.name || "不明"}
          </div>
        </div>

        {/* 担当者 */}
        <div>
          <label className="text-sm font-medium mb-1 block">担当者</label>
          <Input
            value={selectedTask.assignee}
            onChange={(e) => handleUpdateTask({ assignee: e.target.value })}
          />
        </div>

        {/* レベル情報 */}
        <div>
          <label className="text-sm font-medium mb-1 block">階層レベル</label>
          <div className="text-sm p-2 border rounded-md bg-muted/50">
            レベル {selectedTask.level}
            {selectedTask.parentId && " (サブタスク)"}
          </div>
        </div>

        {/* メモ */}
        <div>
          <label className="text-sm font-medium mb-1 block">メモ</label>
          <Textarea
            value={selectedTask.notes}
            onChange={(e) => handleUpdateTask({ notes: e.target.value })}
            className="min-h-[100px]"
            placeholder="メモを追加..."
          />
        </div>

        {/* 複数選択時の情報 */}
        {selectedTaskIds.length > 1 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-md">
            <p className="text-sm text-muted-foreground">
              {selectedTaskIds.length}個のタスクを選択中
              <br />
              最初のタスクの詳細を表示しています
            </p>
          </div>
        )}
      </div>
    </div>
  )
}