// src/utils/taskOperationUtils.ts
import { Task } from "../types/Task";
import { logDebug, logError, logInfo } from "./logUtils";

/**
 * 新しいタスクオーダーを計算する
 */
export function calculateNewTaskOrder(tasks: Task[], level: number, projectId: number, afterIndex: number): number {
  // 同じレベルと同じプロジェクトのタスクを取得
  const sameLevelTasks = tasks.filter(t => t.level === level && t.projectId === projectId);
  
  // タスクが存在しない場合は1を返す
  if (sameLevelTasks.length === 0) return 1;
  
  // 挿入位置の次のタスクがある場合
  if (afterIndex < tasks.length - 1) {
    const nextTask = tasks[afterIndex + 1];
    if (nextTask.level === level && nextTask.projectId === projectId) {
      return ((nextTask.order || 1) - 0.5);
    }
  }
  
  // 最後に追加する場合は最大の順序 + 1
  return Math.max(...sameLevelTasks.map(t => t.order || 0)) + 1;
}

/**
 * 新規タスク作成用の基本情報を取得する
 */
export function getNewTaskInfo(tasks: Task[], selectedTaskId: number | null): {
  projectId: number;
  projectName: string;
  level: number;
  afterIndex: number;
} {
  // デフォルト値 - 最初のプロジェクトの情報
  let projectId = 0;
  let projectName = "";
  let level = 1; // デフォルトはレベル1（プロジェクト直下）
  let afterIndex = tasks.length - 1; // デフォルトは最後に追加
  
  // 選択中のタスクがあれば、その情報を使用
  if (selectedTaskId) {
    const selectedTaskIndex = tasks.findIndex(t => t.id === selectedTaskId);
    const selectedTask = tasks.find(t => t.id === selectedTaskId);
    
    if (selectedTaskIndex >= 0 && selectedTask) {
      afterIndex = selectedTaskIndex;
      
      if (selectedTask.isProject) {
        // プロジェクトが選択されている場合はそのプロジェクト直下に追加
        projectId = selectedTask.projectId;
        projectName = selectedTask.name;
        level = 1; // プロジェクト直下はレベル1
      } else {
        // 通常のタスクが選択されている場合
        projectId = selectedTask.projectId;
        projectName = selectedTask.projectName;
        level = selectedTask.level; // 同じレベルのタスクを追加
      }
    }
  }
  
  // プロジェクトIDが設定されていない場合は最初のプロジェクトを使用
  if (projectId === 0) {
    const firstProject = tasks.find(t => t.isProject);
    if (firstProject) {
      projectId = firstProject.projectId;
      projectName = firstProject.name;
    } else {
      logError("有効なプロジェクトが見つかりません");
    }
  }
  
  logDebug(`新規タスク情報: projectId=${projectId}, level=${level}, afterIndex=${afterIndex}`);
  
  return { projectId, projectName, level, afterIndex };
}

/**
 * 新規タスクのIDを生成する
 */
export function generateNewTaskId(tasks: Task[]): number {
  return Math.max(...tasks.map((t) => t.id), 0) + 1;
}

/**
 * タスクが選択可能かどうかを判定する
 */
export function isTaskSelectable(task: Task): boolean {
  return !task.isProject || task.level > 0;
}