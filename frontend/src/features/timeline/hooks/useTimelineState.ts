// システムプロンプト準拠：タイムライン状態管理フック
// DRY原則：状態管理ロジックの一元化、KISS原則：シンプルな状態構造

import { useState, useCallback, useMemo } from 'react'
import { TIMELINE_CONFIG, getDisplayLevel, calculateCellWidth } from '@core/config/timeline'
import { calculateTimelineDimensions, clampZoomLevel } from '@core/utils/layout'

// タイムライン状態の型定義
export interface TimelineState {
  zoomLevel: number
  viewUnit: 'day' | 'week'
  scrollLeft: number
  scrollTop: number
  theme: 'light' | 'dark'
  isZooming: boolean
  isScrolling: boolean
}

// 時間範囲の型定義
export interface TimeRange {
  startDate: Date
  endDate: Date
  label: string
}

// フックの戻り値型
export interface UseTimelineStateReturn {
  // 状態
  state: TimelineState
  
  // 計算された値
  dimensions: ReturnType<typeof calculateTimelineDimensions>
  timeRange: TimeRange
  visibleDates: Date[]
  displayLevel: ReturnType<typeof getDisplayLevel>
  
  // 状態更新関数
  setZoomLevel: (level: number) => void
  setViewUnit: (unit: 'day' | 'week') => void
  setScrollPosition: (left: number, top?: number) => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  
  // ズーム制御
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  fitToScreen: (containerWidth: number) => void
  
  // スクロール制御
  scrollToDate: (date: Date) => number
  scrollToToday: () => number
  
  // 状態リセット
  resetState: () => void
}

/**
 * タイムライン状態管理フック
 * システムプロンプト準拠：状態管理の一元化と最適化
 */
