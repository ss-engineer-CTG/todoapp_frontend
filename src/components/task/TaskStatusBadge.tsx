import React from 'react';
import { TaskStatus } from '../../models/task';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

/**
 * タスクステータスバッジコンポーネント
 * タスクのステータスを視覚的に表示するバッジ
 */
const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'delayed':
        return {
          label: '遅延',
          className: 'bg-red-100 text-red-800',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'active':
        return {
          label: '進行中',
          className: 'bg-blue-100 text-blue-800',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )
        };
      case 'future':
        return {
          label: '未来',
          className: 'bg-green-100 text-green-800',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )
        };
      case 'completed':
        return {
          label: '完了',
          className: 'bg-gray-100 text-gray-800',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      default:
        return {
          label: '不明',
          className: 'bg-gray-100 text-gray-800',
          icon: null
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusInfo.className} ${className}`}>
      {statusInfo.icon}
      {statusInfo.label}
    </span>
  );
};

export default TaskStatusBadge;