import React from 'react';

interface TaskDragHandleProps {
  type: 'start' | 'end';
  onMouseDown: (e: React.MouseEvent) => void;
}

const TaskDragHandle: React.FC<TaskDragHandleProps> = ({ type, onMouseDown }) => {
  return (
    <div 
      className={`drag-handle ${type}`}
      onMouseDown={onMouseDown}
      aria-label={type === 'start' ? '開始日を調整' : '終了日を調整'}
    ></div>
  );
};

export default TaskDragHandle;