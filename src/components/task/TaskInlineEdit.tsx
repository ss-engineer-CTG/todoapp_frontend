import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { InlineEditTask } from '../../types/task';
import { saveInlineEditTask, cancelInlineEditTask } from '../../store/slices/tasksSlice';

interface TaskInlineEditProps {
  editData: InlineEditTask;
  onChange: (name: string) => void;
}

const TaskInlineEdit: React.FC<TaskInlineEditProps> = ({ editData, onChange }) => {
  const dispatch = useDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // コンポーネントマウント時に入力フィールドにフォーカス
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);
  
  // 保存処理
  const handleSave = () => {
    dispatch(saveInlineEditTask(editData));
  };
  
  // キャンセル処理
  const handleCancel = () => {
    dispatch(cancelInlineEditTask());
  };
  
  return (
    <input
      type="text"
      className="px-2 text-xs font-medium w-full h-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
      value={editData.name}
      onChange={(e) => onChange(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleSave();
        } else if (e.key === 'Escape') {
          handleCancel();
        }
      }}
      ref={inputRef}
      onClick={(e) => e.stopPropagation()}
    />
  );
};

export default TaskInlineEdit;