"use client"

import React, { forwardRef, useRef, useEffect, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Task } from "../../../types/Task"

interface Month {
  id: string
  name: string
  daysInMonth: number
}

interface TimelineItemProps {
  task: Task
  month: Month
  isSelected: boolean
  onSelect: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>, taskId: number) => void
  onToggleComplete: (id: number) => void
  onDragStart: (e: React.MouseEvent<HTMLDivElement>, task: Task, type: "start" | "end" | "move", daysPerPixel?: number) => void
  isDragging: boolean
  dragType: "start" | "end" | "move" | "reorder" | null
}

const TimelineItem = forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ 
    task,
    month,
    isSelected,
    onSelect,
    onKeyDown,
    onToggleComplete,
    onDragStart,
    isDragging,
    dragType
  }, ref) => {
    // 月のカレンダー幅を取得（実際のDOM要素から）
    const monthGridRef = useRef<HTMLDivElement>(null);
    const [monthWidth, setMonthWidth] = useState(0);
    
    useEffect(() => {
      const updateWidth = () => {
        if (monthGridRef.current) {
          setMonthWidth(monthGridRef.current.offsetWidth);
        }
      };
      
      // 初期化時とリサイズ時に幅を更新
      updateWidth();
      window.addEventListener('resize', updateWidth);
      
      return () => {
        window.removeEventListener('resize', updateWidth);
      };
    }, []);
    
    // 日ごとの幅を計算（カレンダー幅 / 月の日数）
    const dayWidth = monthWidth / month.daysInMonth;
    // 日付あたりのピクセル数の逆数（1ピクセルあたりの日数）
    const daysPerPixel = dayWidth ? 1 / dayWidth : 0.04;
    
    // 優先度に基づく色の設定
    const getTaskColor = () => {
      if (task.completed) return 'bg-green-200'
      
      switch (task.priority) {
        case 'high': return 'bg-red-200'
        case 'medium': return 'bg-yellow-200'
        case 'low': return 'bg-blue-200'
        default: return 'bg-blue-200'
      }
    }
    
    // より正確な日付位置計算
    const getPositionFromDate = (dateStr: string): number => {
      const dateObj = new Date(dateStr);
      // 月が一致しない場合は境界値を返す
      if (dateStr.substring(0, 7) !== month.id) {
        return dateStr < month.id ? 0 : 100;
      }
      
      const day = dateObj.getDate();
      return ((day - 1) / month.daysInMonth) * 100;
    };
    
    // 開始日と終了日の位置をパーセンテージで計算
    const startPosition = getPositionFromDate(task.startDate);
    const endPosition = getPositionFromDate(task.dueDate);
    const width = Math.max(endPosition - startPosition, 3); // 最小幅を確保

    return (
      <div className="flex mt-1">
        <div className="w-40 truncate pr-2 flex items-center">
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => onToggleComplete(task.id)}
            className="mr-2"
          />
          <span className={task.completed ? "line-through text-gray-400" : ""}>
            {task.name}
            {task.tags && task.tags.length > 0 && (
              <span className="ml-1 text-xs text-gray-500">
                ({task.tags.join(', ')})
              </span>
            )}
          </span>
        </div>
        <div
          ref={monthGridRef}
          className="flex-1 grid relative border-l border-gray-200"
          style={{ gridTemplateColumns: `repeat(${month.daysInMonth}, minmax(25px, 1fr))` }}
        >
          {/* 現在の日付を示すマーカー */}
          {month.id === new Date().toISOString().substring(0, 7) && (
            <div
              className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
              style={{
                left: `${((new Date().getDate() - 1) / month.daysInMonth) * 100}%`
              }}
            ></div>
          )}
          
          <div
            ref={ref}
            className={`absolute h-6 rounded ${getTaskColor()} ${
              isSelected ? "ring-2 ring-blue-500" : ""
            } ${isDragging ? "opacity-70" : ""} cursor-grab transition-all duration-100`}
            style={{
              left: `${startPosition}%`,
              width: `${width}%`,
              top: "4px",
            }}
            onClick={onSelect}
            tabIndex={0}
            onKeyDown={(e) => onKeyDown(e, task.id)}
            onMouseDown={(e) => onDragStart(e, task, "move", daysPerPixel)}
            data-task-id={task.id}
          >
            <div className="text-xs px-2 truncate flex justify-between items-center h-full">
              <div className="flex items-center gap-1">
                <span>{task.name}</span>
                {task.assignee && (
                  <span className="text-gray-600 text-xs">({task.assignee})</span>
                )}
              </div>
              <div className="flex space-x-1">
                <div
                  className="cursor-w-resize w-1 h-4 bg-gray-400 opacity-50 hover:opacity-100 rounded"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    onDragStart(e, task, "start", daysPerPixel)
                  }}
                />
                <div
                  className="cursor-e-resize w-1 h-4 bg-gray-400 opacity-50 hover:opacity-100 rounded"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    onDragStart(e, task, "end", daysPerPixel)
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

TimelineItem.displayName = "TimelineItem"

export default TimelineItem