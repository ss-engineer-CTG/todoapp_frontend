"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTodoContext } from "@/hooks/use-todo-context"
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  MoreHorizontal, 
  Copy, 
  Trash 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import type { Task } from "@/types/todo"

interface TaskItemProps {
  task: Task
}

export default function TaskItem({ task }: TaskItemProps) {
  const {
    selectedTaskIds,
    isMultiSelectMode,
    taskRelationMap,
    selectTask,
    toggleTaskCompletion,
    toggleTaskCollapse,
    addTask,
    copyTasks,
    deleteTasks
  } = useTodoContext()

  const isSelected = selectedTaskIds.includes(task.id)
  const hasChildren = (taskRelationMap.childrenMap[task.id]?.length || 0) > 0

  const handleSelect = (e: React.MouseEvent) => {
    selectTask(task.id, e)
  }

  const handleToggleCompletion = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleTaskCompletion(task.id)
  }

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleTaskCollapse(task.id)
  }

  const handleAddSubtask = (e: React.MouseEvent) => {
    e.stopPropagation()
    // サブタスク追加のロジック
    addTask({
      name: "新しいサブタスク",
      projectId: task.projectId,
      parentId: task.id,
      completed: false,
      startDate: task.startDate,
      dueDate: task.dueDate,
      completionDate: null,
      notes: "",
      assignee: task.assignee,
      level: task.level + 1,
      collapsed: false
    })
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isMultiSelectMode && selectedTaskIds.includes(task.id)) {
      copyTasks(selectedTaskIds)
    } else {
      copyTasks([task.id])
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    const tasksToDelete = isMultiSelectMode && selectedTaskIds.includes(task.id) 
      ? selectedTaskIds 
      : [task.id]
      
    if (confirm(`${tasksToDelete.length}個のタスクを削除しますか？`)) {
      deleteTasks(tasksToDelete)
    }
  }

  return (
    <div
      className={cn(
        "flex items-start p-2 rounded-md cursor-pointer group transition-colors",
        isSelected ? "bg-accent/80 ring-1 ring-primary" : "hover:bg-accent/50",
        task.completed ? "text-muted-foreground" : ""
      )}
      style={{ marginLeft: `${task.level * 1.5}rem` }}
      onClick={handleSelect}
    >
      {/* 展開/折りたたみボタン */}
      <div className="w-4 flex justify-center">
        {hasChildren ? (
          <button
            className="text-muted-foreground hover:text-foreground"
            onClick={handleToggleCollapse}
            title={task.collapsed ? "サブタスクを展開" : "サブタスクを折りたたみ"}
          >
            {task.collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}
      </div>

      {/* チェックボックス */}
      <Checkbox
        checked={task.completed}
        onCheckedChange={handleToggleCompletion}
        className="mr-2 mt-0.5"
        onClick={(e) => e.stopPropagation()}
      />

      {/* タスク内容 */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-medium truncate",
          task.completed ? "line-through" : ""
        )}>
          {task.name}
        </div>

        <div className="flex items-center text-xs text-muted-foreground mt-1 space-x-2">
          <span>期限: {format(task.dueDate, "M月d日", { locale: ja })}</span>
          {task.notes && <span>📝</span>}
          {hasChildren && (
            <span className="bg-muted px-1 rounded text-xs">
              {taskRelationMap.childrenMap[task.id]?.length || 0}個のサブタスク
            </span>
          )}
        </div>
      </div>

      {/* アクション */}
      <div className="flex opacity-0 group-hover:opacity-100 ml-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleAddSubtask}
          title="サブタスク追加"
        >
          <Plus className="h-3 w-3" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              {isMultiSelectMode && selectedTaskIds.includes(task.id)
                ? `${selectedTaskIds.length}個のタスクをコピー`
                : "コピー"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive"
            >
              <Trash className="h-4 w-4 mr-2" />
              {isMultiSelectMode && selectedTaskIds.includes(task.id)
                ? `${selectedTaskIds.length}個のタスクを削除`
                : "削除"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}