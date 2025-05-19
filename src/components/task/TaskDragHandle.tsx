import React from 'react';

interface TaskDragHandleProps {
  type: 'start' | 'end';
  onMouseDown: (e: React.MouseEvent) => void;
}

const TaskDragHandle: React.FC<TaskDragHandleProps> = ({ type, onMouseDown }) => {
  return (
    <div 
      className={`drag-handle ${type} absolute top-0 bottom-0 cursor-ew-resize z-10 hover:bg-indigo-500/20`}
      style={{
        width: '8px',
        [type === 'start' ? 'left' : 'right']: 0
      }}
      onMouseDown={onMouseDown}
      aria-label={type === 'start' ? '開始日を調整' : '終了日を調整'}
    >
      <div 
        className={`w-1 h-full mx-auto ${type === 'start' ? 'ml-1' : 'mr-1'} hover:bg-indigo-600/40`}
      />
    </div>
  );
};

export default TaskDragHandle;