// システムプロンプト準拠：タスク行コンポーネント（行選択対応）
// 機能：単一タスク行の描画と選択処理を担当

import React, { useCallback } from 'react'
import { Task, Project } from '@core/types'
import { TaskWithChildren, DragMode, DragState } from '../types'
import { DraggableTaskBar } from './DraggableTaskBar'
import { 
  getDatePosition,
  isValidDate
} from '@core/utils'

interface TaskRowProps {
  taskWithChildren: TaskWithChildren
  project: Project
  dimensions: {
    rowHeight: { task: number }
    cellWidth: number
    taskBarHeight: number
    fontSize: { base: number; small: number }
    zoomRatio: number
  }
  timeRange: {
    startDate: Date
    endDate: Date
  }
  viewUnit: 'day' | 'week'
  theme: 'light' | 'dark'
  zoomLevel: number
  
  // ドラッグ関連
  onDragStart: (event: React.MouseEvent, task: Task, mode: DragMode) => void
  isDragging: boolean
  dragState: DragState
  
  // タスク操作
  onToggleTask?: (taskId: string) => void
  
  // 選択関連
  isSelected: boolean
  isPreview: boolean
  onRowClick?: (event: React.MouseEvent, taskId: string) => void
  onRowMouseDown?: (event: React.MouseEvent, taskId: string) => void
  registerRowElement?: (taskId: string, element: HTMLElement) => void
  
  // スタイル計算
  getTaskStatusStyle: (task: Task) => {
    background: string
    backgroundColor: string
    borderColor: string
    textColor: string
  }
  calculateIndent: (level: number) => number
}

export const TaskRow: React.FC<TaskRowProps> = ({
  taskWithChildren,
  project,
  dimensions,
  timeRange,
  viewUnit,
  theme,
  zoomLevel,
  onDragStart,
  isDragging,
  dragState,
  onToggleTask,
  isSelected,
  isPreview,
  onRowClick,
  onRowMouseDown,
  registerRowElement,
  getTaskStatusStyle,
  calculateIndent
}) => {
  const { task } = taskWithChildren
  
  if (!isValidDate(task.startDate) || !isValidDate(task.dueDate)) return null

  const statusStyle = getTaskStatusStyle(task)
  const indent = calculateIndent(task.level)
  
  let startPos = getDatePosition(task.startDate, timeRange.startDate, dimensions.cellWidth, viewUnit)
  let endPos = getDatePosition(task.dueDate, timeRange.startDate, dimensions.cellWidth, viewUnit)
  
  const barWidth = endPos - startPos + dimensions.cellWidth
  const barHeight = Math.max(24, dimensions.taskBarHeight - (task.level * 1.5))

  // ドラッグ中かつ対象タスクの場合の処理
  const isCurrentlyDragging = isDragging && dragState.originalTask?.id === task.id
  
  // 行の視覚的スタイル
  const getRowStyle = useCallback(() => {
    let backgroundColor = ''
    let borderColor = ''
    
    if (isSelected) {
      backgroundColor = theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.1)'
      borderColor = theme === 'dark' ? '#3b82f6' : '#2563eb'
    } else if (isPreview) {
      backgroundColor = theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.05)'
      borderColor = theme === 'dark' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(37, 99, 235, 0.6)'
    } else {
      backgroundColor = theme === 'dark' ? 'transparent' : 'transparent'
      borderColor = theme === 'dark' ? '#374151' : '#e5e7eb'
    }
    
    return {
      backgroundColor,
      borderColor,
      borderLeftWidth: isSelected ? '4px' : '1px',
      borderLeftStyle: 'solid'
    }
  }, [isSelected, isPreview, theme])

  // 行クリック処理（タスクバー以外の領域）
  const handleRowClickLocal = useCallback((event: React.MouseEvent) => {
    // タスクバー上のクリックでない場合のみ行選択処理
    const target = event.target as HTMLElement
    const isTaskBarClick = target.closest('.timeline-task-bar')
    
    if (!isTaskBarClick && onRowClick) {
      onRowClick(event, task.id)
    }
  }, [task.id, onRowClick])

  // 行マウスダウン処理
  const handleRowMouseDownLocal = useCallback((event: React.MouseEvent) => {
    // タスクバー上のマウスダウンでない場合のみ行選択処理
    const target = event.target as HTMLElement
    const isTaskBarMouseDown = target.closest('.timeline-task-bar')
    
    if (!isTaskBarMouseDown && onRowMouseDown) {
      onRowMouseDown(event, task.id)
    }
  }, [task.id, onRowMouseDown])

  // 行要素の登録
  const rowRef = useCallback((element: HTMLDivElement | null) => {
    if (element && registerRowElement) {
      registerRowElement(task.id, element)
    }
  }, [task.id, registerRowElement])

  return (
    <div
      ref={rowRef}
      className={`relative border-b transition-all duration-150 cursor-pointer select-none`}
      style={{ 
        height: `${dimensions.rowHeight.task}px`,
        paddingLeft: `${indent}px`,
        ...getRowStyle()
      }}
      onClick={handleRowClickLocal}
      onMouseDown={handleRowMouseDownLocal}
    >
      {/* DraggableTaskBarコンポーネントを使用 */}
      <DraggableTaskBar
        taskWithChildren={taskWithChildren}
        project={project}
        startPos={startPos}
        barWidth={barWidth}
        barHeight={barHeight}
        statusStyle={statusStyle}
        dimensions={dimensions}
        zoomLevel={zoomLevel}
        theme={theme}
        onTaskClick={onToggleTask}
        onDragStart={onDragStart}
        isDragging={isCurrentlyDragging}
        isPreview={false}
        previewStartDate={dragState.previewStartDate}
        previewDueDate={dragState.previewDueDate}
        isSelected={false} // 行レベル選択に変更したため無効化
        onTaskSelect={undefined} // 行レベル選択に変更したため無効化
      />

      {/* ドラッグ中のプレビュー表示 */}
      {isCurrentlyDragging && dragState.previewStartDate && dragState.previewDueDate && (
        <DraggableTaskBar
          taskWithChildren={{
            ...taskWithChildren,
            task: {
              ...task,
              startDate: dragState.previewStartDate,
              dueDate: dragState.previewDueDate
            }
          }}
          project={project}
          startPos={getDatePosition(dragState.previewStartDate, timeRange.startDate, dimensions.cellWidth, viewUnit)}
          barWidth={Math.max(80, 
            getDatePosition(dragState.previewDueDate, timeRange.startDate, dimensions.cellWidth, viewUnit) - 
            getDatePosition(dragState.previewStartDate, timeRange.startDate, dimensions.cellWidth, viewUnit) + 
            dimensions.cellWidth
          )}
          barHeight={barHeight}
          statusStyle={{
            ...statusStyle,
            background: statusStyle.background.replace(/[\d.]+\)/, '0.5)'),
            backgroundColor: statusStyle.backgroundColor
          }}
          dimensions={dimensions}
          zoomLevel={zoomLevel}
          theme={theme}
          onDragStart={() => {}}
          isDragging={false}
          isPreview={true}
          previewStartDate={dragState.previewStartDate}
          previewDueDate={dragState.previewDueDate}
        />
      )}
    </div>
  )
}