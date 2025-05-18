import React from 'react';
import { useDispatch } from 'react-redux';
import { Check, Edit, Copy, Trash, Calendar, Clock, AlertCircle } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { updateTaskStatus } from '../../store/slices/tasksSlice';
import { openTaskEditModal, openDeleteConfirmation } from '../../store/slices/uiSlice';
import { duplicateTask } from '../../store/slices/tasksSlice';
import { Task, SubTask, TaskStatus } from '../../types/task';
import { HoverInfo } from '../../types/timeline';

interface TaskDetailPopoverProps {
  info: HoverInfo | null;
}

const TaskDetailPopover: React.FC<TaskDetailPopoverProps> = ({ info }) => {
  const dispatch = useDispatch();

  if (!info) return null;
  
  const { task, position, projectId, taskId, subtaskId, projectColor } = info;
  
  // ステータスラベルの安全なアクセスのためのマッピング
  const statusLabels: Record<TaskStatus, string> = {
    'completed': '完了',
    'in-progress': '進行中',
    'not-started': '未開始',
    'overdue': '遅延'
  };
  
  // ステータスアイコンの安全なアクセスのためのマッピング
  const statusIcons: Record<TaskStatus, React.ReactNode> = {
    'completed': <Check size={14} className="text-green-500" />,
    'in-progress': <Clock size={14} className="text-blue-500" />,
    'not-started': <Clock size={14} className="text-gray-400" />,
    'overdue': <AlertCircle size={14} className="text-red-500" />
  };
  
  // タスクステータス更新
  const handleStatusUpdate = () => {
    dispatch(updateTaskStatus({ 
      projectId, 
      taskId, 
      subtaskId, 
      status: task.status === 'completed' ? 'not-started' : 'completed'
    }));
  };
  
  // タスク編集モーダルを開く
  const handleEdit = () => {
    dispatch(openTaskEditModal({ 
      mode: 'edit',
      projectId, 
      taskId, 
      subtaskId 
    }));
  };
  
  // タスク複製
  const handleDuplicate = () => {
    dispatch(duplicateTask({ projectId, taskId, subtaskId }));
  };
  
  // タスク削除確認
  const handleDelete = () => {
    dispatch(openDeleteConfirmation({ 
      projectId, 
      taskId, 
      subtaskId 
    }));
  };
  
  return (
    <div 
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-3 w-64"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="font-medium text-sm mb-2 text-gray-800 dark:text-gray-200">{task.name}</h3>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400">ステータス:</span>
          <span 
            className={`font-medium flex items-center ${
              task.status === 'completed' ? 'text-green-600 dark:text-green-400' : 
              task.status === 'in-progress' ? 'text-blue-600 dark:text-blue-400' : 
              task.status === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {statusIcons[task.status as TaskStatus]}
            <span className="ml-1">{statusLabels[task.status as TaskStatus]}</span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400">期間:</span>
          <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <Calendar size={12} className="mr-1" />
            {formatDate(task.start)} - {formatDate(task.end)}
          </span>
        </div>
        
        {task.notes && (
          <div className="mt-2">
            <span className="text-gray-500 dark:text-gray-400 block mb-1">ノート:</span>
            <div className="pl-2 text-gray-700 dark:text-gray-300 border-l-2 border-gray-200 dark:border-gray-700">
              {task.notes.length > 100 ? task.notes.substring(0, 100) + '...' : task.notes}
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2 flex space-x-2 justify-end">
        <button 
          className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          onClick={handleStatusUpdate}
          aria-label={task.status === 'completed' ? 'タスクを未完了に戻す' : 'タスクを完了としてマーク'}
        >
          <Check size={14} />
        </button>
        <button 
          className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          onClick={handleEdit}
          aria-label="タスクを編集"
        >
          <Edit size={14} />
        </button>
        <button 
          className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          onClick={handleDuplicate}
          aria-label="タスクを複製"
        >
          <Copy size={14} />
        </button>
        <button 
          className="p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
          onClick={handleDelete}
          aria-label="タスクを削除"
        >
          <Trash size={14} />
        </button>
      </div>
    </div>
  );
};

export default TaskDetailPopover;