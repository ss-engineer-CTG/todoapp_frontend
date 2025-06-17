// システムプロンプト準拠：ドラッグ座標変換ヘルパー（リサイズ機能対応版）
// 🔧 修正内容：既存ロジックを活用したリサイズ計算関数を追加

import { Task } from '@core/types'
import { ResizeValidationResult } from '../types'
import { logger } from '@core/utils/core'
import { APP_CONFIG } from '@core/config'

/**
 * 🔧 既存関数：マウス位置から日付を計算（保持）
 */
export const calculateDateFromPosition = (
  mouseX: number,
  timelineStartDate: Date,
  cellWidth: number,
  viewUnit: 'day' | 'week',
  scrollLeft: number = 0
): Date => {
  try {
    // スクロール位置を考慮した実際のX座標
    const actualX = mouseX + scrollLeft
    
    if (viewUnit === 'week') {
      // 週表示の場合
      const weeksFromStart = Math.floor(actualX / (cellWidth * 7))
      const daysInWeek = Math.floor((actualX % (cellWidth * 7)) / cellWidth)
      
      const targetDate = new Date(timelineStartDate)
      targetDate.setDate(targetDate.getDate() + (weeksFromStart * 7) + daysInWeek)
      
      return targetDate
    } else {
      // 日表示の場合
      const daysFromStart = Math.floor(actualX / cellWidth)
      
      const targetDate = new Date(timelineStartDate)
      targetDate.setDate(targetDate.getDate() + daysFromStart)
      
      return targetDate
    }
  } catch (error) {
    logger.error('Date calculation from position failed', { 
      mouseX, 
      timelineStartDate, 
      cellWidth, 
      viewUnit, 
      error 
    })
    return new Date() // フォールバック
  }
}

/**
 * 🔧 既存関数：日付からピクセル位置を計算（保持）
 */
