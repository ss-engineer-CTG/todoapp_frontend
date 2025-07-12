// システムプロンプト準拠：フォームバリデーションフック（リファクタリング：検証ロジック分離）
// リファクタリング対象：DetailPanel.tsx の検証ロジックを抽出

import { useMemo } from 'react'
import { Task } from '@core/types'
import { logger } from '@core/utils/core'

export interface ValidationErrors {
  name?: string
  startDate?: string
  dueDate?: string
  assignee?: string
  notes?: string
}

export interface UseFormValidationReturn {
  errors: ValidationErrors
  isValid: boolean
  hasErrors: boolean
  getFieldError: (field: keyof ValidationErrors) => string | undefined
}

export interface FormValidationData {
  name: string
  startDate: Date | null
  dueDate: Date | null
  assignee: string
  notes: string
}

export const useFormValidation = (
  formData: FormValidationData,
  task?: Task
): UseFormValidationReturn => {
  
  const errors = useMemo((): ValidationErrors => {
    const validationErrors: ValidationErrors = {}

    // Task name validation
    if (!formData.name.trim()) {
      validationErrors.name = 'タスク名は必須です'
    } else if (formData.name.trim().length > 200) {
      validationErrors.name = 'タスク名は200文字以内で入力してください'
    }

    // Date validation
    if (formData.startDate && formData.dueDate) {
      if (formData.startDate > formData.dueDate) {
        validationErrors.dueDate = '期限日は開始日より後に設定してください'
      }
    }

    // Assignee validation (optional but with length limit)
    if (formData.assignee && formData.assignee.length > 50) {
      validationErrors.assignee = '担当者名は50文字以内で入力してください'
    }

    // Notes validation (optional but with length limit)
    if (formData.notes && formData.notes.length > 1000) {
      validationErrors.notes = 'ノートは1000文字以内で入力してください'
    }

    // Log validation results for debugging
    if (Object.keys(validationErrors).length > 0) {
      logger.info('Form validation errors found', { 
        taskId: task?.id,
        errors: validationErrors,
        formData: {
          nameLength: formData.name.length,
          hasStartDate: !!formData.startDate,
          hasDueDate: !!formData.dueDate,
          assigneeLength: formData.assignee.length,
          notesLength: formData.notes.length
        }
      })
    }

    return validationErrors
  }, [formData, task?.id])

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && !!formData.name.trim()
  }, [errors, formData.name])

  const hasErrors = useMemo(() => {
    return Object.keys(errors).length > 0
  }, [errors])

  const getFieldError = (field: keyof ValidationErrors): string | undefined => {
    return errors[field]
  }

  return {
    errors,
    isValid,
    hasErrors,
    getFieldError
  }
}