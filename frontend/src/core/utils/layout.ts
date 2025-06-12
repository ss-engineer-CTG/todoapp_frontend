// システムプロンプト準拠：レイアウトユーティリティ統合
// DRY原則：レイアウト計算の一元化、KISS原則：シンプルな計算関数

import { TIMELINE_CONFIG, TimelineDisplayLevel, calculateCellWidth, getDisplayLevel } from '@core/config/timeline'

// CSS Grid エリア定義
export interface GridAreas {
  header: string
  sidebar: string
  content: string
}

// レスポンシブ設定
export interface ResponsiveConfig {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  breakpoint: 'mobile' | 'tablet' | 'desktop'
}

/**
 * CSS Grid テンプレート文字列生成
 * システムプロンプト準拠：設定値による動的生成
 */
export const generateGridTemplate = (
  config: ResponsiveConfig
): { areas: string; rows: string; columns: string } => {
  
  if (config.isMobile) {
    return {
      areas: `
        "header"
        "content"
      `,
      rows: `${TIMELINE_CONFIG.LAYOUT.HEADER_HEIGHT}px 1fr`,
      columns: '1fr'
    }
  }

  return {
    areas: `
      "header header"
      "sidebar content"
    `,
    rows: `${TIMELINE_CONFIG.LAYOUT.HEADER_HEIGHT}px 1fr`,
    columns: `${TIMELINE_CONFIG.LAYOUT.SIDEBAR_WIDTH}px 1fr`
  }
}

/**
 * レスポンシブ設定判定
 * システムプロンプト準拠：明確な閾値による判定
 */
export const getResponsiveConfig = (width: number): ResponsiveConfig => {
  const isMobile = width < 768
  const isTablet = width >= 768 && width < 1200
  const isDesktop = width >= 1200

  return {
    isMobile,
    isTablet,
    isDesktop,
    breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  }
}

/**
 * タイムライン寸法計算
 * システムプロンプト準拠：ズームレベルに応じた動的計算
 */
export interface TimelineDimensions {
  cellWidth: number
  rowHeight: {
    project: number
    task: number
    subtask: number
  }
  fontSize: {
    base: number
    small: number
    large: number
  }
  zoomRatio: number
  displayLevel: TimelineDisplayLevel
}

export const calculateTimelineDimensions = (
  zoomLevel: number,
  viewUnit: 'day' | 'week' = 'week'
): TimelineDimensions => {
  
  const zoomRatio = zoomLevel / 100
  const baseWidth = viewUnit === 'week' ? 20 : 30
  
  return {
    cellWidth: calculateCellWidth(zoomLevel, baseWidth),
    rowHeight: {
      project: Math.round(TIMELINE_CONFIG.LAYOUT.ROW_HEIGHT.PROJECT * zoomRatio),
      task: Math.round(TIMELINE_CONFIG.LAYOUT.ROW_HEIGHT.TASK * zoomRatio),
      subtask: Math.round(TIMELINE_CONFIG.LAYOUT.ROW_HEIGHT.SUBTASK * zoomRatio)
    },
    fontSize: calculateFontSizes(zoomLevel),
    zoomRatio,
    displayLevel: getDisplayLevel(zoomLevel)
  }
}

/**
 * フォントサイズ計算
 * システムプロンプト準拠：ズームレベルに応じた段階的調整
 */
const calculateFontSizes = (zoomLevel: number) => {
  if (zoomLevel <= 30) return { base: 8, small: 7, large: 9 }
  if (zoomLevel <= 50) return { base: 10, small: 9, large: 11 }
  if (zoomLevel <= 80) return { base: 12, small: 11, large: 13 }
  if (zoomLevel <= 120) return { base: 14, small: 12, large: 16 }
  if (zoomLevel <= 150) return { base: 16, small: 14, large: 18 }
  return { base: 18, small: 16, large: 20 }
}

/**
 * スクロール位置計算
 * システムプロンプト準拠：日付とセル幅による位置計算
 */
