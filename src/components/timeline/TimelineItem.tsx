import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../../models/task';
import { useTaskStatus } from '../../hooks/useTaskStatus';
import { format, addDays, differenceInDays } from 'date-fns';
import { useTaskContext } from '../../contexts/TaskContext';
import TaskDetailPopover from './TaskDetailPopover';

interface TimelineItemProps {
  task: Task;
  rowIndex: number;
  depth: number; // 使用しない場合でも型定義を保持
  dayWidth: number;
  startDate: Date;
  rowHeight: number;
  isSelected: boolean;
  isDragging: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onDragStart: (type: 'start' | 'end' | 'move') => void;
  onDragEnd: () => void;
  onEdit?: () => void;
  onNote?: () => void;
  onToggleCompletion?: () => void;
  onDelete?: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/**
 * タイムライン上の個別タスクバーコンポーネント
 * タスクの期間とステータスを視覚化し、ドラッグ操作を処理
 */
const TimelineItem: React.FC<TimelineItemProps> = ({
  task,
  rowIndex,
  depth: _depth, // 使用しないが型定義のために残す
  dayWidth,
  startDate,
  rowHeight,
  isSelected,
  isDragging,
  isHovered,
  onSelect,
  onDragStart,
  onDragEnd,
  onEdit,
  onNote,
  onToggleCompletion,
  onDelete,
  onMouseEnter,
  onMouseLeave
}) => {
  const { updateTask } = useTaskContext();
  const { statusColors } = useTaskStatus(task);
  const [dragType, setDragType] = useState<'start' | 'end' | 'move' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const [dragEndDate, setDragEndDate] = useState<Date | null>(null);
  const [showPopover, setShowPopover] = useState(false);
  
  const itemRef = useRef<HTMLDivElement>(null);
  
  // タスクの表示位置とサイズを計算
  const calculatePosition = () => {
    // 開始日の差分（日数）
    const daysDiff = differenceInDays(task.startDate, startDate);
    
    // タスクの期間（日数）
    const duration = Math.max(1, differenceInDays(task.endDate, task.startDate) + 1);
    
    // 位置計算
    const left = Math.max(0, daysDiff * dayWidth);
    const width = duration * dayWidth;
    
    return { left, width };
  };
  
  const position = calculatePosition();
  
  // ドラッグによる日付変更
  const updateDates = (diffDays: number) => {
    if (!dragStartDate) return;
    
    if (dragType === 'start') {
      // 開始日変更（終了日より後にはならないようにする）
      const newStartDate = addDays(dragStartDate, diffDays);
      if (newStartDate <= task.endDate) {
        updateTask({
          ...task,
          startDate: newStartDate
        });
      }
    } else if (dragType === 'end') {
      // 終了日変更（開始日より前にはならないようにする）
      const newEndDate = addDays(dragEndDate!, diffDays);
      if (newEndDate >= task.startDate) {
        updateTask({
          ...task,
          endDate: newEndDate
        });
      }
    } else if (dragType === 'move') {
      // 全体移動
      const newStartDate = addDays(dragStartDate, diffDays);
      const newEndDate = addDays(dragEndDate!, diffDays);
      updateTask({
        ...task,
        startDate: newStartDate,
        endDate: newEndDate
      });
    }
  };
  
  // ドラッグ開始
  const handleMouseDown = (e: React.MouseEvent, type: 'start' | 'end' | 'move') => {
    if (e.button !== 0) return; // 左クリックのみ
    e.preventDefault();
    e.stopPropagation();
    
    setDragType(type);
    setDragStartX(e.clientX);
    setDragStartDate(new Date(task.startDate));
    setDragEndDate(new Date(task.endDate));
    
    onDragStart(type);
    
    // グローバルのマウスイベントリスナーを設定
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // ドラッグ中
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragType || !dragStartDate) return;
    
    // X方向の移動量（ピクセル）
    const deltaX = e.clientX - dragStartX;
    
    // 日数に変換
    const diffDays = Math.round(deltaX / dayWidth);
    
    if (diffDays !== 0) {
      updateDates(diffDays);
      setDragStartX(e.clientX);
    }
  };
  
  // ドラッグ終了
  const handleMouseUp = () => {
    setDragType(null);
    setDragStartDate(null);
    setDragEndDate(null);
    onDragEnd();
    
    // グローバルのマウスイベントリスナーを削除
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  // マウスホバー時にポップオーバーを表示
  const handleMouseEnter = () => {
    onMouseEnter();
    setShowPopover(true);
  };
  
  const handleMouseLeave = () => {
    onMouseLeave();
    setShowPopover(false);
  };
  
  // コンポーネントのアンマウント時にイベントリスナーを削除
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={itemRef}
      className={`
        timeline-item absolute cursor-pointer
        ${isSelected ? 'z-20' : 'z-10'}
        ${isDragging ? 'opacity-75' : ''}
      `}
      style={{
        top: `${rowIndex * rowHeight}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        height: `${rowHeight - 4}px`
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* タスクバー */}
      <div
        className={`
          task-bar h-full rounded shadow-sm flex items-center px-2
          border transition-all duration-150
          ${isSelected ? 'ring-2 ring-blue-400' : ''}
          ${isHovered ? 'shadow' : ''}
        `}
        style={{
          backgroundColor: statusColors.background,
          borderColor: statusColors.border,
          opacity: task.completed ? 0.7 : 1
        }}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
        {/* 開始日ドラッグハンドル */}
        <div
          className="drag-handle-start absolute left-0 top-0 bottom-0 w-2 cursor-w-resize"
          onMouseDown={(e) => handleMouseDown(e, 'start')}
        />
        
        {/* タスク内容 */}
        <div className="task-content flex-1 overflow-hidden text-xs">
          {position.width > 100 ? (
            <>
              <div className="task-title font-medium truncate" style={{ color: statusColors.text }}>
                {task.title}
              </div>
              {position.width > 150 && (
                <div className="task-dates text-xs opacity-75">
                  {format(task.startDate, 'MM/dd')} - {format(task.endDate, 'MM/dd')}
                </div>
              )}
            </>
          ) : position.width > 50 ? (
            <div className="task-title font-medium truncate" style={{ color: statusColors.text }}>
              {task.title}
            </div>
          ) : (
            <div className="w-full h-full" />
          )}
        </div>
        
        {/* アクションボタン - ホバー時のみ表示 */}
        {isHovered && position.width > 100 && (
          <div className="action-buttons flex space-x-1">
            {onToggleCompletion && (
              <button
                className="p-1 text-gray-500 hover:text-blue-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompletion();
                }}
                title={task.completed ? "完了解除" : "完了にする"}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
            
            {onNote && (
              <button
                className="p-1 text-gray-500 hover:text-blue-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onNote();
                }}
                title="ノートを開く"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            
            {onEdit && (
              <button
                className="p-1 text-gray-500 hover:text-blue-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                title="編集"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* 終了日ドラッグハンドル */}
        <div
          className="drag-handle-end absolute right-0 top-0 bottom-0 w-2 cursor-e-resize"
          onMouseDown={(e) => handleMouseDown(e, 'end')}
        />
      </div>
      
      {/* タスク詳細ポップオーバー */}
      {showPopover && (
        <TaskDetailPopover
          task={task}
          position="top"
          parentRef={itemRef}
          onEdit={onEdit}
          onNote={onNote}
          onToggleCompletion={onToggleCompletion}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};

export default TimelineItem;