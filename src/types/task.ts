// タスクの状態
export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'overdue';

// タスクの優先度
export type TaskPriority = 'low' | 'medium' | 'high';

// Projectを別途インポート（型として）
export type { Project } from './project';

// サブタスクのインターフェース
export interface SubTask {
  id: string;
  name: string;
  start: string; // ISO形式の日付文字列
  end: string;   // ISO形式の日付文字列
  status: TaskStatus;
  notes?: string;
}

// タスクのインターフェース
export interface Task {
  id: string;
  name: string;
  start: string; // ISO形式の日付文字列
  end: string;   // ISO形式の日付文字列
  status: TaskStatus;
  expanded: boolean;
  notes?: string;
  priority?: TaskPriority;
  subtasks: SubTask[];
}

// インライン編集用タスクデータ
export interface InlineEditTask {
  projectId: string;
  taskId: string;
  subtaskId?: string | null;
  name: string;
}

// リピートタスクのオプション
export interface RepeatOptions {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number; // 間隔（例：1=毎日、2=2日おき）
  daysOfWeek?: number[]; // 週次の場合（0=日曜、1=月曜...）
  dayOfMonth?: number; // 月次の場合
  endAfter?: number; // 繰り返し回数
  endDate?: string; // 終了日
  excludeDates?: string[]; // 除外日
}