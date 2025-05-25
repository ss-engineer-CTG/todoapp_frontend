"use client"

import { useState, useMemo, useCallback } from "react"
import type { DynamicSizes } from "@/types/timeline"

const ZOOM_CONFIG = {
  min: 10,
  max: 200,
  default: 100,
  step: 10
}

const BASE_SIZES = {
  cellWidth: {
    day: 30,
    week: 20
  },
  rowHeight: {
    project: 32,
    task: 48,
    subtask: 40
  },
  fontSize: {
    base: 14,
    small: 12,
    large: 16
  }
}

export const useTimelineZoom = (timelineRef: HTMLDivElement | null, viewUnit: 'day' | 'week') => {
  const [zoomLevel, setZoomLevel] = useState(ZOOM_CONFIG.default)

  // 文字サイズ計算
  const calculateFontSize = useCallback((zoom: number) => {
    if (zoom <= 30) return { base: 8, small: 7, large: 9, week: 8 }
    if (zoom <= 50) return { base: 10, small: 9, large: 11, week: 10 }
    if (zoom <= 80) return { base: 12, small: 11, large: 13, week: 12 }
    if (zoom <= 120) return { base: 14, small: 12, large: 16, week: 13 }
    if (zoom <= 150) return { base: 16, small: 14, large: 18, week: 15 }
    return { base: 18, small: 16, large: 20, week: 17 }
  }, [])

  // 動的サイズ計算
  const dynamicSizes: DynamicSizes = useMemo(() => {
    const zoomRatio = zoomLevel / 100

    return {
      cellWidth: Math.round(BASE_SIZES.cellWidth[viewUnit] * zoomRatio),
      rowHeight: {
        project: Math.round(BASE_SIZES.rowHeight.project * zoomRatio),
        task: Math.round(BASE_SIZES.rowHeight.task * zoomRatio),
        subtask: Math.round(BASE_SIZES.rowHeight.subtask * zoomRatio)
      },
      fontSize: calculateFontSize(zoomLevel),
      taskBarHeight: Math.round(32 * zoomRatio),
      zoomRatio
    }
  }, [zoomLevel, viewUnit, calculateFontSize])

  // ズーム操作
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

  // 画面フィット機能
  const fitToScreen = useCallback((visibleDates: Date[]) => {
    if (timelineRef && visibleDates.length > 0) {
      const containerWidth = timelineRef.clientWidth
      const totalDates = visibleDates.length
      const requiredCellWidth = viewUnit === 'week' 
        ? containerWidth / (totalDates * 7) 
        : containerWidth / totalDates
      
      const baseCellWidth = BASE_SIZES.cellWidth[viewUnit]
      const fitZoom = Math.round((requiredCellWidth / baseCellWidth) * 100)
      handleZoom(Math.max(ZOOM_CONFIG.min, Math.min(ZOOM_CONFIG.max, fitZoom)))
    }
  }, [timelineRef, viewUnit, handleZoom])

  return {
    zoomLevel,
    dynamicSizes,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    handleZoom
  }
}