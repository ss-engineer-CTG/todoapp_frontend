// システムプロンプト準拠：タスクフォーム状態管理フック（リファクタリング：状態分離）
// リファクタリング対象：DetailPanel.tsx のフォーム状態管理ロジックを抽出

import { useState, useEffect, useCallback } from 'react'
import { Task } from '@core/types'
import { isValidDate, logger } from '@core/utils/core'
import { isDraftTask } from '@tasklist/utils/task'

export interface TaskFormData {
  name: string
  startDate: Date | null
  dueDate: Date | null
  assignee: string
  notes: string
  hasChanges: boolean
  canSave: boolean
}

export interface UseTaskFormReturn {
  formData: TaskFormData
  isSaving: boolean
  updateField: (field: keyof Omit<TaskFormData, 'hasChanges' | 'canSave'>, value: any) => void
  resetForm: (task: Task) => void
  validateForm: () => boolean
  setSaving: (saving: boolean) => void
}

export const useTaskForm = (selectedTask: Task | undefined): UseTaskFormReturn => {
  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    startDate: null,
    dueDate: null,
    assignee: '',
    notes: '',
    hasChanges: false,
    canSave: false
  })

  const [isSaving, setIsSaving] = useState(false)
  const isTaskDraft = selectedTask ? isDraftTask(selectedTask) : false

  // Initialize form data when task changes
  useEffect(() => {
    if (selectedTask) {
      logger.info('Initializing form data', { 
        taskId: selectedTask.id,
        isDraft: isTaskDraft,
        taskName: selectedTask.name
      })
      
      resetForm(selectedTask)
    }
  }, [selectedTask?.id, isTaskDraft])

  const resetForm = useCallback((task: Task) => {
    setFormData({
      name: task.name || '',
      startDate: (task.startDate && isValidDate(task.startDate)) ? task.startDate : null,
      dueDate: (task.dueDate && isValidDate(task.dueDate)) ? task.dueDate : null,
      assignee: task.assignee || '自分',
      notes: task.notes || '',
      hasChanges: false,
      canSave: isDraftTask(task)
    })
  }, [])

  const calculateChanges = useCallback((newData: Partial<TaskFormData>) => {
    if (!selectedTask) return { hasChanges: false, canSave: false }

    const updatedData = { ...formData, ...newData }
    let hasActualChanges = false
    let canSave = false

    if (isTaskDraft) {
      canSave = !!updatedData.name.trim()
      // Draft tasks don't show "unsaved" indicator
      hasActualChanges = false
    } else {
      hasActualChanges = Boolean(
        updatedData.name !== selectedTask.name ||
        updatedData.assignee !== selectedTask.assignee ||
        updatedData.notes !== selectedTask.notes ||
        (updatedData.startDate && selectedTask.startDate && 
         updatedData.startDate.getTime() !== selectedTask.startDate.getTime()) ||
        (updatedData.dueDate && selectedTask.dueDate && 
         updatedData.dueDate.getTime() !== selectedTask.dueDate.getTime()) ||
        (!updatedData.startDate && selectedTask.startDate) ||
        (!updatedData.dueDate && selectedTask.dueDate)
      )
      canSave = hasActualChanges && !!updatedData.name.trim()
    }

    return { hasChanges: hasActualChanges, canSave }
  }, [formData, selectedTask, isTaskDraft])

  const updateField = useCallback((field: keyof Omit<TaskFormData, 'hasChanges' | 'canSave'>, value: any) => {
    if (!selectedTask) return

    try {
      logger.info('Updating form field', { 
        taskId: selectedTask.id, 
        field, 
        value, 
        isDraft: isTaskDraft 
      })
      
      const newData = { [field]: value }
      const { hasChanges, canSave } = calculateChanges(newData)
      
      setFormData(prev => ({
        ...prev,
        [field]: value,
        hasChanges,
        canSave
      }))
    } catch (error) {
      logger.error('Error updating form field', { 
        taskId: selectedTask.id, 
        field, 
        value, 
        error 
      })
    }
  }, [selectedTask, calculateChanges, isTaskDraft])

  const validateForm = useCallback(() => {
    return !!formData.name.trim()
  }, [formData.name])

  const setSaving = useCallback((saving: boolean) => {
    setIsSaving(saving)
  }, [])

  return {
    formData,
    isSaving,
    updateField,
    resetForm,
    validateForm,
    setSaving
  }
}