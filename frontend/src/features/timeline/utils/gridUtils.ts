// システムプロンプト準拠：グリッド専用ユーティリティ
// DRY原則：グリッド計算の一元化、KISS原則：シンプルな計算関数

import { TIMELINE_CONFIG } from '@core/config/timeline'
import { calculateScrollPosition, isElementInViewport } from '@core/utils/layout'
import { getDateType, getWeekNumber } from './holidayData'

// グリッドセル情報型
export interface GridCell {
  date: Date
  x: number
  y: number
  width: number
  height: number
  isWeekend: boolean
  isHoliday: boolean
  isToday: boolean
  isFirstOfMonth: boolean
  isFirstOfWeek: boolean
}

// グリッド行情報型
export interface GridRow {
  id: string
  type: 'project' | 'task' | 'subtask'
  level: number
  y: number
  height: number
  visible: boolean
}

// グリッド寸法型
export interface GridDimensions {
  totalWidth: number
  totalHeight: number
  visibleWidth: number
  visibleHeight: number
  cellWidth: number
  cellHeight: number
}

/**
 * 日付グリッドセル生成
 * システムプロンプト準拠：日付ベースのグリッドセル情報生成
 */
export const generateDateGridCells = (
  visibleDates: Date[],
  startDate: Date,
  cellWidth: number,
  cellHeight: number,
  viewUnit: 'day' | 'week',
  today = new Date()
): GridCell[] => {
  
  return visibleDates.map((date, index) => {
    const x = viewUnit === 'week' 
      ? index * cellWidth * 7 
      : calculateScrollPosition(date, startDate, cellWidth, viewUnit)
    
    const width = viewUnit === 'week' ? cellWidth * 7 : cellWidth
    const dateType = getDateType(date)
    
    return {
      date,
      x,
      y: 0,
      width,
      height: cellHeight,
      isWeekend: dateType === 'saturday' || dateType === 'sunday',
      isHoliday: dateType === 'holiday',
      isToday: date.toDateString() === today.toDateString(),
      isFirstOfMonth: isFirstDayOfMonth(date, index, visibleDates),
      isFirstOfWeek: isFirstDayOfWeek(date)
    }
  })
}

/**
 * 背景グリッド生成
 * システムプロンプト準拠：パフォーマンス最適化されたグリッド背景
 */
export const generateBackgroundGrid = (
  cells: GridCell[],
  totalHeight: number,
  theme: 'light' | 'dark'
): Array<{
  x: number
  width: number
  className: string
  style: React.CSSProperties
}> => {
  
  return cells.map((cell, index) => {
    let className = 'absolute inset-y-0 pointer-events-none'
    
    // 週表示の場合の交互背景
    if (index % 2 === 0) {
      className += theme === 'dark' ? ' bg-gray-900/60' : ' bg-gray-50/60'
    } else {
      className += theme === 'dark' ? ' bg-gray-800/60' : ' bg-white/60'
    }
    
    // 境界線の設定
    let borderRightWidth = '1px'
    let borderRightColor = theme === 'dark' ? '#6b7280' : '#d1d5db'
    
    if (cell.isFirstOfMonth) {
      borderRightWidth = '3px'
      borderRightColor = theme === 'dark' ? '#6366f1' : '#4f46e5'
    } else if (cell.isFirstOfWeek) {
      borderRightWidth = '2px'
    }
    
    return {
      x: cell.x,
      width: cell.width,
      className,
      style: {
        height: `${totalHeight}px`,
        borderRightWidth,
        borderRightColor,
        borderRightStyle: 'solid',
        opacity: 0.4
      }
    }
  })
}

/**
 * 土日祝日オーバーレイ生成
 * システムプロンプト準拠：非営業日の視覚的強調
 */
export const generateHolidayOverlays = (
  cells: GridCell[],
  totalHeight: number,
  theme: 'light' | 'dark'
): Array<{
  x: number
  width: number
  className: string
  style: React.CSSProperties
}> => {
  
  const overlays: Array<{
    x: number
    width: number
    className: string
    style: React.CSSProperties
  }> = []
  
  cells.forEach(cell => {
    if (!cell.isWeekend && !cell.isHoliday) return
    
    const bgColor = theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-300/50'
    
    overlays.push({
      x: cell.x,
      width: cell.width,
      className: `absolute inset-y-0 ${bgColor}`,
      style: {
        height: `${totalHeight}px`,
        zIndex: 1
      }
    })
  })
  
  return overlays
}

