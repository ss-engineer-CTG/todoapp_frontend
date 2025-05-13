// src/utils/timelineUtils.ts
import { Task } from "../types/Task";
import { parseDate, formatDate } from "./dateUtils";

/**
 * 日付が週末（土日）かどうかを判定
 * @param dateString YYYY-MM-DD形式の日付文字列
 * @returns 週末の場合はtrue
 */
export function isWeekend(dateString: string): boolean {
  const date = new Date(dateString);
  const day = date.getDay();
  return day === 0 || day === 6; // 0:日曜, 6:土曜
}

/**
 * 2つの日付間の日数を計算
 * @param startDate 開始日（YYYY-MM-DD形式）
 * @param endDate 終了日（YYYY-MM-DD形式）
 * @returns 日数（終了日を含む）
 */
export function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const differenceMs = end.getTime() - start.getTime();
  return Math.round(differenceMs / (1000 * 60 * 60 * 24)) + 1; // 終了日を含む
}

/**
 * 指定された日付範囲の全日付リストを生成
 * @param startDate 開始日（YYYY-MM-DD形式）
 * @param endDate 終了日（YYYY-MM-DD形式）
 * @returns 日付文字列の配列
 */
export function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const current = new Date(start);
  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * 日付表示用のフォーマット
 * @param dateString YYYY-MM-DD形式の日付文字列
 * @param format 表示形式（short:短い形式、medium:中程度、full:完全な日付）
 * @returns フォーマットされた日付
 */
export function formatDateDisplay(dateString: string, format: 'short' | 'medium' | 'full' = 'medium'): string {
  const date = new Date(dateString);
  
  switch (format) {
    case 'short':
      return `${date.getMonth() + 1}/${date.getDate()}`; // 5/15
    case 'full':
      return date.toLocaleDateString('ja-JP', { 
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' 
      }); // 2025年5月15日(木)
    case 'medium':
    default:
      return date.toLocaleDateString('ja-JP', { 
        month: 'short', day: 'numeric' 
      }); // 5月15日
  }
}

/**
 * 月の日数を取得
 * @param year 年
 * @param month 月（0-11）
 * @returns 月の日数
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * タスクの表示位置計算（指定された日付範囲内での相対位置）
 * @param task タスク
 * @param startDate 表示範囲の開始日
 * @param totalDays 表示範囲の総日数
 * @returns {left, width} 左端位置（%）と幅（%）
 */
export function calculateTaskPosition(task: Task, startDate: string, totalDays: number): { left: number, width: number } {
  // タスクの開始日と終了日
  const taskStartDate = new Date(task.startDate);
  const taskEndDate = new Date(task.dueDate);
  
  // 表示範囲の開始日
  const rangeStart = new Date(startDate);
  
  // タスク開始位置の計算（表示範囲の開始日からの日数）
  let daysFromStart = Math.round((taskStartDate.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
  
  // タスク開始位置が範囲外の場合は調整
  if (daysFromStart < 0) {
    daysFromStart = 0;
  }
  
  // タスクの幅（日数）を計算
  let taskWidth = Math.round((taskEndDate.getTime() - taskStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // 表示範囲外にはみ出る場合は幅を調整
  if (daysFromStart + taskWidth > totalDays) {
    taskWidth = totalDays - daysFromStart;
  }
  
  // 最小幅を確保
  if (taskWidth < 1) {
    taskWidth = 1;
  }
  
  // 位置を%で返す
  const left = (daysFromStart / totalDays) * 100;
  const width = (taskWidth / totalDays) * 100;
  
  return { left, width };
}

/**
 * タスクの依存関係を取得
 * @param tasks タスクの配列
 * @returns 依存関係の配列 [{from: taskId, to: taskId}, ...]
 */
export function getTaskDependencies(tasks: Task[]): { from: number, to: number }[] {
  // 現在のコードベースには依存関係のフィールドがないため
  // 親子関係を依存関係として解釈する実装例
  const dependencies: { from: number, to: number }[] = [];
  
  tasks.forEach(task => {
    if (task.parentId) {
      // 親タスクから子タスクへの依存関係
      dependencies.push({
        from: task.parentId,
        to: task.id
      });
    }
  });
  
  return dependencies;
}

/**
 * 日付をクリップする（指定された範囲内に収める）
 * @param dateString 対象の日付
 * @param minDate 最小日付
 * @param maxDate 最大日付
 * @returns 範囲内に収められた日付
 */
export function clipDateToRange(dateString: string, minDate: string, maxDate: string): string {
  const date = new Date(dateString);
  const min = new Date(minDate);
  const max = new Date(maxDate);
  
  if (date < min) return minDate;
  if (date > max) return maxDate;
  return dateString;
}