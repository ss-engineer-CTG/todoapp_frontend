// システムプロンプト準拠：タスクドラッグ操作管理フック（リサイズモード対応版）
// 🔧 修正内容：既存のドラッグ機能を活用しつつ、リサイズモードを追加

import { useState, useCallback, useRef } from 'react'
import { Task } from '@core/types'
import { DragState, DragMode, UseTaskDragProps } from '../types'
import { logger } from '@core/utils/core'
import { 
  calculateDaysDifference, 
  validateResize,
  snapDateToGrid,
  calculateStartDateResize,
  calculateEndDateResize
} from '../utils/dragHelpers'

// 🔧 既存の初期状態を拡張
const initialDragState: DragState = {
  isDragging: false,
  dragMode: 'move',  // 🆕 追加：デフォルトは移動モード
  dragStartX: 0,
  dragCurrentX: 0,
  originalTask: null,
  previewStartDate: null,
  previewDueDate: null
}

export const useTaskDrag = ({
  cellWidth,
  viewUnit,
  onTaskUpdate
}: UseTaskDragProps) => {
  
  const [dragState, setDragState] = useState<DragState>(initialDragState)
  const dragPreventDefault = useRef<boolean>(false)

  // 🔧 修正：ドラッグ開始（モード対応追加）
  const handleDragStart = useCallback((
    event: React.MouseEvent,
    task: Task,
    mode: DragMode = 'move'  // 🆕 追加：モードパラメータ
  ) => {
    try {
      event.preventDefault()
      
      logger.info('Task drag started with mode', { 
        taskId: task.id, 
        taskName: task.name,
        dragMode: mode,  // 🆕 追加：モードログ
        mouseX: event.clientX
      })

      const startX = event.clientX
      
      setDragState({
        isDragging: true,
        dragMode: mode,  // 🆕 追加：モード状態保存
        dragStartX: startX,
        dragCurrentX: startX,
        originalTask: task,
        previewStartDate: task.startDate,
        previewDueDate: task.dueDate
      })

      dragPreventDefault.current = true
      
      // カーソルスタイルの変更
      document.body.style.cursor = mode === 'move' ? 'grabbing' : 'col-resize'
      document.body.style.userSelect = 'none'
      
    } catch (error) {
      logger.error('Drag start failed', { task, mode, error })
    }
  }, [])

  // 🔧 修正：ドラッグ中（モード分岐処理追加）
  const handleDragMove = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging || !dragState.originalTask) return

    try {
      const currentX = event.clientX
      const dragDistance = currentX - dragState.dragStartX
      
      let newDates: { startDate: Date; dueDate: Date }
      
      // 🆕 追加：ドラッグモードによる計算分岐
      switch (dragState.dragMode) {
        case 'resize-start':
          // 開始日のみ変更（期限日固定）
          newDates = calculateStartDateResize(
            dragState.originalTask,
            dragDistance,
            cellWidth,
            viewUnit
          )
          logger.debug('Start date resize', {
            taskId: dragState.originalTask.id,
            originalStart: dragState.originalTask.startDate,
            newStart: newDates.startDate,
            dragDistance
          })
          break
          
        case 'resize-end':
          // 期限日のみ変更（開始日固定）
          newDates = calculateEndDateResize(
            dragState.originalTask,
            dragDistance,
            cellWidth,
            viewUnit
          )
          logger.debug('End date resize', {
            taskId: dragState.originalTask.id,
            originalEnd: dragState.originalTask.dueDate,
            newEnd: newDates.dueDate,
            dragDistance
          })
          break
          
        case 'move':
        default: {
          // 🔧 既存：タスク全体移動（既存ロジック保持）
          const daysDiff = calculateDaysDifference(dragDistance, cellWidth, viewUnit)
          
          const newStartDate = new Date(dragState.originalTask.startDate)
          newStartDate.setDate(newStartDate.getDate() + daysDiff)
          
          const newDueDate = new Date(dragState.originalTask.dueDate)
          newDueDate.setDate(newDueDate.getDate() + daysDiff)
          
          // スナップ機能適用
          newDates = {
            startDate: snapDateToGrid(newStartDate, viewUnit),
            dueDate: snapDateToGrid(newDueDate, viewUnit)
          }
          
          logger.debug('Task move', {
            taskId: dragState.originalTask.id,
            daysDiff,
            newStartDate: newDates.startDate,
            newDueDate: newDates.dueDate,
            dragDistance
          })
          break
        }
      }
      
      // 🔧 既存：妥当性チェック（既存ロジック活用）
      const validation = validateResize(
        dragState.originalTask.startDate,
        dragState.originalTask.dueDate,
        newDates.startDate,
        newDates.dueDate
      )
      
      if (validation.isValid) {
        setDragState(prev => ({
          ...prev,
          dragCurrentX: currentX,
          previewStartDate: newDates.startDate,
          previewDueDate: newDates.dueDate
        }))
        
        // 警告メッセージがある場合はログ出力
        if (validation.warningMessage) {
          logger.warn('Drag operation has warnings', { 
            taskId: dragState.originalTask.id,
            warningMessage: validation.warningMessage,
            dragMode: dragState.dragMode
          })
        }
      } else {
        logger.warn('Invalid date change during drag', { 
          taskId: dragState.originalTask.id,
          errorMessage: validation.errorMessage,
          dragMode: dragState.dragMode
        })
      }
      
    } catch (error) {
      logger.error('Drag move failed', { error, dragMode: dragState.dragMode })
    }
  }, [dragState, cellWidth, viewUnit])

  // 🔧 既存：ドラッグ終了（モード情報ログ追加）
  const handleDragEnd = useCallback(async () => {
    if (!dragState.isDragging || !dragState.originalTask) return

    try {
      // 最終的な妥当性チェック
      const finalValidation = dragState.previewStartDate && dragState.previewDueDate ? 
        validateResize(
          dragState.originalTask.startDate,
          dragState.originalTask.dueDate,
          dragState.previewStartDate,
          dragState.previewDueDate
        ) : { isValid: false }

      logger.info('Task drag ended', { 
        taskId: dragState.originalTask.id,
        dragMode: dragState.dragMode,  // 🆕 追加：モード情報
        originalStartDate: dragState.originalTask.startDate,
        newStartDate: dragState.previewStartDate,
        originalDueDate: dragState.originalTask.dueDate,
        newDueDate: dragState.previewDueDate,
        validation: {
          isValid: finalValidation.isValid,
          hasError: !!finalValidation.errorMessage,
          hasWarning: !!finalValidation.warningMessage
        }
      })

      // エラーがある場合は更新を中止
      if (!finalValidation.isValid) {
        logger.warn('Task update cancelled due to validation error', { 
          taskId: dragState.originalTask.id,
          errorMessage: finalValidation.errorMessage,
          dragMode: dragState.dragMode
        })
        
        if (finalValidation.errorMessage) {
          // console.warn(`ドラッグ操作エラー: ${finalValidation.errorMessage}`)
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
          dragMode: dragState.dragMode,
          updatedStartDate: dragState.previewStartDate,
          updatedDueDate: dragState.previewDueDate
        })
        
        // 警告メッセージがある場合はユーザーに通知
        if (finalValidation.warningMessage) {
          // console.info(`ドラッグ操作警告: ${finalValidation.warningMessage}`)
        }
      } else {
        logger.info('No date changes detected, skipping update', { 
          taskId: dragState.originalTask.id,
          dragMode: dragState.dragMode
        })
      }

    } catch (error) {
      logger.error('Task update failed after drag', { 
        taskId: dragState.originalTask?.id,
        dragMode: dragState.dragMode,
        error 
      })
    } finally {
      // 状態をリセット
      setDragState(initialDragState)

      // カーソルスタイルをリセット
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      dragPreventDefault.current = false
    }
  }, [dragState, onTaskUpdate])

  // 🔧 既存：ドラッグキャンセル（モード情報ログ追加）
  const handleDragCancel = useCallback(() => {
    logger.info('Task drag cancelled', {
      taskId: dragState.originalTask?.id,
      dragMode: dragState.dragMode  // 🆕 追加：モード情報
    })
    
    setDragState(initialDragState)

    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    dragPreventDefault.current = false
  }, [dragState.originalTask?.id, dragState.dragMode])

  return {
    dragState,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
    isDragging: dragState.isDragging
  }
}