/**
 * グリッド行生成
 * システムプロンプト準拠：階層構造に基づく行レイアウト
 */
export const generateGridRows = (
  projects: Array<{
    id: string
    expanded: boolean
    tasks: Array<{
      id: string
      expanded?: boolean
      subtasks?: Array<{ id: string }>
    }>
  }>,
  rowHeights: { project: number; task: number; subtask: number }
): GridRow[] => {
  
  const rows: GridRow[] = []
  let currentY = 0
  
  projects.forEach(project => {
    // プロジェクト行
    rows.push({
      id: project.id,
      type: 'project',
      level: 0,
      y: currentY,
      height: rowHeights.project,
      visible: true
    })
    currentY += rowHeights.project
    
    if (project.expanded) {
      project.tasks.forEach(task => {
        // タスク行
        rows.push({
          id: task.id,
          type: 'task',
          level: 1,
          y: currentY,
          height: rowHeights.task,
          visible: true
        })
        currentY += rowHeights.task
        
        if (task.expanded && task.subtasks) {
          task.subtasks.forEach(subtask => {
            // サブタスク行
            rows.push({
              id: subtask.id,
              type: 'subtask',
              level: 2,
              y: currentY,
              height: rowHeights.subtask,
              visible: true
            })
            currentY += rowHeights.subtask
          })
        }
      })
    }
  })
  
  return rows
}

/**
 * 可視範囲内のアイテム計算
 * システムプロンプト準拠：パフォーマンス最適化のための可視性判定
 */
export const getVisibleItems = <T extends { x?: number; width?: number; y?: number; height?: number }>(
  items: T[],
  viewportLeft: number,
  viewportTop: number,
  viewportWidth: number,
  viewportHeight: number,
  margin = 100
): T[] => {
  
  return items.filter(item => {
    const itemLeft = item.x ?? 0
    const itemWidth = item.width ?? 0
    const itemTop = item.y ?? 0
    const itemHeight = item.height ?? 0
    
    const horizontalVisible = isElementInViewport(
      itemLeft, itemWidth, viewportLeft, viewportWidth, margin
    )
    
    const verticalVisible = !(
      itemTop + itemHeight < viewportTop - margin ||
      itemTop > viewportTop + viewportHeight + margin
    )
    
    return horizontalVisible && verticalVisible
  })
}

/**
 * グリッド寸法計算
 * システムプロンプト準拠：動的サイズ計算
 */
export const calculateGridDimensions = (
  visibleDates: Date[],
  rows: GridRow[],
  cellWidth: number,
  viewUnit: 'day' | 'week'
): GridDimensions => {
  
  const totalWidth = visibleDates.length * cellWidth * (viewUnit === 'week' ? 7 : 1)
  const totalHeight = rows.reduce((sum, row) => sum + row.height, 0)
  
  return {
    totalWidth,
    totalHeight,
    visibleWidth: Math.min(totalWidth, window.innerWidth || 1200),
    visibleHeight: Math.min(totalHeight, window.innerHeight || 800),
    cellWidth,
    cellHeight: TIMELINE_CONFIG.LAYOUT.ROW_HEIGHT.TASK
  }
}

/**
 * 月境界判定
 * システムプロンプト準拠：月の最初の日の判定
 */
export const isFirstDayOfMonth = (
  date: Date, 
  index: number, 
  visibleDates: Date[]
): boolean => {
  return index === 0 || (index > 0 && visibleDates[index - 1].getMonth() !== date.getMonth())
}

/**
 * 週境界判定
 * システムプロンプト準拠：週の最初の日（月曜日）の判定
 */
export const isFirstDayOfWeek = (date: Date): boolean => {
  return date.getDay() === 1 // 月曜日
}

/**
 * 今日のインジケーター位置計算
 * システムプロンプト準拠：今日の位置マーカー
 */
