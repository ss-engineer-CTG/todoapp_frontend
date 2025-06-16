// システムプロンプト準拠：タスクドラッグ操作管理フック（制限設定対応版）
// 🔧 修正内容：設定ベース制限検証の対応、警告メッセージ処理を追加

import { useState, useCallback, useRef } from 'react'
import { Task } from '@core/types'
import { logger } from '@core/utils/core'
import { APP_CONFIG } from '@core/config'
import { 
  calculateDateFromPosition, 
  calculateDaysDifference, 
  validateDateChange,
  snapDateToGrid
} from '../utils/dragHelpers'

// ドラッグ状態の型定義
interface DragState {
  isDragging: boolean
  dragStartX: number
  dragCurrentX: number
  originalTask: Task | null
  previewStartDate: Date | null
  previewDueDate: Date | null
}

interface UseTaskDragProps {
  timelineStartDate: Date
  cellWidth: number
  viewUnit: 'day' | 'week'
  scrollLeft: number
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>
}

export const useTaskDrag = ({
  timelineStartDate,
  cellWidth,
  viewUnit,
  scrollLeft,
  onTaskUpdate
}: UseTaskDragProps) => {
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragStartX: 0,
    dragCurrentX: 0,
    originalTask: null,
    previewStartDate: null,
    previewDueDate: null
  })

  const dragPreventDefault = useRef<boolean>(false)

  // ドラッグ開始
  const handleDragStart = useCallback((
    event: React.MouseEvent,
    task: Task
  ) => {
    try {
      event.preventDefault()
      
      // 🔧 追加：制限設定状態をログ出力
      logger.info('Task drag started with current restrictions', { 
        taskId: task.id, 
        taskName: task.name,
        mouseX: event.clientX,
        restrictions: {
          preventPastDates: APP_CONFIG.DRAG_RESTRICTIONS.PREVENT_PAST_DATES,
          enforceDateOrder: APP_CONFIG.DRAG_RESTRICTIONS.ENFORCE_DATE_ORDER
        }
      })

      const startX = event.clientX
      
      setDragState({
        isDragging: true,
        dragStartX: startX,
        dragCurrentX: startX,
        originalTask: task,
        previewStartDate: task.startDate,
        previewDueDate: task.dueDate
      })

      dragPreventDefault.current = true
      
      // カーソルスタイルの変更
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
      
    } catch (error) {
      logger.error('Drag start failed', { task, error })
    }
  }, [])

  // ドラッグ中
  const handleDragMove = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging || !dragState.originalTask) return

    try {
      const currentX = event.clientX
      const dragDistance = currentX - dragState.dragStartX
      
      // 日数差を計算
      const daysDiff = calculateDaysDifference(dragDistance, cellWidth, viewUnit)
      
      // 新しい日付を計算
      const newStartDate = new Date(dragState.originalTask.startDate)
      newStartDate.setDate(newStartDate.getDate() + daysDiff)
      
      const newDueDate = new Date(dragState.originalTask.dueDate)
      newDueDate.setDate(newDueDate.getDate() + daysDiff)
      
      // グリッドにスナップ
      const snappedStartDate = snapDateToGrid(newStartDate, viewUnit)
      const snappedDueDate = snapDateToGrid(newDueDate, viewUnit)
      
      // 🔧 修正：設定ベース妥当性チェック（警告メッセージ対応）
      const validation = validateDateChange(
        dragState.originalTask.startDate,
        dragState.originalTask.dueDate,
        snappedStartDate,
        snappedDueDate
      )
      
      if (validation.isValid) {
        setDragState(prev => ({
          ...prev,
          dragCurrentX: currentX,
          previewStartDate: snappedStartDate,
          previewDueDate: snappedDueDate
        }))
        
        // 🔧 追加：警告メッセージがある場合はログ出力
        if (validation.warningMessage) {
          logger.warn('Drag operation has warnings', { 
            taskId: dragState.originalTask.id,
            warningMessage: validation.warningMessage,
            restrictions: {
              preventPastDates: APP_CONFIG.DRAG_RESTRICTIONS.PREVENT_PAST_DATES,
              enforceDateOrder: APP_CONFIG.DRAG_RESTRICTIONS.ENFORCE_DATE_ORDER
            }
          })
        }
      } else {
        logger.warn('Invalid date change during drag', { 
          taskId: dragState.originalTask.id,
          errorMessage: validation.errorMessage,
          restrictions: {
            preventPastDates: APP_CONFIG.DRAG_RESTRICTIONS.PREVENT_PAST_DATES,
            enforceDateOrder: APP_CONFIG.DRAG_RESTRICTIONS.ENFORCE_DATE_ORDER
          }
        })
      }
      
    } catch (error) {
      logger.error('Drag move failed', { error })
    }
  }, [dragState, cellWidth, viewUnit])

  // ドラッグ終了
  const handleDragEnd = useCallback(async () => {
    if (!dragState.isDragging || !dragState.originalTask) return

    try {
      // 🔧 追加：最終的な制限チェックと警告表示
      const finalValidation = dragState.previewStartDate && dragState.previewDueDate ? 
        validateDateChange(
          dragState.originalTask.startDate,
          dragState.originalTask.dueDate,
          dragState.previewStartDate,
          dragState.previewDueDate
        ) : { isValid: false }

      logger.info('Task drag ended with validation', { 
        taskId: dragState.originalTask.id,
        originalStartDate: dragState.originalTask.startDate,
        newStartDate: dragState.previewStartDate,
        originalDueDate: dragState.originalTask.dueDate,
        newDueDate: dragState.previewDueDate,
        validation: {
          isValid: finalValidation.isValid,
          hasError: !!finalValidation.errorMessage,
          hasWarning: !!finalValidation.warningMessage,
          errorMessage: finalValidation.errorMessage,
          warningMessage: finalValidation.warningMessage
        },
        restrictions: {
          preventPastDates: APP_CONFIG.DRAG_RESTRICTIONS.PREVENT_PAST_DATES,
          enforceDateOrder: APP_CONFIG.DRAG_RESTRICTIONS.ENFORCE_DATE_ORDER
        }
      })

      // 🔧 修正：エラーがある場合は更新を中止
      if (!finalValidation.isValid) {
        logger.warn('Task update cancelled due to validation error', { 
          taskId: dragState.originalTask.id,
          errorMessage: finalValidation.errorMessage
        })
        
        // エラーメッセージをコンソールに表示（UIトーストは将来の拡張で追加可能）
        if (finalValidation.errorMessage) {
          console.warn(`ドラッグ操作エラー: ${finalValidation.errorMessage}`)
        }
        
        return
      }

      // 日付が実際に変更された場合のみ更新
      const hasStartDateChanged = dragState.previewStartDate && 
        dragState.previewStartDate.getTime() !== dragState.originalTask.startDate.getTime()
      
      const hasDueDateChanged = dragState.previewDueDate && 
        dragState.previewDueDate.getTime() !== dragState.originalTask.dueDate.getTime()

      if (hasStartDateChanged || hasDueDateChanged) {
        await onTaskUpdate(dragState.originalTask.id, {
          startDate: dragState.previewStartDate || dragState.originalTask.startDate,
          dueDate: dragState.previewDueDate || dragState.originalTask.dueDate
        })
        
        logger.info('Task dates updated via drag', { 
          taskId: dragState.originalTask.id,
          updatedStartDate: dragState.previewStartDate,
          updatedDueDate: dragState.previewDueDate
        })
        
        // 🔧 追加：警告メッセージがある場合はユーザーに通知
        if (finalValidation.warningMessage) {
          console.info(`ドラッグ操作警告: ${finalValidation.warningMessage}`)
        }
      } else {
        logger.info('No date changes detected, skipping update', { 
          taskId: dragState.originalTask.id 
        })
      }

    } catch (error) {
      logger.error('Task update failed after drag', { 
        taskId: dragState.originalTask?.id, 
        error 
      })
    } finally {
      // 状態をリセット
      setDragState({
        isDragging: false,
        dragStartX: 0,
        dragCurrentX: 0,
        originalTask: null,
        previewStartDate: null,
        previewDueDate: null
      })

      // カーソルスタイルをリセット
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      dragPreventDefault.current = false
    }
  }, [dragState, onTaskUpdate])

  // ドラッグキャンセル
  const handleDragCancel = useCallback(() => {
    logger.info('Task drag cancelled', {
      taskId: dragState.originalTask?.id,
      restrictions: {
        preventPastDates: APP_CONFIG.DRAG_RESTRICTIONS.PREVENT_PAST_DATES,
        enforceDateOrder: APP_CONFIG.DRAG_RESTRICTIONS.ENFORCE_DATE_ORDER
      }
    })
    
    setDragState({
      isDragging: false,
      dragStartX: 0,
      dragCurrentX: 0,
      originalTask: null,
      previewStartDate: null,
      previewDueDate: null
    })

    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    dragPreventDefault.current = false
  }, [dragState.originalTask?.id])

  return {
    dragState,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
    isDragging: dragState.isDragging
  }
}