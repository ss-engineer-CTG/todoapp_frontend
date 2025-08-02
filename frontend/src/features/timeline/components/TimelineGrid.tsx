// システムプロンプト準拠：タイムライングリッド部分（リファクタリング：グリッド描画分離）
// リファクタリング対象：OptimizedTimeline からタスク行描画ロジックを抽出

import React from 'react'
import { Task, Project } from '@core/types'
import { TaskRow } from './TaskRow'
import { SelectionBorder } from './SelectionBorder'
import { DragSelectionRectangle } from './DragSelectionRectangle'
import { isTaskVisibleInTimeline } from '@tasklist/utils/task'
// import { logger } from '@core/utils'

interface TimelineGridProps {
  tasks: Task[]
  projects: Project[]
  taskChildrenMap: Map<string, Task[]>
  taskRelationMap: any
  dimensions: {
    cellWidth: number
    rowHeight: number
  }
  timeRange: {
    start: Date
    end: Date
  }
  visibleDates: Date[]
  
  // イベントハンドラー
  onToggleTask?: (taskId: string) => Promise<void>
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>
  
  // 選択関連
  selectedTaskIds: Set<string>
  previewTaskIds: Set<string>
  isTaskSelected: (taskId: string) => boolean
  isTaskPreview: (taskId: string) => boolean
  handleRowClick: (e: React.MouseEvent, taskId: string) => void
  handleRowMouseDown: (e: React.MouseEvent, taskId: string) => void
  registerRowElement: (taskId: string, element: HTMLElement) => void
  updateTaskPosition: (taskId: string, position: any) => void
  taskPositions: Map<string, any>
  
  // ドラッグ関連
  handleDragStart: (e: React.MouseEvent, taskId: string) => void
  isDragSelecting: boolean
  dragSelectionStartY: number
  dragSelectionCurrentY: number
  
  // レファレンス
  containerRef?: React.RefObject<HTMLDivElement>
}

export const TimelineGrid: React.FC<TimelineGridProps> = React.memo(({
  tasks,
  projects,
  taskChildrenMap,
  taskRelationMap,
  dimensions,
  timeRange,
  visibleDates,
  onToggleTask,
  onTaskUpdate,
  selectedTaskIds,
  _previewTaskIds,
  isTaskSelected,
  isTaskPreview,
  handleRowClick,
  handleRowMouseDown,
  registerRowElement,
  updateTaskPosition,
  taskPositions,
  handleDragStart,
  isDragSelecting,
  dragSelectionStartY,
  dragSelectionCurrentY,
  containerRef
}) => {
  
  const renderTaskRows = () => {
    return tasks.map((task) => {
      const children = taskChildrenMap.get(task.id) || []
      const isVisible = isTaskVisibleInTimeline(task, taskRelationMap)
      
      if (!isVisible) {
        return null
      }

      const project = projects.find(p => p.id === task.projectId)
      
      return (
        <TaskRow
          key={task.id}
          task={task}
          project={project}
          children={children}
          dimensions={dimensions}
          timeRange={timeRange}
          visibleDates={visibleDates}
          onToggleTask={onToggleTask}
          onTaskUpdate={onTaskUpdate}
          isSelected={isTaskSelected(task.id)}
          isPreview={isTaskPreview(task.id)}
          onClick={(e: React.MouseEvent) => handleRowClick(e, task.id)}
          onMouseDown={(e: React.MouseEvent) => handleRowMouseDown(e, task.id)}
          onDragStart={(e: React.DragEvent) => handleDragStart(e, task.id)}
          registerElement={(element: HTMLElement | null) => registerRowElement(task.id, element)}
          updatePosition={(position: { top: number; height: number }) => updateTaskPosition(task.id, position)}
        />
      )
    })
  }

  return (
    <div className="relative">
      {/* タスク行描画 */}
      {renderTaskRows()}
      
      {/* 選択境界線 */}
      {containerRef && selectedTaskIds && taskPositions && (
        <SelectionBorder
          selectedTasks={Array.from(selectedTaskIds).map(id => tasks.find(t => t.id === id)).filter(Boolean) as Task[]}
          taskPositions={taskPositions}
          theme="light"
          containerRef={containerRef}
        />
      )}
      
      {/* ドラッグ選択矩形 */}
      {isDragSelecting && (
        <DragSelectionRectangle
          startY={dragSelectionStartY}
          currentY={dragSelectionCurrentY}
          isVisible={true}
          theme="light"
        />
      )}
    </div>
  )
})

TimelineGrid.displayName = 'TimelineGrid'