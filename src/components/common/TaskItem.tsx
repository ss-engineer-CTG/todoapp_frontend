"use client"

import React from "react"
import { FileText, Edit, ChevronDown, ChevronRight } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Task } from "../../types/Task"

interface TaskItemProps {
  task: Task
  depth: number
  isSelected: boolean
  hasChildren: boolean
  onSelect: (id: number) => void
  onToggleExpand: (id: number) => void
  onToggleComplete: (id: number) => void
  onEdit: (id: number) => void
  onOpenNotes: (id: number) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>, taskId: number) => void
  onDragStart?: (e: React.MouseEvent<HTMLDivElement>, task: Task, type: "start" | "end" | "move" | "reorder") => void
  isDragOver?: boolean
  taskRef: (el: HTMLElement | null) => void
}

export default function TaskItem({
  task,
  depth,
  isSelected,
  hasChildren,
  onSelect,
  onToggleExpand,
  onToggleComplete,
  onEdit,
  onOpenNotes,
  onKeyDown,
  onDragStart,
  isDragOver,
  taskRef
}: TaskItemProps) {
  return (
    <div
      ref={taskRef}
      tabIndex={0}
      className={`p-2 rounded my-1 transition-colors ${isSelected ? "bg-blue-100" : "hover:bg-gray-100"} ${isDragOver ? "bg-yellow-100" : ""}`}
      onClick={() => onSelect(task.id)}
      onKeyDown={(e) => onKeyDown(e, task.id)}
      data-task-id={task.id}
      onMouseDown={onDragStart ? (e) => onDragStart(e, task, "reorder") : undefined}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div style={{ width: `${depth * 20}px` }} className="flex-shrink-0" />
          
          {hasChildren && (
            <button
              className="w-6 h-6 flex items-center justify-center text-gray-500"
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand(task.id)
              }}
            >
              {task.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          
          {!task.isProject && (
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => onToggleComplete(task.id)}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          
          <div>
            <span className={`${task.isProject ? "font-bold" : ""} ${task.completed ? "line-through text-gray-400" : ""}`}>
              {task.name}
              {task.priority && (
                <span className={`ml-2 inline-block w-2 h-2 rounded-full ${
                  task.priority === 'high' ? 'bg-red-500' : 
                  task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></span>
              )}
            </span>
            
            {task.tags && task.tags.length > 0 && (
              <div className="flex gap-1 mt-1">
                {task.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs py-0 h-5">
                    {tag}
                  </Badge>
                ))}
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
              <FileText size={14} />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{task.assignee}</span>
          <button
            className="text-blue-500 hover:text-blue-700"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(task.id)
            }}
          >
            <Edit size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}