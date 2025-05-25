"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useTodoContext } from "@/hooks/use-todo-context"
import TaskItem from "./task-item"
import { 
  Plus, 
  PanelRight, 
  X, 
  Check, 
  Copy, 
  Trash 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/utils/format"

export default function TaskList() {
  const {
    projects,
    tasks,
    selectedProjectId,
    selectedTaskIds,
    isMultiSelectMode,
    showCompleted,
    isDetailPanelVisible,
    filteredTasks,
    activeArea,
    addTask,
    toggleTaskCompletion,
    copyTasks,
    deleteTasks,
    toggleDetailPanel,
    toggleShowCompleted,
    clearSelection,
    toggleMultiSelectMode
  } = useTodoContext()

  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskName, setNewTaskName] = useState("")

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  const handleAddTask = () => {
    setIsAddingTask(true)
  }

  const handleSaveNewTask = () => {
    if (newTaskName.trim() && selectedProjectId) {
      addTask({
        name: newTaskName.trim(),
        projectId: selectedProjectId,
        parentId: null,
        completed: false,
        startDate: new Date(),
        dueDate: new Date(Date.now() + 86400000 * 7), // 1週間後
        completionDate: null,
        notes: "",
        assignee: "自分",
        level: 0,
        collapsed: false
      })
      setNewTaskName("")
      setIsAddingTask(false)
    } else {
      setIsAddingTask(false)
    }
  }

  const handleMultiAction = (action: 'complete' | 'copy' | 'delete') => {
    if (selectedTaskIds.length === 0) return

    switch (action) {
      case 'complete':
        selectedTaskIds.forEach(taskId => toggleTaskCompletion(taskId))
        break
      case 'copy':
        copyTasks(selectedTaskIds)
        break
      case 'delete':
        if (confirm(`${selectedTaskIds.length}個のタスクを削除しますか？`)) {
          deleteTasks(selectedTaskIds)
        }
        break
    }
  }

  return (
    <div className={cn(
      "flex flex-col h-full",
      activeArea === "tasks" ? "bg-accent/40" : ""
    )}>
      {/* ヘッダー */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">
            {selectedProject ? (
              <>
                <span
                  className="inline-block w-4 h-4 mr-2 rounded-full"
                  style={{ backgroundColor: selectedProject.color }}
                />
                {selectedProject.name}
              </>
            ) : (
              "プロジェクトを選択してください"
            )}
          </h1>

          {isMultiSelectMode && selectedTaskIds.length > 0 && (
            <div className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
              {selectedTaskIds.length}個のタスクを選択中
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* 複数選択モード切り替え */}
          <Button
            variant={isMultiSelectMode ? "secondary" : "outline"}
            size="sm"
            onClick={toggleMultiSelectMode}
            className="text-xs"
          >
            {isMultiSelectMode ? "選択モード解除" : "複数選択"}
          </Button>

          {/* 選択解除ボタン */}
          {isMultiSelectMode && selectedTaskIds.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearSelection}
              className="text-xs"
            >
              選択解除
            </Button>
          )}

          {/* 完了タスク表示切り替え */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-completed"
              checked={showCompleted}
              onCheckedChange={toggleShowCompleted}
            />
            <label htmlFor="show-completed" className="text-sm">
              完了タスク表示
            </label>
          </div>

          {/* タスク追加ボタン */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddTask}
            disabled={!selectedProjectId}
          >
            <Plus className="h-4 w-4 mr-1" />
            タスク追加
          </Button>

          {/* 詳細パネル切り替え */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDetailPanel}
            title={isDetailPanelVisible ? "詳細パネルを非表示" : "詳細パネルを表示"}
          >
            {isDetailPanelVisible ? <X className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* タスクリスト */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTasks.length === 0 && !isAddingTask ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>タスクがありません</p>
            {selectedProjectId && (
              <Button variant="outline" className="mt-2" onClick={handleAddTask}>
                <Plus className="h-4 w-4 mr-1" />
                最初のタスクを追加
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}

            {/* 新規タスク追加フィールド */}
            {isAddingTask && (
              <div className="flex items-center p-2">
                <div className="w-4 mr-2" />
                <Checkbox className="mr-2 opacity-50" disabled />
                <Input
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  onBlur={handleSaveNewTask}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveNewTask()
                    if (e.key === "Escape") setIsAddingTask(false)
                  }}
                  placeholder="新しいタスク"
                  className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                  autoFocus
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 複数選択時のアクションバー */}
      {isMultiSelectMode && selectedTaskIds.length > 0 && (
        <div className="border-t p-2 bg-muted/50 flex items-center justify-between">
          <div className="text-sm font-medium">
            {selectedTaskIds.length}個のタスクを選択中
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMultiAction('copy')}
            >
              <Copy className="h-4 w-4 mr-1" />
              コピー
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMultiAction('complete')}
            >
              <Check className="h-4 w-4 mr-1" />
              完了切替
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMultiAction('delete')}
              className="text-destructive"
            >
              <Trash className="h-4 w-4 mr-1" />
              削除
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearSelection}
            >
              選択解除
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}