export const calculatePositionFromDate = (
  date: Date,
  timelineStartDate: Date,
  cellWidth: number,
  viewUnit: 'day' | 'week'
): number => {
  try {
    if (viewUnit === 'week') {
      // 週の開始日（月曜日）を取得
      const startOfWeek = new Date(date)
      while (startOfWeek.getDay() !== 1) {
        startOfWeek.setDate(startOfWeek.getDate() - 1)
      }
      
      const weeksDiff = Math.round(
        (startOfWeek.getTime() - timelineStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      )
      const daysInWeek = (date.getDay() + 6) % 7
      
      return weeksDiff * cellWidth * 7 + daysInWeek * cellWidth
    } else {
      // 日表示の場合
      const diffDays = Math.round(
        (date.getTime() - timelineStartDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      return diffDays * cellWidth
    }
  } catch (error) {
    logger.error('Position calculation from date failed', { 
      date, 
      timelineStartDate, 
      cellWidth, 
      viewUnit, 
      error 
    })
    return 0 // フォールバック
  }
}

/**
 * 🔧 既存関数：グリッドスナップ機能（保持）
 */
export const snapDateToGrid = (
  date: Date,
  viewUnit: 'day' | 'week'
): Date => {
  try {
    const snappedDate = new Date(date)
    
    if (viewUnit === 'week') {
      // 週単位にスナップ（月曜日に吸着）
      while (snappedDate.getDay() !== 1) {
        snappedDate.setDate(snappedDate.getDate() - 1)
      }
    }
    // 日単位の場合はそのまま返す
    
    // 時刻をリセット（00:00:00）
    snappedDate.setHours(0, 0, 0, 0)
    
    return snappedDate
  } catch (error) {
    logger.error('Date grid snap failed', { date, viewUnit, error })
    return new Date(date) // フォールバック
  }
}

/**
 * 🔧 既存関数：ドラッグ距離から日数差を計算（保持）
 */
export const calculateDaysDifference = (
  dragDistance: number,
  cellWidth: number,
  viewUnit: 'day' | 'week'
): number => {
  try {
    if (viewUnit === 'week') {
      // 週表示の場合：7日単位で計算
      const weeksDiff = Math.round(dragDistance / (cellWidth * 7))
      return weeksDiff * 7
    } else {
      // 日表示の場合：1日単位で計算
      return Math.round(dragDistance / cellWidth)
    }
  } catch (error) {
    logger.error('Days difference calculation failed', { 
      dragDistance, 
      cellWidth, 
      viewUnit, 
      error 
    })
    return 0 // フォールバック
  }
}

/**
 * 🆕 新規追加：開始日のみリサイズ（期限日固定）
 */
export const calculateStartDateResize = (
  originalTask: Task,
  dragDistance: number,
  cellWidth: number,
  viewUnit: 'day' | 'week'
): { startDate: Date; dueDate: Date } => {
  try {
    const daysDiff = calculateDaysDifference(dragDistance, cellWidth, viewUnit)
    
    const newStartDate = new Date(originalTask.startDate)
    newStartDate.setDate(newStartDate.getDate() + daysDiff)
    
    // スナップ機能適用
    const snappedStartDate = snapDateToGrid(newStartDate, viewUnit)
    
    // 開始日が期限日以降になる場合は期限日の1日前に調整
    if (snappedStartDate >= originalTask.dueDate) {
      const adjustedStartDate = new Date(originalTask.dueDate)
      adjustedStartDate.setDate(adjustedStartDate.getDate() - 1)
      
      logger.warn('Start date adjusted to prevent overlap with due date', {
        taskId: originalTask.id,
        originalStartDate: originalTask.startDate,
        attemptedStartDate: snappedStartDate,
        adjustedStartDate,
        dueDate: originalTask.dueDate
      })
      
      return { 
        startDate: adjustedStartDate, 
        dueDate: originalTask.dueDate 
      }
    }
    
    logger.info('Start date resize calculated', {
      taskId: originalTask.id,
      originalStartDate: originalTask.startDate,
      newStartDate: snappedStartDate,
      daysDiff,
      dragDistance
    })
    
    return { 
      startDate: snappedStartDate, 
      dueDate: originalTask.dueDate 
    }
  } catch (error) {
    logger.error('Start date resize calculation failed', { 
      originalTask, 
      dragDistance, 
      cellWidth, 
      viewUnit, 
      error 
    })
    // エラー時は元の日付を返す
    return { 
      startDate: originalTask.startDate, 
      dueDate: originalTask.dueDate 
    }
  }
}

/**
 * 🆕 新規追加：期限日のみリサイズ（開始日固定）
 */
export const calculateEndDateResize = (
  originalTask: Task,
  dragDistance: number,
  cellWidth: number,
  viewUnit: 'day' | 'week'
): { startDate: Date; dueDate: Date } => {
  try {
    const daysDiff = calculateDaysDifference(dragDistance, cellWidth, viewUnit)
    
    const newDueDate = new Date(originalTask.dueDate)
    newDueDate.setDate(newDueDate.getDate() + daysDiff)
    
    // スナップ機能適用
    const snappedDueDate = snapDateToGrid(newDueDate, viewUnit)
    
    // 期限日が開始日以前になる場合は開始日の1日後に調整
    if (snappedDueDate <= originalTask.startDate) {
      const adjustedDueDate = new Date(originalTask.startDate)
      adjustedDueDate.setDate(adjustedDueDate.getDate() + 1)
      
      logger.warn('Due date adjusted to prevent overlap with start date', {
        taskId: originalTask.id,
        originalDueDate: originalTask.dueDate,
        attemptedDueDate: snappedDueDate,
        adjustedDueDate,
        startDate: originalTask.startDate
      })
      
      return { 
        startDate: originalTask.startDate, 
        dueDate: adjustedDueDate 
      }
    }
    
    logger.info('End date resize calculated', {
      taskId: originalTask.id,
      originalDueDate: originalTask.dueDate,
      newDueDate: snappedDueDate,
      daysDiff,
      dragDistance
    })
    
    return { 
      startDate: originalTask.startDate, 
      dueDate: snappedDueDate 
    }
  } catch (error) {
    logger.error('End date resize calculation failed', { 
      originalTask, 
      dragDistance, 
      cellWidth, 
      viewUnit, 
      error 
    })
    // エラー時は元の日付を返す
    return { 
      startDate: originalTask.startDate, 
      dueDate: originalTask.dueDate 
    }
  }
}

/**
 * 🆕 新規追加：リサイズ操作の妥当性チェック
 */
export const validateResize = (
  originalStartDate: Date,
  originalDueDate: Date,
  newStartDate: Date,
  newDueDate: Date
): ResizeValidationResult => {
  try {
    const warnings: string[] = []
    const errors: string[] = []

    // 基本的な日付順序チェック
    if (newStartDate >= newDueDate) {
      errors.push('開始日は期限日より前である必要があります')
    }

    // 設定に基づく過去日制限チェック
    const restrictions = APP_CONFIG.DRAG_RESTRICTIONS
    if (restrictions.PREVENT_PAST_DATES) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (newStartDate < today) {
        errors.push('開始日に過去の日付は設定できません')
      }
      
      if (newDueDate < today) {
        errors.push('期限日に過去の日付は設定できません')
      }
    } else {
      // 制限解除時は警告のみ
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (newStartDate < today || newDueDate < today) {
        warnings.push('過去の日付に設定されています')
      }
    }
    
    // 期間の変更が大きすぎないかチェック（安全制限）
    const maxChange = 365 * 24 * 60 * 60 * 1000 // 1年
    
    const startChange = Math.abs(newStartDate.getTime() - originalStartDate.getTime())
    const dueChange = Math.abs(newDueDate.getTime() - originalDueDate.getTime())
    
    if (startChange > maxChange || dueChange > maxChange) {
      errors.push('日付の変更幅が大きすぎます（1年以内に収めてください）')
    }
    
    const isValid = errors.length === 0
    const errorMessage = errors.length > 0 ? errors.join(', ') : undefined
    const warningMessage = warnings.length > 0 ? warnings.join(', ') : undefined
    
    logger.info('Resize validation completed', {
      isValid,
      hasErrors: errors.length > 0,
      hasWarnings: warnings.length > 0,
      restrictions: {
        preventPastDates: restrictions.PREVENT_PAST_DATES,
        enforceDateOrder: restrictions.ENFORCE_DATE_ORDER
      }
    })
    
    return { isValid, errorMessage, warningMessage }
  } catch (error) {
    logger.error('Resize validation failed', { 
      originalStartDate, 
      originalDueDate, 
      newStartDate, 
      newDueDate, 
      error 
    })
    return {
      isValid: false,
      errorMessage: 'リサイズの検証中にエラーが発生しました'
    }
  }
}