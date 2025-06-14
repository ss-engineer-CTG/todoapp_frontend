// システムプロンプト準拠：タイムライン統合フック（軽量化版）
// 修正内容：MINIMAL_SAMPLE_PROJECTS完全削除、サンプルデータフォールバック削除

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Task, Project } from '@core/types'
import { ZOOM_CONFIG } from '../utils/timeline'
import { TimelineState, TimelineProject, TimelineTask, DynamicSizes, TimeRange } from '../types'
import { 
  calculateDynamicSizes, 
  calculateTimeRange, 
  generateVisibleDates,
  getDisplayLevel 
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

  // 修正：プロジェクトデータの初期化を空配列に変更（サンプルデータ削除）
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

  // 修正：プロジェクト設定（サンプルデータフォールバック削除）
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

  // 今日にスクロール
  const scrollToToday = useCallback((): number => {
    if (timelineRef.current && visibleDates.length > 0) {
      try {
        // 今日の位置を計算
        const todayIndex = visibleDates.findIndex(date => 
          date.toDateString() === today.toDateString()
        )
        
        if (todayIndex >= 0) {
          const todayPosition = state.viewUnit === 'week'
            ? todayIndex * dimensions.cellWidth * 7
            : todayIndex * dimensions.cellWidth
          
          const containerWidth = timelineRef.current.clientWidth
          const scrollPosition = Math.max(0, todayPosition - containerWidth / 2)
          
          logger.info('Scrolling to today', {
            todayIndex,
            todayPosition,
            scrollPosition
          })
          
          timelineRef.current.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
          })
          
          return scrollPosition
        } else {
          logger.warn('Today not found in visible dates range')
          return 0
        }
      } catch (error) {
        logger.error('Scroll to today failed', { error })
        return 0
      }
    }
    return 0
  }, [visibleDates, today, state.viewUnit, dimensions.cellWidth])

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