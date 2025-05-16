import { useMemo } from 'react';
import { isAfter, isBefore, isSameDay } from 'date-fns';
import { Task, TaskStatus } from '../models/task';

interface StatusColors {
  background: string;
  border: string;
  text: string;
}

interface UseTaskStatusResult {
  status: TaskStatus;
  statusColors: StatusColors;
}

/**
 * カスタムフック: タスクのステータスを計算
 * 
 * タスクの開始日・終了日・完了状態から現在のステータスとカラーを計算
 */
export const useTaskStatus = (task: Task): UseTaskStatusResult => {
  return useMemo(() => {
    const today = new Date();
    
    // ステータスを判定
    let status: TaskStatus;
    
    // 完了タスク
    if (task.completed) {
      status = 'completed';
    }
    // 遅延タスク（終了日が過ぎているが未完了）
    else if (isAfter(today, task.endDate)) {
      status = 'delayed';
    }
    // 進行中タスク（今日が開始日と終了日の間）
    else if (
      (isAfter(today, task.startDate) || isSameDay(today, task.startDate)) &&
      (isBefore(today, task.endDate) || isSameDay(today, task.endDate))
    ) {
      status = 'active';
    }
    // 未来タスク（開始日がまだ来ていない）
    else {
      status = 'future';
    }
    
    // ステータスに応じたカラーを設定
    let statusColors: StatusColors;
    
    switch (status) {
      case 'delayed':
        statusColors = {
          background: '#fecaca', // bg-red-200
          border: '#ef4444',     // border-red-500
          text: '#b91c1c'        // text-red-800
        };
        break;
      case 'active':
        statusColors = {
          background: '#bfdbfe', // bg-blue-200
          border: '#3b82f6',     // border-blue-500
          text: '#1e40af'        // text-blue-800
        };
        break;
      case 'future':
        statusColors = {
          background: '#a7f3d0', // bg-green-200
          border: '#10b981',     // border-green-500
          text: '#047857'        // text-green-800
        };
        break;
      case 'completed':
        statusColors = {
          background: '#e5e7eb', // bg-gray-200
          border: '#9ca3af',     // border-gray-400
          text: '#4b5563'        // text-gray-600
        };
        break;
      default:
        statusColors = {
          background: '#f3f4f6', // bg-gray-100
          border: '#d1d5db',     // border-gray-300
          text: '#374151'        // text-gray-700
        };
    }
    
    return { status, statusColors };
  }, [task.startDate, task.endDate, task.completed]);
};

export default useTaskStatus;