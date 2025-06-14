// システムプロンプト準拠：タイムライン統合フック（TaskRelationMap対応版）
// 🔧 修正内容：ネスト構造管理削除、Tasklist準拠の平坦配列 + TaskRelationMap方式に統一
// DRY原則：Tasklistの階層管理ロジック再利用

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { ZOOM_CONFIG } from '../utils/timeline'
import { TimelineState, TimelineProject, TimelineTask, DynamicSizes, TimeRange, TimelineData } from '../types'
import { TaskRelationMap } from '@tasklist/types'
import { buildTaskRelationMap } from '@tasklist/utils/task'
import { 
  calculateDynamicSizes, 
  calculateTimeRange, 
  generateVisibleDates,
  getDisplayLevel,
  getDatePosition
} from '../utils/timeline'
import { 
  filterTimelineTasks, 
  sortTimelineTasksHierarchically,
  calculateHierarchyDisplayInfo,
  isTaskVisible
} from '../utils/hierarchy'
import { logger } from '@core/utils/core'

interface UseTimelineReturn {
  // 状態
  state: TimelineState
  timelineData: TimelineData
  
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
  
  // 🔧 修正：平坦構造データ操作
  setTimelineData: (data: Partial<TimelineData>) => void
  updateTimelineProjects: (projects: TimelineProject[]) => void
  updateTimelineTasks: (tasks: TimelineTask[]) => void
  
  // タスク操作（TaskRelationMap準拠）
  toggleTask: (taskId: string) => void
  expandAllTasks: () => void
  collapseAllTasks: () => void
  
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

  // 🔧 修正：Timeline統合データ（平坦構造）
  const [timelineData, setTimelineDataState] = useState<TimelineData>({
    projects: [],
    allTasks: [],
    taskRelationMap: { childrenMap: {}, parentMap: {} },
    filteredTasks: []
  })

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

  // 🔧 修正：TaskRelationMapの自動再計算
  const taskRelationMap = useMemo(() => {
    if (timelineData.allTasks.length === 0) {
      return { childrenMap: {}, parentMap: {} }
    }
    
    try {
      const relationMap = buildTaskRelationMap(timelineData.allTasks)
      logger.info('TaskRelationMap rebuilt for timeline', {
        taskCount: timelineData.allTasks.length,
        parentCount: Object.keys(relationMap.parentMap).length,
        childrenCount: Object.keys(relationMap.childrenMap).length
      })
      return relationMap
    } catch (error) {
      logger.error('TaskRelationMap build failed', { error })
      return { childrenMap: {}, parentMap: {} }
    }
  }, [timelineData.allTasks])

  // 🔧 修正：フィルタ済みタスクの自動更新
  useEffect(() => {
    if (timelineData.projects.length === 0 || timelineData.allTasks.length === 0) {
      setTimelineDataState(prev => ({ ...prev, filteredTasks: [] }))
      return
    }

    try {
      // 全プロジェクトのタスクをフィルタリング・ソート
      let allFilteredTasks: TimelineTask[] = []
      
      timelineData.projects.forEach(project => {
        const projectTasks = filterTimelineTasks(
          timelineData.allTasks, 
          project, 
          true, // showCompleted
          taskRelationMap
        )
        
        const sortedTasks = sortTimelineTasksHierarchically(projectTasks, taskRelationMap)
        allFilteredTasks = [...allFilteredTasks, ...sortedTasks]
      })

      setTimelineDataState(prev => ({
        ...prev,
        taskRelationMap,
        filteredTasks: allFilteredTasks
      }))

      logger.info('Timeline filtered tasks updated', {
        projectCount: timelineData.projects.length,
        totalTasks: timelineData.allTasks.length,
        filteredTasks: allFilteredTasks.length
      })

    } catch (error) {
      logger.error('Timeline task filtering failed', { error })
      setTimelineDataState(prev => ({ ...prev, filteredTasks: [] }))
    }
  }, [timelineData.projects, timelineData.allTasks, taskRelationMap])

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

  // 🔧 修正：Timeline統合データ更新
  const setTimelineData = useCallback((data: Partial<TimelineData>) => {
    setTimelineDataState(prev => {
      const newData = { ...prev, ...data }
      
      logger.info('Timeline data updated', {
        projects: newData.projects.length,
        allTasks: newData.allTasks.length,
        updatedFields: Object.keys(data)
      })
      
      return newData
    })
  }, [])

  // プロジェクト更新
  const updateTimelineProjects = useCallback((projects: TimelineProject[]) => {
    setTimelineDataState(prev => ({ ...prev, projects }))
    logger.info('Timeline projects updated', { count: projects.length })
  }, [])

  // タスク更新
  const updateTimelineTasks = useCallback((tasks: TimelineTask[]) => {
    setTimelineDataState(prev => ({ ...prev, allTasks: tasks }))
    logger.info('Timeline tasks updated', { count: tasks.length })
  }, [])

  // 🔧 修正：タスク展開/折り畳み（TaskRelationMap準拠）
  const toggleTask = useCallback((taskId: string) => {
    setTimelineDataState(prev => ({
      ...prev,
      allTasks: prev.allTasks.map(task => 
        task.id === taskId 
          ? { ...task, collapsed: !task.collapsed }
          : task
      )
    }))
    
    logger.info('Task toggle completed', { taskId })
  }, [])

  // 全タスク展開
  const expandAllTasks = useCallback(() => {
    setTimelineDataState(prev => ({
      ...prev,
      allTasks: prev.allTasks.map(task => ({ ...task, collapsed: false }))
    }))
    
    logger.info('All tasks expanded')
  }, [])

  // 全タスク折り畳み
  const collapseAllTasks = useCallback(() => {
    setTimelineDataState(prev => ({
      ...prev,
      allTasks: prev.allTasks.map(task => ({ ...task, collapsed: true }))
    }))
    
    logger.info('All tasks collapsed')
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

  // 🔧 修正：今日にスクロール（精度向上・DRY原則適用）
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
    timelineData,
    dimensions,
    timeRange,
    visibleDates,
    displayLevel,
    setZoomLevel,
    setViewUnit,
    setScrollLeft,
    setTheme,
    toggleTheme,
    setTimelineData,
    updateTimelineProjects,
    updateTimelineTasks,
    toggleTask,
    expandAllTasks,
    collapseAllTasks,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    scrollToToday,
    timelineRef
  }
}