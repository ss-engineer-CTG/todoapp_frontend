// システムプロンプト準拠：タイムライン統合最適化コンポーネント（リファクタリング：レンダリング効率向上）
// リファクタリング対象：TimelineView + TimelineRenderer の重複機能統合

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { TimelineControls } from './TimelineControls'
import { TimelineMenuBar } from './TimelineMenuBar'
import { TimelineHeader } from './TimelineHeader'
import { TimelineGrid } from './TimelineGrid'
import { ContextMenu } from './ContextMenu'
import { DateShiftDialog, DateShiftOptions } from './DateShiftDialog'
import { TimelineViewProps } from '../types'
import { useTimeline } from '../hooks/useTimeline'
import { useRowSelection } from '../hooks/useRowSelection'
import { useTaskDrag } from '../hooks/useTaskDrag'
import { buildTaskRelationMap } from '@tasklist/utils/task'
import { useTheme } from '@core/components/ThemeProvider'
import { Task } from '@core/types'
// import { Project } from '@core/types'
import { apiService } from '@core/services/api'
import { 
  logger,
  // getDateCellClass,
  // getMonthName,
  // getWeekNumber,
  calculateDateHeaderFontSize,
  // calculateDynamicSizes,
  // getDatePosition,
  // isValidDate,
  // isWeekend
} from '@core/utils'
import { 
  // calculateTimelineTaskStatus,
  // isTaskVisibleInTimeline,
  filterTasksForAllProjects,
  sortTasksHierarchically
} from '@tasklist/utils/task'
import { /* isFirstDayOfWeek, isFirstDayOfMonth, */ buildTaskChildrenMap } from '../utils'
import { DateShiftType } from './ContextMenu'
// import { ChevronDown, ChevronRight, Factory } from 'lucide-react'

// 統合props型定義
interface OptimizedTimelineProps extends TimelineViewProps {
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>
}

