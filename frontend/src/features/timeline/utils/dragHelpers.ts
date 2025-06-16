// システムプロンプト準拠：ドラッグ座標変換ヘルパー（設定ベース制限版）
// 🔧 修正内容：制限検証を設定値ベースに変更、柔軟な制限制御を実現

import { logger } from '@core/utils/core'
import { APP_CONFIG } from '@core/config'

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
 * ドラッグによる日付変更の妥当性チェック（設定ベース版）
 * 🔧 修正：APP_CONFIGの制限設定に基づく動的制限制御
 */
export const validateDateChange = (
  originalStartDate: Date,
  originalDueDate: Date,
  newStartDate: Date,
  newDueDate: Date
): { isValid: boolean; errorMessage?: string; warningMessage?: string } => {
  try {
    const restrictions = APP_CONFIG.DRAG_RESTRICTIONS
    const warnings: string[] = []
    const errors: string[] = []

    // 🔧 修正：設定に基づく過去日制限チェック
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
        warnings.push('過去の日付に設定されています。履歴管理目的でない場合は注意してください。')
      }
    }
    
    // 🔧 修正：設定に基づく開始日・期限日順序チェック
    if (restrictions.ENFORCE_DATE_ORDER) {
      if (newStartDate > newDueDate) {
        errors.push('開始日は期限日より前である必要があります')
      }
    } else {
      // 制限解除時は警告のみ
      if (newStartDate > newDueDate) {
        warnings.push('開始日が期限日より後になっています。スケジュール管理にご注意ください。')
      }
    }
    
    // 期間の変更が大きすぎないかチェック（常に有効な安全制限）
    const maxChange = 365 * 24 * 60 * 60 * 1000 // 1年
    
    const startChange = Math.abs(newStartDate.getTime() - originalStartDate.getTime())
    const dueChange = Math.abs(newDueDate.getTime() - originalDueDate.getTime())
    
    if (startChange > maxChange || dueChange > maxChange) {
      errors.push('日付の変更幅が大きすぎます（1年以内に収めてください）')
    }
    
    // 結果の決定
    const isValid = errors.length === 0
    const errorMessage = errors.length > 0 ? errors.join(', ') : undefined
    const warningMessage = warnings.length > 0 ? warnings.join(', ') : undefined
    
    // 🔧 追加：制限設定状態をログ出力
    logger.info('Date change validation completed', {
      restrictions: {
        preventPastDates: restrictions.PREVENT_PAST_DATES,
        enforceDateOrder: restrictions.ENFORCE_DATE_ORDER
      },
      validation: {
        isValid,
        hasErrors: errors.length > 0,
        hasWarnings: warnings.length > 0,
        errorCount: errors.length,
        warningCount: warnings.length
      },
      dateChanges: {
        originalStart: originalStartDate.toISOString().split('T')[0],
        newStart: newStartDate.toISOString().split('T')[0],
        originalDue: originalDueDate.toISOString().split('T')[0],
        newDue: newDueDate.toISOString().split('T')[0]
      }
    })
    
    return { isValid, errorMessage, warningMessage }
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