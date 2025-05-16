import React, { useRef, useEffect, useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Task } from '../../models/task';
import { useTaskStatus } from '../../hooks/useTaskStatus';

interface TaskDetailPopoverProps {
  task: Task;
  position?: 'top' | 'bottom' | 'left' | 'right';
  parentRef?: React.RefObject<HTMLElement>;
  onEdit?: () => void;
  onNote?: () => void;
  onToggleCompletion?: () => void;
  onDelete?: () => void;
}

/**
 * タスク詳細ポップオーバーコンポーネント
 * タスクにホバーした際に詳細情報を表示
 */
const TaskDetailPopover: React.FC<TaskDetailPopoverProps> = ({
  task,
  position = 'top',
  parentRef,
  onEdit,
  onNote,
  onToggleCompletion,
  onDelete
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState({});
  const { status, statusColors } = useTaskStatus(task);
  
  // タスクの期間（日数）を計算
  const taskDuration = differenceInDays(task.endDate, task.startDate) + 1;
  
  // 親要素の位置を基にポップオーバーの位置を計算
  useEffect(() => {
    if (!popoverRef.current || !parentRef?.current) return;
    
    const parentRect = parentRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    
    let top = 0;
    let left = 0;
    
    switch (position) {
      case 'top':
        top = -popoverRect.height - 10;
        left = Math.max(0, (parentRect.width - popoverRect.width) / 2);
        break;
      case 'bottom':
        top = parentRect.height + 10;
        left = Math.max(0, (parentRect.width - popoverRect.width) / 2);
        break;
      case 'left':
        top = Math.max(0, (parentRect.height - popoverRect.height) / 2);
        left = -popoverRect.width - 10;
        break;
      case 'right':
        top = Math.max(0, (parentRect.height - popoverRect.height) / 2);
        left = parentRect.width + 10;
        break;
    }
    
    setPopoverStyle({
      top: `${top}px`,
      left: `${left}px`
    });
  }, [position, parentRef]);

  return (
    <div
      ref={popoverRef}
      className={`
        task-detail-popover absolute z-30 bg-white rounded shadow-lg border
        transition-opacity duration-150 max-w-sm
      `}
      style={{
        ...popoverStyle,
        borderColor: statusColors.border
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ポップオーバーヘッダー */}
      <div
        className="popover-header p-3 rounded-t border-b"
        style={{ backgroundColor: statusColors.background }}
      >
        <div className="flex justify-between items-start">
          <h3 className="task-title text-sm font-medium" style={{ color: statusColors.text }}>
            {task.title}
          </h3>
          <span className={`
            status-badge px-2 py-0.5 rounded-full text-xs font-medium
            ${status === 'delayed' ? 'bg-red-100 text-red-800' : ''}
            ${status === 'active' ? 'bg-blue-100 text-blue-800' : ''}
            ${status === 'future' ? 'bg-green-100 text-green-800' : ''}
            ${status === 'completed' ? 'bg-gray-100 text-gray-800' : ''}
          `}>
            {status === 'delayed' ? '遅延' : 
             status === 'active' ? '進行中' : 
             status === 'future' ? '未来' : 
             status === 'completed' ? '完了' : '不明'}
          </span>
        </div>
      </div>
      
      {/* ポップオーバー本文 */}
      <div className="popover-body p-3">
        <div className="detail-row mb-2">
          <span className="detail-label text-xs text-gray-500">期間:</span>
          <div className="detail-value text-sm text-gray-700">
            {format(task.startDate, 'yyyy/MM/dd')} - {format(task.endDate, 'yyyy/MM/dd')}
            <span className="text-xs text-gray-500 ml-1">（{taskDuration}日）</span>
          </div>
        </div>
        
        {task.completed && task.completedAt && (
          <div className="detail-row mb-2">
            <span className="detail-label text-xs text-gray-500">完了日:</span>
            <div className="detail-value text-sm text-gray-700">
              {format(task.completedAt, 'yyyy/MM/dd')}
            </div>
          </div>
        )}
        
        {task.noteContent && (
          <div className="detail-row mb-2">
            <span className="detail-label text-xs text-gray-500">ノート:</span>
            <div className="detail-value text-sm text-gray-700 mt-1 line-clamp-3">
              {task.noteContent}
            </div>
          </div>
        )}
        
        {/* アクションボタン */}
        <div className="actions flex justify-end space-x-1 mt-3">
          {onToggleCompletion && (
            <button
              className="p-1 text-gray-500 hover:text-blue-500"
              onClick={onToggleCompletion}
              title={task.completed ? "完了解除" : "完了にする"}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          
          {onNote && (
            <button
              className="p-1 text-gray-500 hover:text-blue-500"
              onClick={onNote}
              title="ノートを開く"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          
          {onEdit && (
            <button
              className="p-1 text-gray-500 hover:text-blue-500"
              onClick={onEdit}
              title="編集"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          
          {onDelete && (
            <button
              className="p-1 text-gray-500 hover:text-red-500"
              onClick={onDelete}
              title="削除"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* 矢印 */}
      <div
        className={`
          arrow absolute w-3 h-3 bg-white transform rotate-45 border
          ${position === 'top' ? 'bottom-0 translate-y-1.5' : ''}
          ${position === 'bottom' ? 'top-0 -translate-y-1.5' : ''}
          ${position === 'left' ? 'right-0 translate-x-1.5' : ''}
          ${position === 'right' ? 'left-0 -translate-x-1.5' : ''}
        `}
        style={{
          borderColor: statusColors.border,
          left: position === 'top' || position === 'bottom' ? 'calc(50% - 6px)' : '',
          top: position === 'left' || position === 'right' ? 'calc(50% - 6px)' : ''
        }}
      />
    </div>
  );
};

export default TaskDetailPopover;