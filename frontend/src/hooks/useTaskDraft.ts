// システムプロンプト準拠：軽量な草稿タスク管理hook
// KISS原則：シンプルなフラグベース管理
// DRY原則：統一された草稿操作

import { Task, TaskApiActions } from '../types'
import { logger } from '../utils/logger'
import { handleError } from '../utils/errorHandler'
import { isValidDate } from '../utils/dateUtils'

export const useTaskDraft = () => {
  // システムプロンプト準拠：パス管理統一 - ID生成規則
  const generateDraftId = (): string => {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 草稿タスク作成（強化版：即座に詳細パネル表示用）
  const createDraft = (
    projectId: string,
    parentId: string | null = null, 
    level: number = 0
  ): Task => {
    try {
      logger.debug('Creating draft task for immediate detail panel display', { 
        projectId, 
        parentId, 
        level 
      })

      // 統合フラグアプローチ：草稿タスクは一覧に表示されず、詳細パネルでのみ編集
      const now = new Date()

      const draft: Task = {
        id: generateDraftId(),
        name: '', // 空名前で開始（詳細パネルで即入力）
        projectId,
        parentId,
        completed: false,
        startDate: now,
        dueDate: now,
        completionDate: null,
        notes: '',
        assignee: '自分',
        level,
        collapsed: false,
        _isDraft: true // 統合フラグの核心
      }

      logger.debug('Draft task created for detail panel editing', { 
        draftId: draft.id,
        willShowInList: false,
        targetPanel: 'details'
      })
      
      return draft

    } catch (error) {
      logger.error('Draft task creation failed', { projectId, parentId, level, error })
      handleError(error, '草稿タスクの作成に失敗しました')
      throw error
    }
  }

  // 草稿タスク保存（新規作成として処理）
  const saveDraft = async (
    draft: Task, 
    updates: Partial<Task>,
    apiActions: TaskApiActions
  ): Promise<Task> => {
    try {
      if (!draft._isDraft) {
        throw new Error('Not a draft task')
      }

      // タスク名バリデーション
      const finalName = updates.name?.trim() || draft.name?.trim()
      if (!finalName) {
        throw new Error('タスク名は必須です')
      }

      logger.info('Saving draft task as new confirmed task', { 
        draftId: draft.id, 
        name: finalName,
        willAppearInList: true
      })

      // 草稿フラグを除去して新規タスクとして作成
      const { _isDraft, ...taskData } = { ...draft, ...updates }
      
      // 日付の安全な処理
      if (!isValidDate(taskData.startDate)) {
        taskData.startDate = new Date()
      }
      if (!isValidDate(taskData.dueDate)) {
        taskData.dueDate = new Date()
      }

      const savedTask = await apiActions.createTask(taskData)
      
      logger.info('Draft task successfully converted to confirmed task', { 
        draftId: draft.id, 
        newTaskId: savedTask.id,
        name: savedTask.name,
        nowInTaskList: true
      })
      
      return savedTask

    } catch (error) {
      logger.error('Draft task save failed', { draftId: draft.id, error })
      handleError(error, '草稿タスクの保存に失敗しました')
      throw error
    }
  }

  // 草稿判定ユーティリティ
  const isDraft = (task: Task): boolean => {
    return !!task._isDraft
  }

  // 草稿タスクの操作可否判定
  const canPerformOperation = (task: Task, operation: string): boolean => {
    if (!isDraft(task)) return true

    // 草稿タスクで無効化する操作
    const restrictedOperations = ['complete', 'collapse', 'copy', 'batch']
    return !restrictedOperations.includes(operation)
  }

  return {
    createDraft,
    saveDraft,
    isDraft,
    canPerformOperation
  }
}