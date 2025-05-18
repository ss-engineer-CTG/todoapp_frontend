import { Task, SubTask } from './task';

// タイムラインスケール
export type TimelineScale = 'day' | 'week' | 'month';

// ドラッグ操作の種類
export type DragType = 'move' | 'resize-start' | 'resize-end';

// ドラッグ情報
export interface DragInfo {
  projectId: string;
  taskId: string;
  subtaskId?: string | null;
  type: DragType;
  initialX: number;
  startX: number;
  currentX?: number;
  taskStart: Date | null;
  taskEnd: Date | null;
  daysDelta: number;
}

// ホバー情報
export interface HoverInfo {
  projectId: string;
  taskId: string;
  subtaskId?: string | null;
  task: Task | SubTask;
  projectColor: string;
  position: {
    x: number;
    y: number;
  };
}

// タイムライン表示の設定
export interface TimelineSettings {
  scale: TimelineScale;
  zoomLevel: number;
  showWeekends: boolean;
  showToday: boolean;
  showCompletedTasks: boolean;
  taskBarHeight: number;
  projectGrouping: boolean;
  autoScroll: boolean;
}

// タイムラインフィルター
export interface TimelineFilter {
  viewMode: 'all' | 'today' | 'overdue';
  projects: string[]; // 表示するプロジェクトIDの配列
  statuses: string[]; // 表示するステータスの配列
  search?: string;    // 検索テキスト
}