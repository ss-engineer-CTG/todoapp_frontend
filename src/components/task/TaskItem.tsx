import React from 'react';
import { format } from 'date-fns';
import { Task } from '../../models/task';
import { useTaskContext } from '../../contexts/TaskContext';
import TaskStatusBadge from './TaskStatusBadge';
import { useTaskStatus } from '../../hooks/useTaskStatus';

interface TaskItemProps {
  task: Task;
  depth?: number; // ネストレベル（インデント用）
  onEdit?: (task: Task) => void; // 編集ボタンクリック時のコールバック
  onNoteOpen?: (task: Task) => void; // ノートボタンクリック時のコールバック
}

/**
 * タスク項目表示コンポーネント
 * リスト表示で使用される個別タスクの表示
 */
const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  depth = 0, 
  onEdit, 
  onNoteOpen 
}) => {
  const { toggleTaskCompletion, deleteTask } = useTaskContext();
  const { status } = useTaskStatus(task);
  
  // タスク完了状態の切り替え
  const handleToggleCompletion = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTaskCompletion(task.id);
  };
  
  // タスク削除
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('このタスクを削除してもよろしいですか？')) {
      deleteTask(task.id);
    }
  };
  
  // タスク編集
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(task);
  };
  
  // ノート表示
  const handleNoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNoteOpen?.(task);
  };

  return (
    <div 
      className={`
        group flex items-center p-3 border rounded mb-2 
        ${depth > 0 ? `ml-${depth * 6}` : ''}
        ${status === 'completed' ? 'bg-gray-100' : 'bg-white'}
        hover:shadow-sm transition-shadow duration-200
      `}
    >
      {/* チェックボックス */}
      <button
        onClick={handleToggleCompletion}
        className={`
          w-5 h-5 rounded border flex items-center justify-center mr-3
          ${task.completed ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300'}
        `}
      >
        {task.completed && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      
      {/* タスク情報 */}
      <div className="flex-1">
        <div className="flex items-center">
          <h3 className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
            {task.title}
          </h3>
          <TaskStatusBadge status={status} className="ml-2" />
        </div>
        
        <div className="text-xs text-gray-500 mt-1">
          {format(task.startDate, 'yyyy/MM/dd')} - {format(task.endDate, 'yyyy/MM/dd')}
        </div>
      </div>
      
      {/* アクションボタン */}
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* ノートボタン */}
        <button
          onClick={handleNoteClick}
          className="p-1 text-gray-500 hover:text-blue-500"
          title="ノートを開く"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        
        {/* 編集ボタン */}
        <button
          onClick={handleEdit}
          className="p-1 text-gray-500 hover:text-blue-500"
          title="編集"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        
        {/* 削除ボタン */}
        <button
          onClick={handleDelete}
          className="p-1 text-gray-500 hover:text-red-500"
          title="削除"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TaskItem;