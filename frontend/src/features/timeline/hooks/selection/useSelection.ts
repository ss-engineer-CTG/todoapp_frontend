// システムプロンプト準拠：基本選択機能（リファクタリング：責任分離）
// リファクタリング対象：useRowSelection.ts から基本選択ロジックを抽出

import { useState, useCallback } from 'react'
import { Task } from '@core/types'
import { logger } from '@core/utils'
import { 
  RowSelectionMode, 
  UseSelectionReturn,
  INITIAL_ROW_SELECTION_STATE 
} from '../../types/selection/selectionTypes'

export const useSelection = (): UseSelectionReturn => {
  const [state, setState] = useState({
    selectedTaskIds: INITIAL_ROW_SELECTION_STATE.selectedTaskIds,
    lastSelectedTaskId: INITIAL_ROW_SELECTION_STATE.lastSelectedTaskId,
    selectionMode: INITIAL_ROW_SELECTION_STATE.selectionMode,
    isSelecting: INITIAL_ROW_SELECTION_STATE.isSelecting
  })

  // ===== 基本選択操作 =====
  const selectTask = useCallback((taskId: string, mode: RowSelectionMode = 'single') => {
    setState(prevState => {
      const newSelectedIds = new Set(prevState.selectedTaskIds)
      
      if (mode === 'multiple' || mode === 'range') {
        // 複数選択モード：既存選択を保持して追加
        newSelectedIds.add(taskId)
      } else {
        // 単一選択モード：選択をクリアして新規選択
        newSelectedIds.clear()
        newSelectedIds.add(taskId)
      }
      
      logger.info('Task selected', { 
        taskId, 
        mode, 
        selectedCount: newSelectedIds.size,
        source: 'useSelection'
      })
      
      return {
        ...prevState,
        selectedTaskIds: newSelectedIds,
        lastSelectedTaskId: taskId,
        selectionMode: mode,
        isSelecting: newSelectedIds.size > 0
      }
    })
  }, [])

  const deselectTask = useCallback((taskId: string) => {
    setState(prevState => {
      const newSelectedIds = new Set(prevState.selectedTaskIds)
      newSelectedIds.delete(taskId)
      
      logger.info('Task deselected', { 
        taskId, 
        remainingCount: newSelectedIds.size,
        source: 'useSelection'
      })
      
      return {
        ...prevState,
        selectedTaskIds: newSelectedIds,
        lastSelectedTaskId: newSelectedIds.size > 0 
          ? prevState.lastSelectedTaskId 
          : null,
        isSelecting: newSelectedIds.size > 0
      }
    })
  }, [])

  const toggleTaskSelection = useCallback((taskId: string, mode: RowSelectionMode = 'single') => {
    setState(prevState => {
      const isCurrentlySelected = prevState.selectedTaskIds.has(taskId)
      
      if (isCurrentlySelected) {
        // 選択解除
        const newSelectedIds = new Set(prevState.selectedTaskIds)
        newSelectedIds.delete(taskId)
        
        logger.info('Task toggled (deselected)', { 
          taskId, 
          remainingCount: newSelectedIds.size,
          source: 'useSelection'
        })
        
        return {
          ...prevState,
          selectedTaskIds: newSelectedIds,
          lastSelectedTaskId: newSelectedIds.size > 0 
            ? prevState.lastSelectedTaskId 
            : null,
          isSelecting: newSelectedIds.size > 0
        }
      } else {
        // 選択追加
        const newSelectedIds = new Set(
          mode === 'single' ? [] : prevState.selectedTaskIds
        )
        newSelectedIds.add(taskId)
        
        logger.info('Task toggled (selected)', { 
          taskId, 
          mode,
          selectedCount: newSelectedIds.size,
          source: 'useSelection'
        })
        
        return {
          ...prevState,
          selectedTaskIds: newSelectedIds,
          lastSelectedTaskId: taskId,
          selectionMode: mode,
          isSelecting: true
        }
      }
    })
  }, [])

  const selectAll = useCallback((tasks: Task[]) => {
    const allTaskIds = new Set(tasks.map(task => task.id))
    
    setState(prevState => {
      logger.info('All tasks selected', { 
        taskCount: allTaskIds.size,
        source: 'useSelection'
      })
      
      return {
        ...prevState,
        selectedTaskIds: allTaskIds,
        lastSelectedTaskId: tasks.length > 0 ? tasks[tasks.length - 1]?.id || null : null,
        selectionMode: 'multiple',
        isSelecting: allTaskIds.size > 0
      }
    })
  }, [])

  const clearSelection = useCallback(() => {
    setState(prevState => {
      const previousCount = prevState.selectedTaskIds.size
      
      logger.info('Selection cleared', { 
        previousCount,
        source: 'useSelection'
      })
      
      return {
        ...prevState,
        selectedTaskIds: new Set(),
        lastSelectedTaskId: null,
        isSelecting: false
      }
    })
  }, [])

  // ===== 状態確認メソッド =====
  const isTaskSelected = useCallback((taskId: string): boolean => {
    return state.selectedTaskIds.has(taskId)
  }, [state.selectedTaskIds])

  const getSelectedTasks = useCallback((tasks: Task[]): Task[] => {
    return tasks.filter(task => state.selectedTaskIds.has(task.id))
  }, [state.selectedTaskIds])

  return {
    // 状態
    selectedTaskIds: state.selectedTaskIds,
    selectedCount: state.selectedTaskIds.size,
    isSelecting: state.isSelecting,
    lastSelectedTaskId: state.lastSelectedTaskId,
    
    // 選択操作
    selectTask,
    deselectTask,
    toggleTaskSelection,
    selectAll,
    clearSelection,
    
    // 状態確認
    isTaskSelected,
    getSelectedTasks
  }
}