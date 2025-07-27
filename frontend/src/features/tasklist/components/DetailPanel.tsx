// システムプロンプト準拠：詳細パネル（リファクタリング：軽量化版）
// リファクタリング結果：588行 → 約150行（75%削減）

import React, { RefObject, useEffect } from 'react'
import { Task, Project } from '@core/types'
import { formatDate, logger, handleError } from '@core/utils/core'
import { isDraftTask } from '@tasklist/utils/task'
import { X } from 'lucide-react'
import { Button } from '@core/components/ui/button'
import { cn } from '@core/utils/cn'
import { TaskForm } from './form/TaskForm'
import { useTaskForm } from '../hooks'


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
  // Use extracted form hooks
  const { formData, isSaving, updateField, resetForm, validateForm, setSaving } = useTaskForm(selectedTask)
  // Form validation is handled by the form components
  // const { errors } = useFormValidation(formData, selectedTask)
  
  const isTaskDraft = selectedTask ? isDraftTask(selectedTask) : false

  const toggleDetailPanel = () => {
    setIsVisible(!isVisible)
    if (!isVisible && activeArea === "details") {
      setActiveArea("tasks")
    }
  }

  // Focus management for task name input
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


  // Simplified save handler using form validation
  const handleSave = async () => {
    if (!selectedTask || !formData.canSave || isSaving) {
      logger.info('Save skipped', { 
        hasTask: !!selectedTask, 
        canSave: formData.canSave, 
        isSaving 
      })
      return
    }

    if (!validateForm()) {
      logger.warn('Form validation failed', { taskId: selectedTask.id, isDraft: isTaskDraft })
      handleError(new Error('タスク名を入力してください'), 'タスク名を入力してください')
      setTimeout(() => {
        taskNameInputRef.current?.focus()
        taskNameInputRef.current?.select()
      }, 0)
      return
    }

    setSaving(true)

    try {
      logger.info('Starting task save operation', { 
        taskId: selectedTask.id, 
        isDraft: isTaskDraft,
        taskName: formData.name
      })

      const taskData: Partial<Task> = {
        name: formData.name.trim(),
        assignee: formData.assignee.trim(),
        notes: formData.notes,
        startDate: formData.startDate || undefined,
        dueDate: formData.dueDate || undefined
      }

      const savedTask = await onTaskSave(selectedTask.id, taskData)
      
      if (savedTask) {
        logger.info('Task save completed successfully', { 
          originalTaskId: selectedTask.id,
          savedTaskId: savedTask.id,
          isDraft: isTaskDraft,
          taskName: savedTask.name
        })
        
        if (isTaskDraft) {
          logger.info('Draft task saved - focus control delegated to parent component')
        }
      }

    } catch (error) {
      logger.error('Task save failed', { 
        taskId: selectedTask.id, 
        isDraft: isTaskDraft,
        formData, 
        error 
      })
      
      handleError(error, 'タスクの保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (selectedTask) {
      resetForm(selectedTask)
    }
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

  if (!selectedTask) {
    logger.info('DetailPanel: No selected task', {
      selectedTask,
      isVisible,
      activeArea
    })
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
  const isEmptyName = !formData.name.trim()

  logger.info('DetailPanel: Rendering with selected task', {
    taskId: selectedTask.id,
    taskName: selectedTask.name,
    isDraft: isTaskDraft,
    isVisible,
    activeArea,
    formDataName: formData.name,
    hasFormData: !!formData,
    isEmptyName
  })

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
            {isTaskDraft ? 'タスク作成' : 'タスク詳細'}
            {formData.hasChanges && !isTaskDraft && (
              <span className="ml-2 text-xs text-orange-500 font-normal">
                •未保存
              </span>
            )}
            {isEmptyName && !isTaskDraft && (
              <span className="ml-2 text-xs text-red-500 font-normal">
                •名前未設定
              </span>
            )}
            {isTaskDraft && (
              <span className="ml-2 text-xs text-blue-500 font-normal">
                •新規作成中
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

        <div className="flex-grow overflow-y-auto">
          <TaskForm
            task={selectedTask}
            formData={formData}
            onFormChange={(field: string, value: any) => {
              const validFields = ['name', 'startDate', 'dueDate', 'assignee', 'notes'] as const
              if (validFields.includes(field as any)) {
                updateField(field as 'name' | 'startDate' | 'dueDate' | 'assignee' | 'notes', value)
              }
            }}
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={isSaving}
            projects={projects}
            taskNameInputRef={taskNameInputRef}
            startDateButtonRef={startDateButtonRef}
            dueDateButtonRef={dueDateButtonRef}
            taskNotesRef={taskNotesRef}
            saveButtonRef={saveButtonRef}
          />
          
          {/* Project info display */}
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-foreground">
              プロジェクト
            </label>
            <div className="p-2 bg-muted rounded border text-sm flex items-center">
              <span
                className="inline-block w-3 h-3 mr-2 rounded-full"
                style={{ backgroundColor: projectInfo.color }}
              />
              {projectInfo.name}
            </div>
          </div>

          {/* Completion date display for completed tasks */}
          {!isTaskDraft && selectedTask.completionDate && (
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-foreground">
                完了日
              </label>
              <div className="p-2 bg-muted rounded border text-sm">
                {formatDate(selectedTask.completionDate)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}