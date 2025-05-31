import React, { RefObject, useEffect, useState, useCallback } from 'react'
import { Task, Project, TaskEditingState } from '../types'
import { safeFormatDate, isValidDate } from '../utils/dateUtils'
import { logger } from '../utils/logger'
import { handleError, handleTemporaryTaskSaveError } from '../utils/errorHandler'
import { CalendarIcon, X, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { ERROR_MESSAGES } from '../config/constants'

interface DetailPanelProps {
  selectedTask: Task | undefined
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  // システムプロンプト準拠：一時的タスク保存処理追加
  onTemporaryTaskSave: (taskId: string, taskData: Partial<Task>) => Promise<Task | null>
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
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  selectedTask,
  onTaskUpdate,
  onTemporaryTaskSave, // システムプロンプト準拠：一時的タスク保存処理追加
  projects,
  activeArea,
  setActiveArea,
  isVisible,
  setIsVisible,
  taskNameInputRef,
  startDateButtonRef,
  dueDateButtonRef,
  taskNotesRef,
  saveButtonRef
}) => {
  // システムプロンプト準拠：編集状態管理（一時的タスク対応強化）
  const [editingState, setEditingState] = useState<TaskEditingState>({
    name: '',
    startDate: null,
    dueDate: null,
    assignee: '',
    notes: '',
    hasChanges: false,
    isStartDateCalendarOpen: false,
    isDueDateCalendarOpen: false,
    focusTransitionMode: 'navigation',
    isTemporaryTask: false,
    canSave: false
  })

  const [isSaving, setIsSaving] = useState<boolean>(false)

  const toggleDetailPanel = () => {
    setIsVisible(!isVisible)
    if (!isVisible && activeArea === "details") {
      setActiveArea("tasks")
    }
  }

  // システムプロンプト準拠：一時的タスクの判定
  const isTemporaryTask = selectedTask?.isTemporary === true

  // タスク変更時の編集状態初期化（一時的タスク対応）
  useEffect(() => {
    if (selectedTask) {
      logger.debug('Initializing editing state for task', { 
        taskId: selectedTask.id,
        isTemporary: isTemporaryTask,
        taskName: selectedTask.name
      })
      
      setEditingState({
        name: selectedTask.name || '',
        startDate: isValidDate(selectedTask.startDate) ? selectedTask.startDate : new Date(),
        dueDate: isValidDate(selectedTask.dueDate) ? selectedTask.dueDate : new Date(),
        assignee: selectedTask.assignee || '自分',
        notes: selectedTask.notes || '',
        hasChanges: false,
        isStartDateCalendarOpen: false,
        isDueDateCalendarOpen: false,
        focusTransitionMode: 'navigation',
        isTemporaryTask,
        canSave: isTemporaryTask // 一時的タスクの場合は初期から保存可能
      })
    }
  }, [selectedTask?.id, isTemporaryTask])

  // システムプロンプト準拠：一時的タスクの場合は自動フォーカス
  useEffect(() => {
    if (activeArea === "details" && selectedTask && taskNameInputRef.current) {
      if (isTemporaryTask) {
        logger.debug('Temporary task selected - focusing task name input immediately')
        setTimeout(() => {
          taskNameInputRef.current?.focus()
          taskNameInputRef.current?.select() // 一時的タスクの場合は全選択
        }, 0)
      } else {
        logger.debug('Regular task selected - focusing task name input')
        setTimeout(() => {
          taskNameInputRef.current?.focus()
        }, 0)
      }
    }
  }, [activeArea, selectedTask, taskNameInputRef, isTemporaryTask])

  // システムプロンプト準拠：開始日ボタンフォーカス時のカレンダー自動表示
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

  // システムプロンプト準拠：期限日ボタンフォーカス時のカレンダー自動表示
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

  // 編集状態更新関数（一時的タスク対応）
  const updateEditingState = (field: keyof Omit<TaskEditingState, 'hasChanges' | 'isStartDateCalendarOpen' | 'isDueDateCalendarOpen' | 'focusTransitionMode' | 'isTemporaryTask' | 'canSave'>, value: any) => {
    if (!selectedTask) return

    try {
      logger.trace('Updating editing state', { taskId: selectedTask.id, field, value, isTemporary: isTemporaryTask })
      
      setEditingState(prev => {
        const newState = { ...prev, [field]: value }
        
        // システムプロンプト準拠：一時的タスクの場合の変更検知
        let hasActualChanges = false
        let canSave = false

        if (isTemporaryTask) {
          // 一時的タスクの場合：名前があれば保存可能
          canSave = !!newState.name.trim()
          hasActualChanges = canSave // 名前があれば変更ありとみなす
        } else {
          // 通常タスクの場合：従来通りの変更検知
          hasActualChanges = Boolean(
            newState.name !== selectedTask.name ||
            newState.assignee !== selectedTask.assignee ||
            newState.notes !== selectedTask.notes ||
            (newState.startDate && selectedTask.startDate && 
            newState.startDate.getTime() !== selectedTask.startDate.getTime()) ||
            (newState.dueDate && selectedTask.dueDate && 
            newState.dueDate.getTime() !== selectedTask.dueDate.getTime())
          )
          canSave = hasActualChanges && !!newState.name.trim()
        }
      
        return { 
          ...newState, 
          hasChanges: hasActualChanges,
          canSave
        }
      })
    } catch (error) {
      logger.error('Error updating editing state', { taskId: selectedTask.id, field, value, error })
    }
  }

  // システムプロンプト準拠：開始日選択完了時の自動遷移（同一日付許可）
  const handleStartDateSelect = useCallback((date: Date | undefined) => {
    if (!date || !selectedTask) return

    logger.debug('Start date selected, transitioning to due date', { 
      taskId: selectedTask.id, 
      selectedDate: date.toISOString(),
      isTemporary: isTemporaryTask,
      isSameDate: editingState.startDate && editingState.startDate.getTime() === date.getTime()
    })

    // システムプロンプト準拠：同一日付でも受け入れて値を更新
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
  }, [selectedTask, dueDateButtonRef, isTemporaryTask, editingState.startDate])

  // システムプロンプト準拠：期限日選択完了時の自動遷移（同一日付許可）
  const handleDueDateSelect = useCallback((date: Date | undefined) => {
    if (!date || !selectedTask) return

    logger.debug('Due date selected, transitioning to notes', { 
      taskId: selectedTask.id, 
      selectedDate: date.toISOString(),
      isTemporary: isTemporaryTask,
      isSameDate: editingState.dueDate && editingState.dueDate.getTime() === date.getTime()
    })

    // システムプロンプト準拠：同一日付でも受け入れて値を更新
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
  }, [selectedTask, taskNotesRef, isTemporaryTask, editingState.dueDate])

  // システムプロンプト準拠：統一保存処理（一時的タスク対応）
  const handleSave = async () => {
    if (!selectedTask || !editingState.canSave || isSaving) {
      logger.debug('Save skipped', { 
        hasTask: !!selectedTask, 
        canSave: editingState.canSave, 
        isSaving 
      })
      return
    }

    // システムプロンプト準拠：空名前時のバリデーション強化
    if (!editingState.name.trim()) {
      logger.warn('Attempted to save task with empty name', { taskId: selectedTask.id, isTemporary: isTemporaryTask })
      handleError(new Error(ERROR_MESSAGES.TEMPORARY_TASK_NAME_REQUIRED), 'タスク名を入力してください')
      setTimeout(() => {
        taskNameInputRef.current?.focus()
        taskNameInputRef.current?.select()
      }, 0)
      return
    }

    setIsSaving(true)

    try {
      if (isTemporaryTask) {
        // システムプロンプト準拠：一時的タスクの保存処理
        logger.logTemporaryTaskOperation('save_attempt', selectedTask.id, { 
          taskName: editingState.name,
          hasValidName: !!editingState.name.trim()
        })

        const taskData: Partial<Task> = {
          name: editingState.name.trim(),
          assignee: editingState.assignee.trim(),
          notes: editingState.notes,
          startDate: editingState.startDate && isValidDate(editingState.startDate) ? editingState.startDate : new Date(),
          dueDate: editingState.dueDate && isValidDate(editingState.dueDate) ? editingState.dueDate : new Date()
        }

        const savedTask = await onTemporaryTaskSave(selectedTask.id, taskData)
        
        if (savedTask) {
          logger.logTemporaryTaskOperation('save_success', selectedTask.id, {
            newTaskId: savedTask.id,
            taskName: savedTask.name
          })
          
          // 編集状態をリセット
          setEditingState(prev => ({ 
            ...prev, 
            hasChanges: false,
            canSave: false,
            isTemporaryTask: false
          }))
        }
      } else {
        // システムプロンプト準拠：通常タスクの更新処理
        logger.info('Starting regular task save operation', { 
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

        await onTaskUpdate(selectedTask.id, updates)
        
        setEditingState(prev => ({ ...prev, hasChanges: false, canSave: false }))
        
        logger.info('Regular task save completed successfully', { 
          taskId: selectedTask.id, 
          updatedFields: Object.keys(updates) 
        })
      }

    } catch (error) {
      logger.error('Task save failed', { 
        taskId: selectedTask.id, 
        isTemporary: isTemporaryTask,
        editingState, 
        error 
      })
      
      if (isTemporaryTask) {
        handleTemporaryTaskSaveError(error as Error, selectedTask.id, { editingState })
      } else {
        handleError(error, 'タスクの保存に失敗しました')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveButtonClick = async () => {
    logger.debug('Save button clicked', { isTemporary: isTemporaryTask })
    await handleSave()
  }

  // システムプロンプト準拠：フォーカス管理改善
  const handlePanelClick = () => {
    logger.debug('Detail panel clicked, setting active area')
    setActiveArea("details")
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
          activeArea === "details" ? "bg-accent/40 ring-1 ring-primary/20" : ""
        )}
        onClick={handlePanelClick}
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>タスクを選択して詳細を表示</p>
        </div>
      </div>
    )
  }

  if (!selectedTask.id) {
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
  
  // システムプロンプト準拠：一時的タスクと空名前タスクの視覚的強調
  const isEmptyName = !selectedTask.name.trim()
  const showTemporaryIndicator = isTemporaryTask

  return (
    <div
      className={cn(
        "w-80 border-l h-full",
        activeArea === "details" ? "bg-accent/40 ring-1 ring-primary/20" : "",
        isEmptyName || showTemporaryIndicator ? "border-l-orange-300" : ""
      )}
      onClick={handlePanelClick}
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
            {showTemporaryIndicator && (
              <span className="ml-2 text-xs text-blue-500 font-normal">
                •新規作成中
              </span>
            )}
            {isEmptyName && !showTemporaryIndicator && (
              <span className="ml-2 text-xs text-red-500 font-normal">
                •名前未設定
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
          {/* システムプロンプト準拠：タスク名（一時的タスク対応強化） */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              タスク名 <span className="text-red-500">*</span>
              {showTemporaryIndicator && (
                <span className="ml-2 text-xs text-blue-500">（必須：保存時に確定されます）</span>
              )}
            </label>
            <Input
              ref={taskNameInputRef}
              value={editingState.name}
              onChange={(e) => updateEditingState('name', e.target.value)}
              tabIndex={activeArea === "details" ? 1 : -1}
              className={cn(
                editingState.name !== selectedTask.name ? "border-orange-300" : "",
                !editingState.name.trim() ? "border-red-300 bg-red-50" : "",
                showTemporaryIndicator ? "border-blue-300 bg-blue-50" : ""
              )}
              placeholder={showTemporaryIndicator ? "タスク名を入力してください" : "タスク名を入力してください"}
              autoFocus={showTemporaryIndicator}
            />
            {!editingState.name.trim() && (
              <p className="text-red-500 text-xs mt-1">
                ⚠ タスク名は必須です
              </p>
            )}
            {showTemporaryIndicator && editingState.name.trim() && (
              <p className="text-blue-500 text-xs mt-1">
                ✓ 保存ボタンで確定できます
              </p>
            )}
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
                        ? "border-orange-300" : "",
                      showTemporaryIndicator ? "border-blue-200" : ""
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
                        ? "border-orange-300" : "",
                      showTemporaryIndicator ? "border-blue-200" : ""
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

          {/* 完了日（一時的タスクは非表示） */}
          {!showTemporaryIndicator && selectedTask.completionDate && (
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
              {showTemporaryIndicator && (
                <span className="ml-2 text-xs text-blue-500">（保存時に確定）</span>
              )}
            </div>
          </div>

          {/* 担当者 */}
          <div>
            <label className="text-sm font-medium mb-1 block">担当者</label>
            <Input
              value={editingState.assignee}
              onChange={(e) => updateEditingState('assignee', e.target.value)}
              tabIndex={activeArea === "details" ? 4 : -1}
              className={cn(
                editingState.assignee !== selectedTask.assignee ? "border-orange-300" : "",
                showTemporaryIndicator ? "border-blue-200" : ""
              )}
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
                editingState.notes !== selectedTask.notes ? "border-orange-300" : "",
                showTemporaryIndicator ? "border-blue-200" : ""
              )}
              placeholder="メモを追加..."
              tabIndex={activeArea === "details" ? 5 : -1}
            />
          </div>

          {/* 保存ボタン（一時的タスク対応） */}
          <div className="flex justify-end pt-2">
            <Button
              ref={saveButtonRef}
              onClick={handleSaveButtonClick}
              disabled={!editingState.canSave || isSaving}
              tabIndex={activeArea === "details" ? 6 : -1}
              className={cn(
                "min-w-[80px]",
                editingState.canSave
                  ? showTemporaryIndicator 
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-orange-600 hover:bg-orange-700 text-white"
                  : ""
              )}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {showTemporaryIndicator ? "作成中..." : "保存中..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  {showTemporaryIndicator ? "タスク作成" : "保存"}
                </>
              )}
            </Button>
          </div>

          {/* 一時的タスクの説明 */}
          {showTemporaryIndicator && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
              <p className="text-blue-800 font-medium mb-1">📝 新規タスク作成中</p>
              <ul className="text-blue-700 text-xs space-y-1">
                <li>• タスク名を入力して「タスク作成」ボタンで確定</li>
                <li>• キャンセルする場合は他のタスクを選択</li>
                <li>• 確定後は通常のタスクとして編集可能</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}