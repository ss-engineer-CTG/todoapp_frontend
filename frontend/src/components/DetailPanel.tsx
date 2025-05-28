import React, { useRef } from 'react'
import { Task, Project } from '../types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { CalendarIcon, X } from 'lucide-react'

interface DetailPanelProps {
  selectedTask: Task | undefined
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  projects: Project[]
  activeArea: string
  setActiveArea: (area: "projects" | "tasks" | "details") => void
  isVisible: boolean
  setIsVisible: (visible: boolean) => void
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  selectedTask,
  onTaskUpdate,
  projects,
  activeArea,
  setActiveArea,
  isVisible,
  setIsVisible
}) => {
  const taskNameInputRef = useRef<HTMLInputElement>(null)
  const startDateButtonRef = useRef<HTMLButtonElement>(null)
  const dueDateButtonRef = useRef<HTMLButtonElement>(null)
  const taskNotesRef = useRef<HTMLTextAreaElement>(null)

  const toggleDetailPanel = () => {
    setIsVisible(!isVisible)
    if (!isVisible && activeArea === "details") {
      setActiveArea("tasks")
    }
  }

  if (!selectedTask) {
    return (
      <div
        className={`w-80 border-l h-full ${activeArea === "details" ? "bg-accent/40" : ""}`}
        onClick={() => setActiveArea("details")}
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>タスクを選択して詳細を表示</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`w-80 border-l h-full ${activeArea === "details" ? "bg-accent/40" : ""}`}
      onClick={() => setActiveArea("details")}
    >
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">タスク詳細</h2>
          <button
            className="p-1 hover:bg-accent rounded"
            onClick={toggleDetailPanel}
            title="詳細パネルを非表示"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 flex-grow overflow-y-auto">
          <div>
            <label className="text-sm font-medium mb-1 block">タスク名</label>
            <input
              ref={taskNameInputRef}
              value={selectedTask.name}
              onChange={(e) => onTaskUpdate(selectedTask.id, { name: e.target.value })}
              className="w-full p-2 border rounded bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium mb-1 block">開始日</label>
              <button
                ref={startDateButtonRef}
                className="w-full flex items-center justify-start text-left font-normal p-2 border rounded hover:bg-accent"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedTask.startDate, "yyyy年M月d日", { locale: ja })}
              </button>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">期限日</label>
              <button
                ref={dueDateButtonRef}
                className="w-full flex items-center justify-start text-left font-normal p-2 border rounded hover:bg-accent"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedTask.dueDate, "yyyy年M月d日", { locale: ja })}
              </button>
            </div>
          </div>

          {selectedTask.completionDate && (
            <div>
              <label className="text-sm font-medium mb-1 block">完了日</label>
              <div className="text-sm p-2 border rounded-md">
                {format(selectedTask.completionDate, "yyyy年M月d日", { locale: ja })}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1 block">プロジェクト</label>
            <div className="text-sm p-2 border rounded-md flex items-center">
              <span
                className="inline-block w-3 h-3 mr-2 rounded-full"
                style={{
                  backgroundColor: projects.find((p) => p.id === selectedTask.projectId)?.color || "#ccc",
                }}
              />
              {projects.find((p) => p.id === selectedTask.projectId)?.name || "不明"}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">担当者</label>
            <div className="text-sm p-2 border rounded-md">{selectedTask.assignee}</div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">メモ</label>
            <textarea
              ref={taskNotesRef}
              value={selectedTask.notes}
              onChange={(e) => onTaskUpdate(selectedTask.id, { notes: e.target.value })}
              className="w-full min-h-[100px] p-2 border rounded bg-background resize-none"
              placeholder="メモを追加..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}