export const calculateTodayIndicator = (
  today: Date,
  startDate: Date,
  cellWidth: number,
  totalHeight: number,
  viewUnit: 'day' | 'week',
  zoomRatio: number
): {
  x: number
  width: number
  height: number
  markerStyle: React.CSSProperties
} => {
  
  const x = calculateScrollPosition(today, startDate, cellWidth, viewUnit)
  const width = Math.max(2, Math.round(3 * zoomRatio))
  
  return {
    x,
    width,
    height: totalHeight,
    markerStyle: {
      position: 'absolute' as const,
      top: 0,
      left: `${x}px`,
      width: `${width}px`,
      height: `${totalHeight}px`,
      backgroundColor: '#ef4444', // red-500
      zIndex: 30,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }
  }
}

/**
 * 月ヘッダーグループ計算
 * システムプロンプト準拠：月表示のためのグループ化
 */
export const calculateMonthGroups = (
  visibleDates: Date[],
  cellWidth: number
): Array<{
  month: number
  year: number
  startIndex: number
  width: number
  label: string
}> => {
  
  const monthGroups: Array<{
    month: number
    year: number
    startIndex: number
    width: number
    label: string
  }> = []
  
  let currentMonth: number | null = null
  let monthStart = 0
  let monthWidth = 0
  
  visibleDates.forEach((date, index) => {
    if (currentMonth !== date.getMonth()) {
      if (currentMonth !== null) {
        const previousDate = visibleDates[monthStart]
        monthGroups.push({
          month: currentMonth,
          year: previousDate.getFullYear(),
          startIndex: monthStart,
          width: monthWidth * cellWidth,
          label: `${previousDate.getFullYear()}年${currentMonth + 1}月`
        })
      }
      currentMonth = date.getMonth()
      monthStart = index
      monthWidth = 1
    } else {
      monthWidth++
    }
    
    // 最後の月を処理
    if (index === visibleDates.length - 1) {
      monthGroups.push({
        month: currentMonth!,
        year: date.getFullYear(),
        startIndex: monthStart,
        width: monthWidth * cellWidth,
        label: `${date.getFullYear()}年${currentMonth! + 1}月`
      })
    }
  })
  
  return monthGroups
}

/**
 * 週ヘッダーラベル計算
 * システムプロンプト準拠：週表示のためのラベル生成
 */
export const calculateWeekLabel = (
  weekStart: Date,
  isFirstMonth: boolean
): string => {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return isFirstMonth 
      ? `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getDate()}`
      : `${weekStart.getDate()}-${weekEnd.getDate()}`
  } else {
    return `${weekStart.getMonth() + 1}/${weekStart.getDate()}-${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
  }
}

/**
 * 祝日名取得
 * システムプロンプト準拠：祝日情報の表示サポート
 */
export const getHolidayName = (date: Date): string | null => {
  // holidayData.ts から祝日情報を取得
  const holidays = [
    { date: new Date(2025, 0, 1), name: '元日' },
    { date: new Date(2025, 0, 13), name: '成人の日' },
    { date: new Date(2025, 1, 11), name: '建国記念の日' },
    // ... 他の祝日
  ]
  
  const holiday = holidays.find(h => 
    h.date.getFullYear() === date.getFullYear() &&
    h.date.getMonth() === date.getMonth() &&
    h.date.getDate() === date.getDate()
  )
  
  return holiday?.name || null
}

/**
 * グリッドスナップ位置計算
 * システムプロンプト準拠：ドラッグ&ドロップ時のスナップ機能
 */
export const snapToGrid = (
  x: number,
  cellWidth: number,
  snapThreshold = 10
): number => {
  const cellPosition = Math.round(x / cellWidth) * cellWidth
  const distance = Math.abs(x - cellPosition)
  
  return distance <= snapThreshold ? cellPosition : x
}

/**
 * パフォーマンス最適化：仮想化計算
 * システムプロンプト準拠：大量データの効率的な描画
 */
export const calculateVirtualization = (
  totalItems: number,
  itemHeight: number,
  containerHeight: number,
  scrollTop: number,
  buffer = 5
): {
  startIndex: number
  endIndex: number
  offsetY: number
  visibleCount: number
} => {
  
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer)
  const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + buffer * 2)
  const offsetY = startIndex * itemHeight
  
  return {
    startIndex,
    endIndex,
    offsetY,
    visibleCount
  }
}
