// システムプロンプト準拠：ドラッグ可能なタスクバーコンポーネント（リサイズハンドル対応版）
// 🔧 修正内容：既存機能を保持しつつ、左端・右端ハンドル機能を追加

import React, { useCallback, useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Task, Project } from '@core/types'
import { TaskWithChildren, DragMode } from '../types'
import { 
  ChevronDown, ChevronRight
} from 'lucide-react'
import { 
  isDraftTask
} from '@tasklist/utils/task'
import { 
  getDisplayText,
  calculateTaskDuration,
  isShortDurationTask,
  logger
} from '@core/utils'
import { useTheme } from '@core/components/ThemeProvider'

// 🔧 定数定義（システムプロンプト準拠：一元管理）
const RESIZE_HANDLE_WIDTH = 8   // リサイズハンドル領域の幅
const TASK_BAR_MIN_WIDTH = 60   // タスクバーの最小幅

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
  }
  zoomLevel: number
  theme: 'light' | 'dark'
  onTaskClick?: (taskId: string) => void
  onDragStart: (event: React.MouseEvent, task: Task, mode: DragMode) => void
  isDragging: boolean
  isPreview?: boolean
  previewStartDate?: Date | null
  previewDueDate?: Date | null
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
  isPreview = false,
  previewStartDate,
  previewDueDate
}) => {
  const { task, hasChildren, childrenCount } = taskWithChildren
  const isTaskDraft = isDraftTask(task)
  const { theme: currentTheme } = useTheme()
  
  // タスク期間の計算
  const taskDuration = calculateTaskDuration(new Date(task.startDate), new Date(task.dueDate))
  const isShortTask = isShortDurationTask(barWidth, taskDuration)
  
  // 🆕 追加：ホバー状態管理
  const [hoverMode, setHoverMode] = useState<DragMode | null>(null)
  const [isHovering, setIsHovering] = useState<boolean>(false)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const taskBarRef = useRef<HTMLDivElement>(null)

  // 🔧 既存：ドラッグ中のマウスイベント設定（保持）
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = () => {
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

  // 🔧 既存：タスククリックハンドラー（保持）
  const handleTaskClick = useCallback((e: React.MouseEvent) => {
    // ドラッグ操作でない場合のみクリック処理
    if (!isDragging) {
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
    }
  }, [task.id, task.name, task.collapsed, hasChildren, onTaskClick, isDragging])

  // 🆕 追加：マウス位置によるドラッグモード判定
  const getDragModeFromPosition = useCallback((e: React.MouseEvent): DragMode => {
    const rect = e.currentTarget.getBoundingClientRect()
    const relativeX = e.clientX - rect.left
    
    if (relativeX <= RESIZE_HANDLE_WIDTH) {
      return 'resize-start'  // 左端：開始日変更
    } else if (relativeX >= barWidth - RESIZE_HANDLE_WIDTH) {
      return 'resize-end'    // 右端：期限日変更
    } else {
      return 'move'          // 中央：全体移動
    }
  }, [barWidth])

  // 🆕 追加：マウスダウン時のドラッグ開始処理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 草稿タスクはドラッグ不可
    if (isTaskDraft) {
      logger.info('Draft task drag prevented', { taskId: task.id })
      return
    }

    const mode = getDragModeFromPosition(e)
    
    logger.info('Task bar mouse down - initiating drag', { 
      taskId: task.id,
      dragMode: mode,
      mouseX: e.clientX,
      relativeX: e.clientX - e.currentTarget.getBoundingClientRect().left,
      startPos
    })

    onDragStart(e, task, mode)
  }, [isTaskDraft, task, onDragStart, startPos, getDragModeFromPosition])

  // 🆕 追加：マウス移動時のホバー効果
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging || isTaskDraft) return

    const mode = getDragModeFromPosition(e)
    
    // ホバーモードが変更された場合のみ状態更新
    if (mode !== hoverMode) {
      setHoverMode(mode)
    }
  }, [isDragging, isTaskDraft, getDragModeFromPosition, hoverMode])

  // 🆕 追加：マウスエンター時の処理
  const handleMouseEnter = useCallback(() => {
    if (!isDragging && !isTaskDraft && taskBarRef.current) {
      const rect = taskBarRef.current.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      })
      setIsHovering(true)
    }
  }, [isDragging, isTaskDraft])

  // 🆕 追加：マウスリーブ時の処理
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
    setHoverMode(null)
  }, [])

  // 🆕 追加：カーソルスタイルの動的設定
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

  // 🆕 追加：ハンドル表示判定
  const shouldShowHandles = useCallback((): boolean => {
    return isHovering && !isTaskDraft && !isDragging && barWidth >= 20
  }, [isHovering, isTaskDraft, isDragging, barWidth])

  // プレビュー時の透明度調整
  const opacity = isPreview ? 0.7 : 1
  const transform = isDragging ? 'scale(1.02)' : 'scale(1)'

  return (
    <>
      {/* メインのタスクバー */}
      <div
        ref={taskBarRef}
        className={`absolute rounded-lg shadow-lg flex items-center transition-all duration-200 timeline-task-bar ${
          !isTaskDraft ? 'hover:shadow-xl' : 'opacity-50'
        } ${isDragging ? 'z-50' : 'hover:scale-[1.02]'}`}
        style={{ 
          left: `${startPos}px`,
          width: `${barWidth}px`,
          height: `${barHeight}px`,
          top: '50%',
          transform: `translateY(-50%) ${transform}`,
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
          className="absolute left-0 top-0 w-2 h-full flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
          style={{
            width: `${RESIZE_HANDLE_WIDTH}px`,
            background: hoverMode === 'resize-start' ? 
              'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.8))' : 
              'transparent',
            borderTopLeftRadius: '6px',
            borderBottomLeftRadius: '6px'
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
          className="absolute right-0 top-0 w-2 h-full flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
          style={{
            width: `${RESIZE_HANDLE_WIDTH}px`,
            background: hoverMode === 'resize-end' ? 
              'linear-gradient(270deg, transparent, rgba(59, 130, 246, 0.8))' : 
              'transparent',
            borderTopRightRadius: '6px',
            borderBottomRightRadius: '6px'
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

      {/* 🔧 既存：プレビュー表示時の日付情報（保持） */}
      {isPreview && (previewStartDate || previewDueDate) && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          {previewStartDate && previewDueDate && (
            <>
              {previewStartDate.toLocaleDateString()} ～ {previewDueDate.toLocaleDateString()}
            </>
          )}
        </div>
      )}

      {/* 🆕 追加：ホバー時のタスク情報表示（Portal使用） */}
      {isHovering && !isDragging && createPortal(
        <div 
          className="absolute text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap transition-all duration-200"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateX(-50%)',
            zIndex: 99999,
            backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            color: theme === 'dark' ? 'white' : 'black',
            border: `2px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'}`,
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none'
          }}
        >
          <div className="flex flex-col space-y-1">
            <div className="font-semibold text-base">{task.name}</div>
            <div className="text-xs opacity-80 space-y-0.5">
              <div>📅 開始: {new Date(task.startDate).toLocaleDateString('ja-JP')}</div>
              <div>⏰ 期限: {new Date(task.dueDate).toLocaleDateString('ja-JP')}</div>
              <div>⏱️ 期間: {Math.ceil((new Date(task.dueDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24))}日間</div>
              {task.notes && <div className="max-w-xs truncate">📝 {task.notes}</div>}
            </div>
          </div>
        </div>,
        document.body
      )}
      </div>

      {/* 🆕 追加：短期間タスクの外部ラベル表示 */}
      {isShortTask && (
        <div 
          className="absolute z-10 pointer-events-none"
          style={{
            left: `${startPos + barWidth + 8}px`, // タスクバーの右端から8px離れた位置
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: `${Math.max(11, dimensions.fontSize.small - (task.level * 0.5))}px`,
            fontWeight: task.level === 0 ? '600' : task.level === 1 ? '500' : '400',
            color: currentTheme === 'dark' ? '#e5e7eb' : '#374151',
            backgroundColor: currentTheme === 'dark' ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            padding: '2px 6px',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            whiteSpace: 'nowrap',
            letterSpacing: '0.025em',
            lineHeight: '1.3',
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {task.name}
        </div>
      )}
    </>
  )
}