export const calculateScrollPosition = (
  targetDate: Date,
  startDate: Date,
  cellWidth: number,
  viewUnit: 'day' | 'week' = 'week'
): number => {
  
  if (viewUnit === 'week') {
    // 週の開始日（月曜日）を取得
    const startOfWeek = new Date(targetDate)
    while (startOfWeek.getDay() !== 1) {
      startOfWeek.setDate(startOfWeek.getDate() - 1)
    }
    
    const weeksDiff = Math.round(
      (startOfWeek.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    )
    const daysInWeek = (targetDate.getDay() + 6) % 7
    
    return weeksDiff * cellWidth * 7 + daysInWeek * cellWidth
  } else {
    // 日表示の場合
    const diffDays = Math.round(
      (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    return diffDays * cellWidth
  }
}

/**
 * 要素の中央配置計算
 * システムプロンプト準拠：コンテナ内での中央表示
 */
export const calculateCenterPosition = (
  targetPosition: number,
  containerWidth: number
): number => {
  return Math.max(0, targetPosition - containerWidth / 2)
}

/**
 * CSS クラス名生成
 * システムプロンプト準拠：設定に基づく一貫したクラス名
 */
export const generateTimelineClasses = (
  baseClass: string,
  modifiers: string[] = []
): string => {
  const classes = [TIMELINE_CONFIG.CSS_CLASSES.CONTAINER]
  
  if (baseClass) {
    classes.push(baseClass)
  }
  
  modifiers.forEach(modifier => {
    if (modifier) {
      classes.push(`${baseClass}--${modifier}`)
    }
  })
  
  return classes.join(' ')
}

/**
 * グリッドポジション計算
 * システムプロンプト準拠：タスクバーの配置計算
 */
export interface TaskPosition {
  left: number
  width: number
  top: number
  height: number
}

export const calculateTaskPosition = (
  startDate: Date,
  endDate: Date,
  timelineStartDate: Date,
  cellWidth: number,
  rowIndex: number,
  rowHeight: number,
  viewUnit: 'day' | 'week' = 'week'
): TaskPosition => {
  
  const startPosition = calculateScrollPosition(
    startDate,
    timelineStartDate,
    cellWidth,
    viewUnit
  )
  
  const endPosition = calculateScrollPosition(
    endDate,
    timelineStartDate,
    cellWidth,
    viewUnit
  )
  
  return {
    left: startPosition,
    width: Math.max(cellWidth, endPosition - startPosition + cellWidth),
    top: rowIndex * rowHeight,
    height: rowHeight
  }
}

/**
 * ビューポート内判定
 * システムプロンプト準拠：パフォーマンス最適化のための可視性判定
 */
export const isElementInViewport = (
  elementLeft: number,
  elementWidth: number,
  viewportLeft: number,
  viewportWidth: number,
  margin: number = 0
): boolean => {
  const elementRight = elementLeft + elementWidth
  const viewportRight = viewportLeft + viewportWidth
  
  return !(
    elementRight < viewportLeft - margin ||
    elementLeft > viewportRight + margin
  )
}

/**
 * ズーム制限チェック
 * システムプロンプト準拠：設定値による制限確認
 */
export const clampZoomLevel = (zoomLevel: number): number => {
  return Math.max(
    TIMELINE_CONFIG.ZOOM.MIN,
    Math.min(TIMELINE_CONFIG.ZOOM.MAX, zoomLevel)
  )
}

/**
 * ページサイズ計算
 * システムプロンプト準拠：効率的なページング実装のサポート
 */
export const calculatePageSize = (
  containerWidth: number,
  cellWidth: number,
  viewUnit: 'day' | 'week' = 'week'
): number => {
  const cellsPerView = Math.floor(containerWidth / cellWidth)
  const multiplier = viewUnit === 'week' ? 7 : 1
  return Math.max(1, cellsPerView * multiplier)
}
