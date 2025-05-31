import React, { RefObject, useEffect } from 'react'
import { Task, Project } from '../types'
import { safeFormatDate } from '../utils/dateUtils'
import { logger } from '../utils/logger'
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

  // フォーカス管理
  useEffect(() => {
    if (activeArea === "details" && selectedTask) {
      // 詳細パネルがアクティブになった時、最初の要素にフォーカス
      setTimeout(() => {
        taskNameInputRef.current?.focus()
      }, 0)
    }
  }, [activeArea, selectedTask, taskNameInputRef])

  // Tabキー処理の支援
  useEffect(() => {
    const handleTabInDetailPanel = (e: KeyboardEvent) => {
      if (activeArea !== "details" || !selectedTask) return
      
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

  // システムプロンプト準拠：安全な日付更新処理
  const handleDateUpdate = (field: 'startDate' | 'dueDate', date: Date | undefined) => {
    if (!selectedTask || !date) return
    
    try {
      // 有効な日付であることを確認
      if (isNaN(date.getTime())) {
        logger.warn('Invalid date provided for update', { field, date })
        return
      }
      
      logger.debug('Updating task date field', { 
        taskId: selectedTask.id, 
        field, 
        newDate: date.toISOString() 
      })
      
      onTaskUpdate(selectedTask.id, { [field]: date })
    } catch (error) {
      logger.error('Error updating date field', { 
        taskId: selectedTask.id, 
        field, 
        date, 
        error 
      })
    }
  }

  // システムプロンプト準拠：安全なテキスト更新処理
  const handleTextUpdate = (field: 'name' | 'assignee' | 'notes', value: string) => {
    if (!selectedTask) return
    
    try {
      logger.debug('Updating task text field', { 
        taskId: selectedTask.id, 
        field, 
        valueLength: value.length 
      })
      
      onTaskUpdate(selectedTask.id, { [field]: value })
    } catch (error) {
      logger.error('Error updating text field', { 
        taskId: selectedTask.id, 
        field, 
        value, 
        error 
      })
    }
  }

  // システムプロンプト準拠：安全なプロジェクト情報取得
  const getProjectInfo = (projectId: string) => {
    try {
      const project = projects.find((p) => p.id === projectId)
      return {
        name: project?.name || '不明なプロジェクト',
        color: project?.color || '#ccc'
      }
    } catch (error) {
      logger.warn('Error getting project info', { projectId, error })
      return {
        name: '不明なプロジェクト',
        color: '#ccc'
      }
    }
  }

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

  // システムプロンプト準拠：データ検証
  if (!selectedTask.id || !selectedTask.name) {
    logger.warn('Selected task has invalid data', { task: selectedTask })
    return (
      <div className="w-80 border-l h-full p-4">
        <div className="text-center text-red-500">
          <p>タスクデータが不正です</p>
          <p className="text-sm mt-2">タスクを再選択してください</p>
        </div>
      </div>
    )
  }

  const projectInfo = getProjectInfo(selectedTask.projectId)

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
              value={selectedTask.name || ''}
              onChange={(e) => handleTextUpdate('name', e.target.value)}
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
                    {safeFormatDate(selectedTask.startDate, '開始日未設定')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedTask.startDate instanceof Date ? selectedTask.startDate : undefined}
                    onSelect={(date) => handleDateUpdate('startDate', date)}
                    initialFocus
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
                    {safeFormatDate(selectedTask.dueDate, '期限日未設定')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedTask.dueDate instanceof Date ? selectedTask.dueDate : undefined}
                    onSelect={(date) => handleDateUpdate('dueDate', date)}
                    initialFocus
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
                {safeFormatDate(selectedTask.completionDate, '完了日不明')}
              </div>
            </div>
          )}

          {/* プロジェクト */}
          <div>
            <label className="text-sm font-medium mb-1 block">プロジェクト</label>
            <div className="text-sm p-2 border rounded-md flex items-center">
              <span
                className="inline-block w-3 h-3 mr-2 rounded-full"
                style={{ backgroundColor: projectInfo.color }}
              />
              {projectInfo.name}
            </div>
          </div>

          {/* 担当者 */}
          <div>
            <label className="text-sm font-medium mb-1 block">担当者</label>
            <Input
              value={selectedTask.assignee || ''}
              onChange={(e) => handleTextUpdate('assignee', e.target.value)}
              tabIndex={activeArea === "details" ? 4 : -1}
            />
          </div>

          {/* メモ - Tab順序5番目（最後） */}
          <div>
            <label className="text-sm font-medium mb-1 block">メモ</label>
            <Textarea
              ref={taskNotesRef}
              value={selectedTask.notes || ''}
              onChange={(e) => handleTextUpdate('notes', e.target.value)}
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