"use client"

import { useContext } from "react"
import { List, Clock, Calendar, MoveVertical, Plus, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaskContext } from "../../contexts/TaskContext"
import { UIContext } from "../../contexts/UIContext"
import { useTasks } from "../../hooks/useTasks"
import ShortcutKey from "../common/ShortcutKey"

interface SidebarProps {
  activeView: string
  setActiveView: (view: string) => void
}

export default function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const { tasks } = useContext(TaskContext)
  const { setSelectedTaskId, setFilterStatus, setSearchQuery, setFilterTags, setFilterPriority } = useContext(UIContext)
  const { createNewProject, editTask } = useTasks()

  // 今日のタスク数を取得
  const getTodayTasksCount = () => {
    const today = new Date().toISOString().split("T")[0]
    return tasks.filter((task) => 
      !task.isProject && 
      !task.completed && 
      task.startDate <= today && 
      task.dueDate >= today
    ).length
  }

  return (
    <div className="w-48 bg-gray-100 border-r border-gray-200 p-4">
      <button
        className="w-full mb-4 bg-blue-500 text-white py-2 px-4 rounded flex items-center justify-center hover:bg-blue-600 transition-colors"
        onClick={createNewProject}
      >
        <Plus size={16} className="mr-1" /> 新規プロジェクト
      </button>

      <nav>
        <div className="mb-2 text-sm font-medium text-gray-500">ビュー</div>
        <ul className="space-y-2 mb-4">
          <li>
            <button
              className={`w-full text-left py-2 px-3 rounded flex items-center ${activeView === "project" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-200"}`}
              onClick={() => setActiveView("project")}
            >
              <List size={16} className="mr-2" /> プロジェクト
              <span className="ml-auto text-xs text-gray-500">1</span>
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left py-2 px-3 rounded flex items-center ${activeView === "timeline" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-200"}`}
              onClick={() => setActiveView("timeline")}
            >
              <Clock size={16} className="mr-2" /> タイムライン
              <span className="ml-auto text-xs text-gray-500">2</span>
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left py-2 px-3 rounded flex items-center ${activeView === "table" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-200"}`}
              onClick={() => setActiveView("table")}
            >
              <List size={16} className="mr-2" /> テーブル
              <span className="ml-auto text-xs text-gray-500">3</span>
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left py-2 px-3 rounded flex items-center ${activeView === "today" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-200"}`}
              onClick={() => setActiveView("today")}
            >
              <Calendar size={16} className="mr-2" /> 今日のタスク
              <span className="ml-auto bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getTodayTasksCount()}
              </span>
              <span className="sr-only">4</span>
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left py-2 px-3 rounded flex items-center ${activeView === "kanban" ? "bg-blue-100 text-blue-600" : "hover:bg-gray-200"}`}
              onClick={() => setActiveView("kanban")}
            >
              <MoveVertical size={16} className="mr-2" /> かんばん
              <span className="ml-auto text-xs text-gray-500">5</span>
            </button>
          </li>
        </ul>
        
        <div className="mb-2 text-sm font-medium text-gray-500">プロジェクト</div>
        <ul className="space-y-1 mb-6">
          {tasks
            .filter(task => task.isProject)
            .map(project => (
              <li key={project.id}>
                <button
                  className="w-full text-left py-1 px-3 rounded flex items-center hover:bg-gray-200 group"
                  onClick={() => {
                    setActiveView("project")
                    setSelectedTaskId(project.id)
                    setFilterStatus("all")
                    setSearchQuery("")
                    setFilterTags([])
                    setFilterPriority("all")
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: project.color || '#4a6da7' }}
                  ></div>
                  <span className="truncate">{project.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="ml-auto opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      editTask(project.id)
                    }}
                  >
                    <Edit size={12} />
                  </Button>
                </button>
              </li>
            ))
          }
        </ul>

        <div className="mt-8">
          <h3 className="font-medium text-sm text-gray-500 mb-2">キーボードショートカット</h3>
          <ul className="text-xs space-y-1 text-gray-600">
            <li className="flex justify-between">
              <span>新規タスク</span>
              <ShortcutKey keys="Enter" />
            </li>
            <li className="flex justify-between">
              <span>新規子タスク</span>
              <ShortcutKey keys="Tab" />
            </li>
            <li className="flex justify-between">
              <span>タスク削除</span>
              <ShortcutKey keys="Delete" />
            </li>
            <li className="flex justify-between">
              <span>メモを開く</span>
              <ShortcutKey keys="Ctrl+N" />
            </li>
            <li className="flex justify-between">
              <span>タスクコピー</span>
              <ShortcutKey keys="Ctrl+Shift+C" />
            </li>
            {/* 他のショートカットキー */}
            <li className="flex justify-between">
              <span>クリップボードにコピー</span>
              <ShortcutKey keys="Ctrl+C" />
            </li>
            <li className="flex justify-between">
              <span>タスク切り取り</span>
              <ShortcutKey keys="Ctrl+X" />
            </li>
            <li className="flex justify-between">
              <span>クリップボードからペースト</span>
              <ShortcutKey keys="Ctrl+V" />
            </li>
            <li className="flex justify-between">
              <span>タスク編集</span>
              <ShortcutKey keys="Ctrl+E" />
            </li>
            <li className="flex justify-between">
              <span>完了/未完了切替</span>
              <ShortcutKey keys="Space" />
            </li>
            <li className="flex justify-between">
              <span>優先度を上げる</span>
              <ShortcutKey keys="+" />
            </li>
            <li className="flex justify-between">
              <span>優先度を下げる</span>
              <ShortcutKey keys="-" />
            </li>
            <li className="flex justify-between">
              <span>上へ移動</span>
              <ShortcutKey keys="↑" />
            </li>
            <li className="flex justify-between">
              <span>下へ移動</span>
              <ShortcutKey keys="↓" />
            </li>
            <li className="flex justify-between">
              <span>親へ移動</span>
              <ShortcutKey keys="←" />
            </li>
            <li className="flex justify-between">
              <span>子へ移動</span>
              <ShortcutKey keys="→" />
            </li>
            <li className="flex justify-between">
              <span>新規プロジェクト</span>
              <ShortcutKey keys="Ctrl+Shift+N" />
            </li>
            <li className="flex justify-between">
              <span>検索</span>
              <ShortcutKey keys="Ctrl+F" />
            </li>
            <li className="flex justify-between">
              <span>高度な検索</span>
              <ShortcutKey keys="Ctrl+Shift+F" />
            </li>
            <li className="flex justify-between">
              <span>データ保存</span>
              <ShortcutKey keys="Ctrl+S" />
            </li>
            <li className="flex justify-between">
              <span>インポート/エクスポート</span>
              <ShortcutKey keys="Ctrl+Shift+E" />
            </li>
            <li className="flex justify-between">
              <span>ヘルプ</span>
              <ShortcutKey keys="F1" />
            </li>
          </ul>
        </div>
      </nav>
    </div>
  )
}