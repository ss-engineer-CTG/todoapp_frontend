// src/hooks/useTaskStatus.ts
import { useMemo } from "react";
import { Task } from "../types/Task";

// タスクのステータス種別
export type TaskStatus = 'delayed' | 'active' | 'future' | 'completed';

// タスクのステータス情報
export interface TaskStatusInfo {
  status: TaskStatus;
  color: string;
  backgroundColor: string;
  borderColor: string;
  label: string;
}

/**
 * タスクのステータスを判定し、関連する表示情報を提供するカスタムフック
 */
export function useTaskStatus() {
  /**
   * タスクのステータスを判定
   * @param task タスク
   * @param today 今日の日付（YYYY-MM-DD形式）
   * @returns タスクのステータス
   */
  const getTaskStatus = (task: Task, today: string): TaskStatus => {
    // 完了済み
    if (task.completed) {
      return 'completed';
    }
    
    // 遅延（期限切れ）
    if (today > task.dueDate) {
      return 'delayed';
    }
    
    // 進行中（現在日付が開始～終了の間）
    if (today >= task.startDate && today <= task.dueDate) {
      return 'active';
    }
    
    // 未来タスク
    return 'future';
  };

  /**
   * タスクのステータスに基づく色情報を取得
   * @param status タスクのステータス
   * @returns 色情報
   */
  const getStatusColors = (status: TaskStatus): { bg: string, border: string, text: string } => {
    switch (status) {
      case 'delayed':
        return {
          bg: '#FECACA', // 薄い赤
          border: '#EF4444', // 赤
          text: '#B91C1C', // 濃い赤
        };
      case 'active':
        return {
          bg: '#BFDBFE', // 薄い青
          border: '#3B82F6', // 青
          text: '#1E40AF', // 濃い青
        };
      case 'future':
        return {
          bg: '#A7F3D0', // 薄い緑
          border: '#10B981', // 緑
          text: '#047857', // 濃い緑
        };
      case 'completed':
        return {
          bg: '#E5E7EB', // 薄い灰色
          border: '#9CA3AF', // 灰色
          text: '#4B5563', // 濃い灰色
        };
      default:
        return {
          bg: '#E5E7EB',
          border: '#9CA3AF',
          text: '#4B5563',
        };
    }
  };

  /**
   * タスクのステータスに応じたラベルを取得
   * @param status タスクのステータス
   * @returns ステータスラベル
   */
  const getStatusLabel = (status: TaskStatus): string => {
    switch (status) {
      case 'delayed': return '遅延';
      case 'active': return '進行中';
      case 'future': return '未来';
      case 'completed': return '完了';
      default: return '不明';
    }
  };

  /**
   * タスクの詳細なステータス情報を取得
   * @param task タスク
   * @param today 今日の日付（YYYY-MM-DD形式）
   * @returns タスクのステータス情報
   */
  const getTaskStatusInfo = (task: Task, today: string): TaskStatusInfo => {
    const status = getTaskStatus(task, today);
    const { bg, border, text } = getStatusColors(status);
    
    return {
      status,
      color: text,
      backgroundColor: bg,
      borderColor: border,
      label: getStatusLabel(status)
    };
  };

  return {
    getTaskStatus,
    getStatusColors,
    getStatusLabel,
    getTaskStatusInfo
  };
}