// システムプロンプト準拠：統一された草稿タスク判定・操作ユーティリティ
// DRY原則：判定ロジックの一元化
// KISS原則：シンプルな関数ベース

import { Task } from '../types'
import { logger } from './logger'

// 草稿タスク判定（中核関数）
export const isDraftTask = (task: Task): boolean => {
  return !!task._isDraft
}

// 草稿タスク一覧取得
export const getDraftTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(isDraftTask)
}

// 確定タスク一覧取得
export const getConfirmedTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(task => !isDraftTask(task))
}

// 操作可否判定
export const canEditTask = (): boolean => {
  return true // 草稿・確定どちらも編集可能
}

export const canCompleteTask = (task: Task): boolean => {
  if (isDraftTask(task)) {
    logger.debug('Completion disabled for draft task', { taskId: task.id })
    return false
  }
  return true
}

export const canCollapseTask = (task: Task): boolean => {
  if (isDraftTask(task)) {
    logger.debug('Collapse disabled for draft task', { taskId: task.id })
    return false
  }
  return true
}

export const canCopyTask = (task: Task): boolean => {
  if (isDraftTask(task)) {
    logger.debug('Copy disabled for draft task', { taskId: task.id })
    return false
  }
  return true
}

export const canDeleteTask = (): boolean => {
  return true // 草稿・確定どちらも削除可能（草稿は破棄、確定は削除）
}

// バッチ操作用フィルタリング
export const filterTasksForBatchOperation = (
  tasks: Task[], 
  taskIds: string[]
): string[] => {
  return taskIds.filter(id => {
    const task = tasks.find(t => t.id === id)
    return task && !isDraftTask(task)
  })
}

// UI状態判定（統合フラグアプローチ：草稿タスクは一覧非表示）
export const getTaskDisplayState = (task: Task) => {
  if (isDraftTask(task)) {
    return {
      isDraft: true,
      showDraftIndicator: true,
      allowBusinessOperations: false,
      requiresNameInput: !task.name.trim(),
      className: 'border-blue-200 bg-blue-50',
      shouldShowInList: false // 統合フラグアプローチ：一覧に表示しない
    }
  }

  return {
    isDraft: false,
    showDraftIndicator: false,
    allowBusinessOperations: true,
    requiresNameInput: false,
    className: '',
    shouldShowInList: true
  }
}

// 草稿タスクの統計情報（統合フラグアプローチ：一覧外タスクの統計）
export const getDraftStatistics = (tasks: Task[]) => {
  const drafts = getDraftTasks(tasks)
  const emptyNameDrafts = drafts.filter(task => !task.name.trim())
  
  return {
    totalDrafts: drafts.length,
    emptyNameDrafts: emptyNameDrafts.length,
    namedDrafts: drafts.length - emptyNameDrafts.length,
    // 統合フラグアプローチ：草稿タスクは一覧に表示されないため常に0
    visibleInList: 0
  }
}