// src/utils/taskUtils.ts
import { Task } from "../types/Task"

/**
 * タスクの親タスクを取得する
 */
export function getParentTask(task: Task, tasks: Task[]): Task | null {
  if (task.level === 0) return null
  
  const index = tasks.findIndex(t => t.id === task.id)
  if (index === -1) return null
  
  // 自分より前の、自分より1つレベルが低いタスクを探す
  for (let i = index - 1; i >= 0; i--) {
    if (tasks[i].level === task.level - 1) {
      return tasks[i]
    }
    // もっと低いレベルのタスクが見つかったら親はいない
    if (tasks[i].level < task.level - 1) {
      break
    }
  }
  
  return null
}

/**
 * 特定のタスクの子タスクを全て取得する
 */
export function getChildTasks(task: Task, tasks: Task[]): Task[] {
  const childTasks: Task[] = []
  const taskIndex = tasks.findIndex(t => t.id === task.id)
  
  if (taskIndex === -1) return []
  
  // 自分より後のタスクをチェック
  let i = taskIndex + 1
  while (i < tasks.length) {
    if (tasks[i].level <= task.level) {
      // レベルが同じかより低いタスクが見つかったらそれ以降は子タスクではない
      break
    }
    // レベルが1つ高いタスクだけが直接の子
    if (tasks[i].level === task.level + 1) {
      childTasks.push(tasks[i])
    }
    i++
  }
  
  return childTasks
}

/**
 * タスクが表示可能かどうかを確認する（親タスクが全て展開されているかどうか）
 */
export function isTaskVisible(task: Task, tasks: Task[]): boolean {
  if (task.level === 0) return true
  
  const parent = getParentTask(task, tasks)
  if (!parent) return true
  
  return parent.expanded && isTaskVisible(parent, tasks)
}

/**
 * 順序の整合性を保ちながらタスクを並べ替える
 */
export function sortTasksWithConsistency(tasks: Task[]): Task[] {
  // まずプロジェクトIDでグループ化
  const groupedByProject: Record<number, Task[]> = {}
  
  tasks.forEach(task => {
    if (!groupedByProject[task.projectId]) {
      groupedByProject[task.projectId] = []
    }
    groupedByProject[task.projectId].push(task)
  })
  
  // 各プロジェクト内でレベル順、その後order順でソート
  const sortedTasks: Task[] = []
  
  Object.values(groupedByProject).forEach(projectTasks => {
    // レベル0のプロジェクト自体を最初に追加
    const project = projectTasks.find(t => t.isProject && t.level === 0)
    if (project) {
      sortedTasks.push(project)
    }
    
    // 階層ごとにソート
    for (let level = 0; level <= Math.max(...projectTasks.map(t => t.level)); level++) {
      const tasksAtLevel = projectTasks
        .filter(t => t.level === level && (!t.isProject || level > 0))
        .sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order
          }
          return a.id - b.id
        })
      
      sortedTasks.push(...tasksAtLevel)
    }
  })
  
  return sortedTasks
}

/**
 * タスクの展開状態を調整する
 */
export function adjustTaskExpansion(tasks: Task[]): Task[] {
  return tasks.map(task => {
    // プロジェクトとレベル0のタスクは常に展開
    if (task.isProject || task.level === 0) {
      return { ...task, expanded: true }
    }
    return task
  })
}