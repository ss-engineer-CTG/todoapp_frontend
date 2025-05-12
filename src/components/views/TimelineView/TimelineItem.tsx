"use client"

import React, { forwardRef } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Task } from "../../../types/Task"

interface Month {
  id: string
  name: string
  daysInMonth: number
}

interface TimelineItemProps {
  task: Task
  month: Month
  isSelected: boolean
  onSelect: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>, taskId: number) => void
  onToggleComplete: (id: number) => void
  onDragStart: (e: React.MouseEvent<HTMLDivElement>, task: Task, type: "start" | "end" | "move") => void
  isDragging: boolean
  dragType: "start" | "end" | "move" | "reorder" | null
}

const TimelineItem = forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ 
    task,
    month,
    isSelected,
    onSelect,
    onKeyDown,
    onToggleComplete,
    onDragStart,
    isDragging,
    dragType
  }, ref) => {
    // 月内でのタスクの開始日と終了日を計算
    const startDay = task.startDate.substring(0, 7) === month.id 
      ? Number.parseInt(task.startDate.split("-")[2]) 
      : 1

    const endDay = task.dueDate.substring(0, 7) === month.id
      ? Number.parseInt(task.dueDate.split("-")[2])
      : month.daysInMonth

    // 優先度に基づく色の設定
    const getTaskColor = () => {
      if (task.completed) return 'bg-green-200'
      
      switch (task.priority) {
        case 'high': return 'bg-red-200'
        case 'medium': return 'bg-yellow-200'
        case 'low': return 'bg-blue-200'
        default: return 'bg-blue-200'
      }
    }

    return (
      <div className="flex mt-1">
        <div className="w-40 truncate pr-2 flex items-center">
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => onToggleComplete(task.id)}
            className="mr-2"
          />
          <span className={task.completed ? "line-through text-gray-400" : ""}>
            {task.name}
            {task.tags && task.tags.length > 0 && (
              <span className="ml-1 text-xs text-gray-500">
                ({task.tags.join(', ')})
              </span>
            )}
          </span>
        </div>
        <div
          className="flex-1 grid relative border-l border-gray-200"
          style={{ gridTemplateColumns: `repeat(${month.daysInMonth}, minmax(25px, 1fr))` }}
        >
          <div
            ref={ref}
            className={`absolute h-6 rounded ${getTaskColor()} ${
              isSelected ? "ring-2 ring-blue-500" : ""
            } ${isDragging ? "opacity-70" : ""} cursor-grab`}
            style={{
              left: `${((startDay - 1) / month.daysInMonth) * 100}%`,
              width: `${((endDay - startDay + 1) / month.daysInMonth) * 100}%`,
              top: "4px",
            }}
            onClick={onSelect}
            tabIndex={0}
            onKeyDown={(e) => onKeyDown(e, task.id)}
            onMouseDown={(e) => onDragStart(e, task, "move")}
            data-task-id={task.id}
          >
            <div className="text-xs px-2 truncate flex justify-between items-center h-full">
              <div className="flex items-center gap-1">
                <span>{task.name}</span>
                {task.assignee && (
                  <span className="text-gray-600 text-xs">({task.assignee})</span>
                )}
              </div>
              <div className="flex space-x-1">
                <div
                  className="cursor-w-resize w-1 h-4 bg-gray-400 opacity-50 hover:opacity-100 rounded"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    onDragStart(e, task, "start")
                  }}
                />
                <div
                  className="cursor-e-resize w-1 h-4 bg-gray-400 opacity-50 hover:opacity-100 rounded"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    onDragStart(e, task, "end")
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

TimelineItem.displayName = "TimelineItem"

export default TimelineItem