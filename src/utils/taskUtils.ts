// src/utils/taskUtils.ts
import { Task } from "../types/Task"
import { logDebug, logWarning } from "./logUtils"

/**
 * タスクの親タスクを取得する（明示的な参照を使用）
 */
export function getParentTask(task: Task, tasks: Task[]): Task | null {
  // parentIdが設定されていればそれを使用
  if (task.parentId !== undefined && task.parentId !== null) {
    return tasks.find(t => t.id === task.parentId) || null;
  }
  
  // 後方互換性のため、parentIdがない場合は従来の方法で探す
  if (task.level === 0) return null;
  
  const index = tasks.findIndex(t => t.id === task.id);
  if (index === -1) return null;
  
  // 自分より前の、自分より1つレベルが低いタスクを探す
  for (let i = index - 1; i >= 0; i--) {
    if (tasks[i].level === task.level - 1) {
      return tasks[i];
    }
    // もっと低いレベルのタスクが見つかったら親はいない
    if (tasks[i].level < task.level - 1) {
      break;
    }
  }
  
  return null;
}

/**
 * 特定のタスクの直接の子タスクを取得する
 */
export function getDirectChildTasks(task: Task, tasks: Task[]): Task[] {
  // parentIdが使用可能な場合
  if (tasks.some(t => t.parentId !== undefined)) {
    return tasks.filter(t => t.parentId === task.id);
  }
  
  // 後方互換性のため、従来の方法でも子タスクを探す
  const childTasks: Task[] = [];
  const taskIndex = tasks.findIndex(t => t.id === task.id);
  
  if (taskIndex === -1) return [];
  
  // 自分より後のタスクをチェック
  let i = taskIndex + 1;
  while (i < tasks.length) {
    if (tasks[i].level <= task.level) {
      // レベルが同じかより低いタスクが見つかったらそれ以降は子タスクではない
      break;
    }
    // レベルが1つ高いタスクだけが直接の子
    if (tasks[i].level === task.level + 1) {
      childTasks.push(tasks[i]);
    }
    i++;
  }
  
  return childTasks;
}

/**
 * タスクとその子孫タスクをすべて取得する
 */
export function getTaskWithDescendants(task: Task, tasks: Task[]): Task[] {
  const result = [task];
  const childTasks = getDirectChildTasks(task, tasks);
  
  for (const child of childTasks) {
    result.push(...getTaskWithDescendants(child, tasks));
  }
  
  return result;
}

/**
 * タスクが表示可能かどうかを確認する（親タスクが全て展開されているかどうか）
 */
export function isTaskVisible(task: Task, tasks: Task[]): boolean {
  if (task.level === 0) return true;
  
  const parent = getParentTask(task, tasks);
  if (!parent) return true;
  
  return parent.expanded && isTaskVisible(parent, tasks);
}

/**
 * 順序の整合性を保ちながらタスクを並べ替える
 */
export function sortTasksWithConsistency(tasks: Task[]): Task[] {
  // まずプロジェクトIDでグループ化
  const groupedByProject: Record<number, Task[]> = {};
  
  tasks.forEach(task => {
    if (!groupedByProject[task.projectId]) {
      groupedByProject[task.projectId] = [];
    }
    groupedByProject[task.projectId].push(task);
  });
  
  // 各プロジェクト内でレベル順、その後order順でソート
  const sortedTasks: Task[] = [];
  
  Object.values(groupedByProject).forEach(projectTasks => {
    // レベル0のプロジェクト自体を最初に追加
    const project = projectTasks.find(t => t.isProject && t.level === 0);
    if (project) {
      sortedTasks.push(project);
    }
    
    // 階層ごとにソート
    for (let level = 0; level <= Math.max(...projectTasks.map(t => t.level)); level++) {
      const tasksAtLevel = projectTasks
        .filter(t => t.level === level && (!t.isProject || level > 0))
        .sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          return a.id - b.id;
        });
      
      sortedTasks.push(...tasksAtLevel);
    }
  });
  
  return sortedTasks;
}

/**
 * タスクの展開状態を調整する
 */
