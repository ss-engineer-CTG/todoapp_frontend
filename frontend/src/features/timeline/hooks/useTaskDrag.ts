// システムプロンプト準拠：タスクドラッグ操作管理フック
// 🎯 目的：ドラッグ状態の一元管理、既存APIとの連携

import { useState, useCallback, useRef } from 'react'
import { Task } from '@core/types'
import { logger } from '@core/utils/core'
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
      
      logger.info('Task drag started', { 
        taskId: task.id, 
        taskName: task.name,
        mouseX: event.clientX
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
      
      // 妥当性チェック
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
      } else {
        logger.warn('Invalid date change during drag', { 
          taskId: dragState.originalTask.id,
          error: validation.errorMessage 
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
      logger.info('Task drag ended', { 
        taskId: dragState.originalTask.id,
        originalStartDate: dragState.originalTask.startDate,
        newStartDate: dragState.previewStartDate,
        originalDueDate: dragState.originalTask.dueDate,
        newDueDate: dragState.previewDueDate
      })

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
    logger.info('Task drag cancelled')
    
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
  }, [])

  return {
    dragState,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
    isDragging: dragState.isDragging
  }
}