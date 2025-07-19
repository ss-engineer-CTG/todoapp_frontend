import { useState, useCallback, useEffect } from 'react'
import { SelectionState, SelectionType } from '../types'

export const useSelection = () => {
  const [selection, setSelection] = useState<SelectionState>({
    selectedGoalId: null,
    selectedTodoId: null,
    selectedType: null
  })

  // 目標の選択
  const selectGoal = useCallback((goalId: string) => {
    setSelection({
      selectedGoalId: goalId,
      selectedTodoId: null,
      selectedType: 'goal'
    })
  }, [])

  // ToDoの選択
  const selectTodo = useCallback((todoId: string) => {
    setSelection({
      selectedGoalId: null,
      selectedTodoId: todoId,
      selectedType: 'todo'
    })
  }, [])

  // 選択をクリア
  const clearSelection = useCallback(() => {
    setSelection({
      selectedGoalId: null,
      selectedTodoId: null,
      selectedType: null
    })
  }, [])

  // 特定の目標が選択されているかチェック
  const isGoalSelected = useCallback((goalId: string): boolean => {
    return selection.selectedGoalId === goalId
  }, [selection.selectedGoalId])

  // 特定のToDoが選択されているかチェック
  const isTodoSelected = useCallback((todoId: string): boolean => {
    return selection.selectedTodoId === todoId
  }, [selection.selectedTodoId])

  // 何かが選択されているかチェック
  const hasSelection = useCallback((): boolean => {
    return selection.selectedType !== null
  }, [selection.selectedType])

  // 現在の選択タイプを取得
  const getSelectionType = useCallback((): SelectionType => {
    return selection.selectedType
  }, [selection.selectedType])

  // 現在選択されているIDを取得
  const getSelectedId = useCallback((): string | null => {
    return selection.selectedGoalId || selection.selectedTodoId
  }, [selection.selectedGoalId, selection.selectedTodoId])

  // 選択状態の情報を取得
  const getSelectionInfo = useCallback(() => {
    return {
      selectedGoalId: selection.selectedGoalId,
      selectedTodoId: selection.selectedTodoId,
      selectedType: selection.selectedType,
      hasSelection: hasSelection(),
      selectedId: getSelectedId()
    }
  }, [selection, hasSelection, getSelectedId])

  // 選択可能な項目のリストを取得
  const getSelectableItems = useCallback(() => {
    const goals = Array.from(document.querySelectorAll('[data-selectable][data-type="goal"]'))
    const todos = Array.from(document.querySelectorAll('[data-selectable][data-type="todo"]'))
    
    return [
      ...goals.map(el => ({ 
        element: el as HTMLElement, 
        type: 'goal' as const, 
        id: el.getAttribute('data-id') || ''
      })),
      ...todos.map(el => ({ 
        element: el as HTMLElement, 
        type: 'todo' as const, 
        id: el.getAttribute('data-id') || ''
      }))
    ]
  }, [])

  // 次の項目を選択
  const selectNext = useCallback(() => {
    const items = getSelectableItems()
    if (items.length === 0) return

    const currentIndex = items.findIndex(item => {
      if (item.type === 'goal') {
        return item.id === selection.selectedGoalId
      } else {
        return item.id === selection.selectedTodoId
      }
    })

    const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
    const nextItem = items[nextIndex]

    if (nextItem.type === 'goal') {
      selectGoal(nextItem.id)
    } else {
      selectTodo(nextItem.id)
    }

    // 選択された要素をビューに表示
    nextItem.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selection, getSelectableItems, selectGoal, selectTodo])

  // 前の項目を選択
  const selectPrevious = useCallback(() => {
    const items = getSelectableItems()
    if (items.length === 0) return

    const currentIndex = items.findIndex(item => {
      if (item.type === 'goal') {
        return item.id === selection.selectedGoalId
      } else {
        return item.id === selection.selectedTodoId
      }
    })

    const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
    const prevItem = items[prevIndex]

    if (prevItem.type === 'goal') {
      selectGoal(prevItem.id)
    } else {
      selectTodo(prevItem.id)
    }

    // 選択された要素をビューに表示
    prevItem.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selection, getSelectableItems, selectGoal, selectTodo])

  // 選択された項目を削除
  const deleteSelected = useCallback(() => {
    if (hasSelection()) {
      const deleteEvent = new CustomEvent('deleteSelected', {
        detail: {
          type: selection.selectedType,
          id: getSelectedId()
        }
      })
      window.dispatchEvent(deleteEvent)
    }
  }, [selection, hasSelection, getSelectedId])

  // キーボードイベントハンドラー
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // モーダルが開いている場合は処理をスキップ
    const modalElements = document.querySelectorAll('[role="dialog"], .modal')
    const isModalOpen = Array.from(modalElements).some(modal => 
      !modal.classList.contains('hidden') && 
      getComputedStyle(modal).display !== 'none'
    )
    
    if (isModalOpen) return

    // フォーカスされている要素がテキスト入力の場合はスキップ
    const activeElement = document.activeElement
    const isTextInput = activeElement?.tagName === 'INPUT' || 
                       activeElement?.tagName === 'TEXTAREA' ||
                       activeElement?.contentEditable === 'true'
    
    if (isTextInput) return

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        selectPrevious()
        break
        
      case 'ArrowDown':
        event.preventDefault()
        selectNext()
        break
        
      case 'Escape':
        event.preventDefault()
        clearSelection()
        break
        
      case 'Delete':
      case 'Backspace':
        if (hasSelection()) {
          event.preventDefault()
          deleteSelected()
        }
        break
    }
  }, [selection, hasSelection, clearSelection, selectNext, selectPrevious, deleteSelected])

  // グローバルキーボードイベントの設定
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // 背景クリック時の選択解除
  const handleBackgroundClick = useCallback((event: React.MouseEvent) => {
    // 選択可能な要素がクリックされた場合は処理をスキップ
    const target = event.target as HTMLElement
    const isSelectableElement = target.closest('[data-selectable]') || 
                               target.closest('.goal-item') ||
                               target.closest('.todo-item')
    
    if (isSelectableElement) return

    // 入力フィールドやボタンがクリックされた場合は処理をスキップ
    const isInputElement = target.closest('input') ||
                          target.closest('button') ||
                          target.closest('textarea') ||
                          target.closest('select')
    
    if (isInputElement) return

    // モーダル内のクリックは処理をスキップ
    const isModalClick = target.closest('[role="dialog"]') ||
                        target.closest('.modal')
    
    if (isModalClick) return

    // その他の場所をクリックした場合は選択をクリア
    clearSelection()
  }, [clearSelection])

  // 選択状態のCSSクラスを取得
  const getSelectionClasses = useCallback((
    itemId: string,
    itemType: 'goal' | 'todo'
  ): string => {
    const isSelected = itemType === 'goal' 
      ? isGoalSelected(itemId)
      : isTodoSelected(itemId)
    
    if (isSelected) {
      return 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
    }
    return ''
  }, [isGoalSelected, isTodoSelected])

  // 選択可能な要素のプロパティを取得
  const getSelectableProps = useCallback((
    itemId: string,
    itemType: 'goal' | 'todo'
  ) => {
    const handleClick = (event: React.MouseEvent) => {
      // チェックボックスがクリックされた場合は選択処理をスキップ
      const target = event.target as HTMLElement
      if (target.type === 'checkbox') return

      event.stopPropagation()
      
      if (itemType === 'goal') {
        selectGoal(itemId)
      } else {
        selectTodo(itemId)
      }
    }

    return {
      'data-selectable': true,
      'data-id': itemId,
      'data-type': itemType,
      onClick: handleClick,
      className: getSelectionClasses(itemId, itemType)
    }
  }, [selectGoal, selectTodo, getSelectionClasses])

  return {
    // 選択状態
    selection,
    hasSelection,
    getSelectionType,
    getSelectedId,
    getSelectionInfo,
    
    // 選択操作
    selectGoal,
    selectTodo,
    clearSelection,
    selectNext,
    selectPrevious,
    deleteSelected,
    
    // チェック関数
    isGoalSelected,
    isTodoSelected,
    
    // イベントハンドラー
    handleBackgroundClick,
    
    // UI支援
    getSelectionClasses,
    getSelectableProps
  }
}