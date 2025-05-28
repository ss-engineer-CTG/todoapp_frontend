import { useState, useMemo, useCallback, useRef } from 'react'
import { getTimeRangeByUnit, calculateDynamicSizes, getVisibleDates } from '@/utils/timelineUtils'

const ZOOM_CONFIG = {
  min: 10,
  max: 200,
  default: 100,
  step: 10,
}

export function useTimeline() {
  const [viewUnit, setViewUnit] = useState<'day' | 'week'>('week')
  const [zoomLevel, setZoomLevel] = useState(100)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const timelineRef = useRef<HTMLDivElement | null>(null)

  const dateRange = useMemo(() => {
    try {
      const range = getTimeRangeByUnit(viewUnit, zoomLevel)
      setError(null)
      return range
    } catch (error) {
      console.error('Error calculating date range:', error)
      setError('日付範囲の計算中にエラーが発生しました')
      
      // フォールバック値を返す
      return {
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cellWidth: 30,
        label: '日表示'
      }
    }
  }, [viewUnit, zoomLevel])

  const dynamicSizes = useMemo(() => {
    try {
      const sizes = calculateDynamicSizes(zoomLevel, viewUnit)
      return sizes
    } catch (error) {
      console.error('Error calculating dynamic sizes:', error)
      setError('表示サイズの計算中にエラーが発生しました')
      
      // フォールバック値を返す
      return {
        cellWidth: 30,
        rowHeight: {
          project: 32,
          task: 48,
          subtask: 40
        },
        fontSize: { base: 14, small: 12, large: 16, week: 13 },
        taskBarHeight: 32,
        zoomRatio: 1
      }
    }
  }, [zoomLevel, viewUnit])

  const visibleDates = useMemo(() => {
    try {
      const dates = getVisibleDates(dateRange, viewUnit)
      return dates
    } catch (error) {
      console.error('Error getting visible dates:', error)
      setError('表示日付の計算中にエラーが発生しました')
      return []
    }
  }, [dateRange, viewUnit])

  const handleZoom = useCallback((newLevel: number) => {
    try {
      if (typeof newLevel !== 'number' || isNaN(newLevel)) {
        console.warn('handleZoom: invalid zoom level provided:', newLevel)
        return false
      }

      const clampedLevel = Math.max(ZOOM_CONFIG.min, Math.min(ZOOM_CONFIG.max, newLevel))
      setZoomLevel(clampedLevel)
      setError(null)
      return true
    } catch (error) {
      console.error('Error handling zoom:', error)
      setError('ズーム処理中にエラーが発生しました')
      return false
    }
  }, [])

  const zoomIn = useCallback(() => {
    return handleZoom(zoomLevel + ZOOM_CONFIG.step)
  }, [zoomLevel, handleZoom])

  const zoomOut = useCallback(() => {
    return handleZoom(zoomLevel - ZOOM_CONFIG.step)
  }, [zoomLevel, handleZoom])

  const resetZoom = useCallback(() => {
    return handleZoom(ZOOM_CONFIG.default)
  }, [handleZoom])

  const fitToScreen = useCallback(() => {
    try {
      if (!timelineRef.current) {
        console.warn('fitToScreen: timeline ref is null')
        setError('タイムライン要素が見つかりません')
        return false
      }

      const containerWidth = timelineRef.current.clientWidth || 0
      if (containerWidth === 0) {
        console.warn('fitToScreen: container width is 0')
        return false
      }

      const totalDates = visibleDates.length
      if (totalDates === 0) {
        console.warn('fitToScreen: no visible dates')
        return false
      }

      const requiredCellWidth = viewUnit === 'week' 
        ? containerWidth / (totalDates * 7) 
        : containerWidth / totalDates
      
      const baseCellWidth = viewUnit === 'week' ? 20 : 30
      const fitZoom = Math.round((requiredCellWidth / baseCellWidth) * 100)
      const clampedFitZoom = Math.max(ZOOM_CONFIG.min, Math.min(ZOOM_CONFIG.max, fitZoom))
      
      return handleZoom(clampedFitZoom)
    } catch (error) {
      console.error('Error fitting to screen:', error)
      setError('画面フィット処理中にエラーが発生しました')
      return false
    }
  }, [visibleDates.length, viewUnit, handleZoom])

  const setTimelineRef = useCallback((ref: HTMLDivElement | null) => {
    try {
      timelineRef.current = ref
    } catch (error) {
      console.error('Error setting timeline ref:', error)
    }
  }, [])

  const handleViewUnitChange = useCallback((unit: 'day' | 'week') => {
    try {
      if (unit !== 'day' && unit !== 'week') {
        console.warn('handleViewUnitChange: invalid unit provided:', unit)
        return false
      }

      setViewUnit(unit)
      setError(null)
      return true
    } catch (error) {
      console.error('Error changing view unit:', error)
      setError('表示単位の変更中にエラーが発生しました')
      return false
    }
  }, [])

  const handleScrollLeftChange = useCallback((newScrollLeft: number) => {
    try {
      if (typeof newScrollLeft !== 'number' || isNaN(newScrollLeft)) {
        console.warn('handleScrollLeftChange: invalid scroll value:', newScrollLeft)
        return false
      }

      setScrollLeft(Math.max(0, newScrollLeft))
      return true
    } catch (error) {
      console.error('Error handling scroll change:', error)
      return false
    }
  }, [])

  const scrollToDate = useCallback((targetDate: Date) => {
    try {
      if (!timelineRef.current || !targetDate || isNaN(targetDate.getTime())) {
        console.warn('scrollToDate: invalid parameters')
        return false
      }

      // TODO: 日付位置の計算とスクロール実装
      console.log('Scroll to date:', targetDate)
      return true
    } catch (error) {
      console.error('Error scrolling to date:', error)
      setError('日付へのスクロール中にエラーが発生しました')
      return false
    }
  }, [])

  const scrollToToday = useCallback(() => {
    try {
      return scrollToDate(new Date())
    } catch (error) {
      console.error('Error scrolling to today:', error)
      setError('今日へのスクロール中にエラーが発生しました')
      return false
    }
  }, [scrollToDate])

  const getTimelineMetrics = useCallback(() => {
    try {
      if (!timelineRef.current) {
        return null
      }

      const containerWidth = timelineRef.current.clientWidth || 0
      const containerHeight = timelineRef.current.clientHeight || 0
      const scrollWidth = timelineRef.current.scrollWidth || 0
      const scrollHeight = timelineRef.current.scrollHeight || 0

      return {
        containerWidth,
        containerHeight,
        scrollWidth,
        scrollHeight,
        scrollLeft,
        visibleDateCount: visibleDates.length,
        totalWidth: viewUnit === 'week' 
          ? visibleDates.length * dateRange.cellWidth * 7
          : visibleDates.length * dateRange.cellWidth
      }
    } catch (error) {
      console.error('Error getting timeline metrics:', error)
      return null
    }
  }, [scrollLeft, visibleDates.length, dateRange.cellWidth, viewUnit])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // State
    viewUnit,
    zoomLevel,
    scrollLeft,
    dateRange,
    dynamicSizes,
    visibleDates,
    error,
    
    // Refs
    timelineRef: timelineRef.current,
    setTimelineRef,
    
    // Zoom controls
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    handleZoom,
    
    // View controls
    setViewUnit: handleViewUnitChange,
    setScrollLeft: handleScrollLeftChange,
    
    // Navigation
    scrollToDate,
    scrollToToday,
    
    // Utilities
    getTimelineMetrics,
    clearError,
    
    // Constants
    ZOOM_CONFIG,
  }
}