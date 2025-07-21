// タイムライン用タスク名入力ダイアログ
// キーボードショートカットからのタスク作成時にタスク名を入力

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@core/components/ui/button'
import { Input } from '@core/components/ui/input'
import { Label } from '@core/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@core/components/ui/dialog'
import { logger } from '@core/utils'

export interface TaskNameDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (taskName: string) => Promise<void>
  taskType: 'task' | 'subtask'
  parentTaskName?: string
}

export const TaskNameDialog: React.FC<TaskNameDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  taskType,
  parentTaskName
}) => {
  const [taskName, setTaskName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ダイアログが開いた時の初期化
  useEffect(() => {
    if (isOpen) {
      setTaskName('')
      setError(null)
      setIsSubmitting(false)
      
      // フォーカスを少し遅らせて設定
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      
      logger.info('Task name dialog opened', {
        taskType,
        parentTaskName
      })
    }
  }, [isOpen, taskType, parentTaskName])

  // タスク作成処理
  const handleConfirm = async () => {
    const trimmedName = taskName.trim()
    
    if (!trimmedName) {
      setError('タスク名を入力してください')
      inputRef.current?.focus()
      return
    }

    if (trimmedName.length > 200) {
      setError('タスク名は200文字以内で入力してください')
      inputRef.current?.focus()
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      
      logger.info('Creating task from dialog', {
        taskName: trimmedName,
        taskType,
        parentTaskName
      })
      
      await onConfirm(trimmedName)
      
      // 成功時はダイアログを閉じる
      onClose()
      
      logger.info('Task created successfully from dialog', {
        taskName: trimmedName,
        taskType
      })
      
    } catch (error) {
      logger.error('Task creation failed from dialog', {
        taskName: trimmedName,
        taskType,
        error
      })
      
      setError('タスクの作成に失敗しました。もう一度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  // キャンセル処理
  const handleCancel = () => {
    logger.info('Task name dialog cancelled', {
      taskType,
      enteredName: taskName
    })
    onClose()
  }

  // Enterキーでの確定
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  // 入力値変更時のエラークリア
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTaskName(e.target.value)
    if (error) {
      setError(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {taskType === 'subtask' ? 'サブタスク作成' : 'タスク作成'}
          </DialogTitle>
          <DialogDescription>
            {taskType === 'subtask' && parentTaskName 
              ? `「${parentTaskName}」のサブタスクを作成します`
              : '新しいタスクを作成します'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="task-name" className="text-right">
              タスク名
            </Label>
            <div className="col-span-3">
              <Input
                ref={inputRef}
                id="task-name"
                value={taskName}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="タスク名を入力してください"
                className={error ? 'border-red-500' : ''}
                disabled={isSubmitting}
                maxLength={200}
              />
              {error && (
                <p className="text-sm text-red-500 mt-1">{error}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {taskName.length}/200文字
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || !taskName.trim()}
          >
            {isSubmitting ? '作成中...' : '作成'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}