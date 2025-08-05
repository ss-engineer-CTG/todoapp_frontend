// 理想形ドラッグ機能：シンプルなタスクバーコンポーネント
// 3つのドラッグモード：resize-start（開始日変更）、resize-end（期限日変更）、move（全体移動）

import React, { useCallback, useState } from 'react'
import { Task, Project } from '@core/types'
import { TaskWithChildren, DragMode } from '../types'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { isDraftTask } from '@tasklist/utils/task'
import { getDisplayText, isShortDurationTask, logger, getDatePosition } from '@core/utils'
import { useTheme } from '@core/components/ThemeProvider'

// ドラッグ機能の定数
const RESIZE_HANDLE_WIDTH = 8   // リサイズハンドル領域の幅

interface DraggableTaskBarProps {
  taskWithChildren: TaskWithChildren
  project: Project
  startPos: number
  barWidth: number
  barHeight: number
  statusStyle: {
    background: string
    backgroundColor: string
    borderColor: string
    textColor: string
  }
  dimensions: {
    fontSize: { base: number; small: number }
    zoomRatio: number
    cellWidth: number
  }
  zoomLevel: number
  theme: 'light' | 'dark'
  onTaskClick?: (taskId: string) => void
  onDragStart: (event: React.MouseEvent, task: Task, mode: DragMode) => void
  isDragging: boolean
  dragState?: {
    previewStartDate: Date | null
    previewDueDate: Date | null
    dragMode: DragMode
  }
  timeRange?: {
    startDate: Date
    endDate: Date
  }
  viewUnit?: 'day' | 'week'
}

