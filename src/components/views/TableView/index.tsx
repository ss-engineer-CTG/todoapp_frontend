"use client"

import { useContext } from "react"
import { TaskContext } from "../../../contexts/TaskContext"
import { UIContext } from "../../../contexts/UIContext"
import { useFilterAndSort } from "../../../hooks/useFilterAndSort"
import { useTasks } from "../../../hooks/useTasks"
import { useKeyboardShortcuts } from "../../../hooks/useKeyboardShortcuts"
import { useDragAndDrop } from "../../../hooks/useDragAndDrop"
import FilterToolbar from "./FilterToolbar"
import TableRow from "./TableRow"
import { Task } from "../../../types/Task"  // Task型をインポート

export default function TableView() {
  const { tasks } = useContext(TaskContext)
  const { 
    selectedTaskId, 
    setSelectedTaskId, 
    onKeyDown,
    taskRefs,
  } = useContext(UIContext)
  
  const { toggleExpand, toggleTaskCompletion, openNotes, editTask, confirmDeleteTask } = useTasks()
  const { getVisibleTasks } = useFilterAndSort()
  const { handleDragStart, dragOverTaskId } = useDragAndDrop()
  useKeyboardShortcuts()
  
  const visibleTasks = getVisibleTasks()

  return (
    <div>
      <FilterToolbar />
      
      <div className="bg-white rounded shadow">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 w-8"></th>
              <th className="p-3">タスク</th>
              <th className="p-3 w-32">開始日</th>
              <th className="p-3 w-32">期限日</th>
              <th className="p-3 w-32">担当者</th>
              <th className="p-3 w-20">優先度</th>
              <th className="p-3 w-32">ステータス</th>
              <th className="p-3 w-24">操作</th>
            </tr>
          </thead>
          <tbody>
            {visibleTasks.map((task) => (
              <TableRow
                key={task.id}
                task={task}
                isSelected={selectedTaskId === task.id}
                onSelect={() => setSelectedTaskId(task.id)}
                onKeyDown={onKeyDown}
                onToggleExpand={toggleExpand}
                onToggleComplete={toggleTaskCompletion}
                onOpenNotes={openNotes}
                onEdit={editTask}
                onDelete={confirmDeleteTask}
                hasChildren={
                  visibleTasks.some((childTask) => {
                    const taskIndex = visibleTasks.indexOf(task)
                    const childIndex = visibleTasks.indexOf(childTask)
                    return (
                      childTask.level === task.level + 1 &&
                      childIndex > taskIndex &&
                      !visibleTasks.slice(taskIndex + 1, childIndex).some((t) => t.level <= task.level)
                    )
                  })
                }
                ref={(el) => {
                  if (el) taskRefs.current[task.id] = el;
                  return null;
                }}
                onDragStart={handleDragStart}
                isDragOver={dragOverTaskId === task.id}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}