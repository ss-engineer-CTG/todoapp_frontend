// 修正内容：保存完了時のフォーカス制御最適化
// ★ 新規修正：型の不整合を解決（null を undefined に適切に変換）

import React, { RefObject, useEffect, useState, useCallback } from 'react'
import { Task, Project } from '../types'
import { formatDate, isValidDate, logger, handleError } from '../utils/core'
import { isDraftTask } from '../utils/task'
import { CalendarIcon, X, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface TaskEditingState {
  name: string
  startDate: Date | null
  dueDate: Date | null
  assignee: string
  notes: string
  hasChanges: boolean
  isStartDateCalendarOpen: boolean
  isDueDateCalendarOpen: boolean
  canSave: boolean
}

interface DetailPanelProps {
  selectedTask: Task | undefined
  onTaskSave: (taskId: string, updates: Partial<Task>) => Promise<Task | null>
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
  onTaskSave,
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
  const [editingState, setEditingState] = useState<TaskEditingState>({
    name: '',
    startDate: null,
    dueDate: null,
    assignee: '',
    notes: '',
    hasChanges: false,
    isStartDateCalendarOpen: false,
    isDueDateCalendarOpen: false,
    canSave: false
  })

  const [isSaving, setIsSaving] = useState<boolean>(false)

  const toggleDetailPanel = () => {
    setIsVisible(!isVisible)
    if (!isVisible && activeArea === "details") {
      setActiveArea("tasks")
    }
  }

  const isTaskDraft = selectedTask ? isDraftTask(selectedTask) : false

  useEffect(() => {
    if (selectedTask) {
      logger.info('Initializing editing state for task', { 
        taskId: selectedTask.id,
        isDraft: isTaskDraft,
        taskName: selectedTask.name
      })
      
      setEditingState({
        name: selectedTask.name || '',
        startDate: (selectedTask.startDate && isValidDate(selectedTask.startDate)) ? selectedTask.startDate : null,
        dueDate: (selectedTask.dueDate && isValidDate(selectedTask.dueDate)) ? selectedTask.dueDate : null,
        assignee: selectedTask.assignee || '自分',
        notes: selectedTask.notes || '',
        hasChanges: false,
        isStartDateCalendarOpen: false,
        isDueDateCalendarOpen: false,
        canSave: isTaskDraft
      })
    }
  }, [selectedTask?.id, isTaskDraft])

  useEffect(() => {
    if (activeArea === "details" && selectedTask && taskNameInputRef.current) {
      if (isTaskDraft) {
        logger.info('Draft task selected - immediate focus and selection')
        setTimeout(() => {
          taskNameInputRef.current?.focus()
          taskNameInputRef.current?.select()
        }, 50)
      } else {
        logger.info('Regular task selected - focusing task name input')
        setTimeout(() => {
          taskNameInputRef.current?.focus()
        }, 100)
      }
    }
  }, [activeArea, selectedTask?.id, taskNameInputRef, isTaskDraft])

  useEffect(() => {
    const startDateButton = startDateButtonRef.current
    if (!startDateButton) return

    const handleStartDateFocus = () => {
      logger.info('Start date button focused - opening calendar automatically')
      setEditingState(prev => ({ 
        ...prev, 
        isStartDateCalendarOpen: true
      }))
    }

    startDateButton.addEventListener('focus', handleStartDateFocus)
    return () => {
      startDateButton.removeEventListener('focus', handleStartDateFocus)
    }
  }, [selectedTask])

  useEffect(() => {
    const dueDateButton = dueDateButtonRef.current
    if (!dueDateButton) return

    const handleDueDateFocus = () => {
      logger.info('Due date button focused - opening calendar automatically')
      setEditingState(prev => ({ 
        ...prev, 
        isDueDateCalendarOpen: true
      }))
    }

    dueDateButton.addEventListener('focus', handleDueDateFocus)
    return () => {
      dueDateButton.removeEventListener('focus', handleDueDateFocus)
    }
  }, [selectedTask])

  const updateEditingState = (field: keyof Omit<TaskEditingState, 'hasChanges' | 'isStartDateCalendarOpen' | 'isDueDateCalendarOpen' | 'canSave'>, value: any) => {
    if (!selectedTask) return

    try {
      logger.info('Updating editing state', { taskId: selectedTask.id, field, value, isDraft: isTaskDraft })
      
      setEditingState(prev => {
        const newState = { ...prev, [field]: value }
        
        let hasActualChanges = false
        let canSave = false

        if (isTaskDraft) {
          canSave = !!newState.name.trim()
          hasActualChanges = canSave
        } else {
          hasActualChanges = Boolean(
            newState.name !== selectedTask.name ||
            newState.assignee !== selectedTask.assignee ||
            newState.notes !== selectedTask.notes ||
            (newState.startDate && selectedTask.startDate && 
            newState.startDate.getTime() !== selectedTask.startDate.getTime()) ||
            (newState.dueDate && selectedTask.dueDate && 
            newState.dueDate.getTime() !== selectedTask.dueDate.getTime()) ||
            (!newState.startDate && selectedTask.startDate) ||
            (!newState.dueDate && selectedTask.dueDate)
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

  const handleTaskNameKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      logger.info('Enter key pressed in task name input - moving to start date')
      startDateButtonRef.current?.focus()
    }
  }, [startDateButtonRef])

  const handleStartDateSelect = useCallback((date: Date | undefined) => {
    logger.info('Start date selected, transitioning to due date', { 
      taskId: selectedTask?.id, 
      selectedDate: date?.toISOString(),
      isDraft: isTaskDraft
    })

    updateEditingState('startDate', date || null)
    
    setEditingState(prev => ({ 
      ...prev, 
      isStartDateCalendarOpen: false
    }))

    setTimeout(() => {
      dueDateButtonRef.current?.focus()
    }, 100)
  }, [selectedTask, dueDateButtonRef, isTaskDraft])

  const handleDueDateSelect = useCallback((date: Date | undefined) => {
    logger.info('Due date selected, transitioning to notes', { 
      taskId: selectedTask?.id, 
      selectedDate: date?.toISOString(),
      isDraft: isTaskDraft
    })

    updateEditingState('dueDate', date || null)
    
    setEditingState(prev => ({ 
      ...prev, 
      isDueDateCalendarOpen: false
    }))

    setTimeout(() => {
      taskNotesRef.current?.focus()
    }, 100)
  }, [selectedTask, taskNotesRef, isTaskDraft])

  // ★ 修正：保存処理 - 型の不整合を解決
  const handleSave = async () => {
    if (!selectedTask || !editingState.canSave || isSaving) {
      logger.info('Save skipped', { 
        hasTask: !!selectedTask, 
        canSave: editingState.canSave, 
        isSaving 
      })
      return
    }

    if (!editingState.name.trim()) {
      logger.warn('Attempted to save task with empty name', { taskId: selectedTask.id, isDraft: isTaskDraft })
      handleError(new Error('タスク名を入力してください'), 'タスク名を入力してください')
      setTimeout(() => {
        taskNameInputRef.current?.focus()
        taskNameInputRef.current?.select()
      }, 0)
      return
    }

    setIsSaving(true)

    try {
      logger.info('Starting task save operation', { 
        taskId: selectedTask.id, 
        isDraft: isTaskDraft,
        taskName: editingState.name,
        preparingForFocus: isTaskDraft
      })

      // ★ 修正箇所：null を undefined に変換して型の不整合を解決
      const taskData: Partial<Task> = {
        name: editingState.name.trim(),
        assignee: editingState.assignee.trim(),
        notes: editingState.notes,
        startDate: editingState.startDate || undefined, // null → undefined
        dueDate: editingState.dueDate || undefined       // null → undefined
      }

      const savedTask = await onTaskSave(selectedTask.id, taskData)
      
      if (savedTask) {
        logger.info('Task save completed successfully', { 
          originalTaskId: selectedTask.id,
          savedTaskId: savedTask.id,
          isDraft: isTaskDraft,
          taskName: savedTask.name,
          focusWillBeManagedByParent: isTaskDraft
        })
        
        setEditingState(prev => ({ 
          ...prev, 
          hasChanges: false,
          canSave: false
        }))

        if (isTaskDraft) {
          logger.info('Draft task saved - focus control delegated to parent component')
        }
      }

    } catch (error) {
      logger.error('Task save failed', { 
        taskId: selectedTask.id, 
        isDraft: isTaskDraft,
        editingState, 
        error 
      })
      
      handleError(error, 'タスクの保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveButtonClick = async () => {
    logger.info('Save button clicked', { isDraft: isTaskDraft })
    await handleSave()
  }

  const handlePanelClick = () => {
    logger.info('Detail panel clicked, setting active area')
    setActiveArea("details")
  }

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

  const formatDateDisplay = (date: Date | null): string => {
    if (!date) return '未設定'
    return formatDate(date)
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
  const isEmptyName = !selectedTask.name.trim()

  return (
    <div
      className={cn(
        "w-80 border-l h-full",
        activeArea === "details" ? "bg-accent/40 ring-1 ring-primary/20" : "",
        isEmptyName ? "border-l-orange-300" : ""
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
            {isEmptyName && (
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
          <div>
            <label className="text-sm font-medium mb-1 block">
              タスク名 <span className="text-red-500">*</span>
            </label>
            <Input
              ref={taskNameInputRef}
              value={editingState.name}
              onChange={(e) => updateEditingState('name', e.target.value)}
              onKeyDown={handleTaskNameKeyDown}
              tabIndex={activeArea === "details" ? 1 : -1}
              className={cn(
                editingState.name !== selectedTask.name ? "border-orange-300" : "",
                !editingState.name.trim() ? "border-red-300 bg-red-50 dark:bg-red-950/20" : ""
              )}
              placeholder="タスク名を入力してください"
              autoFocus={isTaskDraft}
            />
            {!editingState.name.trim() && (
              <p className="text-red-500 text-xs mt-1">
                ⚠ タスク名は必須です
              </p>
            )}
          </div>

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
                      !editingState.startDate ? "text-muted-foreground" : "",
                      editingState.startDate && selectedTask.startDate &&
                      editingState.startDate.getTime() !== selectedTask.startDate.getTime()
                        ? "border-orange-300" : ""
                    )}
                    tabIndex={activeArea === "details" ? 2 : -1}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateDisplay(editingState.startDate)}
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
                      !editingState.dueDate ? "text-muted-foreground" : "",
                      editingState.dueDate && selectedTask.dueDate &&
                      editingState.dueDate.getTime() !== selectedTask.dueDate.getTime()
                        ? "border-orange-300" : ""
                    )}
                    tabIndex={activeArea === "details" ? 3 : -1}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateDisplay(editingState.dueDate)}
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

          {!isTaskDraft && selectedTask.completionDate && (
            <div>
              <label className="text-sm font-medium mb-1 block">完了日</label>
              <div className="text-sm p-2 border rounded-md">
                {formatDate(selectedTask.completionDate)}
              </div>
            </div>
          )}

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

          <div>
            <label className="text-sm font-medium mb-1 block">担当者</label>
            <Input
              value={editingState.assignee}
              onChange={(e) => updateEditingState('assignee', e.target.value)}
              tabIndex={activeArea === "details" ? 4 : -1}
              className={cn(
                editingState.assignee !== selectedTask.assignee ? "border-orange-300" : ""
              )}
            />
          </div>

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

          <div className="flex justify-end pt-2">
            <Button
              ref={saveButtonRef}
              onClick={handleSaveButtonClick}
              disabled={!editingState.canSave || isSaving}
              tabIndex={activeArea === "details" ? 6 : -1}
              className={cn(
                "min-w-[80px]",
                editingState.canSave ? "bg-orange-600 hover:bg-orange-700 text-white" : ""
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