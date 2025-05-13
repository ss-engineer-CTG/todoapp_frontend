"use client"

import React, { forwardRef } from "react"
import { ChevronDown, ChevronRight, Edit, FileText, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Task } from "../../../types/Task"
import { TaskLevelIndicator } from "../../common/TaskHierarchyUtility"

interface TableRowProps {
  task: Task
  isSelected: boolean
  onSelect: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>, taskId: number) => void
  onToggleExpand: (id: number) => void
  onToggleComplete: (id: number) => void
  onOpenNotes: (id: number) => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  hasChildren: boolean
  onDragStart: (e: React.MouseEvent<HTMLDivElement>, task: Task, type: "start" | "end" | "move" | "reorder") => void
  isDragOver: boolean
}

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ 
    task, 
    isSelected, 
    onSelect, 
    onKeyDown, 
    onToggleExpand, 
    onToggleComplete, 
    onOpenNotes, 
    onEdit, 
    onDelete, 
    hasChildren,
    onDragStart,
    isDragOver
  }, ref) => {
    return (
      <tr
        ref={ref}
        tabIndex={0}
        className={`border-b border-gray-200 hover:bg-blue-50 ${isSelected ? "bg-blue-100" : ""} ${isDragOver ? "bg-yellow-100" : ""} transition-colors`}
        onClick={onSelect}
        onKeyDown={(e) => onKeyDown(e, task.id)}
        data-task-id={task.id}
        onMouseDown={(e) => onDragStart(e, task, "reorder")}
      >
        <td className="p-3">
          {(task.isProject || hasChildren) ? (
            <button
              className="w-6 h-6 flex items-center justify-center text-gray-500"
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand(task.id)
              }}
            >
              {task.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <div className="w-6"></div>
          )}
        </td>
        <td className="p-3">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              {/* 階層レベルを視覚的に表示 */}
              <TaskLevelIndicator level={task.level} />
              
              {!task.isProject && (
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => onToggleComplete(task.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <div
                className={`${task.isProject ? "font-bold" : ""} ${task.completed ? "line-through text-gray-400" : ""}`}
              >
                {task.name}
                {task.priority && (
                  <span className={`ml-2 inline-block w-2 h-2 rounded-full ${
                    task.priority === 'high' ? 'bg-red-500' : 
                    task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></span>
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
              {task.tags && task.tags.length > 0 && (
                <div className="flex gap-1 ml-2">
                  {task.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs py-0 h-5">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="p-3 text-sm text-gray-600">{task.startDate}</td>
        <td className="p-3 text-sm text-gray-600">{task.dueDate}</td>
        <td className="p-3 text-sm">{task.assignee}</td>
        <td className="p-3 text-sm">
          {task.priority && (
            <span className={`px-2 py-1 rounded text-xs ${
              task.priority === 'high' ? 'bg-red-100 text-red-800' : 
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-green-100 text-green-800'
            }`}>
              {task.priority === 'high' ? '高' : 
               task.priority === 'medium' ? '中' : '低'}
            </span>
          )}
        </td>
        <td className="p-3">
          <span
            className={`px-2 py-1 rounded text-xs ${task.completed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
          >
            {task.completed ? "完了" : "進行中"}
          </span>
        </td>
        <td className="p-3">
          <div className="flex space-x-2">
            <button
              className="text-blue-500 hover:text-blue-700"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(task.id)
              }}
            >
              <Edit size={16} />
            </button>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={(e) => {
                e.stopPropagation()
                onOpenNotes(task.id)
              }}
            >
              <FileText size={16} />
            </button>
            <button
              className="text-red-500 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(task.id)
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
    )
  }
)

TableRow.displayName = "TableRow"

export default TableRow