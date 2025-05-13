// src/utils/migrationUtils.ts
import { Task } from "../types/Task";
import { logInfo, logError } from "./logUtils";

/**
 * 既存データを新しい構造（parent ID有り）に移行する
 */
export function migrateTasksData(tasks: Task[]): Task[] {
  try {
    // タスクを階層順にソート
    const sortedTasks = [...tasks].sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return tasks.indexOf(a) - tasks.indexOf(b);
    });
    
    // 各タスクに親IDを設定
    return sortedTasks.map((task, index) => {
      // プロジェクトまたはレベル0のタスクは親を持たない
      if (task.level === 0 || task.isProject) {
        return { ...task, parentId: null };
      }
      
      // 親タスクを探す (このタスクより前の、レベルが1つ低いタスク)
      let parentId = null;
      for (let i = index - 1; i >= 0; i--) {
        if (sortedTasks[i].level === task.level - 1) {
          parentId = sortedTasks[i].id;
          break;
        }
        if (sortedTasks[i].level < task.level - 1) break;
      }
      
      return { ...task, parentId };
    });
  } catch (error) {
    logError("データ移行中にエラーが発生しました", error);
    // エラーが発生しても元のデータを返す
    return tasks;
  }
}

/**
 * 移行が必要かチェック
 */
export function needsMigration(tasks: Task[]): boolean {
  // 配列が空の場合は移行不要
  if (!tasks.length) return false;
  
  // いずれかのタスクにparentIdがない場合は移行が必要
  return tasks.some(task => task.parentId === undefined);
}

/**
 * データ移行を実行し結果を返す
 */
export async function performDataMigration(
  tasks: Task[], 
  saveProject: (task: Task) => Promise<any>,
  saveTask: (task: Task) => Promise<any>
): Promise<Task[]> {
  if (!needsMigration(tasks)) {
    logInfo("データ移行は不要です。既に新しい構造になっています。");
    return tasks;
  }
  
  const migratedTasks = migrateTasksData(tasks);
  logInfo(`${tasks.length}件のタスクを新しい構造に移行しました`);
  
  // データベースに保存
  try {
    const savePromises = migratedTasks.map(task => {
      if (task.isProject) {
        return saveProject(task);
      } else {
        return saveTask(task);
      }
    });
    
    await Promise.all(savePromises);
    logInfo("移行したデータをデータベースに保存しました");
  } catch (error) {
    logError("移行データの保存中にエラーが発生しました", error);
  }
  
  return migratedTasks;
}