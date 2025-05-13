// src/components/views/TableView/index.tsx
"use client"

import { useContext, useEffect } from "react"
import { TaskContext } from "../../../contexts/TaskContext"
import { UIContext } from "../../../contexts/UIContext"
import { useFilterAndSort } from "../../../hooks/useFilterAndSort"
import { useTasks } from "../../../hooks/useTasks"
import { useKeyboardShortcuts } from "../../../hooks/useKeyboardShortcuts"
import { useDragAndDrop } from "../../../hooks/useDragAndDrop"
import { getDirectChildTasks } from "../../../utils/taskUtils"
import FilterToolbar from "./FilterToolbar"
import TableRow from "./TableRow"
import AddTaskButton from "../../common/AddTaskButton"
import { logInfo } from "../../../utils/logUtils"

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
  
  // キーボードショートカットを有効化
  useKeyboardShortcuts()
  
  // 表示対象のタスクを取得
  const visibleTasks = getVisibleTasks()

  // コンポーネントマウント時のログ
  useEffect(() => {
    logInfo("TableView がレンダリングされました");
  }, []);

  return (
    <div>
      {/* ツールバーエリア */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1">
          <FilterToolbar />
        </div>
        
        {/* 共通コンポーネントを使用 */}
        <AddTaskButton className="ml-4 whitespace-nowrap" />
      </div>
      
      {/* テーブル本体 */}
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
                hasChildren={getDirectChildTasks(task, tasks).length > 0}
                ref={(el) => {
                  if (el) taskRefs.current[task.id] = el;
                }}
                onDragStart={handleDragStart}
                isDragOver={dragOverTaskId === task.id}
              />
            ))}
            
            {/* テーブルが空の場合のメッセージ */}
            {visibleTasks.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500">
                  表示するタスクがありません。新しいタスクを追加してください。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}