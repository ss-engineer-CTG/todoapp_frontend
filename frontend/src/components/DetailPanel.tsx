import React, { RefObject, useEffect } from 'react'
import { Task, Project } from '../types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { CalendarIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface DetailPanelProps {
  selectedTask: Task | undefined
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  projects: Project[]
  activeArea: string
  setActiveArea: (area: "projects" | "tasks" | "details") => void
  isVisible: boolean
  setIsVisible: (visible: boolean) => void
  taskNameInputRef: RefObject<HTMLInputElement>
  startDateButtonRef: RefObject<HTMLButtonElement>
  dueDateButtonRef: RefObject<HTMLButtonElement>
  taskNotesRef: RefObject<HTMLTextAreaElement>
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  selectedTask,
  onTaskUpdate,
  projects,
  activeArea,
  setActiveArea,
  isVisible,
  setIsVisible,
  taskNameInputRef,
  startDateButtonRef,
  dueDateButtonRef,
  taskNotesRef
}) => {
  const toggleDetailPanel = () => {
    setIsVisible(!isVisible)
    if (!isVisible && activeArea === "details") {
      setActiveArea("tasks")
    }
  }

  // フォーカス管理（page.tsx準拠）
  useEffect(() => {
    if (activeArea === "details" && selectedTask) {
      // 詳細パネルがアクティブになった時、最初の要素にフォーカス
      setTimeout(() => {
        taskNameInputRef.current?.focus()
      }, 0)
    }
  }, [activeArea, selectedTask, taskNameInputRef])

  // Tabキー処理の支援（page.tsx準拠）
  useEffect(() => {
    const handleTabInDetailPanel = (e: KeyboardEvent) => {
      if (activeArea !== "details" || !selectedTask) return
      
      // カスタムTabキー処理は useKeyboardShortcuts で行うため、
      // ここでは基本的なフォーカス管理のみ
      if (e.key === "Tab") {
        const focusableElements = [
          taskNameInputRef.current,
          startDateButtonRef.current,
          dueDateButtonRef.current,
          taskNotesRef.current
        ].filter(Boolean)

        const currentIndex = focusableElements.indexOf(document.activeElement as any)
        
        // フォーカス可能要素が見つからない場合は最初の要素にフォーカス
        if (currentIndex === -1 && focusableElements.length > 0) {
          e.preventDefault()
          focusableElements[0]?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabInDetailPanel)
    return () => {
      document.removeEventListener('keydown', handleTabInDetailPanel)
    }
  }, [activeArea, selectedTask, taskNameInputRef, startDateButtonRef, dueDateButtonRef, taskNotesRef])

  if (!selectedTask) {
    return (
      <div
        className={cn(
          "w-80 border-l h-full",
          activeArea === "details" ? "bg-accent/40" : ""
        )}
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
      className={cn(
        "w-80 border-l h-full",
        activeArea === "details" ? "bg-accent/40" : ""
      )}
      onClick={() => setActiveArea("details")}
    >
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">タスク詳細</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDetailPanel}
            title="詳細パネルを非表示"
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 flex-grow overflow-y-auto">
          {/* タスク名 - Tab順序1番目 */}
          <div>
            <label className="text-sm font-medium mb-1 block">タスク名</label>
            <Input
              ref={taskNameInputRef}
              value={selectedTask.name}
              onChange={(e) => onTaskUpdate(selectedTask.id, { name: e.target.value })}
              tabIndex={activeArea === "details" ? 1 : -1}
            />
          </div>

          {/* 開始日・期限日 - Tab順序2番目、3番目 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium mb-1 block">開始日</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    ref={startDateButtonRef}
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    tabIndex={activeArea === "details" ? 2 : -1}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedTask.startDate, "yyyy年M月d日", { locale: ja })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedTask.startDate}
                    onSelect={(date) => onTaskUpdate(selectedTask.id, { startDate: date || new Date() })}
                    initialFocus
                    locale={ja}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">期限日</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    ref={dueDateButtonRef}
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    tabIndex={activeArea === "details" ? 3 : -1}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedTask.dueDate, "yyyy年M月d日", { locale: ja })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedTask.dueDate}
                    onSelect={(date) => onTaskUpdate(selectedTask.id, { dueDate: date || new Date() })}
                    initialFocus
                    locale={ja}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 完了日 */}
          {selectedTask.completionDate && (
            <div>
              <label className="text-sm font-medium mb-1 block">完了日</label>
              <div className="text-sm p-2 border rounded-md">
                {format(selectedTask.completionDate, "yyyy年M月d日", { locale: ja })}
              </div>
            </div>
          )}

          {/* プロジェクト */}
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

          {/* 担当者 */}
          <div>
            <label className="text-sm font-medium mb-1 block">担当者</label>
            <Input
              value={selectedTask.assignee}
              onChange={(e) => onTaskUpdate(selectedTask.id, { assignee: e.target.value })}
              tabIndex={activeArea === "details" ? 4 : -1}
            />
          </div>

          {/* メモ - Tab順序4番目（最後） */}
          <div>
            <label className="text-sm font-medium mb-1 block">メモ</label>
            <Textarea
              ref={taskNotesRef}
              value={selectedTask.notes}
              onChange={(e) => onTaskUpdate(selectedTask.id, { notes: e.target.value })}
              className="min-h-[100px] resize-none"
              placeholder="メモを追加..."
              tabIndex={activeArea === "details" ? 5 : -1}
            />
          </div>
        </div>
      </div>
    </div>
  )
}