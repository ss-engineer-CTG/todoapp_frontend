// システムプロンプト準拠：ドラッグ可能なタスクバーコンポーネント
// 🎯 目的：既存タスクバーにドラッグ機能を追加、視覚的フィードバック提供

import React, { useCallback, useEffect } from 'react'
import { Task, Project } from '@core/types'
import { TaskWithChildren } from '../types'
import { 
  Check, AlertTriangle, ChevronDown, ChevronRight
} from 'lucide-react'
import { 
  calculateTimelineTaskStatus,
  isDraftTask
} from '@tasklist/utils/task'
import { 
  getDisplayText,
  logger
} from '@core/utils/core'

interface DraggableTaskBarProps {
  taskWithChildren: TaskWithChildren
  project: Project
  startPos: number
  barWidth: number
  barHeight: number
  statusStyle: {
    backgroundColor: string
    borderColor: string
    textColor: string
  }
  dimensions: {
    fontSize: { base: number; small: number }
    zoomRatio: number
  }
  zoomLevel: number
  theme: 'light' | 'dark'
  onTaskClick?: (taskId: string) => void
  onDragStart: (event: React.MouseEvent, task: Task) => void
  isDragging: boolean
  isPreview?: boolean
  previewStartDate?: Date | null
  previewDueDate?: Date | null
}

export const DraggableTaskBar: React.FC<DraggableTaskBarProps> = ({
  taskWithChildren,
  project,
  startPos,
  barWidth,
  barHeight,
  statusStyle,
  dimensions,
  zoomLevel,
  theme,
  onTaskClick,
  onDragStart,
  isDragging,
  isPreview = false,
  previewStartDate,
  previewDueDate
}) => {
  const { task, hasChildren, childrenCount } = taskWithChildren
  const isTaskDraft = isDraftTask(task)

  // ドラッグ中のマウスイベント設定
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      // ドラッグ中の処理は親コンポーネントで管理
    }

    const handleMouseUp = () => {
      // ドラッグ終了の処理は親コンポーネントで管理
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const handleTaskClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    logger.info('Draggable task bar clicked', { 
      taskId: task.id, 
      taskName: task.name,
      hasChildren,
      currentCollapsed: task.collapsed
    })
    
    if (onTaskClick) {
      onTaskClick(task.id)
    }
  }, [task.id, task.name, task.collapsed, hasChildren, onTaskClick])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 草稿タスクはドラッグ不可
    if (isTaskDraft) {
      logger.info('Draft task drag prevented', { taskId: task.id })
      return
    }

    logger.info('Task bar mouse down - initiating drag', { 
      taskId: task.id,
      mouseX: e.clientX,
      startPos
    })

    onDragStart(e, task)
  }, [isTaskDraft, task, onDragStart, startPos])

  // プレビュー時の透明度調整
  const opacity = isPreview ? 0.7 : 1
  const transform = isDragging ? 'scale(1.02)' : 'scale(1)'

  return (
    <div
      className={`absolute rounded-lg shadow-lg flex items-center transition-all duration-200 ${
        !isTaskDraft ? 'cursor-grab hover:shadow-xl' : 'cursor-not-allowed opacity-50'
      } ${isDragging ? 'cursor-grabbing z-50' : 'hover:scale-[1.02]'}`}
      style={{ 
        left: `${startPos}px`,
        width: `${barWidth}px`,
        height: `${barHeight}px`,
        top: '50%',
        transform: `translateY(-50%) ${transform}`,
        backgroundColor: statusStyle.backgroundColor,
        color: statusStyle.textColor,
        borderWidth: task.level > 1 ? '1px' : '2px',
        borderStyle: task.level > 1 ? 'dashed' : 'solid',
        borderColor: statusStyle.borderColor,
        zIndex: isDragging ? 50 : 2,
        opacity,
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleTaskClick}
      title={!isTaskDraft ? 
        `${task.name}${hasChildren ? ` (${childrenCount}個の子タスク)` : ''} - ドラッグして日程を変更` :
        `${task.name} (作成中のため移動不可)`
      }
    >
      {/* 左側アイコン群 */}
      <div className="px-3 flex items-center flex-shrink-0 space-x-2">
        {/* ステータスアイコン */}
        <div className="flex items-center space-x-1">
          {task.completed && <Check size={Math.max(10, 14)} />}
          {calculateTimelineTaskStatus(task) === 'overdue' && !task.completed && 
            <AlertTriangle size={Math.max(10, 14)} />}
        </div>
        
        {/* 折り畳みバッジ */}
        {hasChildren && dimensions.zoomRatio > 0.5 && (
          <div className="bg-white/30 rounded-full px-2 py-1 flex items-center space-x-1">
            {!task.collapsed ? 
              <ChevronDown size={Math.max(8, 12)} /> :
              <ChevronRight size={Math.max(8, 12)} />
            }
            <span className="text-xs font-bold">
              {childrenCount}
            </span>
          </div>
        )}
      </div>
      
      {/* タスク名表示 */}
      <div 
        className="px-2 font-semibold truncate flex-1"
        style={{ fontSize: `${Math.max(10, dimensions.fontSize.small - task.level)}px` }}
      >
        {getDisplayText(task.name, zoomLevel, Math.max(10, 20 - task.level * 2))}
      </div>

      {/* ドラッグ中の視覚的フィードバック */}
      {isDragging && (
        <div className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none animate-pulse" />
      )}

      {/* プレビュー表示時の日付情報 */}
      {isPreview && (previewStartDate || previewDueDate) && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          {previewStartDate && previewDueDate && (
            <>
              {previewStartDate.toLocaleDateString()} ～ {previewDueDate.toLocaleDateString()}
            </>
          )}
        </div>
      )}
    </div>
  )
}