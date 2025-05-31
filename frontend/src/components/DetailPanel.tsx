import React, { RefObject, useEffect, useState, useCallback } from 'react'
import { Task, Project, TaskEditingState, TaskSaveCompleteCallback } from '../types'
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
  saveButtonRef: RefObject<HTMLButtonElement>
  // 🆕 新規追加：保存完了コールバック
  onSaveComplete?: TaskSaveCompleteCallback
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
  saveButtonRef,
  onSaveComplete // 🆕 新規追加
}) => {
  // 🔄 修正：編集状態管理（カレンダー制御追加）
  const [editingState, setEditingState] = useState<TaskEditingState>({
    name: '',
    startDate: null,
    dueDate: null,
    assignee: '',
    notes: '',
    hasChanges: false,
    // 🆕 新規追加：カレンダー制御状態
    isStartDateCalendarOpen: false,
    isDueDateCalendarOpen: false,
    focusTransitionMode: 'navigation'
  })

  const [isSaving, setIsSaving] = useState<boolean>(false)

  const toggleDetailPanel = () => {
    setIsVisible(!isVisible)
    if (!isVisible && activeArea === "details") {
      setActiveArea("tasks")
    }
  }

  // タスク変更時の編集状態初期化
  useEffect(() => {
    if (selectedTask) {
      logger.debug('Initializing editing state for task', { taskId: selectedTask.id })
      
      setEditingState({
        name: selectedTask.name || '',
        startDate: isValidDate(selectedTask.startDate) ? selectedTask.startDate : new Date(),
        dueDate: isValidDate(selectedTask.dueDate) ? selectedTask.dueDate : new Date(),
        assignee: selectedTask.assignee || '自分',
        notes: selectedTask.notes || '',
        hasChanges: false,
        // 🆕 新規追加：カレンダー状態初期化
        isStartDateCalendarOpen: false,
        isDueDateCalendarOpen: false,
        focusTransitionMode: 'navigation'
      })
    }
  }, [selectedTask?.id])

  // フォーカス管理
  useEffect(() => {
    if (activeArea === "details" && selectedTask) {
      setTimeout(() => {
        taskNameInputRef.current?.focus()
      }, 0)
    }
  }, [activeArea, selectedTask, taskNameInputRef])

  // 🆕 新規追加：開始日ボタンフォーカス時のカレンダー自動表示
  useEffect(() => {
    const startDateButton = startDateButtonRef.current
    if (!startDateButton) return

    const handleStartDateFocus = () => {
      logger.debug('Start date button focused - opening calendar automatically')
      setEditingState(prev => ({ 
        ...prev, 
        isStartDateCalendarOpen: true,
        focusTransitionMode: 'calendar-selection'
      }))
    }

    startDateButton.addEventListener('focus', handleStartDateFocus)
    return () => {
      startDateButton.removeEventListener('focus', handleStartDateFocus)
    }
  }, [selectedTask])

  // 🆕 新規追加：期限日ボタンフォーカス時のカレンダー自動表示
  useEffect(() => {
    const dueDateButton = dueDateButtonRef.current
    if (!dueDateButton) return

    const handleDueDateFocus = () => {
      logger.debug('Due date button focused - opening calendar automatically')
      setEditingState(prev => ({ 
        ...prev, 
        isDueDateCalendarOpen: true,
        focusTransitionMode: 'calendar-selection'
      }))
    }

    dueDateButton.addEventListener('focus', handleDueDateFocus)
    return () => {
      dueDateButton.removeEventListener('focus', handleDueDateFocus)
    }
  }, [selectedTask])

  // 編集状態更新関数
  const updateEditingState = (field: keyof Omit<TaskEditingState, 'hasChanges' | 'isStartDateCalendarOpen' | 'isDueDateCalendarOpen' | 'focusTransitionMode'>, value: any) => {
    if (!selectedTask) return

    try {
      logger.trace('Updating editing state', { taskId: selectedTask.id, field, value })
      
      setEditingState(prev => {
        const newState = { ...prev, [field]: value }
        
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

  // 🆕 新規追加：開始日選択完了時の自動遷移
  const handleStartDateSelect = useCallback((date: Date | undefined) => {
    if (!date || !selectedTask) return

    logger.debug('Start date selected, transitioning to due date', { 
      taskId: selectedTask.id, 
      selectedDate: date.toISOString() 
    })

    updateEditingState('startDate', date)
    
    // カレンダーを閉じて次のフィールドにフォーカス
    setEditingState(prev => ({ 
      ...prev, 
      isStartDateCalendarOpen: false,
      focusTransitionMode: 'navigation'
    }))

    // 期限日ボタンにフォーカス（自動でカレンダーが開く）
    setTimeout(() => {
      dueDateButtonRef.current?.focus()
    }, 100)
  }, [selectedTask, dueDateButtonRef])

  // 🆕 新規追加：期限日選択完了時の自動遷移
  const handleDueDateSelect = useCallback((date: Date | undefined) => {
    if (!date || !selectedTask) return

    logger.debug('Due date selected, transitioning to notes', { 
      taskId: selectedTask.id, 
      selectedDate: date.toISOString() 
    })

    updateEditingState('dueDate', date)
    
    // カレンダーを閉じて次のフィールドにフォーカス
    setEditingState(prev => ({ 
      ...prev, 
      isDueDateCalendarOpen: false,
      focusTransitionMode: 'navigation'
    }))

    // メモフィールドにフォーカス
    setTimeout(() => {
      taskNotesRef.current?.focus()
    }, 100)
  }, [selectedTask, taskNotesRef])

  // 🔄 修正：保存処理（完了コールバック追加）
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

      if (!updates.name?.trim() && editingState.name !== selectedTask.name) {
        throw new Error('タスク名は必須です')
      }

      await onTaskUpdate(selectedTask.id, updates)
      
      setEditingState(prev => ({ ...prev, hasChanges: false }))
      
      logger.info('Manual save completed successfully', { 
        taskId: selectedTask.id, 
        updatedFields: Object.keys(updates) 
      })

      // 🆕 新規追加：保存完了コールバック実行
      if (onSaveComplete) {
        logger.debug('Executing save complete callback', { taskId: selectedTask.id })
        onSaveComplete(selectedTask.id)
      }

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

  const handleSaveButtonClick = async () => {
    logger.debug('Save button clicked')
    await handleSave()
  }

  // 🆕 新規追加：Enterキーでの保存処理（useKeyboardShortcuts から呼び出される）
  const handleSaveViaEnter = async () => {
    logger.debug('Save triggered via Enter key')
    await handleSave()
  }

  // 保存ボタンにEnterキーイベントを設定
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
          {/* タスク名 */}
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

          {/* 開始日・期限日 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium mb-1 block">開始日</label>
              <Popover 
                open={editingState.isStartDateCalendarOpen} 
                onOpenChange={(open) => setEditingState(prev => ({ ...prev, isStartDateCalendarOpen: open }))}
              >
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
                    onSelect={handleStartDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">期限日</label>
              <Popover 
                open={editingState.isDueDateCalendarOpen} 
                onOpenChange={(open) => setEditingState(prev => ({ ...prev, isDueDateCalendarOpen: open }))}
              >
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
                    onSelect={handleDueDateSelect}
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

          {/* メモ */}
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

          {/* 保存ボタン */}
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