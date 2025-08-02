// システムプロンプト準拠：Timeline統合フック（テーマ除去版）
// 🔧 修正内容：独自テーマ状態の完全除去・シンプル化

import { useState, useCallback, useMemo, useRef } from 'react'
import { ZOOM_CONFIG } from '../utils'
import { DynamicSizes, TimeRange } from '../types'
import { calculateDynamicSizes, getDatePosition } from '@core/utils'
import { calculateTimeRange, generateVisibleDates } from '../utils'
import { logger } from '@core/utils'

// 🔧 修正：テーマ関連の状態を除去
interface TimelineState {
  zoomLevel: number
  viewUnit: 'day' | 'week'
  scrollLeft: number
}

interface UseTimelineReturn {
  // 状態
  state: TimelineState
  
  // 計算された値
  dimensions: DynamicSizes
  timeRange: TimeRange
  visibleDates: Date[]
  
  // 状態更新
  setZoomLevel: (level: number) => void
  setViewUnit: (unit: 'day' | 'week') => void
  setScrollLeft: (left: number) => void
  
  // ズーム制御
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  fitToScreen: (containerWidth: number) => void
  
  // スクロール制御
  scrollToToday: () => number
  
  // DOM参照
  timelineRef: React.RefObject<HTMLDivElement>
}

