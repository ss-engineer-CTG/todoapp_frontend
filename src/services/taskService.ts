import { Task, SubTask, RepeatOptions } from '../types/task';
import { store } from '../store/store';
import { 
  createTask, 
  updateTask, 
  deleteTask, 
  updateTaskStatus,
  updateTaskDates,
  duplicateTask
} from '../store/slices/tasksSlice';
import { generateId } from '../utils/taskUtils';

/**
 * タスク操作サービス
 * タスクの作成、編集、削除などの操作を行うサービス層
 */
class TaskService {
  /**
   * 新しいタスクを作成
   */
  createNewTask(
    projectId: string, 
    taskData: Omit<Task, 'id' | 'expanded' | 'subtasks'>, 
    parentTaskId?: string | null
  ): string {
    const taskId = generateId();
    
    store.dispatch(createTask({
      projectId,
      parentTaskId,
      task: taskData
    }));
    
    return taskId;
  }
  
  /**
   * タスクを更新
   */
  updateTaskData(
    projectId: string, 
    taskId: string, 
    taskData: Partial<Task>, 
    subtaskId?: string | null
  ): void {
    store.dispatch(updateTask({
      projectId,
      taskId,
      subtaskId,
      task: taskData
    }));
  }
  
  /**
   * タスクを削除
   */
  removeTask(
    projectId: string, 
    taskId: string, 
    subtaskId?: string | null
  ): void {
    store.dispatch(deleteTask({
      projectId,
      taskId,
      subtaskId
    }));
  }
  
  /**
   * タスクのステータスを更新
   */
  setTaskStatus(
    projectId: string, 
    taskId: string, 
    status: string, 
    subtaskId?: string | null
  ): void {
    store.dispatch(updateTaskStatus({
      projectId,
      taskId,
      subtaskId,
      status
    }));
  }
  
  /**
   * タスクの日付を更新
   */
  updateTaskDateRange(
    projectId: string, 
    taskId: string, 
    startDate: Date | string, 
    endDate: Date | string, 
    subtaskId?: string | null
  ): void {
    const task = this.getTask(projectId, taskId, subtaskId);
    if (!task) return;
    
    // 日付をISOString形式に変換
    const start = startDate instanceof Date ? startDate.toISOString() : startDate;
    const end = endDate instanceof Date ? endDate.toISOString() : endDate;
    
    store.dispatch(updateTask({
      projectId,
      taskId,
      subtaskId,
      task: { start, end }
    }));
  }
  
  /**
   * タスクをドラッグ操作で移動/リサイズ
   */
  moveTaskByDrag(
    projectId: string, 
    taskId: string, 
    type: 'move' | 'resize-start' | 'resize-end', 
    daysDelta: number, 
    subtaskId?: string | null
  ): void {
    store.dispatch(updateTaskDates({
      projectId,
      taskId,
      subtaskId,
      type,
      daysDelta
    }));
  }
  
  /**
   * タスクを複製
   */
  duplicateTaskItem(
    projectId: string, 
    taskId: string, 
    subtaskId?: string | null
  ): string {
    const newId = generateId();
    
    store.dispatch(duplicateTask({
      projectId,
      taskId,
      subtaskId,
      newId
    }));
    
    return newId;
  }
  
  /**
   * 繰り返しタスクを作成
   */
  createRecurringTask(
    projectId: string, 
    taskData: Omit<Task, 'id' | 'expanded' | 'subtasks'>, 
    repeatOptions: RepeatOptions,
    parentTaskId?: string | null
  ): string[] {
    const taskIds: string[] = [];
    const { type, interval, daysOfWeek, endAfter, endDate } = repeatOptions;
    
    // 基本タスクを作成
    const baseTaskId = this.createNewTask(projectId, taskData, parentTaskId);
    taskIds.push(baseTaskId);
    
    // 開始日と繰り返し回数に基づいて追加タスクを生成
    const startDate = new Date(taskData.start);
    const duration = this.calculateTaskDuration(taskData.start, taskData.end);
    let currentDate = new Date(startDate);
    let instanceCount = 1;
    
    // 繰り返し回数または終了日に基づいて生成
    const shouldContinue = () => {
      if (endAfter && instanceCount >= endAfter) return false;
      if (endDate && currentDate > new Date(endDate)) return false;
      return true;
    };
    
    while (shouldContinue() && instanceCount < 100) { // 安全のため上限を設定
      // 次の日付を計算
      currentDate = this.calculateNextOccurrence(currentDate, type, interval, daysOfWeek);
      
      if (!currentDate) break;
      
      // 新しい終了日を計算
      const newEndDate = new Date(currentDate);
      newEndDate.setDate(newEndDate.getDate() + duration - 1);
      
      // 新しいタスクデータを作成
      const newTaskData = {
        ...taskData,
        start: currentDate.toISOString(),
        end: newEndDate.toISOString(),
        name: `${taskData.name} (${instanceCount + 1})`
      };
      
      // 新しいタスクを作成
      const newTaskId = this.createNewTask(projectId, newTaskData, parentTaskId);
      taskIds.push(newTaskId);
      
      instanceCount++;
    }
    
    return taskIds;
  }
  
  /**
   * 次の繰り返し日を計算
   */
  private calculateNextOccurrence(
    currentDate: Date, 
    type: string, 
    interval: number, 
    daysOfWeek?: number[]
  ): Date | null {
    const nextDate = new Date(currentDate);
    
    switch (type) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + interval);
        break;
        
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (interval * 7));
        break;
        
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
        
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + interval);
        break;
        
      case 'custom':
        if (daysOfWeek && daysOfWeek.length > 0) {
          // 現在の曜日を取得
          const currentDay = nextDate.getDay();
          let nextDay = -1;
          
          // 次の指定曜日を検索
          for (let i = 0; i < 7; i++) {
            const checkDay = (currentDay + i + 1) % 7;
            if (daysOfWeek.includes(checkDay)) {
              nextDay = checkDay;
              break;
            }
          }
          
          if (nextDay !== -1) {
            // 現在の曜日から次の指定曜日までの日数を計算
            const daysUntilNext = (nextDay - currentDay + 7) % 7;
            nextDate.setDate(nextDate.getDate() + daysUntilNext);
          } else {
            return null;
          }
        } else {
          nextDate.setDate(nextDate.getDate() + interval);
        }
        break;
        
      default:
        return null;
    }
    
    return nextDate;
  }
  
  /**
   * タスクの期間（日数）を計算
   */
  private calculateTaskDuration(start: string | Date, end: string | Date): number {
    const startDate = start instanceof Date ? start : new Date(start);
    const endDate = end instanceof Date ? end : new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 1; // デフォルト値
    }
    
    // 開始日と終了日の差を日数で計算（終了日も含む）
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
  
  /**
   * タスクを取得
   */
  getTask(
    projectId: string, 
    taskId: string, 
    subtaskId?: string | null
  ): Task | SubTask | null {
    const { projects } = store.getState().projects;
    
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;
    
    const task = project.tasks.find(t => t.id === taskId);
    if (!task) return null;
    
    if (subtaskId) {
      return task.subtasks.find(st => st.id === subtaskId) || null;
    }
    
    return task;
  }
}

export const taskService = new TaskService();