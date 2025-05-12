"use client"

import { Badge } from "@/components/ui/badge"
import KanbanCard from "./KanbanCard"
import { Task } from "../../../types/Task"

interface KanbanColumnProps {
  title: string
  tasks: Task[]
  selectedTaskId: number | null
  onSelect: (id: number) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>, taskId: number) => void
  onToggleComplete: (id: number) => void
  onOpenNotes: (id: number) => void
  onEdit: (id: number) => void
  taskRefs: React.MutableRefObject<{ [key: number]: HTMLElement | null }>
  onDragStart: (e: React.MouseEvent<HTMLDivElement>, task: Task, type: "start" | "end" | "move" | "reorder") => void
  dragOverTaskId: number | null
}

export default function KanbanColumn({
  title,
  tasks,
  selectedTaskId,
  onSelect,
  onKeyDown,
  onToggleComplete,
  onOpenNotes,
  onEdit,
  taskRefs,
  onDragStart,
  dragOverTaskId,
}: KanbanColumnProps) {
  return (
    <div className="bg-gray-50 rounded p-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-700">{title}</h3>
        <Badge>{tasks.length}</Badge>
      </div>
      
      <div className="space-y-2">
        {tasks.map(task => (
          <KanbanCard
            key={task.id}
            task={task}
            isSelected={selectedTaskId === task.id}
            onSelect={() => onSelect(task.id)}
            onKeyDown={onKeyDown}
            onToggleComplete={onToggleComplete}
            onOpenNotes={onOpenNotes}
            onEdit={onEdit}
            ref={(el) => (taskRefs.current[task.id] = el)}
            onDragStart={onDragStart}
            isDragOver={dragOverTaskId === task.id}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400 italic text-sm">
            このステータスのタスクはありません
          </div>
        )}
      </div>
    </div>
  )
}