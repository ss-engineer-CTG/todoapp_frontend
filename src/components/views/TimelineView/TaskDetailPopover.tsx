// src/components/views/TimelineView/TaskDetailPopover.tsx
import React from "react";
import { Task } from "../../../types/Task";
import { formatDateDisplay } from "../../../utils/timelineUtils";
import { calculateDaysBetween } from "../../../utils/timelineUtils";
import { TaskStatusInfo } from "../../../hooks/useTaskStatus";
import { Badge } from "@/components/ui/badge";

interface TaskDetailPopoverProps {
  task: Task;
  statusInfo: TaskStatusInfo;
  className?: string;
}

export default function TaskDetailPopover({
  task,
  statusInfo,
  className = ""
}: TaskDetailPopoverProps) {
  // タスクの期間（日数）
  const durationDays = calculateDaysBetween(task.startDate, task.dueDate);
  
  return (
    <div className={`
      absolute invisible group-hover:visible left-1/2 -translate-x-1/2 -top-[10rem]
      w-72 bg-white p-3 rounded-lg shadow-lg z-30 border text-sm
      transition-opacity duration-150 opacity-0 group-hover:opacity-100
      ${className}
    `}>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-4 h-4 bg-white border-r border-b"></div>
      
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-gray-800 truncate max-w-[200px]">{task.name}</h4>
        <div 
          className="px-2 py-0.5 rounded-full text-xs font-medium" 
          style={{
            backgroundColor: statusInfo.backgroundColor,
            color: statusInfo.color,
            borderColor: statusInfo.borderColor,
          }}
        >
          {statusInfo.label}
        </div>
      </div>
      
      <div className="grid grid-cols-[80px_1fr] gap-1 text-sm">
        <div className="text-gray-500">期間:</div>
        <div className="font-medium">
          {formatDateDisplay(task.startDate, 'medium')} - {formatDateDisplay(task.dueDate, 'medium')}
          <span className="ml-1 text-xs text-gray-500">({durationDays}日間)</span>
        </div>
        
        {task.assignee && (
          <>
            <div className="text-gray-500">担当者:</div>
            <div className="font-medium">{task.assignee}</div>
          </>
        )}
        
        {/* ここで進捗率を表示する場合（進捗率のフィールドがある場合） */}
        {task.priority && (
          <>
            <div className="text-gray-500">優先度:</div>
            <div className="font-medium">
              {task.priority === 'high' ? '高' : 
               task.priority === 'medium' ? '中' : '低'}
            </div>
          </>
        )}
      </div>
      
      {/* タグがあれば表示 */}
      {task.tags && task.tags.length > 0 && (
        <div className="mt-2">
          <div className="text-gray-500 mb-1">タグ:</div>
          <div className="flex flex-wrap gap-1">
            {task.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs py-0 px-2">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* メモがあれば表示 */}
      {task.notes && (
        <div className="mt-2">
          <div className="text-gray-500 mb-1">メモ:</div>
          <div className="text-xs bg-gray-50 p-2 rounded max-h-[60px] overflow-y-auto">
            {task.notes}
          </div>
        </div>
      )}
      
      {/* 完了日があれば表示 */}
      {task.completed && task.completionDate && (
        <div className="mt-2 text-xs text-gray-500">
          {formatDateDisplay(task.completionDate, 'full')}に完了
        </div>
      )}
    </div>
  );
}