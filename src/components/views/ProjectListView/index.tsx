// src/components/views/ProjectListView/index.tsx
"use client"

import { useContext } from "react"
import { TaskContext } from "../../../contexts/TaskContext"
import { UIContext } from "../../../contexts/UIContext"
import { useFilterAndSort } from "../../../hooks/useFilterAndSort"
import { useTasks } from "../../../hooks/useTasks"
import { useKeyboardShortcuts } from "../../../hooks/useKeyboardShortcuts"
import { useDragAndDrop } from "../../../hooks/useDragAndDrop"
import ProjectCard from "./ProjectCard"
import FilterToolbar from "../TableView/FilterToolbar"
import AddTaskButton from "../../common/AddTaskButton"
import { logInfo } from "../../../utils/logUtils"

export default function ProjectListView() {
  const { tasks } = useContext(TaskContext)
  const { 
    selectedTaskId, 
    setSelectedTaskId, 
    onKeyDown,
    taskRefs,
  } = useContext(UIContext)
  
  const { toggleExpand, toggleTaskCompletion, openNotes, editTask } = useTasks()
  const { getFilteredTasks } = useFilterAndSort()
  const { handleDragStart, dragOverTaskId } = useDragAndDrop()
  
  // キーボードショートカットを有効化
  useKeyboardShortcuts()
  
  const projects = getFilteredTasks().filter((task) => task.isProject)

  // プロジェクトの進捗率を計算
  const getProjectProgress = (projectId: number) => {
    const projectTasks = tasks.filter(task => task.projectId === projectId && !task.isProject)
    if (projectTasks.length === 0) return 0
    
    const completedTasks = projectTasks.filter(task => task.completed)
    return Math.round((completedTasks.length / projectTasks.length) * 100)
  }

  // コンポーネントマウント時のログ
  logInfo("ProjectListView がレンダリングされました");

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1">
          <FilterToolbar />
        </div>
        
        {/* タスク追加ボタン - 共通コンポーネントを使用 */}
        <AddTaskButton 
          className="ml-4 whitespace-nowrap"
          level={1}
          projectId={selectedTaskId && tasks.find(t => t.id === selectedTaskId && t.isProject)?.projectId}
        />
      </div>
      
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-xl font-bold mb-4">プロジェクト</h2>
        <div className="space-y-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              progress={getProjectProgress(project.projectId)}
              isSelected={selectedTaskId === project.id}
              onSelect={() => setSelectedTaskId(project.id)}
              onKeyDown={onKeyDown}
              onToggleExpand={toggleExpand}
              onToggleComplete={toggleTaskCompletion}
              onOpenNotes={openNotes}
              onEdit={editTask}
              ref={(el) => {
                if (el) taskRefs.current[project.id] = el;
              }}
              tasks={getFilteredTasks().filter(task => task.projectId === project.projectId && !task.isProject)}
              onDragStart={handleDragStart}
              dragOverTaskId={dragOverTaskId}
            />
          ))}
          
          {/* プロジェクトが空の場合のメッセージ */}
          {projects.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              プロジェクトが見つかりません。新しいプロジェクトを作成してください。
            </div>
          )}
        </div>
      </div>
    </div>
  )
}