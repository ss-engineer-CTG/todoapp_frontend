// src/components/views/TimelineView/TimelineItem.tsx
import React, { forwardRef, useRef, useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Task } from "../../../types/Task";
import { calculateDaysBetween } from "../../../utils/timelineUtils";
import { formatDateDisplay } from "../../../utils/timelineUtils";
import { TaskStatusInfo } from "../../../hooks/useTaskStatus";
import TaskDetailPopover from "./TaskDetailPopover";

interface TimelineItemProps {
  task: Task;
  startDate: string;
  dayWidth: number;
  isSelected: boolean;
  statusInfo: TaskStatusInfo;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>, taskId: number) => void;
  onToggleComplete: (id: number) => void;
  onDragStart: (e: React.MouseEvent<HTMLDivElement>, task: Task, type: "start" | "end" | "move", daysPerPixel?: number) => void;
  isDragging: boolean;
  dragType: "start" | "end" | "move" | "reorder" | null;
}

const TimelineItem = forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ 
    task,
    startDate,
    dayWidth,
    isSelected,
    statusInfo,
    onSelect,
    onKeyDown,
    onToggleComplete,
    onDragStart,
    isDragging,
    dragType
  }, ref) => {
    // タスクの開始位置と幅を計算
    const taskStartDate = new Date(task.startDate);
    const rangeStartDate = new Date(startDate);
    
    // 開始日からの日数
    const startDiff = Math.max(0, Math.floor(
      (taskStartDate.getTime() - rangeStartDate.getTime()) / (1000 * 60 * 60 * 24)
    ));
    
    // タスクの期間（日数）
    const duration = calculateDaysBetween(task.startDate, task.dueDate);
    
    // ピクセル単位の位置と幅
    const startPosition = startDiff * dayWidth;
    const width = duration * dayWidth;
    
    // ドラッグ操作時の日数あたりのピクセル数の逆数
    const daysPerPixel = dayWidth ? 1 / dayWidth : 0.04;
    
    // 背景色とボーダー色の設定
    const { backgroundColor, borderColor } = statusInfo;
    
    // ドラッグ操作に合わせたスタイルを動的に生成
    const getContainerStyle = () => {
      return {
        left: `${startPosition}px`,
        width: `${width}px`,
        backgroundColor,
        borderColor,
        opacity: isDragging ? 0.7 : 1,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        zIndex: isSelected ? 20 : (isDragging ? 30 : 10),
      };
    };

    return (
      <div className="flex items-center h-14 mt-1 relative">
        {/* タスク名とチェックボックス（左側固定部分） */}
        <div className="flex items-center w-52 pr-2 flex-shrink-0 sticky left-0 bg-white z-10 border-r border-gray-200">
          <Checkbox
            checked={task.completed}
            onCheckedChange={() => onToggleComplete(task.id)}
            className="mr-2"
          />
          <div className="flex flex-col truncate">
            <span className={`text-sm ${task.completed ? "line-through text-gray-400" : "font-medium"}`}>
              {task.name}
            </span>
            {task.assignee && (
              <span className="text-xs text-gray-500 truncate">{task.assignee}</span>
            )}
          </div>
        </div>
        
        {/* タスクバー */}
        <div
          ref={ref}
          className={`absolute h-10 rounded-md border transition-all duration-150 shadow-sm cursor-grab
            group hover:shadow-md ${isSelected ? "ring-2 ring-blue-500" : ""}`}
          style={getContainerStyle()}
          onClick={onSelect}
          tabIndex={0}
          onKeyDown={(e) => onKeyDown(e, task.id)}
          onMouseDown={(e) => !task.completed && onDragStart(e, task, "move", daysPerPixel)}
          data-task-id={task.id}
        >
          {/* タスク詳細ポップオーバー */}
          <TaskDetailPopover task={task} statusInfo={statusInfo} />
          
          <div className="px-2 py-1 h-full flex justify-between items-center">
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate" style={{ color: statusInfo.color }}>
                {task.name}
              </span>
              <div className="flex items-center text-xs">
                <span className="truncate">
                  {formatDateDisplay(task.startDate, 'short')} - {formatDateDisplay(task.dueDate, 'short')}
                </span>
                <span className="ml-1 text-xs opacity-75">({duration}日)</span>
              </div>
            </div>
            
            {/* タスク操作ハンドル */}
            {!task.completed && (
              <div className="flex space-x-1 ml-1">
                <div
                  className="cursor-w-resize w-4 h-full opacity-30 hover:opacity-100 hover:bg-white hover:bg-opacity-30 rounded-l absolute left-0 top-0"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onDragStart(e, task, "start", daysPerPixel);
                  }}
                />
                <div
                  className="cursor-e-resize w-4 h-full opacity-30 hover:opacity-100 hover:bg-white hover:bg-opacity-30 rounded-r absolute right-0 top-0"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onDragStart(e, task, "end", daysPerPixel);
                  }}
                />
              </div>
            )}
          </div>
          
          {/* タスクタグ（あれば表示） */}
          {task.tags && task.tags.length > 0 && (
            <div className="absolute -bottom-1 left-1 flex gap-1 max-w-full overflow-hidden">
              {task.tags.slice(0, 2).map((tag) => (
                <div 
                  key={tag} 
                  className="px-1 text-[10px] bg-white bg-opacity-90 rounded border shadow-sm"
                  style={{ borderColor }}
                >
                  {tag}
                </div>
              ))}
              {task.tags.length > 2 && (
                <div className="px-1 text-[10px] bg-white bg-opacity-90 rounded border shadow-sm">
                  +{task.tags.length - 2}
                </div>
              )}
            </div>
          )}
          
          {/* 優先度表示 */}
          {task.priority && !task.completed && (
            <div 
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border shadow-sm"
              style={{ 
                backgroundColor: task.priority === 'high' ? '#ef4444' : 
                                 task.priority === 'medium' ? '#f59e0b' : '#10b981',
                borderColor: 'white' 
              }}
            />
          )}
        </div>
      </div>
    );
  }
);

TimelineItem.displayName = "TimelineItem";

export default TimelineItem;