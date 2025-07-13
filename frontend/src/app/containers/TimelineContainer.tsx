// システムプロンプト準拠：タイムライン関連ロジック統合（リファクタリング：責任分離）
// リファクタリング対象：AppContainer.tsx からタイムライン関連処理を抽出

import React, { useCallback } from 'react'
import { AppViewMode, Task, Project } from '@core/types'
import { logger } from '@core/utils'

export interface TimelineContainerProps {
  viewMode: AppViewMode
  activeArea: string
  projects: Project[]
  allTasksWithDrafts: Task[]
  selectedProjectId: string
  timelineScrollToToday: (() => void) | null
  onViewModeChange: (mode: AppViewMode) => Promise<void>
  onToggleProject: (projectId: string) => Promise<void>
  onToggleTask: (taskId: string) => Promise<void>
  onExpandAll: () => Promise<void>
  onCollapseAll: () => Promise<void>
  onTaskUpdateViaDrag: (taskId: string, updates: Partial<Task>) => Promise<void>
  refreshTasks: () => Promise<void>
  setTimelineScrollToToday: (fn: (() => void) | null) => void
}

export interface TimelineContainerReturn {
  // タイムライン制御ハンドラー
  handleTimelineScrollToToday: () => void
  handleViewModeChange: (mode: AppViewMode) => Promise<void>
  
  // タイムライン操作ハンドラー
  handleToggleProject: (projectId: string) => Promise<void>
  handleToggleTask: (taskId: string) => Promise<void>
  handleExpandAll: () => Promise<void>
  handleCollapseAll: () => Promise<void>
  handleTaskUpdateViaDrag: (taskId: string, updates: Partial<Task>) => Promise<void>
  
  // タイムライン状態
  timelineProps: {
    projects: Project[]
    tasks: Task[]
    onViewModeChange: (mode: AppViewMode) => Promise<void>
    onScrollToToday: (fn: (() => void) | null) => void
    onToggleProject: (projectId: string) => Promise<void>
    onToggleTask: (taskId: string) => Promise<void>
    onExpandAll: () => Promise<void>
    onCollapseAll: () => Promise<void>
    onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>
  }
}

export const useTimelineContainer = (props: TimelineContainerProps): TimelineContainerReturn => {
  const {
    viewMode,
    activeArea,
    projects,
    allTasksWithDrafts,
    selectedProjectId,
    timelineScrollToToday,
    onViewModeChange,
    onToggleProject,
    onToggleTask,
    onExpandAll,
    onCollapseAll,
    onTaskUpdateViaDrag,
    refreshTasks,
    setTimelineScrollToToday
  } = props

  // ===== タイムラインスクロール制御 =====
  const handleTimelineScrollToToday = useCallback(() => {
    logger.info('Timeline scroll to today requested', { 
      activeArea,
      hasScrollFunction: !!timelineScrollToToday 
    })
    
    if (timelineScrollToToday) {
      timelineScrollToToday()
    } else {
      logger.warn('Timeline scroll function not available')
    }
  }, [timelineScrollToToday, activeArea])

  // ===== ビューモード制御（タイムライン専用） =====
  const handleViewModeChange = useCallback(async (newMode: AppViewMode) => {
    logger.info('Timeline view mode change requested', { 
      from: viewMode, 
      to: newMode,
      source: 'timeline_container'
    })
    
    await onViewModeChange(newMode)
  }, [viewMode, onViewModeChange])

  // ===== プロジェクト操作（タイムライン経由） =====
  const handleToggleProject = useCallback(async (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    logger.info('Timeline project toggle requested', { 
      projectId, 
      currentState: project?.collapsed,
      source: 'timeline_container'
    })
    
    await onToggleProject(projectId)
  }, [projects, onToggleProject])

  // ===== タスク操作（タイムライン経由） =====
  const handleToggleTask = useCallback(async (taskId: string) => {
    const task = allTasksWithDrafts.find(t => t.id === taskId)
    logger.info('Timeline task toggle requested', { 
      taskId, 
      currentState: task?.collapsed,
      source: 'timeline_container'
    })
    
    await onToggleTask(taskId)
  }, [allTasksWithDrafts, onToggleTask])

  // ===== 一括操作（タイムライン経由） =====
  const handleExpandAll = useCallback(async () => {
    logger.info('Timeline expand all requested', { 
      projectCount: projects.length,
      taskCount: allTasksWithDrafts.length,
      source: 'timeline_container'
    })
    
    await onExpandAll()
  }, [projects.length, allTasksWithDrafts.length, onExpandAll])

  const handleCollapseAll = useCallback(async () => {
    logger.info('Timeline collapse all requested', { 
      projectCount: projects.length,
      taskCount: allTasksWithDrafts.length,
      source: 'timeline_container'
    })
    
    await onCollapseAll()
  }, [projects.length, allTasksWithDrafts.length, onCollapseAll])

  // ===== タスクドラッグ更新（タイムライン専用） =====
  const handleTaskUpdateViaDrag = useCallback(async (taskId: string, updates: Partial<Task>) => {
    logger.info('Timeline drag update requested', { 
      taskId, 
      updates: {
        startDate: updates.startDate?.toISOString().split('T')[0],
        dueDate: updates.dueDate?.toISOString().split('T')[0]
      },
      source: 'timeline_container'
    })
    
    await onTaskUpdateViaDrag(taskId, updates)
  }, [onTaskUpdateViaDrag])

  // ===== キーボードショートカット（タイムライン専用） =====
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Homeキーでタイムライン今日スクロール（タイムラインアクティブ時のみ）
      if (e.key === 'Home' && activeArea === 'timeline') {
        e.preventDefault()
        logger.info('Home key pressed - triggering timeline scroll to today')
        handleTimelineScrollToToday()
      }
    }

    if (viewMode === 'timeline') {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [viewMode, activeArea, handleTimelineScrollToToday])

  // ===== TimelineView用props構成 =====
  const timelineProps = {
    projects,
    tasks: allTasksWithDrafts,
    selectedProjectId,
    refreshTasks,
    onViewModeChange: handleViewModeChange,
    onScrollToToday: setTimelineScrollToToday,
    onToggleProject: handleToggleProject,
    onToggleTask: handleToggleTask,
    onExpandAll: handleExpandAll,
    onCollapseAll: handleCollapseAll,
    onTaskUpdate: handleTaskUpdateViaDrag
  }

  return {
    // タイムライン制御ハンドラー
    handleTimelineScrollToToday,
    handleViewModeChange,
    
    // タイムライン操作ハンドラー
    handleToggleProject,
    handleToggleTask,
    handleExpandAll,
    handleCollapseAll,
    handleTaskUpdateViaDrag,
    
    // タイムライン状態
    timelineProps
  }
}