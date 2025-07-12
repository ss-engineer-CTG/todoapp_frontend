// システムプロンプト準拠：最適化タスクバー（リファクタリング：レンダリング効率向上）
// リファクタリング対象：DraggableTaskBar から不要機能を削除し軽量化

import React, { useCallback, useMemo } from 'react'
import { Task } from '@core/types'
import { 
  getDatePosition, 
  isValidDate, 
  getDisplayText,
  logger 
} from '@core/utils'
import { calculateTimelineTaskStatus } from '@tasklist/utils/task'

interface OptimizedTaskBarProps {
  task: Task
  dimensions: {
    cellWidth: number
    rowHeight: number
  }
  timeRange: {
    start: Date
    end: Date
  }
  visibleDates: Date[]
  isSelected: boolean
  isPreview: boolean
  onDragStart?: (e: React.MouseEvent, taskId: string) => void
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>
}

export const OptimizedTaskBar: React.FC<OptimizedTaskBarProps> = React.memo(({
  task,
  dimensions,
  timeRange,
  visibleDates,
  isSelected,
  isPreview,
  onDragStart,
  onTaskUpdate
}) => {
  
  // ===== メモ化された計算値 =====
  const taskBarStyle = useMemo(() => {
    if (!isValidDate(task.startDate) || !isValidDate(task.dueDate)) {
      return null
    }

    const startPos = getDatePosition(task.startDate, timeRange, dimensions.cellWidth)
    const endPos = getDatePosition(task.dueDate, timeRange, dimensions.cellWidth)
    
    if (startPos === null || endPos === null) {
      return null
    }

    const width = Math.max(endPos - startPos + dimensions.cellWidth, 20) // 最小幅20px
    
    return {
      left: `${startPos}px`,
      width: `${width}px`,
      height: '20px',
      top: '50%',
      transform: 'translateY(-50%)'
    }
  }, [task.startDate, task.dueDate, timeRange, dimensions.cellWidth])

  const taskStatus = useMemo(() => 
    calculateTimelineTaskStatus(task),
    [task.completed, task.startDate, task.dueDate]
  )

  const displayText = useMemo(() => 
    getDisplayText(task.name, 30), // 30文字制限
    [task.name]
  )

  // ===== イベントハンドラー =====
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 左クリックでドラッグ開始
    if (e.button === 0 && onDragStart) {
      e.preventDefault()
      e.stopPropagation()
      
      logger.info('Task bar drag initiated', { 
        taskId: task.id,
        taskName: task.name,
        source: 'optimized_task_bar'
      })
      
      onDragStart(e, task.id)
    }
  }, [onDragStart, task.id, task.name])

  // ===== 描画判定 =====
  if (!taskBarStyle) {
    return null // 無効な日付の場合は描画しない
  }

  // ===== スタイルクラス決定 =====
  const getBarClassName = () => {
    const baseClass = "absolute rounded cursor-pointer transition-all duration-200 border flex items-center px-2"
    
    let statusClass = ""
    switch (taskStatus) {
      case 'completed':
        statusClass = "bg-green-500 border-green-600 text-white"
        break
      case 'overdue':
        statusClass = "bg-red-500 border-red-600 text-white"
        break
      case 'upcoming':
        statusClass = "bg-blue-500 border-blue-600 text-white"
        break
      case 'active':
        statusClass = "bg-orange-500 border-orange-600 text-white"
        break
      default:
        statusClass = "bg-gray-400 border-gray-500 text-white"
    }
    
    let selectionClass = ""
    if (isSelected) {
      selectionClass = "ring-2 ring-blue-400 ring-offset-1"
    } else if (isPreview) {
      selectionClass = "ring-2 ring-blue-200 ring-offset-1 opacity-70"
    }
    
    return `${baseClass} ${statusClass} ${selectionClass}`
  }

  return (
    <div
      className={getBarClassName()}
      style={taskBarStyle}
      onMouseDown={handleMouseDown}
      title={`${task.name} (${task.startDate?.toLocaleDateString()} - ${task.dueDate?.toLocaleDateString()})`}
    >
      <span className="text-xs font-medium truncate select-none">
        {displayText}
      </span>
    </div>
  )
})

OptimizedTaskBar.displayName = 'OptimizedTaskBar'