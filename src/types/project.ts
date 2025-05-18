import { Task } from './task';

// プロジェクトのインターフェース
export interface Project {
  id: string;
  name: string;
  color: string; // HEX形式の色コード
  expanded: boolean;
  tasks: Task[];
  description?: string;
  startDate?: string; // ISO形式の日付文字列
  endDate?: string;   // ISO形式の日付文字列
  pinned?: boolean;   // ピン留めされているか
}

// プロジェクトの統計情報インターフェース
export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  overdueCount: number;
  completionPercentage: number;
  remainingDays?: number;
}