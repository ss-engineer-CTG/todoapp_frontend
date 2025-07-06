// システムプロンプト準拠：ドラッグ操作ユーティリティ
// 🔧 core.tsxから抽出

import { logger } from './logger'
import { formatDate } from './dateUtils'

/**
 * ドラッグ距離から日付差を計算（高精度版）
 */
export const calculatePreciseDateDifference = (
  startX: number,
  endX: number,
  cellWidth: number,
  viewUnit: 'day' | 'week'
): number => {
  try {
    const distance = endX - startX
    
    if (viewUnit === 'week') {
      // 週表示：7日単位での計算
      const weeksDiff = distance / (cellWidth * 7)
      return Math.round(weeksDiff) * 7
    } else {
      // 日表示：1日単位での計算
      return Math.round(distance / cellWidth)
    }
  } catch (error) {
    logger.error('Precise date difference calculation failed', { 
      startX, 
      endX, 
      cellWidth, 
      viewUnit, 
      error 
    })
    return 0
  }
}

/**
 * ドラッグ境界検証
 */
export const validateDragBounds = (
  newDate: Date,
  minDate?: Date,
  maxDate?: Date
): { isValid: boolean; adjustedDate?: Date; message?: string } => {
  try {
    if (minDate && newDate < minDate) {
      return {
        isValid: false,
        adjustedDate: minDate,
        message: `最小日付（${formatDate(minDate)}）より前には設定できません`
      }
    }
    
    if (maxDate && newDate > maxDate) {
      return {
        isValid: false,
        adjustedDate: maxDate,
        message: `最大日付（${formatDate(maxDate)}）より後には設定できません`
      }
    }
    
    return { isValid: true }
  } catch (error) {
    logger.error('Drag bounds validation failed', { newDate, minDate, maxDate, error })
    return {
      isValid: false,
      message: '日付範囲の検証中にエラーが発生しました'
    }
  }
}

/**
 * ドラッグプレビュー位置計算
 */
export const calculateDragPreview = (
  originalStartPos: number,
  originalEndPos: number,
  dragDelta: number,
  timelineWidth: number
): { previewStartPos: number; previewEndPos: number; isOutOfBounds: boolean } => {
  try {
    const previewStartPos = originalStartPos + dragDelta
    const previewEndPos = originalEndPos + dragDelta
    const isOutOfBounds = previewStartPos < 0 || previewEndPos > timelineWidth
    
    return {
      previewStartPos: Math.max(0, previewStartPos),
      previewEndPos: Math.min(timelineWidth, previewEndPos),
      isOutOfBounds
    }
  } catch (error) {
    logger.error('Drag preview calculation failed', { 
      originalStartPos, 
      originalEndPos, 
      dragDelta, 
      timelineWidth, 
      error 
    })
    return {
      previewStartPos: originalStartPos,
      previewEndPos: originalEndPos,
      isOutOfBounds: false
    }
  }
}

/**
 * マウス位置からタイムライン位置を計算
 */
export const calculateTimelinePosition = (
  mouseX: number,
  timelineRect: DOMRect,
  cellWidth: number
): { gridX: number; cellIndex: number; datePosition: number } => {
  try {
    const relativeX = mouseX - timelineRect.left
    const cellIndex = Math.floor(relativeX / cellWidth)
    const gridX = cellIndex * cellWidth
    
    return {
      gridX,
      cellIndex,
      datePosition: relativeX
    }
  } catch (error) {
    logger.error('Timeline position calculation failed', { 
      mouseX, 
      timelineRect, 
      cellWidth, 
      error 
    })
    return {
      gridX: 0,
      cellIndex: 0,
      datePosition: 0
    }
  }
}

/**
 * ドラッグ状態に応じたスタイル計算
 */
export const getDragStyle = (
  isDragging: boolean,
  isValidDrop: boolean = true,
  dragState?: 'idle' | 'dragging' | 'invalid'
): { cursor: string; opacity: number; borderStyle: string; borderColor?: string } => {
  try {
    if (dragState === 'dragging' || (isDragging && isValidDrop)) {
      return {
        cursor: 'grabbing',
        opacity: 0.8,
        borderStyle: 'solid',
        borderColor: 'blue'
      }
    }
    
    if (dragState === 'invalid' || (isDragging && !isValidDrop)) {
      return {
        cursor: 'no-drop',
        opacity: 0.6,
        borderStyle: 'dashed',
        borderColor: 'red'
      }
    }
    
    if (dragState === 'idle') {
      return {
        cursor: 'grab',
        opacity: 1,
        borderStyle: 'solid',
        borderColor: 'gray'
      }
    }
    
    return {
      cursor: 'default',
      opacity: 1,
      borderStyle: 'solid',
      borderColor: 'gray'
    }
  } catch (error) {
    logger.error('Drag style calculation failed', { isDragging, isValidDrop, dragState, error })
    return {
      cursor: 'default',
      opacity: 1,
      borderStyle: 'solid',
      borderColor: 'gray'
    }
  }
}

/**
 * ドラッグキャンセル条件判定
 */
export const shouldCancelDrag = (
  startTime: number,
  currentTime: number,
  startPosition: { x: number; y: number },
  currentPosition: { x: number; y: number },
  options?: {
    maxDragTime?: number
    maxDragDistance?: number
    maxVerticalMovement?: number
  }
): { shouldCancel: boolean; reason?: string } => {
  try {
    const { maxDragTime = 30000, maxDragDistance = 2000, maxVerticalMovement = 100 } = options || {}
    
    // 時間制限チェック
    if (currentTime - startTime > maxDragTime) {
      return {
        shouldCancel: true,
        reason: 'ドラッグ時間が長すぎます'
      }
    }
    
    // 距離制限チェック
    const horizontalDistance = Math.abs(currentPosition.x - startPosition.x)
    if (horizontalDistance > maxDragDistance) {
      return {
        shouldCancel: true,
        reason: 'ドラッグ距離が長すぎます'
      }
    }
    
    // 垂直移動制限チェック
    const verticalDistance = Math.abs(currentPosition.y - startPosition.y)
    if (verticalDistance > maxVerticalMovement) {
      return {
        shouldCancel: true,
        reason: '垂直方向への移動が検出されました'
      }
    }
    
    return { shouldCancel: false }
    
  } catch (error) {
    logger.error('Drag cancellation check failed', { 
      startTime, 
      currentTime, 
      startPosition, 
      currentPosition, 
      options, 
      error 
    })
    return {
      shouldCancel: true,
      reason: 'ドラッグ操作の検証中にエラーが発生しました'
    }
  }
}

/**
 * 位置から日付を計算
 */
export const calculateDateFromPosition = (
  position: number,
  startDate: Date,
  cellWidth: number,
  _viewUnit: 'day' | 'week' = 'week'
): Date => {
  const daysDiff = Math.round(position / cellWidth)
  const resultDate = new Date(startDate)
  resultDate.setDate(startDate.getDate() + daysDiff)
  return resultDate
}