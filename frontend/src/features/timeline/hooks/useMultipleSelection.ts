// システムプロンプト準拠：複数選択状態管理フック
// 機能：タイムライン内でのタスク複数選択操作を管理

import { useState, useCallback, useEffect } from 'react'
import { Task } from '@core/types'
import { logger } from '@core/utils'

// 選択モード
export type SelectionMode = 'single' | 'multiple' | 'range'

// 選択状態
export interface SelectionState {
  selectedTaskIds: Set<string>
  lastSelectedTaskId: string | null
  selectionMode: SelectionMode
  isSelecting: boolean
}

// フック戻り値の型定義
export interface UseMultipleSelectionReturn {
  // 状態
  selectedTaskIds: Set<string>
  selectedCount: number
  isSelecting: boolean
  
  // 選択操作
  selectTask: (taskId: string, mode?: SelectionMode) => void
  deselectTask: (taskId: string) => void
  toggleTaskSelection: (taskId: string, mode?: SelectionMode) => void
  selectRange: (fromTaskId: string, toTaskId: string, tasks: Task[]) => void
  selectAll: (tasks: Task[]) => void
  clearSelection: () => void
  
  // 状態確認
  isTaskSelected: (taskId: string) => boolean
  getSelectedTasks: (tasks: Task[]) => Task[]
  
  // キーボード操作
  handleKeyDown: (event: KeyboardEvent) => void
}

