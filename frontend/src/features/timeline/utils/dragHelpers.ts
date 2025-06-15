// システムプロンプト準拠：ドラッグ座標変換ヘルパー（純粋関数）
// 🎯 目的：マウス位置と日付の相互変換、グリッドスナップ機能

import { logger } from '@core/utils/core'

/**
 * マウス位置から日付を計算
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
 * 日付からピクセル位置を計算
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
 * グリッドスナップ機能（日付を日/週単位に吸着）
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
 * ドラッグによる日付変更の妥当性チェック
 */
export const validateDateChange = (
  originalStartDate: Date,
  originalDueDate: Date,
  newStartDate: Date,
  newDueDate: Date
): { isValid: boolean; errorMessage?: string } => {
  try {
    // 開始日が期限日より後になっていないかチェック
    if (newStartDate > newDueDate) {
      return {
        isValid: false,
        errorMessage: '開始日は期限日より前である必要があります'
      }
    }
    
    // 過去日制限（今日より前に設定不可）
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (newStartDate < today) {
      return {
        isValid: false,
        errorMessage: '過去の日付は設定できません'
      }
    }
    
    // 期間の変更が大きすぎないかチェック（1年以上の変更を警告）
    const originalDuration = originalDueDate.getTime() - originalStartDate.getTime()
    const maxChange = 365 * 24 * 60 * 60 * 1000 // 1年
    
    const startChange = Math.abs(newStartDate.getTime() - originalStartDate.getTime())
    const dueChange = Math.abs(newDueDate.getTime() - originalDueDate.getTime())
    
    if (startChange > maxChange || dueChange > maxChange) {
      return {
        isValid: false,
        errorMessage: '日付の変更幅が大きすぎます（1年以内に収めてください）'
      }
    }
    
    return { isValid: true }
  } catch (error) {
    logger.error('Date validation failed', { 
      originalStartDate, 
      originalDueDate, 
      newStartDate, 
      newDueDate, 
      error 
    })
    return {
      isValid: false,
      errorMessage: '日付の検証中にエラーが発生しました'
    }
  }
}

/**
 * ドラッグ距離から日数差を計算
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