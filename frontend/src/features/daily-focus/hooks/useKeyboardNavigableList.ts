import { useState, useCallback, useRef, useEffect } from 'react'

export interface NavigableItem {
  id: string
  disabled?: boolean
  [key: string]: any
}

interface UseKeyboardNavigableListOptions<T extends NavigableItem> {
  items: T[]
  onSelect?: (item: T, index: number) => void
  onSelectionChange?: (index: number) => void
  initialIndex?: number
  orientation?: 'vertical' | 'horizontal'
  loop?: boolean
  autoScroll?: boolean
  containerSelector?: string
}

export const useKeyboardNavigableList = <T extends NavigableItem>({
  items,
  onSelect,
  onSelectionChange,
  initialIndex = 0,
  orientation = 'vertical',
  loop = true,
  autoScroll = true,
  containerSelector
}: UseKeyboardNavigableListOptions<T>) => {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex)
  const [isNavigating, setIsNavigating] = useState(false)
  const lastNavigationTime = useRef(0)

  // 有効なアイテムのインデックスを取得
  const getValidIndices = useCallback(() => {
    return items
      .map((_, index) => index)
      .filter(index => !items[index]?.disabled)
  }, [items])

  // 次の有効なインデックスを取得
  const getNextValidIndex = useCallback((currentIndex: number, direction: 'next' | 'prev') => {
    const validIndices = getValidIndices()
    if (validIndices.length === 0) return currentIndex

    const currentValidIndex = validIndices.indexOf(currentIndex)
    
    if (direction === 'next') {
      if (currentValidIndex >= validIndices.length - 1) {
        return loop ? validIndices[0] : validIndices[validIndices.length - 1]
      }
      return validIndices[currentValidIndex + 1]
    } else {
      if (currentValidIndex <= 0) {
        return loop ? validIndices[validIndices.length - 1] : validIndices[0]
      }
      return validIndices[currentValidIndex - 1]
    }
  }, [getValidIndices, loop])

  // 選択状態の変更
  const updateSelection = useCallback((newIndex: number, isKeyboard = false) => {
    if (newIndex < 0 || newIndex >= items.length || items[newIndex]?.disabled) {
      return
    }

    setSelectedIndex(newIndex)
    setIsNavigating(isKeyboard)
    lastNavigationTime.current = Date.now()
    
    onSelectionChange?.(newIndex)

    // 自動スクロール
    if (autoScroll && isKeyboard) {
      setTimeout(() => {
        const selector = containerSelector 
          ? `${containerSelector} [data-item-index="${newIndex}"]`
          : `[data-item-index="${newIndex}"]`
        
        const element = document.querySelector(selector)
        element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 0)
    }
  }, [items, onSelectionChange, autoScroll, containerSelector])

  // キーボードナビゲーション
  const navigateNext = useCallback(() => {
    const nextIndex = getNextValidIndex(selectedIndex, 'next')
    if (nextIndex !== undefined) {
      updateSelection(nextIndex, true)
    }
  }, [selectedIndex, getNextValidIndex, updateSelection])

  const navigatePrevious = useCallback(() => {
    const prevIndex = getNextValidIndex(selectedIndex, 'prev')
    if (prevIndex !== undefined) {
      updateSelection(prevIndex, true)
    }
  }, [selectedIndex, getNextValidIndex, updateSelection])

  const navigateToIndex = useCallback((index: number, isKeyboard = false) => {
    updateSelection(index, isKeyboard)
  }, [updateSelection])

  const navigateToItem = useCallback((itemId: string, isKeyboard = false) => {
    const index = items.findIndex(item => item.id === itemId)
    if (index !== -1) {
      updateSelection(index, isKeyboard)
    }
  }, [items, updateSelection])

  // 選択されたアイテムを実行
  const selectCurrent = useCallback(() => {
    const item = items[selectedIndex]
    if (item && !item.disabled) {
      onSelect?.(item, selectedIndex)
    }
  }, [items, selectedIndex, onSelect])

  // 最初の有効なアイテムに移動
  const navigateToFirst = useCallback(() => {
    const validIndices = getValidIndices()
    if (validIndices.length > 0) {
      const firstIndex = validIndices[0]
      if (firstIndex !== undefined) {
        updateSelection(firstIndex, true)
      }
    }
  }, [getValidIndices, updateSelection])

  // 最後の有効なアイテムに移動
  const navigateToLast = useCallback(() => {
    const validIndices = getValidIndices()
    if (validIndices.length > 0) {
      const lastIndex = validIndices[validIndices.length - 1]
      if (lastIndex !== undefined) {
        updateSelection(lastIndex, true)
      }
    }
  }, [getValidIndices, updateSelection])

  // キーボードイベントハンドラー
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key } = event

    switch (key) {
      case orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight':
        event.preventDefault()
        navigateNext()
        break

      case orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft':
        event.preventDefault()
        navigatePrevious()
        break

      case 'Home':
        event.preventDefault()
        navigateToFirst()
        break

      case 'End':
        event.preventDefault()
        navigateToLast()
        break

      case 'Enter':
      case ' ':
        event.preventDefault()
        selectCurrent()
        break
      
      default:
        break
    }
  }, [orientation, navigateNext, navigatePrevious, navigateToFirst, navigateToLast, selectCurrent])

  // 現在の選択アイテム
  const selectedItem = items[selectedIndex] || null

  // 選択状態のプロパティ
  const getItemProps = useCallback((item: T, index: number) => {
    const isSelected = selectedIndex === index
    const isKeyboardNavigation = isNavigating && 
      Date.now() - lastNavigationTime.current < 200 // 200ms以内のナビゲーション

    return {
      'data-item-index': index,
      'data-selected': isSelected,
      'data-keyboard-navigation': isKeyboardNavigation,
      'aria-selected': isSelected,
      'aria-disabled': item.disabled,
      role: 'option',
      tabIndex: isSelected ? 0 : -1,
      onClick: () => {
        updateSelection(index, false)
        if (!item.disabled) {
          onSelect?.(item, index)
        }
      },
      onMouseEnter: () => {
        if (!item.disabled && !isNavigating) {
          updateSelection(index, false)
        }
      }
    }
  }, [selectedIndex, isNavigating, updateSelection, onSelect])

  // リストのプロパティ
  const getListProps = useCallback(() => ({
    role: 'listbox',
    'aria-orientation': orientation,
    'aria-activedescendant': selectedItem ? `item-${selectedItem.id}` : undefined,
    onKeyDown: handleKeyDown
  }), [orientation, selectedItem, handleKeyDown])

  // キーボードナビゲーション状態がリセットされるまでの時間
  useEffect(() => {
    if (isNavigating) {
      const timer = setTimeout(() => {
        setIsNavigating(false)
      }, 500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isNavigating, selectedIndex])

  return {
    // 状態
    selectedIndex,
    selectedItem,
    isNavigating,
    hasItems: items.length > 0,
    
    // ナビゲーション操作
    navigateNext,
    navigatePrevious,
    navigateToIndex,
    navigateToItem,
    navigateToFirst,
    navigateToLast,
    selectCurrent,
    
    // プロパティ取得
    getItemProps,
    getListProps,
    
    // イベントハンドラー
    handleKeyDown
  }
}