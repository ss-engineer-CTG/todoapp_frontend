// システムプロンプト準拠：タスク行コンポーネント（行選択対応）
// 機能：単一タスク行の描画と選択処理を担当

import React, { useCallback } from 'react'
import { Check } from 'lucide-react'
import { Task, Project } from '@core/types'
import { TaskWithChildren, DragMode, DragState } from '../types'
import { DraggableTaskBar } from './DraggableTaskBar'
import { 
  getDatePosition
} from '@core/utils'
import '../styles/animations.css'

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
  updateTaskPosition?: (taskId: string, position: { top: number; left: number; width: number; height: number }) => void
  
  // スタイル計算
  getTaskStatusStyle: (task: Task) => {
    background: string
    backgroundColor: string
    borderColor: string
    textColor: string
  }
  calculateIndent: (level: number) => number
  
  // 🆕 ホバー状態管理
  activeHoverTaskId?: string | null
  onSetActiveHoverTask?: (taskId: string | null) => void
  clickedTaskId?: string | null
  onSetClickedTask?: (taskId: string | null) => void
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
  updateTaskPosition,
  getTaskStatusStyle,
  calculateIndent
}) => {
  const { task } = taskWithChildren
  
  // インデント計算
  const indent = calculateIndent(task.level)
  
  // タスクバー関連の計算
  const startPos = task.startDate ? getDatePosition(new Date(task.startDate), timeRange.startDate, dimensions.cellWidth, viewUnit) : 0
  const endPos = task.dueDate ? getDatePosition(new Date(task.dueDate), timeRange.startDate, dimensions.cellWidth, viewUnit) : startPos + 100
  const barWidth = Math.max(endPos - startPos, 50) // 最小幅50px
  const barHeight = dimensions.taskBarHeight
  const statusStyle = getTaskStatusStyle(task)
  const isCurrentlyDragging = isDragging && dragState.originalTask?.id === task.id
  
  // React Hooksを早期リターンより前に置く
  // 行の視覚的スタイル
  const getRowStyle = useCallback(() => {
    let backgroundColor = ''
    let borderColor = ''
    
    if (isSelected) {
      backgroundColor = theme === 'dark' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(37, 99, 235, 0.15)'
      borderColor = theme === 'dark' ? '#3b82f6' : '#2563eb'
    } else if (isPreview) {
      backgroundColor = theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)'
      borderColor = theme === 'dark' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(37, 99, 235, 0.8)'
    } else {
      backgroundColor = theme === 'dark' ? 'transparent' : 'transparent'
      borderColor = theme === 'dark' ? '#374151' : '#e5e7eb'
    }
    
    return {
      backgroundColor,
      borderColor,
      borderLeftWidth: isSelected ? '5px' : isPreview ? '3px' : '1px',
      borderLeftStyle: 'solid' as const
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

  // 行要素の登録と位置更新（プロジェクト情報付き）
  const rowRef = useCallback((element: HTMLDivElement | null) => {
    if (element) {
      if (registerRowElement) {
        registerRowElement(task.id, element)
      }
      
      // プロジェクト情報をデータ属性として追加
      element.setAttribute('data-project-id', project.id)
      element.setAttribute('data-task-id', task.id)
      
      // 位置情報を更新（過度な更新を防ぐためタイマーを使用）
      if (updateTaskPosition) {
        setTimeout(() => {
          const rect = element.getBoundingClientRect()
          const containerRect = element.offsetParent?.getBoundingClientRect() || { top: 0, left: 0 }
          
          // プロジェクト情報を含むユニークキーで位置を更新
          const uniqueKey = `${project.id}-${task.id}`
          updateTaskPosition(uniqueKey, {
            top: rect.top - containerRect.top,
            left: rect.left - containerRect.left,
            width: rect.width,
            height: rect.height
          })
        }, 0)
      }
    }
  }, [task.id, project.id, registerRowElement, updateTaskPosition])

  // チェックボックスクリック処理
  const handleCheckboxClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    if (onRowClick) {
      onRowClick(event, task.id)
    }
  }, [task.id, onRowClick])

  return (
    <div
      ref={rowRef}
      data-task-row={task.id}
      className={`relative border-b transition-all duration-300 cursor-pointer select-none group ${
        isSelected ? 'animate-pulse-subtle bg-gradient-to-r' : ''
      }`}
      style={{ 
        height: `${dimensions.rowHeight.task}px`,
        paddingLeft: `${indent}px`,
        ...getRowStyle(),
        // アニメーション付きハイライト効果
        background: isSelected 
          ? `linear-gradient(90deg, ${getRowStyle().backgroundColor}, transparent 60%)`
          : getRowStyle().backgroundColor,
        boxShadow: isSelected 
          ? `inset 0 0 20px ${theme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.2)'}`
          : 'none',
        transform: isSelected ? 'translateX(2px)' : 'translateX(0)',
      }}
      onClick={handleRowClickLocal}
      onMouseDown={handleRowMouseDownLocal}
    >
      {/* 選択チェックボックス（選択モード時のみ表示） */}
      {(isSelected || isPreview) && (
        <div 
          className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-30 transition-all duration-200 ${
            isSelected ? 'opacity-100 scale-100' : 
            isPreview ? 'opacity-80 scale-95' : 
            'opacity-0 scale-75'
          }`}
        onClick={handleCheckboxClick}
      >
        <div 
          className={`w-5 h-5 rounded border-2 transition-all duration-200 cursor-pointer flex items-center justify-center ${
            isSelected 
              ? `bg-blue-500 border-blue-500 shadow-lg ${theme === 'dark' ? 'shadow-blue-400/50' : 'shadow-blue-500/30'}` 
              : isPreview 
                ? 'bg-blue-200 border-blue-400 dark:bg-blue-800 dark:border-blue-500'
                : 'bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-500 hover:border-blue-400'
          }`}
        >
          {isSelected && (
            <Check 
              size={12} 
              className="text-white animate-bounce-in" 
              strokeWidth={3}
            />
          )}
          {isPreview && !isSelected && (
            <div 
              className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-blue-400' : 'bg-blue-600'}`}
            />
          )}
        </div>
        </div>
      )}
      {/* DraggableTaskBarコンポーネントを使用 */}
      <DraggableTaskBar
        taskWithChildren={taskWithChildren}
        project={project}
        startPos={startPos} // 正確な日付位置に描画
        barWidth={barWidth}
        barHeight={barHeight}
        statusStyle={statusStyle}
        dimensions={dimensions}
        zoomLevel={zoomLevel}
        theme={theme}
        onTaskClick={onToggleTask}
        onDragStart={onDragStart}
        isDragging={isCurrentlyDragging}
        dragState={dragState}
        timeRange={timeRange}
        viewUnit={viewUnit}
      />

    </div>
  )
}