// システムプロンプト準拠：タイムライン統合フック（軽量化版）
// 修正内容：今日スクロール機能の精度向上、getDatePosition関数活用

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Task, Project } from '@core/types'
import { ZOOM_CONFIG } from '../utils/timeline'
import { TimelineState, TimelineProject, TimelineTask, DynamicSizes, TimeRange } from '../types'
import { 
  calculateDynamicSizes, 
  calculateTimeRange, 
  generateVisibleDates,
  getDisplayLevel,
  getDatePosition // 🎯 修正：正確な位置計算のため追加インポート
} from '../utils/timeline'
import { logger } from '@core/utils/core'

interface UseTimelineReturn {
  // 状態
  state: TimelineState
  projects: TimelineProject[]
  
  // 計算された値
  dimensions: DynamicSizes
  timeRange: TimeRange
  visibleDates: Date[]
  displayLevel: ReturnType<typeof getDisplayLevel>
  
  // 状態更新
  setZoomLevel: (level: number) => void
  setViewUnit: (unit: 'day' | 'week') => void
  setScrollLeft: (left: number) => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  
  // プロジェクト操作
  setProjects: (projects: TimelineProject[]) => void
  toggleProject: (projectId: string) => void
  expandAllProjects: () => void
  collapseAllProjects: () => void
  
  // タスク操作
  toggleTask: (projectId: string, taskId: string) => void
  
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
  initialViewUnit: 'day' | 'week' = 'week',
  initialTheme: 'light' | 'dark' = 'light'
): UseTimelineReturn => {

  // 基本状態
  const [state, setState] = useState<TimelineState>({
    zoomLevel: Math.max(ZOOM_CONFIG.min, Math.min(ZOOM_CONFIG.max, initialZoomLevel)),
    viewUnit: initialViewUnit,
    scrollLeft: 0,
    theme: initialTheme
  })

  const [projects, setProjectsState] = useState<TimelineProject[]>([])

  // DOM参照
  const timelineRef = useRef<HTMLDivElement>(null)

  // 今日の日付
  const today = useMemo(() => new Date(), [])

  // 動的寸法計算
  const dimensions = useMemo(() => 
    calculateDynamicSizes(state.zoomLevel, state.viewUnit),
    [state.zoomLevel, state.viewUnit]
  )

  // 表示レベル計算
  const displayLevel = useMemo(() => 
    getDisplayLevel(state.zoomLevel),
    [state.zoomLevel]
  )

  // 時間範囲計算
  const timeRange = useMemo(() => 
    calculateTimeRange(state.viewUnit, today),
    [state.viewUnit, today]
  )

  // 表示日付配列
  const visibleDates = useMemo(() => 
    generateVisibleDates(timeRange.startDate, timeRange.endDate, state.viewUnit),
    [timeRange.startDate, timeRange.endDate, state.viewUnit]
  )

  // テーマ適用
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(state.theme)
  }, [state.theme])

  // ズームレベル設定
  const setZoomLevel = useCallback((level: number) => {
    const clampedLevel = Math.max(ZOOM_CONFIG.min, Math.min(ZOOM_CONFIG.max, level))
    setState(prev => ({ ...prev, zoomLevel: clampedLevel }))
  }, [])

  // 表示単位設定
  const setViewUnit = useCallback((unit: 'day' | 'week') => {
    setState(prev => ({ ...prev, viewUnit: unit }))
  }, [])

  // スクロール位置設定
  const setScrollLeft = useCallback((left: number) => {
    setState(prev => ({ ...prev, scrollLeft: Math.max(0, left) }))
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

  const setProjects = useCallback((newProjects: TimelineProject[]) => {
    logger.info('Setting timeline projects', { 
      projectCount: newProjects.length,
      projectNames: newProjects.map(p => p.name)
    })
    setProjectsState(newProjects)
  }, [])

  // プロジェクト展開/折り畳み
  const toggleProject = useCallback((projectId: string) => {
    setProjectsState(prev => prev.map(project => 
      project.id === projectId 
        ? { ...project, expanded: !project.expanded } 
        : project
    ))
  }, [])

  // 全プロジェクト展開
  const expandAllProjects = useCallback(() => {
    setProjectsState(prev => prev.map(project => ({
      ...project,
      expanded: true,
      tasks: project.tasks.map(task => ({ ...task, expanded: true }))
    })))
  }, [])

  // 全プロジェクト折り畳み
  const collapseAllProjects = useCallback(() => {
    setProjectsState(prev => prev.map(project => ({
      ...project,
      expanded: false,
      tasks: project.tasks.map(task => ({ ...task, expanded: false }))
    })))
  }, [])

  // タスク展開/折り畳み
  const toggleTask = useCallback((projectId: string, taskId: string) => {
    setProjectsState(prev => prev.map(project => 
      project.id === projectId 
        ? { 
            ...project, 
            tasks: project.tasks.map(task =>
              task.id === taskId 
                ? { ...task, expanded: !task.expanded }
                : task
            )
          }
        : project
    ))
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
    if (containerWidth <= 0) return
    
    const totalDates = visibleDates.length
    if (totalDates === 0) return
    
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

  // 🎯 修正：今日にスクロール（精度向上・DRY原則適用）
  const scrollToToday = useCallback((): number => {
    if (!timelineRef.current) {
      logger.warn('Timeline ref not available for scroll to today')
      return 0
    }

    try {
      // 🔧 修正：getDatePosition関数を使用して正確な位置計算（DRY原則）
      const todayPosition = getDatePosition(
        today, 
        timeRange.startDate, 
        dimensions.cellWidth, 
        state.viewUnit
      )
      
      const containerWidth = timelineRef.current.clientWidth
      
      // 🔧 修正：より正確な画面センター計算
      const scrollPosition = Math.max(0, todayPosition - containerWidth / 2)
      
      logger.info('Scrolling to today with improved calculation', {
        today: today.toISOString().split('T')[0],
        todayPosition,
        containerWidth,
        scrollPosition,
        viewUnit: state.viewUnit,
        cellWidth: dimensions.cellWidth,
        startDate: timeRange.startDate.toISOString().split('T')[0],
        calculationMethod: 'getDatePosition_unified'
      })
      
      // スムーズスクロール実行
      timelineRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      })
      
      // スクロール位置の状態更新
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
    projects,
    dimensions,
    timeRange,
    visibleDates,
    displayLevel,
    setZoomLevel,
    setViewUnit,
    setScrollLeft,
    setTheme,
    toggleTheme,
    setProjects,
    toggleProject,
    expandAllProjects,
    collapseAllProjects,
    toggleTask,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    scrollToToday,
    timelineRef
  }
}