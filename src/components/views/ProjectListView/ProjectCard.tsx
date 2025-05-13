"use client"

import React, { forwardRef, useContext } from "react"
import { ChevronDown, ChevronRight, Edit, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Task } from "../../../types/Task"
import { TaskContext } from "../../../contexts/TaskContext"
import { getDirectChildTasks } from "../../../utils/taskUtils"
import { TaskLevelIndicator } from "../../common/TaskHierarchyUtility"

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
    const { tasks: allTasks } = useContext(TaskContext)
    
    // タスク参照用のローカル参照オブジェクト
    const localTaskRefs = React.useRef<{[key: number]: HTMLElement | null}>({});
    
    // 階層的にタスクを表示する再帰関数
    const renderTask = (task: Task, depth: number = 0) => {
      const childTasks = getDirectChildTasks(task, allTasks);
      const hasChildren = childTasks.length > 0;
      const isHighlighted = dragOverTaskId === task.id;
      
      return (
        <div key={task.id} className="mb-2">
          <div 
            className={`flex items-center p-2 rounded ${
              isHighlighted ? "bg-yellow-100" : ""
            } hover:bg-gray-100`}
            ref={(el) => (localTaskRefs.current[task.id] = el)}
            data-task-id={task.id}
            onMouseDown={(e) => onDragStart(e, task, "reorder")}
          >
            {/* 展開/折りたたみボタン */}
            {hasChildren && (
              <button
                className="mr-2 text-gray-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(task.id);
                }}
              >
                {task.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
            
            {/* インデント表示 */}
            <div style={{ marginLeft: hasChildren ? 0 : 20 }}>
              <TaskLevelIndicator level={depth} />
            </div>
            
            {/* チェックボックス */}
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => onToggleComplete(task.id)}
              className="mr-2"
            />
            
            {/* タスク名 */}
            <div className={`flex-grow ${task.completed ? "line-through text-gray-400" : ""}`}>
              {task.name}
              
              {/* タグ */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {task.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {/* 日付と担当者 */}
            <div className="text-xs text-gray-500 mr-2">
              {task.startDate} 〜 {task.dueDate}
              <div>{task.assignee}</div>
            </div>
            
            {/* メモとアクションボタン */}
            <div className="flex items-center">
              {task.notes && (
                <button
                  className="text-gray-400 hover:text-gray-600 mr-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenNotes(task.id);
                  }}
                >
                  <FileText size={14} />
                </button>
              )}
              
              <button
                className="text-blue-500 hover:text-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task.id);
                }}
              >
                <Edit size={14} />
              </button>
            </div>
          </div>
          
          {/* 子タスクを展開表示 */}
          {task.expanded && childTasks.length > 0 && (
            <div className="ml-8 pl-2 border-l border-gray-200">
              {childTasks.map(childTask => renderTask(childTask, depth + 1))}
            </div>
          )}
        </div>
      );
    };
    
    // プロジェクト直下のタスク（parentId = null）を取得
    const rootTasks = tasks.filter(t => t.parentId === null);
    
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
          <div className="mt-4">
            {rootTasks.length > 0 ? (
              rootTasks.map(task => renderTask(task))
            ) : (
              <div className="text-center py-4 text-gray-500">
                このプロジェクトにはまだタスクがありません。
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)

ProjectCard.displayName = "ProjectCard"

export default ProjectCard