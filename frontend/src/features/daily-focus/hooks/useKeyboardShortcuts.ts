import { useEffect, useCallback } from 'react'
import { useSelection } from './useSelection'

export const useKeyboardShortcuts = () => {
  const { 
    selection, 
    navigateSelection, 
    clearSelection, 
    deleteSelected,
    selectNext,
    selectPrevious 
  } = useSelection()

  // キーボードイベントハンドラー
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // モーダルが開いている場合はスキップ
    const isModalOpen = 
      !document.getElementById('tagSelectionModal')?.classList.contains('hidden') ||
      !document.getElementById('tagEditModal')?.classList.contains('hidden') ||
      !document.getElementById('goalEditModal')?.classList.contains('hidden')
    
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
        
      case 'Delete':
      case 'Backspace':
        event.preventDefault()
        if (selection.selectedGoalId || selection.selectedTodoId) {
          deleteSelected()
        }
        break
        
      case 'Escape':
        event.preventDefault()
        clearSelection()
        break
        
      default:
        break
    }
  }, [selection, selectNext, selectPrevious, deleteSelected, clearSelection])

  // グローバルキーボードイベントの設定
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [handleKeyDown])

  return {
    // キーボードショートカットの状態（デバッグ用）
    hasSelection: !!(selection.selectedGoalId || selection.selectedTodoId),
    selectedType: selection.selectedGoalId ? 'goal' : selection.selectedTodoId ? 'todo' : null
  }
}