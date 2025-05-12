"use client"

import { useContext } from "react"
import { TaskContext } from "../../contexts/TaskContext"
import { UIContext } from "../../contexts/UIContext"

export default function Footer() {
  const { tasks, clipboard } = useContext(TaskContext)
  
  return (
    <footer className="bg-gray-200 border-t border-gray-300 px-4 py-2 text-sm text-gray-600">
      <div className="flex justify-between">
        <span>タスク数: {tasks.filter(t => !t.isProject).length}</span>
        <span>プロジェクト数: {tasks.filter((t) => t.isProject).length}</span>
        <span>完了タスク: {tasks.filter((t) => t.completed).length}</span>
        <span>未完了タスク: {tasks.filter((t) => !t.isProject && !t.completed).length}</span>
        {clipboard && <span>クリップボード: {clipboard.name}</span>}
      </div>
    </footer>
  )
}