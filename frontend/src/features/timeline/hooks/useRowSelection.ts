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
  // ドラッグ選択座標
  dragSelectionStartY: number
  dragSelectionCurrentY: number
  
  // 選択操作
  selectTask: (taskId: string, mode?: RowSelectionMode) => void
  deselectTask: (taskId: string) => void
  toggleTaskSelection: (taskId: string, mode?: RowSelectionMode) => void
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
  isRecentDragEnd: () => boolean
  
  // 行クリック処理
  handleRowClick: (event: React.MouseEvent, taskId: string) => void
  handleRowMouseDown: (event: React.MouseEvent, taskId: string) => void
  
  // 位置管理（選択範囲枠線用）
  taskPositions: Map<string, { top: number; left: number; width: number; height: number }>
  updateTaskPosition: (taskId: string, position: { top: number; left: number; width: number; height: number }) => void
  
  // 内部API
  updateTasksRef: (tasks: Task[]) => void
  registerRowElement: (taskId: string, element: HTMLElement) => void
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
  
  // クリック vs ドラッグ判定用
  const dragStartPositionRef = useRef<{ x: number; y: number } | null>(null)
  const currentMousePositionRef = useRef<{ x: number; y: number } | null>(null)
  const DRAG_THRESHOLD = 10 // ピクセル（ドラッグ検出の感度を調整）

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

  // Y座標から対象タスクIDを取得（DOM直接検索版）
  const getTaskIdFromY = useCallback((y: number): string | null => {
    // 現在のマウス位置を使用（利用可能な場合）
    const mouseX = currentMousePositionRef.current?.x || window.innerWidth / 2
    
    // DOM要素を直接検索してXY座標に該当するタスク行を見つける
    const elementsAtPoint = document.elementsFromPoint(mouseX, y)
    
    // data-task-row属性を持つ要素を探す
    for (const element of elementsAtPoint) {
      const taskRow = element.closest('[data-task-row]')
      if (taskRow) {
        const taskId = taskRow.getAttribute('data-task-row')
        const projectId = taskRow.getAttribute('data-project-id')
        
        if (taskId && projectId) {
          logger.debug('Task selected from Y coordinate (DOM search)', {
            y,
            mouseX,
            taskId,
            projectId,
            elementTop: taskRow.getBoundingClientRect().top,
            elementBottom: taskRow.getBoundingClientRect().bottom
          })
          return taskId
        }
      }
    }

    // フォールバック：従来の方式で最も近い要素を探す
    let closestTaskId: string | null = null
    let closestDistance = Infinity

    rowElementsRef.current.forEach((element, taskId) => {
      const rect = element.getBoundingClientRect()
      const elementCenterY = rect.top + rect.height / 2
      const distance = Math.abs(y - elementCenterY)
      
      if (distance < closestDistance) {
        closestDistance = distance
        closestTaskId = taskId
      }
    })

    if (closestTaskId) {
      logger.debug('Task selected from Y coordinate (fallback)', {
        y,
        mouseX,
        taskId: closestTaskId,
        closestDistance
      })
    }

    return closestTaskId
  }, [])

  // 範囲内のタスクIDを取得（画面位置ベース）
  const getTaskIdsInRange = useCallback((startTaskId: string, endTaskId: string): string[] => {
    const startElement = rowElementsRef.current.get(startTaskId)
    const endElement = rowElementsRef.current.get(endTaskId)
    
    if (!startElement || !endElement) {
      logger.warn('Range selection failed: Elements not found', {
        startTaskId,
        endTaskId,
        startFound: !!startElement,
        endFound: !!endElement
      })
      return [startTaskId]
    }

    const startRect = startElement.getBoundingClientRect()
    const endRect = endElement.getBoundingClientRect()
    
    // Y座標の範囲を決定
    const minY = Math.min(startRect.top, endRect.top)
    const maxY = Math.max(startRect.bottom, endRect.bottom)
    
    // 範囲内にある全てのタスクIDを収集
    const tasksInRange: string[] = []
    
    rowElementsRef.current.forEach((element, taskId) => {
      const rect = element.getBoundingClientRect()
      const elementCenterY = rect.top + rect.height / 2
      
      // 要素の中心が範囲内にあるかチェック
      if (elementCenterY >= minY && elementCenterY <= maxY) {
        tasksInRange.push(taskId)
      }
    })
    
    // Y座標順でソート
    tasksInRange.sort((a, b) => {
      const elementA = rowElementsRef.current.get(a)
      const elementB = rowElementsRef.current.get(b)
      if (!elementA || !elementB) return 0
      
      const rectA = elementA.getBoundingClientRect()
      const rectB = elementB.getBoundingClientRect()
      return rectA.top - rectB.top
    })
    
    logger.debug('Range selection calculated', {
      startTaskId,
      endTaskId,
      minY,
      maxY,
      tasksInRange: tasksInRange.length,
      taskIds: tasksInRange
    })
    
    return tasksInRange
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

  // マウスダウン処理（ドラッグ開始の準備）
  const handleDragStart = useCallback((event: React.MouseEvent, taskId: string, isAdditive: boolean) => {
    event.preventDefault()
    
    // タイムラインコンテナ要素を取得
    const timelineContainer = document.querySelector('.timeline-content')
    const containerRect = timelineContainer?.getBoundingClientRect()
    
    // スクロール位置を考慮してコンテナ相対座標に変換
    const scrollTop = timelineContainer?.scrollTop || 0
    const relativeY = containerRect ? (event.clientY - containerRect.top + scrollTop) : event.clientY
    
    // ドラッグ開始位置と現在のマウス位置を記録
    const mousePos = {
      x: event.clientX,
      y: event.clientY
    }
    dragStartPositionRef.current = mousePos
    currentMousePositionRef.current = mousePos
    
    logger.info('Mouse down on task row - drag initialization', { 
      taskId, 
      isAdditive,
      startX: event.clientX,
      startY: event.clientY,
      relativeY,
      containerTop: containerRect?.top,
      scrollTop,
      button: event.button,
      currentRowElements: rowElementsRef.current.size,
      tasksRefLength: tasksRef.current.length
    })
    
    // まだドラッグは開始しない（移動が検知されてから開始）
    setState(prev => ({
      ...prev,
      dragSelection: {
        ...initialDragState,
        startY: relativeY, // コンテナ相対座標を使用
        currentY: relativeY,
        startTaskId: taskId,
      },
      selectionMode: 'single'
    }))
  }, [])

  // ドラッグ選択移動
  const handleDragMove = useCallback((event: MouseEvent) => {
    // タイムラインコンテナ要素を取得
    const timelineContainer = document.querySelector('.timeline-content')
    const containerRect = timelineContainer?.getBoundingClientRect()
    
    // スクロール位置を考慮してコンテナ相対座標に変換
    const scrollTop = timelineContainer?.scrollTop || 0
    const relativeY = containerRect ? (event.clientY - containerRect.top + scrollTop) : event.clientY
    
    logger.debug('handleDragMove called', {
      clientX: event.clientX,
      clientY: event.clientY,
      relativeY,
      containerTop: containerRect?.top,
      scrollTop,
      dragStartPosition: dragStartPositionRef.current,
      hasStartTaskId: !!state.dragSelection.startTaskId
    })
    
    // 現在のマウス位置を更新
    currentMousePositionRef.current = {
      x: event.clientX,
      y: event.clientY
    }
    
    setState(prev => {
      const startPos = dragStartPositionRef.current
      
      logger.debug('handleDragMove setState callback', {
        hasStartPos: !!startPos,
        startTaskId: prev.dragSelection.startTaskId,
        isDragging: prev.dragSelection.isDragging
      })
      
      // ドラッグ開始位置が記録されていない場合は何もしない
      if (!startPos || !prev.dragSelection.startTaskId) {
        logger.debug('No start position or start task ID, skipping drag move')
        return prev
      }

      // ドラッグ距離を計算
      const deltaX = Math.abs(event.clientX - startPos.x)
      const deltaY = Math.abs(event.clientY - startPos.y)
      const isDragThresholdExceeded = deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD

      logger.debug('Drag distance calculation', {
        deltaX,
        deltaY,
        threshold: DRAG_THRESHOLD,
        isDragThresholdExceeded,
        currentlyDragging: prev.dragSelection.isDragging
      })

      // しきい値を超えていない場合は何もしない
      if (!isDragThresholdExceeded && !prev.dragSelection.isDragging) {
        logger.debug('Drag threshold not exceeded and not currently dragging, skipping')
        return prev
      }

      // 初回のドラッグ開始
      if (!prev.dragSelection.isDragging && isDragThresholdExceeded) {
        logger.info('Drag selection actually started', { 
          taskId: prev.dragSelection.startTaskId,
          deltaX,
          deltaY,
          threshold: DRAG_THRESHOLD,
          startY: prev.dragSelection.startY,
          currentY: event.clientY,
          rowElementsCount: rowElementsRef.current.size
        })
      }

      const currentTaskId = getTaskIdFromY(event.clientY) // ビューポート座標で検索
      logger.debug('Current task ID from Y coordinate', {
        currentY: event.clientY,
        currentTaskId,
        rowElementsSize: rowElementsRef.current.size
      })
      
      if (!currentTaskId) {
        logger.debug('No current task ID found, keeping previous state')
        return prev
      }

      const previewTaskIds = new Set(
        getTaskIdsInRange(prev.dragSelection.startTaskId, currentTaskId)
      )
      
      logger.debug('Preview task IDs calculated', {
        startTaskId: prev.dragSelection.startTaskId,
        currentTaskId,
        previewCount: previewTaskIds.size,
        previewTaskIds: Array.from(previewTaskIds),
        coordinates: {
          startY: prev.dragSelection.startY,
          currentRelativeY: relativeY,
          currentClientY: event.clientY,
          containerTop: containerRect?.top,
          scrollTop
        }
      })

      return {
        ...prev,
        dragSelection: {
          ...prev.dragSelection,
          isDragging: true, // 実際のドラッグが開始された
          currentY: relativeY, // コンテナ相対座標を使用
          previewTaskIds
        },
        selectionMode: 'drag'
      }
    })
  }, [getTaskIdFromY, getTaskIdsInRange, state.dragSelection.startTaskId, state.dragSelection.isDragging])

  // ドラッグ選択終了
  const handleDragEnd = useCallback(() => {
    setState(prev => {
      const wasDragging = prev.dragSelection.isDragging
      const startTaskId = prev.dragSelection.startTaskId
      
      // ドラッグ開始位置とマウス位置をクリア
      dragStartPositionRef.current = null
      currentMousePositionRef.current = null
      
      if (wasDragging) {
        // 実際にドラッグしていた場合：選択を確定
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
      } else if (startTaskId) {
        // 単純クリックの場合：そのタスクを選択
        logger.info('Single click selection', { 
          taskId: startTaskId
        })
        
        return {
          ...prev,
          selectedTaskIds: new Set([startTaskId]),
          lastSelectedTaskId: startTaskId,
          isSelecting: true,
          selectionMode: 'single',
          dragSelection: initialDragState
        }
      }

      return {
        ...prev,
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

  // 行クリック処理（キーボード修飾子対応）
  const handleRowClick = useCallback((event: React.MouseEvent, taskId: string) => {
    const isCtrlCmd = event.ctrlKey || event.metaKey
    
    logger.info('Row click with modifiers', {
      taskId,
      isCtrlCmd,
      currentSelected: Array.from(state.selectedTaskIds),
      lastSelected: state.lastSelectedTaskId
    })
    
    if (isCtrlCmd) {
      // Ctrl/Cmd+クリック：複数選択（トグル）
      toggleTaskSelection(taskId, 'multiple')
    } else {
      // 通常クリック：単一選択
      selectTask(taskId, 'single')
    }
  }, [state.selectedTaskIds, toggleTaskSelection, selectTask])

  // 行マウスダウン処理
  const handleRowMouseDown = useCallback((event: React.MouseEvent, taskId: string) => {
    const isCtrlCmd = event.ctrlKey || event.metaKey
    
    // 右クリックは無視
    if (event.button === 2) return
    
    // Ctrl/Cmd+クリックの場合はドラッグを開始しない（複数選択のため）
    if (isCtrlCmd) {
      logger.info('Ctrl+click detected, skipping drag initialization', { taskId })
      return
    }
    
    // 左クリックの場合のみドラッグ選択開始
    if (event.button === 0) {
      handleDragStart(event, taskId, false)
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

  // グローバルマウスイベントリスナー（ドラッグ準備状態でも登録）
  useEffect(() => {
    // ドラッグ中またはドラッグ準備中（startTaskIdがある）の場合にリスナーを登録
    if (!state.dragSelection.isDragging && !state.dragSelection.startTaskId) {
      logger.debug('No global listeners needed', {
        isDragging: state.dragSelection.isDragging,
        startTaskId: state.dragSelection.startTaskId
      })
      return
    }

    const handleGlobalMouseMove = (event: MouseEvent) => {
      logger.debug('Global mouse move event triggered', {
        clientX: event.clientX,
        clientY: event.clientY,
        target: (event.target as Element)?.tagName
      })
      handleDragMove(event)
    }

    const handleGlobalMouseUp = () => {
      logger.debug('Global mouse up event triggered')
      handleDragEnd()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        logger.debug('Escape key pressed - canceling drag')
        handleDragCancel()
      }
    }

    logger.info('Global mouse listeners registered', {
      isDragging: state.dragSelection.isDragging,
      startTaskId: state.dragSelection.startTaskId,
      listenerFunctions: {
        hasHandleDragMove: typeof handleDragMove === 'function',
        hasHandleDragEnd: typeof handleDragEnd === 'function',
        hasHandleDragCancel: typeof handleDragCancel === 'function'
      }
    })

    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false })
    document.addEventListener('mouseup', handleGlobalMouseUp, { passive: false })
    document.addEventListener('keydown', handleKeyDown, { passive: false })

    return () => {
      logger.info('Global mouse listeners removed')
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [state.dragSelection.isDragging, state.dragSelection.startTaskId, handleDragMove, handleDragEnd, handleDragCancel])

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
    // ドラッグ選択座標
    dragSelectionStartY: state.dragSelection.startY,
    dragSelectionCurrentY: state.dragSelection.currentY,
    
    // 選択操作
    selectTask,
    deselectTask,
    toggleTaskSelection,
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
    
    // 内部API
    updateTasksRef,
    registerRowElement
  }
}