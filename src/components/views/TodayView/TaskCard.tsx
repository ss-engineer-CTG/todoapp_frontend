"use client"

import React, { forwardRef } from "react"
import { FileText, Edit } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Task } from "../../../types/Task"

interface TaskCardProps {
  task: Task
  isSelected: boolean
  onSelect: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>, taskId: number) => void
  onToggleComplete: (id: number) => void
  onOpenNotes: (id: number) => void
  onEdit: (id: number) => void
  variant?: "normal" | "overdue" | "upcoming" | "compact"
}

const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
  ({ 
    task,
    isSelected,
    onSelect,
    onKeyDown,
    onToggleComplete,
    onOpenNotes,
    onEdit,
    variant = "normal"
  }, ref) => {
    const getCardClassName = () => {
      const baseClass = `p-3 border rounded ${isSelected ? "border-blue-300" : ""}`
      
      switch (variant) {
        case "overdue":
          return `${baseClass} border-red-200 ${isSelected ? "bg-red-50 border-red-300" : "hover:bg-red-50"}`
        case "upcoming":
          return `${baseClass} ${isSelected ? "bg-blue-100" : "hover:bg-gray-50"}`
        case "compact":
          return `${baseClass} ${isSelected ? "bg-blue-100" : "hover:bg-gray-50"} py-2`
        default:
          return `${baseClass} ${isSelected ? "bg-blue-100" : "hover:bg-gray-50"}`
      }
    }

    return (
      <div
        ref={ref}
        className={getCardClassName()}
        onClick={onSelect}
        tabIndex={0}
        onKeyDown={(e) => onKeyDown(e, task.id)}
        data-task-id={task.id}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => onToggleComplete(task.id)}
              onClick={(e) => e.stopPropagation()}
            />
            <div>
              <div className={`${task.completed ? "line-through text-gray-400" : "font-medium"} flex items-center gap-2`}>
                {task.name}
                {variant === "overdue" && <Badge variant="destructive">期限切れ</Badge>}
                {task.priority && (
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' : 
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority === 'high' ? '優先度: 高' : 
                     task.priority === 'medium' ? '優先度: 中' : '優先度: 低'}
                  </span>
                )}
              </div>
              {variant !== "compact" && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <span>プロジェクト: {task.projectName}</span>
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex gap-1">
                      {task.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {task.notes && (
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenNotes(task.id)
                }}
              >
                <FileText size={16} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm">
              <div>{task.assignee}</div>
              <div className={`text-gray-400 ${variant === "overdue" ? "text-red-500 font-medium" : ""}`}>
                {variant === "upcoming" ? `開始: ${task.startDate}` : `期限: ${task.dueDate}`}
              </div>
            </div>
            <button
              className="text-blue-500 hover:text-blue-700"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(task.id)
              }}
            >
              <Edit size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }
)

TaskCard.displayName = "TaskCard"

export default TaskCard