export const useTimelineState = (
  initialZoomLevel = TIMELINE_CONFIG.ZOOM.DEFAULT,
  initialViewUnit: 'day' | 'week' = TIMELINE_CONFIG.DISPLAY.DEFAULT_UNIT,
  initialTheme: 'light' | 'dark' = 'light'
): UseTimelineStateReturn => {

  // 基本状態
  const [state, setState] = useState<TimelineState>({
    zoomLevel: clampZoomLevel(initialZoomLevel),
    viewUnit: initialViewUnit,
    scrollLeft: 0,
    scrollTop: 0,
    theme: initialTheme,
    isZooming: false,
    isScrolling: false
  })

  // 動的寸法計算
  const dimensions = useMemo(() => 
    calculateTimelineDimensions(state.zoomLevel, state.viewUnit),
    [state.zoomLevel, state.viewUnit]
  )

  // 表示レベル計算
  const displayLevel = useMemo(() => 
    getDisplayLevel(state.zoomLevel),
    [state.zoomLevel]
  )

  // 時間範囲計算
  const timeRange = useMemo((): TimeRange => {
    const today = new Date()
    const config = TIMELINE_CONFIG.DISPLAY
    const totalDays = config.DATE_RANGE_DAYS
    const beforeRatio = 0.3 // 30%を過去、70%を未来
    
    const beforeDays = Math.floor(totalDays * beforeRatio)
    const afterDays = totalDays - beforeDays
    
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - beforeDays)
    
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + afterDays)
    
    return {
      startDate,
      endDate,
      label: `${state.viewUnit === 'day' ? '日' : '週'}表示 (${totalDays}日間)`
    }
  }, [state.viewUnit])

  // 表示日付配列生成
  const visibleDates = useMemo((): Date[] => {
    const dates: Date[] = []
    const currentDate = new Date(timeRange.startDate)
    
    if (state.viewUnit === 'week') {
      // 週表示：月曜日基準で週の開始日を生成
      while (currentDate.getDay() !== 1 && currentDate < timeRange.endDate) {
        currentDate.setDate(currentDate.getDate() - 1)
      }
      
      while (currentDate <= timeRange.endDate) {
        dates.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 7)
      }
    } else {
      // 日表示：毎日を生成
      while (currentDate <= timeRange.endDate) {
        dates.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }
    
    return dates
  }, [timeRange.startDate, timeRange.endDate, state.viewUnit])

  // ズームレベル設定
  const setZoomLevel = useCallback((level: number) => {
    const clampedLevel = clampZoomLevel(level)
    setState(prev => ({
      ...prev,
      zoomLevel: clampedLevel,
      isZooming: true
    }))
    
    // ズーム状態をリセット
    setTimeout(() => {
      setState(prev => ({ ...prev, isZooming: false }))
    }, 300)
  }, [])

  // 表示単位設定
  const setViewUnit = useCallback((unit: 'day' | 'week') => {
    setState(prev => ({ ...prev, viewUnit: unit }))
  }, [])

  // スクロール位置設定
  const setScrollPosition = useCallback((left: number, top = 0) => {
    setState(prev => ({
      ...prev,
      scrollLeft: Math.max(0, left),
      scrollTop: Math.max(0, top),
      isScrolling: true
    }))
    
    // スクロール状態をリセット
    setTimeout(() => {
      setState(prev => ({ ...prev, isScrolling: false }))
    }, 100)
  }, [])

  // テーマ設定
  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setState(prev => ({ ...prev, theme }))
  }, [])

  // テーマ切り替え
  const toggleTheme = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      theme: prev.theme === 'light' ? 'dark' : 'light' 
    }))
  }, [])

  // ズームイン
  const zoomIn = useCallback(() => {
    setZoomLevel(state.zoomLevel + TIMELINE_CONFIG.ZOOM.STEP)
  }, [state.zoomLevel, setZoomLevel])

  // ズームアウト
  const zoomOut = useCallback(() => {
    setZoomLevel(state.zoomLevel - TIMELINE_CONFIG.ZOOM.STEP)
  }, [state.zoomLevel, setZoomLevel])

  // ズームリセット
  const resetZoom = useCallback(() => {
    setZoomLevel(TIMELINE_CONFIG.ZOOM.DEFAULT)
  }, [setZoomLevel])

  // 画面にフィット
  const fitToScreen = useCallback((containerWidth: number) => {
    if (containerWidth <= 0) return
    
    const totalDates = visibleDates.length
    const requiredCellWidth = state.viewUnit === 'week' 
      ? containerWidth / (totalDates * 7) 
      : containerWidth / totalDates
    
    const baseWidth = state.viewUnit === 'week' ? 20 : 30
    const fitZoom = Math.round((requiredCellWidth / baseWidth) * 100)
    setZoomLevel(fitZoom)
  }, [visibleDates.length, state.viewUnit, setZoomLevel])

  // 日付へのスクロール位置計算
  const calculateDateScrollPosition = useCallback((targetDate: Date): number => {
    if (state.viewUnit === 'week') {
      // 週の開始日（月曜日）を取得
      const startOfWeek = new Date(targetDate)
      while (startOfWeek.getDay() !== 1) {
        startOfWeek.setDate(startOfWeek.getDate() - 1)
      }
      
      const weeksDiff = Math.round(
        (startOfWeek.getTime() - timeRange.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      )
      const daysInWeek = (targetDate.getDay() + 6) % 7
      
      return weeksDiff * dimensions.cellWidth * 7 + daysInWeek * dimensions.cellWidth
    } else {
      const diffDays = Math.round(
        (targetDate.getTime() - timeRange.startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      return diffDays * dimensions.cellWidth
    }
  }, [state.viewUnit, timeRange.startDate, dimensions.cellWidth])

  // 指定日付にスクロール
  const scrollToDate = useCallback((date: Date): number => {
    const position = calculateDateScrollPosition(date)
    setScrollPosition(position)
    return position
  }, [calculateDateScrollPosition, setScrollPosition])

  // 今日にスクロール
  const scrollToToday = useCallback((): number => {
    const today = new Date()
    return scrollToDate(today)
  }, [scrollToDate])

  // 状態リセット
  const resetState = useCallback(() => {
    setState({
      zoomLevel: clampZoomLevel(initialZoomLevel),
      viewUnit: initialViewUnit,
      scrollLeft: 0,
      scrollTop: 0,
      theme: initialTheme,
      isZooming: false,
      isScrolling: false
    })
  }, [initialZoomLevel, initialViewUnit, initialTheme])

  return {
    state,
    dimensions,
    timeRange,
    visibleDates,
    displayLevel,
    setZoomLevel,
    setViewUnit,
    setScrollPosition,
    setTheme,
    toggleTheme,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    scrollToDate,
    scrollToToday,
    resetState
  }
}

// 便利なフック：ズーム制御のみ
export const useTimelineZoom = (
  initialLevel = TIMELINE_CONFIG.ZOOM.DEFAULT
) => {
  const [zoomLevel, setZoomLevel] = useState(clampZoomLevel(initialLevel))
  const [isZooming, setIsZooming] = useState(false)

  const handleZoomChange = useCallback((level: number) => {
    const clampedLevel = clampZoomLevel(level)
    setZoomLevel(clampedLevel)
    setIsZooming(true)
    
    setTimeout(() => setIsZooming(false), 300)
  }, [])

  const zoomIn = useCallback(() => {
    handleZoomChange(zoomLevel + TIMELINE_CONFIG.ZOOM.STEP)
  }, [zoomLevel, handleZoomChange])

  const zoomOut = useCallback(() => {
    handleZoomChange(zoomLevel - TIMELINE_CONFIG.ZOOM.STEP)
  }, [zoomLevel, handleZoomChange])

  const resetZoom = useCallback(() => {
    handleZoomChange(TIMELINE_CONFIG.ZOOM.DEFAULT)
  }, [handleZoomChange])

  return {
    zoomLevel,
    isZooming,
    setZoomLevel: handleZoomChange,
    zoomIn,
    zoomOut,
    resetZoom,
    dimensions: calculateTimelineDimensions(zoomLevel, 'week'),
    displayLevel: getDisplayLevel(zoomLevel)
  }
}

// 便利なフック：スクロール制御のみ
export const useTimelineScroll = () => {
  const [scrollPosition, setScrollPosition] = useState({ left: 0, top: 0 })
  const [isScrolling, setIsScrolling] = useState(false)

  const updateScrollPosition = useCallback((left: number, top = 0) => {
    setScrollPosition({ left: Math.max(0, left), top: Math.max(0, top) })
    setIsScrolling(true)
    
    setTimeout(() => setIsScrolling(false), 100)
  }, [])

  return {
    scrollLeft: scrollPosition.left,
    scrollTop: scrollPosition.top,
    isScrolling,
    setScrollPosition: updateScrollPosition
  }
}