export const DraggableTaskBar: React.FC<DraggableTaskBarProps> = ({
  taskWithChildren,
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
  dragState,
  timeRange,
  viewUnit
}) => {
  const { task, hasChildren, childrenCount } = taskWithChildren
  const isTaskDraft = isDraftTask(task)
  const { resolvedTheme: currentTheme } = useTheme()
  
  // タスク期間の計算
  const isShortTask = isShortDurationTask(barWidth, 7) // 簡略化
  
  // ホバー状態とドラッグモード管理
  const [isHovering, setIsHovering] = useState<boolean>(false)
  const [hoverMode, setHoverMode] = useState<DragMode | null>(null)


  // タスククリックハンドラー（シンプル版）
  const handleTaskClick = useCallback((e: React.MouseEvent) => {
    if (!isDragging && !isTaskDraft) {
      e.preventDefault()
      e.stopPropagation()
      
      logger.info('Task bar clicked', { 
        taskId: task.id, 
        taskName: task.name
      })
      
      if (onTaskClick) {
        onTaskClick(task.id)
      }
    }
  }, [task.id, task.name, onTaskClick, isDragging, isTaskDraft])

  // ドラッグモード判定（理想形の3モード）
  const getDragModeFromPosition = useCallback((e: React.MouseEvent): DragMode => {
    const rect = e.currentTarget.getBoundingClientRect()
    const relativeX = e.clientX - rect.left
    
    if (relativeX <= RESIZE_HANDLE_WIDTH) {
      return 'resize-start'  // 左端：開始日のみ変更
    } else if (relativeX >= barWidth - RESIZE_HANDLE_WIDTH) {
      return 'resize-end'    // 右端：期限日のみ変更
    } else {
      return 'move'          // 中央：開始日・期限日同時移動
    }
  }, [barWidth])

  // ドラッグ開始処理（理想形）
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (isTaskDraft) {
      logger.info('Draft task drag prevented', { taskId: task.id })
      return
    }

    const mode = getDragModeFromPosition(e)
    
    logger.info('Task drag started', { 
      taskId: task.id,
      dragMode: mode,
      taskName: task.name
    })

    onDragStart(e, task, mode)
  }, [isTaskDraft, task, onDragStart, getDragModeFromPosition])

  // マウス移動時のホバー効果とカーソル変更
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging || isTaskDraft) return

    const mode = getDragModeFromPosition(e)
    if (mode !== hoverMode) {
      setHoverMode(mode)
    }
  }, [isDragging, isTaskDraft, getDragModeFromPosition, hoverMode])

  // マウスエンター時の処理
  const handleMouseEnter = useCallback(() => {
    if (!isDragging && !isTaskDraft) {
      setIsHovering(true)
    }
  }, [isDragging, isTaskDraft])

  // マウスリーブ時の処理
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
    setHoverMode(null)
  }, [])

  // カーソルスタイルの動的設定
  const getCursorStyle = useCallback((): string => {
    if (isTaskDraft) return 'not-allowed'
    if (isDragging) return 'grabbing'
    
    switch (hoverMode) {
      case 'resize-start':
      case 'resize-end':
        return 'col-resize'
      case 'move':
      default:
        return 'grab'
    }
  }, [isTaskDraft, isDragging, hoverMode])

  // リサイズハンドル表示判定
  const shouldShowHandles = useCallback((): boolean => {
    return isHovering && !isTaskDraft && !isDragging && barWidth >= 30
  }, [isHovering, isTaskDraft, isDragging, barWidth])

  // 通常の透明度
  const opacity = 1

  return (
    <>
      {/* メインのタスクバー */}
      <div
        className={`absolute rounded-lg shadow-lg flex items-center transition-all duration-200 timeline-task-bar ${
          !isTaskDraft ? (isHovering ? 'shadow-xl' : '') : 'opacity-50'
        } ${isDragging ? 'z-50' : ''}`}
        style={{ 
          left: `${startPos}px`,
          width: `${barWidth}px`,
          height: `${barHeight}px`,
          top: '50%',
          transform: `translateY(-50%) ${isHovering && !isDragging ? 'scale(1.02)' : 'scale(1)'}`,
          background: statusStyle.background,
          backgroundColor: statusStyle.backgroundColor,
          color: statusStyle.textColor,
          borderWidth: task.level > 1 ? '1px' : '2px',
          borderStyle: task.level > 1 ? 'dashed' : 'solid',
          borderColor: statusStyle.borderColor,
          zIndex: isDragging ? 50 : 2,
          opacity,
          userSelect: 'none',
          cursor: getCursorStyle()
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleTaskClick}
      >
      {/* 🆕 追加：左端リサイズハンドル */}
      {shouldShowHandles() && (
        <div
          className="absolute left-0 top-0 w-2 h-full flex items-center justify-center transition-opacity"
          style={{
            width: `${RESIZE_HANDLE_WIDTH}px`,
            background: hoverMode === 'resize-start' ? 
              'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.8))' : 
              'transparent',
            borderTopLeftRadius: '6px',
            borderBottomLeftRadius: '6px',
            opacity: isHovering ? 1 : 0.8
          }}
        >
          <div 
            className="w-1 h-4 rounded-full"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
              opacity: hoverMode === 'resize-start' ? 1 : 0.6
            }}
          />
        </div>
      )}

      {/* 🔧 既存：左側アイコン群（保持） */}
      <div className="px-3 flex items-center flex-shrink-0 space-x-2">
        {/* ステータスアイコン - 削除済み */}
        
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
      
      {/* 🔧 改善：タスク名表示（短期間タスクは表示しない） */}
      {!isShortTask && (
        <div 
          className="px-2 font-medium truncate flex-1"
          style={{ 
            fontSize: `${Math.max(12, dimensions.fontSize.small - (task.level * 0.5))}px`,
            fontWeight: task.level === 0 ? '600' : task.level === 1 ? '500' : '400',
            letterSpacing: '0.025em',
            lineHeight: '1.3'
          }}
        >
          {getDisplayText(task.name, zoomLevel, Math.max(12, 22 - task.level * 1.5))}
        </div>
      )}

      {/* 🆕 追加：右端リサイズハンドル */}
      {shouldShowHandles() && (
        <div
          className="absolute right-0 top-0 w-2 h-full flex items-center justify-center transition-opacity"
          style={{
            width: `${RESIZE_HANDLE_WIDTH}px`,
            background: hoverMode === 'resize-end' ? 
              'linear-gradient(270deg, transparent, rgba(59, 130, 246, 0.8))' : 
              'transparent',
            borderTopRightRadius: '6px',
            borderBottomRightRadius: '6px',
            opacity: isHovering ? 1 : 0.8
          }}
        >
          <div 
            className="w-1 h-4 rounded-full"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
              opacity: hoverMode === 'resize-end' ? 1 : 0.6
            }}
          />
        </div>
      )}

      {/* 🔧 既存：ドラッグ中の視覚的フィードバック（保持） */}
      {isDragging && (
        <div className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none animate-pulse" />
      )}

      </div>

      {/* 🎨 プレビュー用半透明タスクバー */}
      {isDragging && dragState?.previewStartDate && dragState?.previewDueDate && timeRange && viewUnit && (
        (() => {
          const cellWidth = dimensions.cellWidth
          const originalStartPos = startPos
          const originalEndPos = startPos + barWidth
          
          // プレビュー位置の計算
          const previewStartPos = getDatePosition(dragState.previewStartDate, timeRange.startDate, cellWidth, viewUnit)
          const previewEndPos = getDatePosition(dragState.previewDueDate, timeRange.startDate, cellWidth, viewUnit) + cellWidth
          const previewWidth = Math.max(50, previewEndPos - previewStartPos)
          
          // 3つのドラッグモード別の表示
          if (dragState.dragMode === 'resize-start') {
            // 開始日変更：左端が動く
            const newStartPos = previewStartPos
            const newEndPos = originalEndPos
            const newWidth = Math.max(50, newEndPos - newStartPos)
            
            return (
              <div
                className="absolute rounded-lg border-2 border-dashed border-blue-400 bg-blue-200/40 dark:bg-blue-600/30 pointer-events-none z-30"
                style={{
                  left: `${newStartPos}px`,
                  width: `${newWidth}px`,
                  height: `${barHeight}px`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            )
          } else if (dragState.dragMode === 'resize-end') {
            // 期限日変更：右端が動く
            const newStartPos = originalStartPos
            const newEndPos = previewEndPos
            const newWidth = Math.max(50, newEndPos - newStartPos)
            
            return (
              <div
                className="absolute rounded-lg border-2 border-dashed border-blue-400 bg-blue-200/40 dark:bg-blue-600/30 pointer-events-none z-30"
                style={{
                  left: `${newStartPos}px`,
                  width: `${newWidth}px`,
                  height: `${barHeight}px`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            )
          } else if (dragState.dragMode === 'move') {
            // 全体移動：新しい位置に同じ長さで表示
            return (
              <div
                className="absolute rounded-lg border-2 border-dashed border-blue-400 bg-blue-200/40 dark:bg-blue-600/30 pointer-events-none z-30"
                style={{
                  left: `${previewStartPos}px`,
                  width: `${previewWidth}px`,
                  height: `${barHeight}px`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            )
          }
          
          return null
        })()
      )}

      {/* 短期間タスクの外部ラベル表示 */}
      {isShortTask && (
        <div 
          className="absolute z-10 pointer-events-none bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded shadow text-sm"
          style={{
            left: `${startPos + barWidth + 8}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: `${Math.max(11, dimensions.fontSize.small)}px`,
            fontWeight: '500',
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {task.name}
        </div>
      )}
    </>
  )
}