export const useTimeline = (
  initialZoomLevel = ZOOM_CONFIG.default,
  initialViewUnit: 'day' | 'week' = 'week'
): UseTimelineReturn => {

  // 🔧 修正：テーマ状態を除去したシンプルな状態管理
  const [state, setState] = useState<TimelineState>({
    zoomLevel: Math.max(ZOOM_CONFIG.min, Math.min(ZOOM_CONFIG.max, initialZoomLevel)),
    viewUnit: initialViewUnit,
    scrollLeft: 0
  })

  // DOM参照
  const timelineRef = useRef<HTMLDivElement>(null)

  // 🔧 最適化：今日の日付を安定化（日付変更まで固定）
  const today = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0) // 時刻情報を削除して日付のみに
    logger.debug('Today date calculated for timeline', { 
      today: now.toISOString().split('T')[0]
    })
    return now
  }, []) // 依存配列空で完全に固定

  // 🔧 最適化：動的寸法計算のメモ化強化
  const dimensions = useMemo(() => {
    const result = calculateDynamicSizes(state.zoomLevel, state.viewUnit)
    logger.debug('Timeline dimensions calculated', {
      zoomLevel: state.zoomLevel,
      viewUnit: state.viewUnit,
      cellWidth: result.cellWidth,
      rowHeight: result.rowHeight
    })
    return result
  }, [state.zoomLevel, state.viewUnit])

  // 🔧 最適化：時間範囲計算のメモ化強化
  const timeRange = useMemo(() => {
    const result = calculateTimeRange(state.viewUnit, today)
    logger.debug('Timeline range calculated', {
      viewUnit: state.viewUnit,
      startDate: result.startDate.toISOString().split('T')[0],
      endDate: result.endDate.toISOString().split('T')[0],
      daysDiff: Math.ceil((result.endDate.getTime() - result.startDate.getTime()) / (24 * 60 * 60 * 1000))
    })
    return result
  }, [state.viewUnit, today])

  // 🔧 最適化：表示日付配列の効率化
  const visibleDates = useMemo(() => {
    const result = generateVisibleDates(timeRange.startDate, timeRange.endDate, state.viewUnit)
    logger.debug('Visible dates generated', {
      dateCount: result.length,
      viewUnit: state.viewUnit,
      firstDate: result[0]?.toISOString().split('T')[0],
      lastDate: result[result.length - 1]?.toISOString().split('T')[0]
    })
    return result
  }, [timeRange.startDate, timeRange.endDate, state.viewUnit])

  // ズームレベル設定
  const setZoomLevel = useCallback((level: number) => {
    if (typeof level !== 'number' || !isFinite(level)) {
      logger.warn('Invalid zoom level provided', { level, type: typeof level })
      return
    }
    
    const clampedLevel = Math.max(ZOOM_CONFIG.min, Math.min(ZOOM_CONFIG.max, level))
    setState(prev => ({ ...prev, zoomLevel: clampedLevel }))
  }, [])

  // 表示単位設定
  const setViewUnit = useCallback((unit: 'day' | 'week') => {
    setState(prev => ({ ...prev, viewUnit: unit }))
  }, [])

  // スクロール位置設定
  const setScrollLeft = useCallback((left: number) => {
    if (typeof left !== 'number' || !isFinite(left)) {
      logger.warn('Invalid scroll position provided', { left, type: typeof left })
      return
    }
    
    setState(prev => ({ ...prev, scrollLeft: Math.max(0, left) }))
  }, [])

  // ズームイン
  const zoomIn = useCallback(() => {
    setZoomLevel(state.zoomLevel + ZOOM_CONFIG.step)
  }, [state.zoomLevel, setZoomLevel])

  // ズームアウト
  const zoomOut = useCallback(() => {
    setZoomLevel(state.zoomLevel - ZOOM_CONFIG.step)
  }, [state.zoomLevel, setZoomLevel])

  // ズームリセット
  const resetZoom = useCallback(() => {
    setZoomLevel(ZOOM_CONFIG.default)
  }, [setZoomLevel])

  // 画面にフィット
  const fitToScreen = useCallback((containerWidth: number) => {
    if (typeof containerWidth !== 'number' || !isFinite(containerWidth) || containerWidth <= 0) {
      logger.warn('Invalid container width for fit to screen', { containerWidth })
      return
    }
    
    const totalDates = visibleDates?.length || 0
    if (totalDates === 0) {
      logger.warn('No visible dates available for fit to screen')
      return
    }
    
    const requiredCellWidth = state.viewUnit === 'week' 
      ? containerWidth / (totalDates * 7) 
      : containerWidth / totalDates
    
    const baseWidth = state.viewUnit === 'week' ? 20 : 30
    const fitZoom = Math.round((requiredCellWidth / baseWidth) * 100)
    const clampedZoom = Math.max(ZOOM_CONFIG.min, Math.min(ZOOM_CONFIG.max, fitZoom))
    
    logger.info('Fitting timeline to screen', {
      containerWidth,
      totalDates,
      requiredCellWidth,
      fitZoom: clampedZoom
    })
    
    setZoomLevel(clampedZoom)
  }, [visibleDates.length, state.viewUnit, setZoomLevel])

  // 今日にスクロール
  const scrollToToday = useCallback((): number => {
    if (!timelineRef.current) {
      logger.warn('Timeline ref not available for scroll to today')
      return 0
    }

    try {
      const todayPosition = getDatePosition(
        today, 
        timeRange.startDate, 
        dimensions.cellWidth, 
        state.viewUnit
      )
      
      const containerWidth = timelineRef.current.clientWidth
      const scrollPosition = Math.max(0, todayPosition - containerWidth / 2)
      
      logger.info('Scrolling to today', {
        today: today.toISOString().split('T')[0],
        todayPosition,
        containerWidth,
        scrollPosition,
        viewUnit: state.viewUnit,
        cellWidth: dimensions.cellWidth
      })
      
      timelineRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      })
      
      setScrollLeft(scrollPosition)
      return scrollPosition
      
    } catch (error) {
      logger.error('Scroll to today failed', { 
        error, 
        today, 
        timeRange: {
          start: timeRange.startDate.toISOString().split('T')[0],
          end: timeRange.endDate.toISOString().split('T')[0]
        }
      })
      return 0
    }
  }, [today, timeRange.startDate, dimensions.cellWidth, state.viewUnit, setScrollLeft])

  return {
    state,
    dimensions,
    timeRange,
    visibleDates,
    setZoomLevel,
    setViewUnit,
    setScrollLeft,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    scrollToToday,
    timelineRef
  }
}