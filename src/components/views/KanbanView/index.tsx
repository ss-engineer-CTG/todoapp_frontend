"use client"

import { useState, useContext } from "react"
import { TaskContext } from "../../../contexts/TaskContext"
import { UIContext } from "../../../contexts/UIContext"
import { useFilterAndSort } from "../../../hooks/useFilterAndSort"
import { useTasks } from "../../../hooks/useTasks"
import { useKeyboardShortcuts } from "../../../hooks/useKeyboardShortcuts"
import { useDragAndDrop } from "../../../hooks/useDragAndDrop"
import KanbanColumn from "./KanbanColumn"
import FilterToolbar from "../TableView/FilterToolbar"  // 共通のフィルタリングツールバーを再利用
import { Task } from "../../../types/Task"  // Task型をインポート

export default function KanbanView() {
  const { tasks } = useContext(TaskContext)
  const { 
    selectedTaskId, 
    setSelectedTaskId, 
    onKeyDown,
    taskRefs,
  } = useContext(UIContext)
  
  const { toggleTaskCompletion, openNotes, editTask } = useTasks()
  const { getFilteredTasks } = useFilterAndSort()
  const { handleDragStart, dragOverTaskId } = useDragAndDrop()
  useKeyboardShortcuts()
  
  // プロジェクトの一覧
  const projects = tasks.filter(task => task.isProject)
  
  // かんばんの列
  const columns = [
    { id: "backlog", name: "未着手", filter: (task: Task) => !task.completed && task.startDate > new Date().toISOString().split('T')[0] },
    { id: "inProgress", name: "進行中", filter: (task: Task) => !task.completed && task.startDate <= new Date().toISOString().split('T')[0] && task.dueDate >= new Date().toISOString().split('T')[0] },
    { id: "completed", name: "完了", filter: (task: Task) => task.completed },
  ]
  
  // 現在選択中のプロジェクト
  const [activeProject, setActiveProject] = useState<number | null>(null)
  
  // 現在のプロジェクトに属するタスク
  const filteredTasks = getFilteredTasks()
  const projectTasks = filteredTasks.filter(task => 
    !task.isProject && 
    (activeProject === null || task.projectId === activeProject)
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <FilterToolbar />
        
        <select 
          className="border rounded p-1 ml-4"
          value={activeProject || ""}
          onChange={(e) => setActiveProject(Number(e.target.value) || null)}
        >
          <option value="">すべてのプロジェクト</option>
          {projects.map(project => (
            <option key={project.projectId} value={project.projectId}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-xl font-bold mb-4">かんばんボード</h2>
        
        <div className="grid grid-cols-3 gap-4">
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
              title={column.name}
              tasks={projectTasks.filter(column.filter)}
              selectedTaskId={selectedTaskId}
              onSelect={setSelectedTaskId}
              onKeyDown={onKeyDown}
              onToggleComplete={toggleTaskCompletion}
              onOpenNotes={openNotes}
              onEdit={editTask}
              taskRefs={taskRefs}
              onDragStart={handleDragStart}
              dragOverTaskId={dragOverTaskId}
            />
          ))}
        </div>
      </div>
    </div>
  )
}