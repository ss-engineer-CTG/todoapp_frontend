// タイムライン専用キーボードショートカット処理
// 既存のuseKeyboard.tsをベースにタイムライン向けに最適化

import { useEffect, useCallback } from 'react'
import { Task } from '@core/types'
import { logger } from '@core/utils'

interface UseTimelineKeyboardProps {
  // タスク・プロジェクトデータ
  tasks: Task[]
  
  // 選択状態（useRowSelectionから）
  selectedTaskIds: Set<string>
  selectedCount: number
  isSelecting: boolean
  getSelectedTasks: (tasks: Task[]) => Task[]
  
  // タスク操作（タスク名指定対応）
  onCreateTaskWithName: (parentId: string | null, level: number, taskName: string) => Promise<void>
  onCreateSubTaskWithName: (parentId: string, level: number, taskName: string) => Promise<void>
  onToggleCompletion: (taskId: string) => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
  
  // 選択操作
  clearSelection: () => void
  
  // ダイアログ制御
  onShowTaskNameDialog: (taskType: 'task' | 'subtask', parentTask?: Task) => void
  
  // アクティブ状態
  isTimelineActive: boolean
}

export const useTimelineKeyboard = (props: UseTimelineKeyboardProps) => {
  const {
    tasks,
    selectedTaskIds,
    selectedCount,
    isSelecting,
    getSelectedTasks,
    onCreateTaskWithName,
    onCreateSubTaskWithName,
    onToggleCompletion,
    onDeleteTask,
    clearSelection,
    onShowTaskNameDialog,
    isTimelineActive
  } = props

  // 現在選択されている単一タスクを取得
  const getCurrentSelectedTask = useCallback((): Task | null => {
    if (selectedTaskIds.size !== 1) return null
    const taskId = Array.from(selectedTaskIds)[0]
    return tasks.find(t => t.id === taskId) || null
  }, [selectedTaskIds, tasks])

  // キーボードイベントハンドラー
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // タイムラインがアクティブでない場合は処理しない
    if (!isTimelineActive) return

    // 入力フィールドにフォーカスがある場合は処理しない（Escapeを除く）
    const activeElement = document.activeElement as HTMLElement | null
    const isInputActive = activeElement?.tagName === 'INPUT' || 
                         activeElement?.tagName === 'TEXTAREA' ||
                         activeElement?.contentEditable === 'true'
    
    if (isInputActive && e.key !== 'Escape') return

    try {
      switch (e.key) {
        case 'Enter':
          // 新規タスク追加（選択タスクと同レベル）
          if (selectedCount === 1) {
            e.preventDefault()
            const currentTask = getCurrentSelectedTask()
            if (currentTask) {
              logger.info('Showing task name dialog for new task at same level via Enter key', {
                parentId: currentTask.parentId,
                level: currentTask.level,
                currentTaskId: currentTask.id
              })
              onShowTaskNameDialog('task', currentTask)
            }
          } else if (selectedCount === 0) {
            // タスクが選択されていない場合はルートレベルで作成
            e.preventDefault()
            logger.info('Showing task name dialog for new root task via Enter key')
            onShowTaskNameDialog('task')
          }
          break

        case 'Tab':
          // 子タスク追加（選択タスクの子として）
          if (selectedCount === 1) {
            e.preventDefault()
            const currentTask = getCurrentSelectedTask()
            if (currentTask) {
              logger.info('Showing task name dialog for sub task via Tab key', {
                parentId: currentTask.id,
                level: currentTask.level + 1,
                parentTaskName: currentTask.name
              })
              onShowTaskNameDialog('subtask', currentTask)
            }
          }
          break

        case ' ':
          // 完了状態切り替え
          if (selectedCount === 1) {
            e.preventDefault()
            const currentTask = getCurrentSelectedTask()
            if (currentTask) {
              logger.info('Toggling task completion via Space key', {
                taskId: currentTask.id,
                currentState: currentTask.completed,
                taskName: currentTask.name
              })
              onToggleCompletion(currentTask.id)
            }
          } else if (selectedCount > 1) {
            // 複数選択時は最初のタスクの完了状態を基準にする
            e.preventDefault()
            const selectedTasks = getSelectedTasks(tasks)
            if (selectedTasks.length > 0) {
              const firstTask = selectedTasks[0]
              logger.info('Toggling multiple tasks completion via Space key', {
                taskCount: selectedTasks.length,
                referenceTaskId: firstTask.id,
                newState: !firstTask.completed
              })
              
              // 全ての選択されたタスクに対して同じ完了状態を適用
              selectedTasks.forEach(task => {
                onToggleCompletion(task.id)
              })
            }
          }
          break

        case 'Delete':
        case 'Backspace':
          // タスク削除
          if (selectedCount === 1) {
            e.preventDefault()
            const currentTask = getCurrentSelectedTask()
            if (currentTask) {
              logger.info('Deleting task via Delete/Backspace key', {
                taskId: currentTask.id,
                taskName: currentTask.name
              })
              onDeleteTask(currentTask.id)
            }
          } else if (selectedCount > 1) {
            e.preventDefault()
            const selectedTasks = getSelectedTasks(tasks)
            logger.info('Deleting multiple tasks via Delete/Backspace key', {
              taskCount: selectedTasks.length,
              taskIds: selectedTasks.map(t => t.id)
            })
            
            // 全ての選択されたタスクを削除
            selectedTasks.forEach(task => {
              onDeleteTask(task.id)
            })
          }
          break

        case 'Escape':
          // 選択解除
          if (isSelecting) {
            e.preventDefault()
            logger.info('Clearing selection via Escape key', {
              previousSelectedCount: selectedCount
            })
            clearSelection()
          }
          break

        default:
          // その他のキーは処理しない
          break
      }
    } catch (error) {
      logger.error('Timeline keyboard shortcut error', {
        key: e.key,
        selectedCount,
        isTimelineActive,
        error
      })
    }
  }, [
    isTimelineActive,
    selectedCount,
    getCurrentSelectedTask,
    onCreateTaskWithName,
    onCreateSubTaskWithName,
    onToggleCompletion,
    onDeleteTask,
    clearSelection,
    getSelectedTasks,
    tasks,
    isSelecting,
    onShowTaskNameDialog
  ])

  // キーボードイベントリスナーを登録
  useEffect(() => {
    if (isTimelineActive) {
      logger.info('Timeline keyboard shortcuts activated', {
        selectedCount,
        isSelecting
      })
      
      document.addEventListener('keydown', handleKeyDown)
      
      return () => {
        logger.info('Timeline keyboard shortcuts deactivated')
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isTimelineActive, handleKeyDown])

  return {
    // 内部状態（デバッグ用）
    isActive: isTimelineActive,
    selectedCount,
    isSelecting
  }
}