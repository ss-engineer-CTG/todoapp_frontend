// システムプロンプト準拠：Timeline計算ユーティリティ
// 🔧 core.tsxから抽出

export const calculateDimensions = (zoomLevel: number, viewUnit: 'day' | 'week') => {
  const zoomRatio = zoomLevel / 100
  
  const baseSizes = {
    cellWidth: { day: 20, week: 16 },
    rowHeight: { project: 40, task: 32, subtask: 28 },
    fontSize: { base: 14, small: 12, large: 16 },
    taskBarHeight: 24
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

export const getDisplayText = (text: string, zoomLevel?: number, maxLength: number = 20): string => {
  // zoomLevelは互換性のために受け取るが、現在は使用しない
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}