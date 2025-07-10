// システムプロンプト準拠：行レベル選択機能（ドラッグ選択対応）
// 機能：タイムライン内でのタスク行の複数選択とドラッグ選択操作を管理

import { useState, useCallback, useEffect, useRef } from 'react'
import { Task } from '@core/types'
import { logger } from '@core/utils'

// 選択モード
export type RowSelectionMode = 'single' | 'multiple' | 'range' | 'drag'

// ドラッグ選択状態
export interface DragSelectionState {
  isDragging: boolean
  startY: number
  currentY: number
  startTaskId: string | null
  previewTaskIds: Set<string>
}

// 選択状態
export interface RowSelectionState {
  selectedTaskIds: Set<string>
  lastSelectedTaskId: string | null
  selectionMode: RowSelectionMode
  isSelecting: boolean
  dragSelection: DragSelectionState
}

// フック戻り値の型定義
export interface UseRowSelectionReturn {
  // 状態
  selectedTaskIds: Set<string>
  selectedCount: number
  isSelecting: boolean
  isDragSelecting: boolean
  previewTaskIds: Set<string>
  
  // 選択操作
  selectTask: (taskId: string, mode?: RowSelectionMode) => void
  deselectTask: (taskId: string) => void
  toggleTaskSelection: (taskId: string, mode?: RowSelectionMode) => void
  selectRange: (fromTaskId: string, toTaskId: string, tasks: Task[]) => void
  selectAll: (tasks: Task[]) => void
  clearSelection: () => void
  
  // ドラッグ選択
  handleDragStart: (event: React.MouseEvent, taskId: string, isAdditive: boolean) => void
  handleDragMove: (event: MouseEvent) => void
  handleDragEnd: () => void
  handleDragCancel: () => void
  
  // 状態確認
  isTaskSelected: (taskId: string) => boolean
  isTaskPreview: (taskId: string) => boolean
  getSelectedTasks: (tasks: Task[]) => Task[]
  
  // 行クリック処理
  handleRowClick: (event: React.MouseEvent, taskId: string) => void
  handleRowMouseDown: (event: React.MouseEvent, taskId: string) => void
  
  // 位置管理（選択範囲枠線用）
  taskPositions: Map<string, { top: number; left: number; width: number; height: number }>
  updateTaskPosition: (taskId: string, position: { top: number; left: number; width: number; height: number }) => void
}

const initialDragState: DragSelectionState = {
  isDragging: false,
  startY: 0,
  currentY: 0,
  startTaskId: null,
  previewTaskIds: new Set()
}

