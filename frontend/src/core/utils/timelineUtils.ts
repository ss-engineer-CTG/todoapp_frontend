// システムプロンプト準拠：Timeline計算ユーティリティ
// 🔧 core.tsxから抽出

export const calculateDimensions = (zoomLevel: number, viewUnit: 'day' | 'week') => {
  const zoomRatio = zoomLevel / 100
  
  const baseSizes = {
    cellWidth: { day: 20, week: 10 },
    rowHeight: { project: 40, task: 32, subtask: 28 },
    fontSize: { base: 12, small: 10, large: 14 },
    taskBarHeight: 30
  }
  
  return {
    cellWidth: Math.round(baseSizes.cellWidth[viewUnit] * zoomRatio),
    rowHeight: {
      project: Math.round(baseSizes.rowHeight.project * zoomRatio),
      task: Math.round(baseSizes.rowHeight.task * zoomRatio),
      subtask: Math.round(baseSizes.rowHeight.subtask * zoomRatio)
    },
    fontSize: {
      base: Math.round(baseSizes.fontSize.base * zoomRatio),
      small: Math.round(baseSizes.fontSize.small * zoomRatio),
      large: Math.round(baseSizes.fontSize.large * zoomRatio)
    },
    taskBarHeight: Math.round(baseSizes.taskBarHeight * zoomRatio),
    zoomRatio
  }
}

export const calculateTimelineTaskStatus = (task: { 
  completed: boolean, 
  startDate: Date, 
  dueDate: Date 
}): string => {
  if (task.completed) return 'completed'
  
  const today = new Date()
  const startDate = new Date(task.startDate)
  const dueDate = new Date(task.dueDate)
  
  if (today < startDate) return 'pending'
  if (today > dueDate) return 'overdue'
  return 'in-progress'
}

export const getDateCellClass = (date: Date, today: Date, theme: string): string => {
  const isToday = date.toDateString() === today.toDateString()
  if (isToday) return theme === 'dark' ? 'bg-yellow-900/40 border-yellow-400' : 'bg-yellow-100 border-yellow-400'
  
  const isWeekend = date.getDay() === 0 || date.getDay() === 6
  return isWeekend ? 
    (theme === 'dark' ? 'bg-gray-900/60' : 'bg-gray-50/60') : 
    (theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/60')
}

export const getWeekBackground = (date: Date, theme: string): string => {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6
  return isWeekend ? 
    (theme === 'dark' ? 'bg-gray-900/60' : 'bg-gray-50/60') : 
    (theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/60')
}

export const calculateDynamicSizes = (zoomLevel: number, viewUnit: 'day' | 'week') => {
  return calculateDimensions(zoomLevel, viewUnit)
}

export const getDisplayText = (text: string, _zoomLevel?: number, maxLength: number = 20): string => {
  // zoomLevelは互換性のために受け取るが、現在は使用しない
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

// 列幅に基づく動的フォントサイズ計算
export const calculateDynamicFontSize = (
  cellWidth: number,
  textLength: number,
  viewUnit: 'day' | 'week',
  minSize: number = 8,
  maxSize: number = 16
): number => {
  // 基本的な文字幅係数（1文字あたりの推定幅）
  const charWidthRatio = 0.6 // フォントサイズに対する文字幅の比率
  
  // 利用可能な幅（パディングを考慮）
  const availableWidth = cellWidth - 8 // 左右4pxずつのパディング
  
  // 必要な文字数に基づく最適フォントサイズ
  const optimalSize = Math.floor(availableWidth / (textLength * charWidthRatio))
  
  // 週表示の場合は少し小さめに調整
  const viewAdjustment = viewUnit === 'week' ? 0.9 : 1.0
  const adjustedSize = Math.floor(optimalSize * viewAdjustment)
  
  // 最小・最大サイズ制限を適用
  return Math.max(minSize, Math.min(maxSize, adjustedSize))
}

// 日付表示用の動的フォントサイズ（日付ヘッダー専用）
export const calculateDateHeaderFontSize = (
  cellWidth: number,
  viewUnit: 'day' | 'week',
  zoomLevel: number = 100
): { base: number; small: number; large: number } => {
  const zoomRatio = zoomLevel / 100
  
  if (viewUnit === 'day') {
    // 日表示：日付番号（1-31）を基準
    const baseFontSize = calculateDynamicFontSize(cellWidth, 2, 'day', 8, 16)
    return {
      base: Math.round(baseFontSize * zoomRatio),
      small: Math.round(baseFontSize * 0.85 * zoomRatio),
      large: Math.round(baseFontSize * 1.15 * zoomRatio)
    }
  } else {
    // 週表示：固定フォントサイズ（10px base）
    return {
      base: Math.round(10 * zoomRatio),
      small: Math.round(8 * zoomRatio),
      large: Math.round(12 * zoomRatio)
    }
  }
}