export const OptimizedTimeline: React.FC<OptimizedTimelineProps> = ({
  projects,
  tasks,
  onViewModeChange,
  onScrollToToday,
  _onToggleProject,
  onToggleTask,
  onExpandAll,
  onCollapseAll,
  onTaskUpdate
}) => {
  const { resolvedTheme } = useTheme()
  
  // ===== 統合状態管理 =====
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false)
  const [isDateShiftDialogOpen, setIsDateShiftDialogOpen] = useState(false)
  const [currentShiftType, setCurrentShiftType] = useState<DateShiftType>('both')
  
  // ===== 核心フック統合 =====
  const {
    state,
    dimensions,
    timeRange,
    visibleDates,
    setZoomLevel,
    setViewUnit,
    _setScrollLeft,
    fitToScreen,
    scrollToToday,
    timelineRef
  } = useTimeline(100, 'day')

  // 行選択機能
  const rowSelection = useRowSelection()
  
  // タスクドラッグ機能
  const taskDrag = useTaskDrag({
    cellWidth: dimensions.cellWidth,
    viewUnit: state.viewUnit,
    onTaskUpdate: onTaskUpdate || (async () => {
      logger.warn('Task update handler not provided')
    })
  })

  const today = new Date()
  
  // ===== メモ化された計算値（最適化） =====
  const dynamicFontSizes = useMemo(() => 
    calculateDateHeaderFontSize(dimensions.cellWidth, state.viewUnit, state.zoomLevel),
    [dimensions.cellWidth, state.viewUnit, state.zoomLevel]
  )
  
  const taskRelationMap = useMemo(() => {
    logger.info('Building optimized task relation map', {
      taskCount: tasks.length,
      projectCount: projects.length
    })
    return buildTaskRelationMap(tasks)
  }, [tasks, projects.length])

  const filteredAndSortedTasks = useMemo(() => {
    const filtered = filterTasksForAllProjects(tasks)
    const sorted = sortTasksHierarchically(filtered, taskRelationMap)
    logger.info('Tasks filtered and sorted', { 
      originalCount: tasks.length,
      filteredCount: filtered.length,
      sortedCount: sorted.length
    })
    return sorted
  }, [tasks, taskRelationMap])

  const taskChildrenMap = useMemo(() => 
    buildTaskChildrenMap(filteredAndSortedTasks, taskRelationMap),
    [filteredAndSortedTasks, taskRelationMap]
  )

  // ===== イベントハンドラー（最適化） =====
  const handleScrollToToday = useCallback(() => {
    logger.info('Scrolling to today from optimized timeline')
    if (onScrollToToday) {
      onScrollToToday(scrollToToday)
    }
  }, [onScrollToToday, scrollToToday])

  const handleExpandAll = useCallback(async () => {
    logger.info('Expanding all from optimized timeline')
    await onExpandAll?.()
  }, [onExpandAll])

  const handleCollapseAll = useCallback(async () => {
    logger.info('Collapsing all from optimized timeline')
    await onCollapseAll?.()
  }, [onCollapseAll])

  const handleSelectAll = useCallback(() => {
    logger.info('Selecting all tasks', { 
      taskCount: filteredAndSortedTasks.length,
      source: 'optimized_timeline'
    })
    rowSelection.selectAll(filteredAndSortedTasks)
  }, [filteredAndSortedTasks, rowSelection.selectAll])

  const handleClearSelection = useCallback(() => {
    logger.info('Clearing selection', { 
      previousCount: rowSelection.selectedCount,
      source: 'optimized_timeline'
    })
    rowSelection.clearSelection()
  }, [rowSelection.clearSelection, rowSelection.selectedCount])

  // ===== コンテキストメニュー処理 =====
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    logger.info('Context menu requested in optimized timeline')
    setIsContextMenuOpen(true)
  }, [])

  const handleDateShift = useCallback(async (options: DateShiftOptions) => {
    const selectedTasks = rowSelection.getSelectedTasks(filteredAndSortedTasks)
    if (selectedTasks.length === 0) {
      logger.warn('No tasks selected for date shift')
      return
    }

    logger.info('Date shift operation', { 
      taskCount: selectedTasks.length,
      direction: options.direction,
      amount: options.amount,
      type: currentShiftType
    })

    try {
      await apiService.batchShiftDates(
        selectedTasks.map(task => task.id),
        currentShiftType,
        options.direction,
        options.amount
      )
      
      setIsDateShiftDialogOpen(false)
      handleClearSelection()
      
      logger.info('Date shift completed successfully')
    } catch (error) {
      logger.error('Date shift failed', { error })
    }
  }, [filteredAndSortedTasks, rowSelection.getSelectedTasks, currentShiftType, handleClearSelection])

  // ===== グローバルイベント管理 =====
  useEffect(() => {
    if (!taskDrag.isDragging) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      taskDrag.handleDragMove(e)
    }

    const handleGlobalMouseUp = () => {
      taskDrag.handleDragEnd()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        taskDrag.handleDragCancel()
      }
    }

    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false })
    document.addEventListener('mouseup', handleGlobalMouseUp, { passive: false })
    document.addEventListener('keydown', handleKeyDown, { passive: false })

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [taskDrag.isDragging, taskDrag.handleDragMove, taskDrag.handleDragEnd, taskDrag.handleDragCancel])

  // タスクリファレンス更新
  useEffect(() => {
    rowSelection.updateTasksRef(filteredAndSortedTasks)
  }, [filteredAndSortedTasks, rowSelection.updateTasksRef])

  // ===== レンダリング部分（サブコンポーネント化で最適化） =====

  return (
    <div className="flex flex-col h-full bg-background">
      {/* メニューバー */}
      <TimelineMenuBar
        onViewModeChange={onViewModeChange}
        selectedCount={rowSelection.selectedCount}
        isSelecting={rowSelection.isSelecting}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onScrollToToday={handleScrollToToday}
      />

      {/* コントロール */}
      <TimelineControls
        zoomLevel={state.zoomLevel}
        viewUnit={state.viewUnit}
        onZoomChange={setZoomLevel}
        onViewUnitChange={setViewUnit}
        onFitToScreen={fitToScreen}
        onScrollToToday={scrollToToday}
      />

      {/* タイムライン本体 */}
      <div 
        ref={timelineRef}
        className="flex-1 overflow-auto border border-border"
        onContextMenu={handleContextMenu}
      >
        {/* 日付ヘッダー（サブコンポーネント化） */}
        <TimelineHeader
          visibleDates={visibleDates}
          dimensions={dimensions}
          dynamicFontSizes={dynamicFontSizes}
          viewUnit={state.viewUnit}
          theme={resolvedTheme as "dark" | "light"}
          today={today}
          scrollLeft={state.scrollLeft}
        />

        {/* タスクグリッド（サブコンポーネント化） */}
        <TimelineGrid
          tasks={filteredAndSortedTasks}
          projects={projects}
          taskChildrenMap={taskChildrenMap}
          taskRelationMap={taskRelationMap}
          dimensions={dimensions}
          timeRange={timeRange}
          visibleDates={visibleDates}
          onToggleTask={onToggleTask}
          onTaskUpdate={onTaskUpdate}
          selectedTaskIds={rowSelection.selectedTaskIds}
          previewTaskIds={rowSelection.previewTaskIds}
          isTaskSelected={rowSelection.isTaskSelected}
          isTaskPreview={rowSelection.isTaskPreview}
          handleRowClick={rowSelection.handleRowClick}
          handleRowMouseDown={rowSelection.handleRowMouseDown}
          registerRowElement={rowSelection.registerRowElement}
          updateTaskPosition={rowSelection.updateTaskPosition}
          taskPositions={rowSelection.taskPositions}
          handleDragStart={taskDrag.handleDragStart}
          isDragSelecting={rowSelection.isDragSelecting}
          dragSelectionStartY={rowSelection.dragSelectionStartY}
          dragSelectionCurrentY={rowSelection.dragSelectionCurrentY}
          containerRef={timelineRef}
        />
      </div>

      {/* コンテキストメニュー */}
      {isContextMenuOpen && (
        <ContextMenu
          selectedTaskIds={rowSelection.selectedTaskIds}
          onClose={() => setIsContextMenuOpen(false)}
          onDateShift={(type) => {
            setCurrentShiftType(type)
            setIsDateShiftDialogOpen(true)
            setIsContextMenuOpen(false)
          }}
        />
      )}

      {/* 日付シフトダイアログ */}
      {isDateShiftDialogOpen && (
        <DateShiftDialog
          isOpen={isDateShiftDialogOpen}
          onClose={() => setIsDateShiftDialogOpen(false)}
          onConfirm={handleDateShift}
          selectedTaskCount={rowSelection.selectedCount}
          shiftType={currentShiftType}
        />
      )}
    </div>
  )
}

// React.memo適用でレンダリング最適化
export default React.memo(OptimizedTimeline)