export const useRowSelection = (): UseRowSelectionReturn => {
  const [state, setState] = useState<RowSelectionState>({
    selectedTaskIds: new Set(),
    lastSelectedTaskId: null,
    selectionMode: 'single',
    isSelecting: false,
    dragSelection: initialDragState
  })

  // ドラッグ終了直後のクリア防止用タイマー
  const dragEndTimeRef = useRef<number>(0)

  const tasksRef = useRef<Task[]>([])
  const rowElementsRef = useRef<Map<string, HTMLElement>>(new Map())
  const [taskPositions, setTaskPositions] = useState<Map<string, { top: number; left: number; width: number; height: number }>>(new Map())

  // タスクリストの更新
  const updateTasksRef = useCallback((tasks: Task[]) => {
    tasksRef.current = tasks
  }, [])

  // 行要素の登録
  const registerRowElement = useCallback((taskId: string, element: HTMLElement) => {
    rowElementsRef.current.set(taskId, element)
  }, [])

  // タスク位置の更新
  const updateTaskPosition = useCallback((taskId: string, position: { top: number; left: number; width: number; height: number }) => {
    setTaskPositions(prev => {
      const newPositions = new Map(prev)
      newPositions.set(taskId, position)
      return newPositions
    })
  }, [])

  // Y座標から対象タスクIDを取得
  const getTaskIdFromY = useCallback((y: number): string | null => {
    let closestTaskId: string | null = null
    let closestDistance = Infinity

    rowElementsRef.current.forEach((element, taskId) => {
      const rect = element.getBoundingClientRect()
      const elementCenterY = rect.top + rect.height / 2
      const distance = Math.abs(y - elementCenterY)
      
      if (distance < closestDistance && y >= rect.top && y <= rect.bottom) {
        closestDistance = distance
        closestTaskId = taskId
      }
    })

    return closestTaskId
  }, [])

  // 範囲内のタスクIDを取得
  const getTaskIdsInRange = useCallback((startTaskId: string, endTaskId: string): string[] => {
    const tasks = tasksRef.current
    const startIndex = tasks.findIndex(task => task.id === startTaskId)
    const endIndex = tasks.findIndex(task => task.id === endTaskId)
    
    if (startIndex === -1 || endIndex === -1) return []
    
    const minIndex = Math.min(startIndex, endIndex)
    const maxIndex = Math.max(startIndex, endIndex)
    
    return tasks.slice(minIndex, maxIndex + 1).map(task => task.id)
  }, [])

  // タスク選択
  const selectTask = useCallback((taskId: string, mode: RowSelectionMode = 'single') => {
    setState(prev => {
      const newSelectedIds = new Set(prev.selectedTaskIds)
      
      if (mode === 'single') {
        newSelectedIds.clear()
      }
      
      newSelectedIds.add(taskId)
      
      logger.info('Row task selected', { 
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
      
      logger.info('Row task deselected', { 
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
  const toggleTaskSelection = useCallback((taskId: string, mode: RowSelectionMode = 'single') => {
    setState(prev => {
      const isCurrentlySelected = prev.selectedTaskIds.has(taskId)
      
      if (isCurrentlySelected) {
        if (mode === 'single') {
          return {
            ...prev,
            selectedTaskIds: new Set(),
            lastSelectedTaskId: null,
            isSelecting: false
          }
        } else {
          const newSelectedIds = new Set(prev.selectedTaskIds)
          newSelectedIds.delete(taskId)
          
          return {
            ...prev,
            selectedTaskIds: newSelectedIds,
            lastSelectedTaskId: newSelectedIds.size > 0 ? prev.lastSelectedTaskId : null,
            isSelecting: newSelectedIds.size > 0
          }
        }
      } else {
        const newSelectedIds = new Set(prev.selectedTaskIds)
        
        if (mode === 'single') {
          newSelectedIds.clear()
        }
        
        newSelectedIds.add(taskId)
        
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
    logger.info('Row selection cleared', { 
      previousCount: state.selectedTaskIds.size 
    })
    
    setState(prev => ({
      ...prev,
      selectedTaskIds: new Set(),
      lastSelectedTaskId: null,
      isSelecting: false,
      dragSelection: initialDragState
    }))
  }, [state.selectedTaskIds.size])

  // ドラッグ選択開始
  const handleDragStart = useCallback((event: React.MouseEvent, taskId: string, isAdditive: boolean) => {
    event.preventDefault()
    
    logger.info('Drag selection started', { 
      taskId, 
      isAdditive,
      startY: event.clientY
    })
    
    setState(prev => ({
      ...prev,
      dragSelection: {
        isDragging: true,
        startY: event.clientY,
        currentY: event.clientY,
        startTaskId: taskId,
        previewTaskIds: new Set([taskId])
      },
      selectionMode: 'drag'
    }))
  }, [])

  // ドラッグ選択移動
  const handleDragMove = useCallback((event: MouseEvent) => {
    setState(prev => {
      if (!prev.dragSelection.isDragging || !prev.dragSelection.startTaskId) {
        return prev
      }

      const currentTaskId = getTaskIdFromY(event.clientY)
      if (!currentTaskId) return prev

      const previewTaskIds = new Set(
        getTaskIdsInRange(prev.dragSelection.startTaskId, currentTaskId)
      )

      return {
        ...prev,
        dragSelection: {
          ...prev.dragSelection,
          currentY: event.clientY,
          previewTaskIds
        }
      }
    })
  }, [getTaskIdFromY, getTaskIdsInRange])

  // ドラッグ選択終了
  const handleDragEnd = useCallback(() => {
    setState(prev => {
      if (!prev.dragSelection.isDragging) return prev

      const newSelectedIds = new Set(prev.dragSelection.previewTaskIds)
      const lastSelected = Array.from(newSelectedIds).pop() || null
      
      // ドラッグ終了時刻を記録（クリア防止用）
      dragEndTimeRef.current = Date.now()
      
      logger.info('Drag selection ended', { 
        selectedCount: newSelectedIds.size,
        taskIds: Array.from(newSelectedIds),
        lastSelectedTaskId: lastSelected,
        dragEndTime: dragEndTimeRef.current
      })

      return {
        ...prev,
        selectedTaskIds: newSelectedIds,
        lastSelectedTaskId: lastSelected,
        isSelecting: newSelectedIds.size > 0,
        selectionMode: newSelectedIds.size > 1 ? 'multiple' : 'single',
        dragSelection: initialDragState
      }
    })
  }, [])

  // ドラッグ選択キャンセル
  const handleDragCancel = useCallback(() => {
    logger.info('Drag selection cancelled')
    
    setState(prev => ({
      ...prev,
      dragSelection: initialDragState
    }))
  }, [])

  // 行クリック処理
  const handleRowClick = useCallback((event: React.MouseEvent, taskId: string) => {
    const isCtrlCmd = event.ctrlKey || event.metaKey
    const isShift = event.shiftKey
    
    let mode: RowSelectionMode = 'single'
    if (isCtrlCmd) {
      mode = 'multiple'
    } else if (isShift && state.lastSelectedTaskId) {
      mode = 'range'
      selectRange(state.lastSelectedTaskId, taskId, tasksRef.current)
      return
    }
    
    toggleTaskSelection(taskId, mode)
  }, [state.lastSelectedTaskId, selectRange, toggleTaskSelection])

  // 行マウスダウン処理
  const handleRowMouseDown = useCallback((event: React.MouseEvent, taskId: string) => {
    const isCtrlCmd = event.ctrlKey || event.metaKey
    
    // 右クリックは無視
    if (event.button === 2) return
    
    // 左クリックの場合のみドラッグ選択開始
    if (event.button === 0) {
      handleDragStart(event, taskId, isCtrlCmd)
    }
  }, [handleDragStart])

  // 選択状態確認
  const isTaskSelected = useCallback((taskId: string) => {
    return state.selectedTaskIds.has(taskId)
  }, [state.selectedTaskIds])

  // プレビュー状態確認
  const isTaskPreview = useCallback((taskId: string) => {
    return state.dragSelection.previewTaskIds.has(taskId)
  }, [state.dragSelection.previewTaskIds])

  // 選択されたタスクを取得
  const getSelectedTasks = useCallback((tasks: Task[]) => {
    return tasks.filter(task => state.selectedTaskIds.has(task.id))
  }, [state.selectedTaskIds])

  // ドラッグ終了直後かどうかをチェック
  const isRecentDragEnd = useCallback((): boolean => {
    return Date.now() - dragEndTimeRef.current < 200 // 200ms以内
  }, [])

  // グローバルマウスイベントリスナー
  useEffect(() => {
    if (!state.dragSelection.isDragging) return

    const handleGlobalMouseMove = (event: MouseEvent) => {
      handleDragMove(event)
    }

    const handleGlobalMouseUp = () => {
      handleDragEnd()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleDragCancel()
      }
    }

    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [state.dragSelection.isDragging, handleDragMove, handleDragEnd, handleDragCancel])

  // Escapeキーでの選択解除
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && state.isSelecting) {
        clearSelection()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [state.isSelecting, clearSelection])

  return {
    // 状態
    selectedTaskIds: state.selectedTaskIds,
    selectedCount: state.selectedTaskIds.size,
    isSelecting: state.isSelecting,
    isDragSelecting: state.dragSelection.isDragging,
    previewTaskIds: state.dragSelection.previewTaskIds,
    
    // 選択操作
    selectTask,
    deselectTask,
    toggleTaskSelection,
    selectRange,
    selectAll,
    clearSelection,
    
    // ドラッグ選択
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
    
    // 状態確認
    isTaskSelected,
    isTaskPreview,
    getSelectedTasks,
    isRecentDragEnd,
    
    // 行クリック処理
    handleRowClick,
    handleRowMouseDown,
    
    // 位置管理（選択範囲枠線用）
    taskPositions,
    updateTaskPosition,
    
    // 内部API（型に含めない）
    updateTasksRef: updateTasksRef as any,
    registerRowElement: registerRowElement as any
  }
}