export const useMultipleSelection = (): UseMultipleSelectionReturn => {
  const [state, setState] = useState<SelectionState>({
    selectedTaskIds: new Set(),
    lastSelectedTaskId: null,
    selectionMode: 'single',
    isSelecting: false
  })

  // タスク選択
  const selectTask = useCallback((taskId: string, mode: SelectionMode = 'single') => {
    setState(prev => {
      const newSelectedIds = new Set(prev.selectedTaskIds)
      
      if (mode === 'single') {
        newSelectedIds.clear()
      }
      
      newSelectedIds.add(taskId)
      
      logger.info('Task selected', { 
        taskId, 
        mode, 
        totalSelected: newSelectedIds.size,
        previousCount: prev.selectedTaskIds.size
      })
      
      return {
        ...prev,
        selectedTaskIds: newSelectedIds,
        lastSelectedTaskId: taskId,
        selectionMode: mode,
        isSelecting: newSelectedIds.size > 0
      }
    })
  }, [])

  // タスク選択解除
  const deselectTask = useCallback((taskId: string) => {
    setState(prev => {
      const newSelectedIds = new Set(prev.selectedTaskIds)
      newSelectedIds.delete(taskId)
      
      logger.info('Task deselected', { 
        taskId, 
        remainingSelected: newSelectedIds.size,
        previousCount: prev.selectedTaskIds.size
      })
      
      return {
        ...prev,
        selectedTaskIds: newSelectedIds,
        lastSelectedTaskId: newSelectedIds.size > 0 ? prev.lastSelectedTaskId : null,
        isSelecting: newSelectedIds.size > 0
      }
    })
  }, [])

  // タスク選択状態トグル
  const toggleTaskSelection = useCallback((taskId: string, mode: SelectionMode = 'single') => {
    setState(prev => {
      const isCurrentlySelected = prev.selectedTaskIds.has(taskId)
      
      if (isCurrentlySelected) {
        // 選択解除
        if (mode === 'single') {
          // 単一選択モードの場合は全選択解除
          logger.info('Single selection mode: clearing all selection', { taskId })
          return {
            ...prev,
            selectedTaskIds: new Set(),
            lastSelectedTaskId: null,
            isSelecting: false
          }
        } else {
          // 複数選択モードの場合は該当タスクのみ解除
          const newSelectedIds = new Set(prev.selectedTaskIds)
          newSelectedIds.delete(taskId)
          
          logger.info('Multiple selection mode: deselecting task', { 
            taskId, 
            remainingSelected: newSelectedIds.size 
          })
          
          return {
            ...prev,
            selectedTaskIds: newSelectedIds,
            lastSelectedTaskId: newSelectedIds.size > 0 ? prev.lastSelectedTaskId : null,
            isSelecting: newSelectedIds.size > 0
          }
        }
      } else {
        // 新規選択
        const newSelectedIds = new Set(prev.selectedTaskIds)
        
        if (mode === 'single') {
          newSelectedIds.clear()
        }
        
        newSelectedIds.add(taskId)
        
        logger.info('Task selection toggled on', { 
          taskId, 
          mode, 
          totalSelected: newSelectedIds.size 
        })
        
        return {
          ...prev,
          selectedTaskIds: newSelectedIds,
          lastSelectedTaskId: taskId,
          selectionMode: mode,
          isSelecting: true
        }
      }
    })
  }, [])

  // 範囲選択
  const selectRange = useCallback((fromTaskId: string, toTaskId: string, tasks: Task[]) => {
    const fromIndex = tasks.findIndex(task => task.id === fromTaskId)
    const toIndex = tasks.findIndex(task => task.id === toTaskId)
    
    if (fromIndex === -1 || toIndex === -1) {
      logger.warn('Range selection failed: invalid task IDs', { fromTaskId, toTaskId })
      return
    }
    
    const startIndex = Math.min(fromIndex, toIndex)
    const endIndex = Math.max(fromIndex, toIndex)
    
    const selectedTasks = tasks.slice(startIndex, endIndex + 1)
    const newSelectedIds = new Set(selectedTasks.map(task => task.id))
    
    logger.info('Range selection applied', { 
      fromTaskId, 
      toTaskId, 
      selectedCount: newSelectedIds.size,
      startIndex,
      endIndex
    })
    
    setState(prev => ({
      ...prev,
      selectedTaskIds: newSelectedIds,
      lastSelectedTaskId: toTaskId,
      selectionMode: 'range',
      isSelecting: true
    }))
  }, [])

  // 全選択
  const selectAll = useCallback((tasks: Task[]) => {
    const allTaskIds = new Set(tasks.map(task => task.id))
    
    logger.info('All tasks selected', { 
      totalTasks: tasks.length,
      selectedCount: allTaskIds.size
    })
    
    setState(prev => ({
      ...prev,
      selectedTaskIds: allTaskIds,
      lastSelectedTaskId: tasks.length > 0 ? tasks[tasks.length - 1].id : null,
      selectionMode: 'multiple',
      isSelecting: allTaskIds.size > 0
    }))
  }, [])

  // 選択解除
  const clearSelection = useCallback(() => {
    logger.info('Selection cleared', { 
      previousCount: state.selectedTaskIds.size 
    })
    
    setState(prev => ({
      ...prev,
      selectedTaskIds: new Set(),
      lastSelectedTaskId: null,
      isSelecting: false
    }))
  }, [state.selectedTaskIds.size])

  // 選択状態確認
  const isTaskSelected = useCallback((taskId: string) => {
    return state.selectedTaskIds.has(taskId)
  }, [state.selectedTaskIds])

  // 選択されたタスクを取得
  const getSelectedTasks = useCallback((tasks: Task[]) => {
    return tasks.filter(task => state.selectedTaskIds.has(task.id))
  }, [state.selectedTaskIds])

  // キーボード操作
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        if (state.isSelecting) {
          event.preventDefault()
          clearSelection()
          logger.info('Selection cleared via Escape key')
        }
        break
      
      case 'a':
      case 'A':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          // 全選択は親コンポーネントから tasks を受け取る必要があるため、
          // ここではイベントのみログ出力
          logger.info('Select all shortcut detected (Ctrl/Cmd+A)')
        }
        break
        
      default:
        // その他のキーは処理しない
        break
    }
  }, [state.isSelecting, clearSelection])

  // グローバルキーボードイベントリスナー
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      handleKeyDown(event)
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [handleKeyDown])

  return {
    // 状態
    selectedTaskIds: state.selectedTaskIds,
    selectedCount: state.selectedTaskIds.size,
    isSelecting: state.isSelecting,
    
    // 選択操作
    selectTask,
    deselectTask,
    toggleTaskSelection,
    selectRange,
    selectAll,
    clearSelection,
    
    // 状態確認
    isTaskSelected,
    getSelectedTasks,
    
    // キーボード操作
    handleKeyDown
  }
}