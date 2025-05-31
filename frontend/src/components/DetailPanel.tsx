import React, { RefObject, useEffect, useState } from 'react'
import { Task, Project, TaskEditingState } from '../types'
import { safeFormatDate, isValidDate } from '../utils/dateUtils'
import { logger } from '../utils/logger'
import { handleError } from '../utils/errorHandler'
import { CalendarIcon, X, Save } from 'lucide-react'
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
  saveButtonRef: RefObject<HTMLButtonElement> // 🆕 追加
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
  taskNotesRef,
  saveButtonRef // 🆕 追加
}) => {
  // 🆕 新規追加：編集状態管理
  const [editingState, setEditingState] = useState<TaskEditingState>({
    name: '',
    startDate: null,
    dueDate: null,
    assignee: '',
    notes: '',
    hasChanges: false
  })

  // 🆕 新規追加：保存処理中の状態管理
  const [isSaving, setIsSaving] = useState<boolean>(false)

  const toggleDetailPanel = () => {
    setIsVisible(!isVisible)
    if (!isVisible && activeArea === "details") {
      setActiveArea("tasks")
    }
  }

  // 🆕 新規追加：タスク変更時の編集状態初期化
  useEffect(() => {
    if (selectedTask) {
      logger.debug('Initializing editing state for task', { taskId: selectedTask.id })
      
      setEditingState({
        name: selectedTask.name || '',
        startDate: isValidDate(selectedTask.startDate) ? selectedTask.startDate : new Date(),
        dueDate: isValidDate(selectedTask.dueDate) ? selectedTask.dueDate : new Date(),
        assignee: selectedTask.assignee || '自分',
        notes: selectedTask.notes || '',
        hasChanges: false
      })
    }
  }, [selectedTask?.id]) // selectedTask?.id の変更時のみ実行

  // フォーカス管理
  useEffect(() => {
    if (activeArea === "details" && selectedTask) {
      // 詳細パネルがアクティブになった時、最初の要素にフォーカス
      setTimeout(() => {
        taskNameInputRef.current?.focus()
      }, 0)
    }
  }, [activeArea, selectedTask, taskNameInputRef])

  // 🆕 新規追加：編集状態更新関数
  const updateEditingState = (field: keyof Omit<TaskEditingState, 'hasChanges'>, value: any) => {
    if (!selectedTask) return

    try {
      logger.trace('Updating editing state', { taskId: selectedTask.id, field, value })
      
        setEditingState(prev => {
          const newState = { ...prev, [field]: value }
          
          // 🔧 修正：変更があるかどうかをチェック（確実にboolean型を返す）
          const hasActualChanges = Boolean(
            newState.name !== selectedTask.name ||
            newState.assignee !== selectedTask.assignee ||
            newState.notes !== selectedTask.notes ||
            (newState.startDate && selectedTask.startDate && 
            newState.startDate.getTime() !== selectedTask.startDate.getTime()) ||
            (newState.dueDate && selectedTask.dueDate && 
            newState.dueDate.getTime() !== selectedTask.dueDate.getTime())
          )
        
          return { ...newState, hasChanges: hasActualChanges }
        })
    } catch (error) {
      logger.error('Error updating editing state', { taskId: selectedTask.id, field, value, error })
    }
  }

  // 🆕 新規追加：保存処理
  const handleSave = async () => {
    if (!selectedTask || !editingState.hasChanges || isSaving) {
      logger.debug('Save skipped', { 
        hasTask: !!selectedTask, 
        hasChanges: editingState.hasChanges, 
        isSaving 
      })
      return
    }

    setIsSaving(true)

    try {
      logger.info('Starting manual save operation', { 
        taskId: selectedTask.id, 
        taskName: editingState.name 
      })

      // システムプロンプト準拠：日付フィールドの安全な処理
      const updates: Partial<Task> = {}
      
      if (editingState.name !== selectedTask.name) {
        updates.name = editingState.name.trim()
      }
      
      if (editingState.assignee !== selectedTask.assignee) {
        updates.assignee = editingState.assignee.trim()
      }
      
      if (editingState.notes !== selectedTask.notes) {
        updates.notes = editingState.notes
      }
      
      if (editingState.startDate && isValidDate(editingState.startDate) &&
          editingState.startDate.getTime() !== selectedTask.startDate?.getTime()) {
        updates.startDate = editingState.startDate
      }
      
      if (editingState.dueDate && isValidDate(editingState.dueDate) &&
          editingState.dueDate.getTime() !== selectedTask.dueDate?.getTime()) {
        updates.dueDate = editingState.dueDate
      }

      // バリデーション
      if (!updates.name?.trim() && editingState.name !== selectedTask.name) {
        throw new Error('タスク名は必須です')
      }

      await onTaskUpdate(selectedTask.id, updates)
      
      // 保存成功時は変更状態をリセット
      setEditingState(prev => ({ ...prev, hasChanges: false }))
      
      logger.info('Manual save completed successfully', { 
        taskId: selectedTask.id, 
        updatedFields: Object.keys(updates) 
      })

    } catch (error) {
      logger.error('Manual save failed', { 
        taskId: selectedTask.id, 
        editingState, 
        error 
      })
      handleError(error, 'タスクの保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  // 🆕 新規追加：保存ボタンクリックハンドラー
  const handleSaveButtonClick = async () => {
    logger.debug('Save button clicked')
    await handleSave()
  }

  // 🆕 新規追加：Enterキーでの保存処理（useKeyboardShortcuts から呼び出される）
  const handleSaveViaEnter = async () => {
    logger.debug('Save triggered via Enter key')
    await handleSave()
  }

  // 🆕 新規追加：保存ボタンにEnterキーイベントを設定
  useEffect(() => {
    const saveButton = saveButtonRef.current
    if (!saveButton) return

    const handleEnterOnSaveButton = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && document.activeElement === saveButton) {
        e.preventDefault()
        handleSaveViaEnter()
      }
    }

    saveButton.addEventListener('keydown', handleEnterOnSaveButton)
    return () => {
      saveButton.removeEventListener('keydown', handleEnterOnSaveButton)
    }
  }, [selectedTask, editingState.hasChanges])

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
          <h2 className="text-lg font-semibold">
            タスク詳細
            {editingState.hasChanges && (
              <span className="ml-2 text-xs text-orange-500 font-normal">
                •未保存
              </span>
            )}
          </h2>
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
          {/* タスク名 - Tab/Enter順序1番目 */}
          <div>
            <label className="text-sm font-medium mb-1 block">タスク名</label>
            <Input
              ref={taskNameInputRef}
              value={editingState.name}
              onChange={(e) => updateEditingState('name', e.target.value)}
              tabIndex={activeArea === "details" ? 1 : -1}
              className={editingState.name !== selectedTask.name ? "border-orange-300" : ""}
            />
          </div>

          {/* 開始日・期限日 - Tab/Enter順序2番目、3番目 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium mb-1 block">開始日</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    ref={startDateButtonRef}
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      editingState.startDate && selectedTask.startDate &&
                      editingState.startDate.getTime() !== selectedTask.startDate.getTime()
                        ? "border-orange-300" : ""
                    )}
                    tabIndex={activeArea === "details" ? 2 : -1}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {safeFormatDate(editingState.startDate, '開始日未設定')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editingState.startDate || undefined}
                    onSelect={(date) => updateEditingState('startDate', date || new Date())}
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
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      editingState.dueDate && selectedTask.dueDate &&
                      editingState.dueDate.getTime() !== selectedTask.dueDate.getTime()
                        ? "border-orange-300" : ""
                    )}
                    tabIndex={activeArea === "details" ? 3 : -1}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {safeFormatDate(editingState.dueDate, '期限日未設定')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editingState.dueDate || undefined}
                    onSelect={(date) => updateEditingState('dueDate', date || new Date())}
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
              value={editingState.assignee}
              onChange={(e) => updateEditingState('assignee', e.target.value)}
              tabIndex={activeArea === "details" ? 4 : -1}
              className={editingState.assignee !== selectedTask.assignee ? "border-orange-300" : ""}
            />
          </div>

          {/* メモ - Tab/Enter順序4番目 */}
          <div>
            <label className="text-sm font-medium mb-1 block">メモ</label>
            <Textarea
              ref={taskNotesRef}
              value={editingState.notes}
              onChange={(e) => updateEditingState('notes', e.target.value)}
              className={cn(
                "min-h-[100px] resize-none",
                editingState.notes !== selectedTask.notes ? "border-orange-300" : ""
              )}
              placeholder="メモを追加..."
              tabIndex={activeArea === "details" ? 5 : -1}
            />
          </div>

          {/* 🆕 新規追加：保存ボタン - Tab/Enter順序5番目 */}
          <div className="flex justify-end pt-2">
            <Button
              ref={saveButtonRef}
              onClick={handleSaveButtonClick}
              disabled={!editingState.hasChanges || isSaving}
              tabIndex={activeArea === "details" ? 6 : -1}
              className={cn(
                "min-w-[80px]",
                editingState.hasChanges 
                  ? "bg-orange-600 hover:bg-orange-700 text-white" 
                  : ""
              )}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  保存
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}