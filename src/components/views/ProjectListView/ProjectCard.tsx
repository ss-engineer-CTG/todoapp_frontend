"use client"

import React, { forwardRef } from "react"
import { ChevronDown, ChevronRight, Edit, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Task } from "../../../types/Task"
import TaskItem from "../../common/TaskItem"

interface ProjectCardProps {
  project: Task
  progress: number
  isSelected: boolean
  onSelect: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>, taskId: number) => void
  onToggleExpand: (id: number) => void
  onToggleComplete: (id: number) => void
  onOpenNotes: (id: number) => void
  onEdit: (id: number) => void
  tasks: Task[]
  onDragStart: (e: React.MouseEvent<HTMLDivElement>, task: Task, type: "start" | "end" | "move" | "reorder") => void
  dragOverTaskId: number | null
}

const ProjectCard = forwardRef<HTMLDivElement, ProjectCardProps>(
  ({ 
    project, 
    progress, 
    isSelected, 
    onSelect, 
    onKeyDown, 
    onToggleExpand, 
    onToggleComplete, 
    onOpenNotes, 
    onEdit, 
    tasks,
    onDragStart,
    dragOverTaskId
  }, ref) => {
    // タスク参照用のローカル参照オブジェクト
    const localTaskRefs = React.useRef<{[key: number]: HTMLElement | null}>({});
    
    return (
      <div 
        className="border rounded p-3 hover:shadow-md transition-shadow"
        style={{ borderLeftColor: project.color || '#4a6da7', borderLeftWidth: '4px' }}
      >
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => onToggleExpand(project.id)}
          ref={ref}
          tabIndex={0}
          onKeyDown={(e) => onKeyDown(e, project.id)}
          data-task-id={project.id}
        >
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{project.name}</h3>
            {project.tags && project.tags.length > 0 && (
              <div className="flex gap-1">
                {project.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {project.priority && (
              <span className={`px-2 py-0.5 text-xs rounded ${
                project.priority === 'high' ? 'bg-red-100 text-red-800' : 
                project.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-green-100 text-green-800'
              }`}>
                {project.priority === 'high' ? '優先度: 高' : 
                 project.priority === 'medium' ? '優先度: 中' : '優先度: 低'}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="text-blue-500 hover:text-blue-700 p-1"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(project.id)
              }}
            >
              <Edit size={14} />
            </button>
            <span className="text-sm text-gray-500">
              {project.startDate} 〜 {project.dueDate}
            </span>
            {project.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        </div>
        
        <div className="mt-2">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>進捗率: {progress}%</span>
            <span>担当者: {project.assignee}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {project.expanded && (
          <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-2">
            {tasks
              .filter((task) => task.level === 1)
              .map((task) => {
                // このタスクに子タスクがあるかチェック
                const hasChildren = tasks.some((childTask) => {
                  const taskIndex = tasks.indexOf(task)
                  const childIndex = tasks.indexOf(childTask)
                  return (
                    childTask.level === task.level + 1 &&
                    childIndex > taskIndex &&
                    !tasks.slice(taskIndex + 1, childIndex).some((t) => t.level <= task.level)
                  )
                })
                
                return (
                  <div key={task.id}>
                    <TaskItem
                      task={task}
                      depth={0}
                      isSelected={task.id === task.id}
                      hasChildren={hasChildren}
                      onSelect={() => onSelect()}
                      onToggleExpand={onToggleExpand}
                      onToggleComplete={onToggleComplete}
                      onEdit={onEdit}
                      onOpenNotes={onOpenNotes}
                      onKeyDown={onKeyDown}
                      onDragStart={onDragStart}
                      isDragOver={dragOverTaskId === task.id}
                      taskRef={(el) => (localTaskRefs.current[task.id] = el)}
                    />
                    
                    {task.expanded && hasChildren && (
                      <div className="ml-6 space-y-2 mt-2">
                        {tasks
                          .filter((subTask) => {
                            const taskIndex = tasks.indexOf(task)
                            const subTaskIndex = tasks.indexOf(subTask)
                            return (
                              subTask.level === task.level + 1 &&
                              subTaskIndex > taskIndex &&
                              !tasks.slice(taskIndex + 1, subTaskIndex).some((t) => t.level <= task.level)
                            )
                          })
                          .map((subTask) => (
                            <TaskItem
                              key={subTask.id}
                              task={subTask}
                              depth={1}
                              isSelected={subTask.id === task.id}
                              hasChildren={false}
                              onSelect={() => onSelect()}
                              onToggleExpand={onToggleExpand}
                              onToggleComplete={onToggleComplete}
                              onEdit={onEdit}
                              onOpenNotes={onOpenNotes}
                              onKeyDown={onKeyDown}
                              onDragStart={onDragStart}
                              isDragOver={dragOverTaskId === subTask.id}
                              taskRef={(el) => (localTaskRefs.current[subTask.id] = el)}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        )}
      </div>
    )
  }
)

ProjectCard.displayName = "ProjectCard"

export default ProjectCard