export function adjustTaskExpansion(tasks: Task[]): Task[] {
  return tasks.map(task => {
    // プロジェクトとレベル0のタスクは常に展開
    if (task.isProject || task.level === 0) {
      return { ...task, expanded: true };
    }
    return task;
  });
}

/**
 * 階層構造を維持したままタスクを並べ替える
 */
export function reorderTaskWithHierarchy(tasks: Task[], sourceId: number, targetId: number): Task[] {
  const sourceTask = tasks.find(t => t.id === sourceId);
  const targetTask = tasks.find(t => t.id === targetId);
  
  if (!sourceTask || !targetTask) {
    logWarning("並べ替えに必要なタスクが見つかりません");
    return tasks;
  }
  
  // 同じレベルでない場合は操作を中止
  if (sourceTask.level !== targetTask.level) {
    logWarning("異なるレベルのタスク間での並べ替えはできません");
    return tasks;
  }
  
  // 同じ親を持つタスク間でのみ並べ替えを許可
  if (sourceTask.parentId !== targetTask.parentId) {
    logWarning("異なる親を持つタスク間での並べ替えはできません");
    return tasks;
  }
  
  // 移動するタスクの子孫すべてを取得
  const sourceWithDescendants = getTaskWithDescendants(sourceTask, tasks);
  const sourceIds = sourceWithDescendants.map(t => t.id);
  
  // 移動元のタスクとその子孫を除いたタスクリスト
  const tasksWithoutSource = tasks.filter(t => !sourceIds.includes(t.id));
  
  // 挿入位置を計算
  const targetIndex = tasksWithoutSource.findIndex(t => t.id === targetId);
  
  // 新しいタスクリストを構築
  const result = [
    ...tasksWithoutSource.slice(0, targetIndex + 1),
    ...sourceWithDescendants,
    ...tasksWithoutSource.slice(targetIndex + 1)
  ];
  
  logDebug(`タスク ${sourceTask.name} とその子孫を ${targetTask.name} の後に移動しました`);
  return result;
}

/**
 * タスクの正しい挿入位置を計算
 */
export function calculateTaskInsertPosition(tasks: Task[], parentTaskId: number | null, level: number): number {
  if (!parentTaskId) {
    // プロジェクト直下のタスクなら、既存のレベル1タスクの最後に追加
    const levelOneTasks = tasks.filter(t => t.level === 1);
    return levelOneTasks.length > 0 
      ? tasks.indexOf(levelOneTasks[levelOneTasks.length - 1])
      : tasks.findIndex(t => t.isProject); // プロジェクトの直後
  }

  const parentIndex = tasks.findIndex(t => t.id === parentTaskId);
  if (parentIndex === -1) return tasks.length - 1;

  // 親タスクの子タスクの後ろを探す
  let insertIndex = parentIndex;
  const parentLevel = tasks[parentIndex].level;
  
  for (let i = parentIndex + 1; i < tasks.length; i++) {
    if (tasks[i].level <= parentLevel) {
      break; // 親のレベル以下のタスクが見つかったら終了
    }
    insertIndex = i; // 子タスクの最後の位置を更新
  }
  
  return insertIndex;
}

/**
 * 親子関係に基づいてタスクのレベルを再計算
 */
export function recalculateTaskLevels(tasks: Task[]): Task[] {
  const result = [...tasks];
  
  // まずプロジェクトとプロジェクト直下のタスクを設定
  for (const task of result) {
    if (task.isProject) {
      task.level = 0;
    } else if (task.parentId === null) {
      task.level = 1; // プロジェクト直下
    }
  }
  
  // 親IDが設定されているタスクのレベルを再帰的に計算
  let changed = true;
  while (changed) {
    changed = false;
    
    for (const task of result) {
      if (task.parentId !== null && task.parentId !== undefined) {
        const parent = result.find(t => t.id === task.parentId);
        if (parent) {
          const newLevel = parent.level + 1;
          if (task.level !== newLevel) {
            task.level = newLevel;
            changed = true;
          }
        }
      }
    }
  }
  
  return result;
}