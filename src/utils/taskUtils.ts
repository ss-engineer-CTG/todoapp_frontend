import { Task, SubTask } from '../types/task';
import { Project } from '../types/project';

// ID生成
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// 日付標準化ユーティリティ関数
const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

// タスク位置計算関数：グリッドの日付と一貫性のある計算方法を使用
export const getTaskPositionWithGrid = (
  task: Task | SubTask, 
  gridStartDate: Date,
  dayWidth: number
): { left: number; width: number } => {
  if (!task || !task.start || !task.end) return { left: 0, width: 0 };
  
  // 日付オブジェクトに変換し、時間部分を正規化
  const taskStart = normalizeDate(new Date(task.start));
  const taskEnd = normalizeDate(new Date(task.end));
  const timelineStartDate = normalizeDate(new Date(gridStartDate));
  
  // 無効な日付の場合はデフォルト値を返す
  if (isNaN(taskStart.getTime()) || isNaN(taskEnd.getTime()) || isNaN(timelineStartDate.getTime())) {
    return { left: 0, width: 0 };
  }
  
  // 開始日からの日数を計算
  const startDiffMs = taskStart.getTime() - timelineStartDate.getTime();
  const startDiffDays = startDiffMs / (1000 * 60 * 60 * 24);
  
  // タスクの期間（日数）を計算 - 終了日も含めるため +1 する
  const durationMs = taskEnd.getTime() - taskStart.getTime();
  const durationDays = (durationMs / (1000 * 60 * 60 * 24)) + 1;
  
  return {
    left: startDiffDays * dayWidth,
    width: durationDays * dayWidth
  };
};

// 既存の位置計算関数 - 後方互換性のために残しておく
export const getTaskPosition = (
  task: Task | SubTask, 
  timelineStart: Date | string,
  zoomLevel: number
): { left: number; width: number } => {
  if (!task || !task.start || !task.end) return { left: 0, width: 0 };
  
  // 日付オブジェクトに変換
  const taskStart = new Date(task.start);
  const taskEnd = new Date(task.end);
  const timelineStartDate = timelineStart instanceof Date ? timelineStart : new Date(timelineStart);
  
  // 無効な日付の場合はデフォルト値を返す
  if (isNaN(taskStart.getTime()) || isNaN(taskEnd.getTime()) || isNaN(timelineStartDate.getTime())) {
    return { left: 0, width: 0 };
  }
  
  // すべての日付を標準化
  const normalizedTaskStart = normalizeDate(taskStart);
  const normalizedTaskEnd = normalizeDate(taskEnd);
  const normalizedTimelineStart = normalizeDate(timelineStartDate);
  
  // 日付差をミリ秒で計算し、日数に変換
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  
  // 開始日差分の計算（整数に丸めず、正確な差分を使用）
  const startDiff = (normalizedTaskStart.getTime() - normalizedTimelineStart.getTime()) / MS_PER_DAY;
  
  // タスクの期間（日数）を計算
  const duration = ((normalizedTaskEnd.getTime() - normalizedTaskStart.getTime()) / MS_PER_DAY) + 1; // 終了日も含める
  
  // ズームレベルに応じてスケール
  const dayWidth = 34 * (zoomLevel / 100);
  
  return {
    left: startDiff * dayWidth,
    width: duration * dayWidth
  };
};

// ステータスに基づく色とスタイルを取得
export const getStatusStyle = (status: string, projectColor: string) => {
  switch (status) {
    case 'completed':
      return { 
        backgroundColor: 'rgb(16, 185, 129)', // green-500
        borderColor: 'rgb(5, 150, 105)',      // green-600
        textColor: 'text-white'
      };
    case 'in-progress':
      return { 
        backgroundColor: projectColor, 
        borderColor: projectColor,
        textColor: 'text-white'
      };
    case 'not-started':
      return { 
        backgroundColor: 'rgb(243, 244, 246)', // gray-100
        borderColor: 'rgb(156, 163, 175)',     // gray-400
        textColor: 'text-gray-700'
      };
    case 'overdue':
      return { 
        backgroundColor: 'rgb(254, 226, 226)', // red-100
        borderColor: 'rgb(239, 68, 68)',       // red-500
        textColor: 'text-red-700'
      };
    default:
      return { 
        backgroundColor: 'rgb(243, 244, 246)', // gray-100
        borderColor: 'rgb(156, 163, 175)',     // gray-400
        textColor: 'text-gray-700'
      };
  }
};

// すべてのタスクキーを取得
export const getAllTaskKeys = (projects: Project[]): string[] => {
  const taskKeys: string[] = [];
  
  projects.forEach(project => {
    if (project.expanded) {
      project.tasks.forEach(task => {
        // 親タスクを追加
        taskKeys.push(`${project.id}-${task.id}`);
        
        // 展開されている場合はサブタスクも追加
        if (task.expanded && task.subtasks && task.subtasks.length > 0) {
          task.subtasks.forEach(subtask => {
            taskKeys.push(`${project.id}-${task.id}-${subtask.id}`);
          });
        }
      });
    }
  });
  
  return taskKeys;
};

// タスクキーからプロジェクト、タスク、サブタスクIDを取得
export const parseTaskKey = (taskKey: string): {
  projectId: string;
  taskId: string;
  subtaskId?: string;
} => {
  const parts = taskKey.split('-');
  return {
    projectId: parts[0],
    taskId: parts[1],
    subtaskId: parts.length > 2 ? parts[2] : undefined
  };
};

// 指定したIDでタスクを検索
export const findTaskById = (
  projects: Project[], 
  projectId: string, 
  taskId: string, 
  subtaskId?: string
): Task | SubTask | null => {
  const project = projects.find(p => p.id === projectId);
  if (!project) return null;
  
  const task = project.tasks.find(t => t.id === taskId);
  if (!task) return null;
  
  if (subtaskId && task.subtasks) {
    return task.subtasks.find(st => st.id === subtaskId) || null;
  }
  
  return task;
};

// タスクの日付を更新
export const updateTaskDatesByDays = (
  task: Task | SubTask, 
  type: 'move' | 'resize-start' | 'resize-end', 
  daysDelta: number
): Task | SubTask => {
  const taskStart = new Date(task.start);
  const taskEnd = new Date(task.end);
  
  if (isNaN(taskStart.getTime()) || isNaN(taskEnd.getTime())) {
    return task;
  }
  
  if (type === 'move') {
    taskStart.setDate(taskStart.getDate() + daysDelta);
    taskEnd.setDate(taskEnd.getDate() + daysDelta);
  } else if (type === 'resize-start') {
    taskStart.setDate(taskStart.getDate() + daysDelta);
    
    // 開始日が終了日を超えないようにする
    if (taskStart > taskEnd) {
      taskStart.setTime(taskEnd.getTime());
    }
  } else if (type === 'resize-end') {
    taskEnd.setDate(taskEnd.getDate() + daysDelta);
    
    // 終了日が開始日より前にならないようにする
    if (taskEnd < taskStart) {
      taskEnd.setTime(taskStart.getTime());
    }
  }
  
  return {
    ...task,
    start: taskStart.toISOString(),
    end: taskEnd.toISOString()
  };
};