"use client"

import React, { forwardRef } from "react"
import { FileText, Edit } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Task } from "../../../types/Task"

interface KanbanCardProps {
  task: Task
  isSelected: boolean
  onSelect: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>, taskId: number) => void
  onToggleComplete: (id: number) => void
  onOpenNotes: (id: number) => void
  onEdit: (id: number) => void
  onDragStart: (e: React.MouseEvent<HTMLDivElement>, task: Task, type: "start" | "end" | "move" | "reorder") => void
  isDragOver: boolean
}

const KanbanCard = forwardRef<HTMLDivElement, KanbanCardProps>(
  ({ 
    task,
    isSelected,
    onSelect,
    onKeyDown,
    onToggleComplete,
    onOpenNotes,
    onEdit,
    onDragStart,
    isDragOver
  }, ref) => {
    return (
      <Card 
        className={`${
          isSelected ? "ring-2 ring-blue-500" : ""
        } ${
          isDragOver ? "bg-yellow-100" : ""
        } cursor-grab hover:shadow-md transition-shadow`}
        ref={ref}
        data-task-id={task.id}
        tabIndex={0}
        onKeyDown={(e) => onKeyDown(e, task.id)}
        onClick={onSelect}
        onMouseDown={(e) => onDragStart(e, task, "reorder")}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              {task.name}
              {task.priority && (
                <span className={`inline-block w-2 h-2 rounded-full ${
                  task.priority === 'high' ? 'bg-red-500' : 
                  task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></span>
              )}
            </CardTitle>
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => onToggleComplete(task.id)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <CardDescription className="text-xs">
            {task.projectName}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-1 text-xs">
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {task.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs py-0 px-1 h-4">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex justify-between text-gray-500">
            <div>{task.startDate} 〜 {task.dueDate}</div>
            <div>{task.assignee}</div>
          </div>
        </CardContent>
        <CardFooter className="pt-1 pb-2 flex justify-end gap-1">
          {task.notes && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1"
              onClick={(e) => {
                e.stopPropagation()
                onOpenNotes(task.id)
              }}
            >
              <FileText size={14} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(task.id)
            }}
          >
            <Edit size={14} />
          </Button>
        </CardFooter>
      </Card>
    )
  }
)

KanbanCard.displayName = "KanbanCard"

export default KanbanCard