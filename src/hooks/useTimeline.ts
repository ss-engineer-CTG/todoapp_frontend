import { useState, useMemo, useCallback, useRef } from 'react'
import { getTimeRangeByUnit, calculateDynamicSizes } from '@/utils/timelineUtils'

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
  const timelineRef = useRef<HTMLDivElement | null>(null)

  const dateRange = useMemo(() => {
    return getTimeRangeByUnit(viewUnit, zoomLevel)
  }, [viewUnit, zoomLevel])

  const dynamicSizes = useMemo(() => {
    return calculateDynamicSizes(zoomLevel, viewUnit)
  }, [zoomLevel, viewUnit])

  const visibleDates = useMemo(() => {
    if (viewUnit === 'week') {
      const weeks = []
      const currentDate = new Date(dateRange.startDate)
      
      while (currentDate <= dateRange.endDate) {
        weeks.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 7)
      }
      return weeks
    } else {
      const dates = []
      const currentDate = new Date(dateRange.startDate)
      while (currentDate <= dateRange.endDate) {
        dates.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
      }
      return dates
    }
  }, [dateRange.startDate, dateRange.endDate, viewUnit])

  const handleZoom = useCallback((newLevel: number) => {
    const clampedLevel = Math.max(ZOOM_CONFIG.min, Math.min(ZOOM_CONFIG.max, newLevel))
    setZoomLevel(clampedLevel)
  }, [])

  const zoomIn = useCallback(() => {
    handleZoom(zoomLevel + ZOOM_CONFIG.step)
  }, [zoomLevel, handleZoom])

  const zoomOut = useCallback(() => {
    handleZoom(zoomLevel - ZOOM_CONFIG.step)
  }, [zoomLevel, handleZoom])

  const resetZoom = useCallback(() => {
    handleZoom(ZOOM_CONFIG.default)
  }, [handleZoom])

  const fitToScreen = useCallback(() => {
    if (timelineRef.current) {
      const containerWidth = timelineRef.current.clientWidth
      const totalDates = visibleDates.length
      const requiredCellWidth = viewUnit === 'week' 
        ? containerWidth / (totalDates * 7) 
        : containerWidth / totalDates
      
      const baseCellWidth = viewUnit === 'week' ? 20 : 30
      const fitZoom = Math.round((requiredCellWidth / baseCellWidth) * 100)
      handleZoom(Math.max(ZOOM_CONFIG.min, Math.min(ZOOM_CONFIG.max, fitZoom)))
    }
  }, [visibleDates.length, viewUnit, handleZoom])

  const setTimelineRef = useCallback((ref: HTMLDivElement | null) => {
    timelineRef.current = ref
  }, [])

  return {
    viewUnit,
    setViewUnit,
    zoomLevel,
    scrollLeft,
    setScrollLeft,
    dateRange,
    dynamicSizes,
    visibleDates,
    timelineRef: timelineRef.current,
    setTimelineRef,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    handleZoom,
    ZOOM_CONFIG,
  }
}