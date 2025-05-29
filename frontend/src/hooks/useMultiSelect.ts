import { useState, useCallback } from 'react'

interface UseMultiSelectProps<T> {
  items: T[]
  getItemId: (item: T) => string
  initialSelectedId?: string | null
}

export const useMultiSelect = <T>({
  items,
  getItemId,
  initialSelectedId = null
}: UseMultiSelectProps<T>) => {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId)
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialSelectedId ? [initialSelectedId] : []
  )
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false)
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(0)

  const handleSelect = useCallback((
    itemId: string,
    event?: React.MouseEvent
  ) => {
    const currentIndex = items.findIndex(item => getItemId(item) === itemId)

    // Ctrl/Cmd + クリック: 個別選択/選択解除
    if (event && (event.ctrlKey || event.metaKey)) {
      setIsMultiSelectMode(true)

      if (selectedIds.includes(itemId)) {
        // 選択解除
        const newSelectedIds = selectedIds.filter(id => id !== itemId)
        setSelectedIds(newSelectedIds)
        
        if (selectedId === itemId) {
          setSelectedId(newSelectedIds.length > 0 ? newSelectedIds[0] : null)
        }
      } else {
        // 選択に追加
        setSelectedIds([...selectedIds, itemId])
        setSelectedId(itemId)
      }
      
      setLastSelectedIndex(currentIndex)
    }
    // Shift + クリック: 範囲選択
    else if (event && event.shiftKey && selectedId && items.length > 0) {
      setIsMultiSelectMode(true)
      
      const lastIndex = items.findIndex(item => getItemId(item) === selectedId)
      
      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex)
        const end = Math.max(currentIndex, lastIndex)
        
        const rangeIds = items
          .slice(start, end + 1)
          .map(item => getItemId(item))
        
        setSelectedIds(rangeIds)
        setSelectedId(itemId)
        setLastSelectedIndex(currentIndex)
      }
    }
    // 通常のクリック: 単一選択
    else {
      setSelectedId(itemId)
      setSelectedIds([itemId])
      setIsMultiSelectMode(false)
      setLastSelectedIndex(currentIndex)
    }
  }, [items, getItemId, selectedId, selectedIds])

  const handleKeyboardRangeSelect = useCallback((direction: 'up' | 'down') => {
    if (!selectedId || items.length === 0) return

    const currentIndex = items.findIndex(item => getItemId(item) === selectedId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(items.length - 1, currentIndex + 1)

    if (newIndex === currentIndex) return

    const newItemId = getItemId(items[newIndex])

    if (isMultiSelectMode) {
      // 範囲選択の拡張/縮小
      if (selectedIds.includes(newItemId)) {
        // 縮小: 現在のアイテムを選択解除
        if ((direction === 'up' && lastSelectedIndex < currentIndex) ||
            (direction === 'down' && lastSelectedIndex > currentIndex)) {
          setSelectedIds(selectedIds.filter(id => id !== selectedId))
        }
      } else {
        // 拡張: 新しいアイテムを選択に追加
        setSelectedIds([...selectedIds, newItemId])
      }
    } else {
      // 通常の移動
      setSelectedIds([newItemId])
    }

    setSelectedId(newItemId)
    setLastSelectedIndex(newIndex)
  }, [items, getItemId, selectedId, selectedIds, isMultiSelectMode, lastSelectedIndex])

  const selectAll = useCallback(() => {
    if (items.length === 0) return

    setIsMultiSelectMode(true)
    const allIds = items.map(item => getItemId(item))
    setSelectedIds(allIds)
    
    if (!selectedId && items.length > 0) {
      setSelectedId(getItemId(items[0]))
    }
  }, [items, getItemId, selectedId])

  const clearSelection = useCallback(() => {
    setSelectedId(null)
    setSelectedIds([])
    setIsMultiSelectMode(false)
    setLastSelectedIndex(0)
  }, [])

  const toggleMultiSelectMode = useCallback(() => {
    if (isMultiSelectMode) {
      // 複数選択モードを解除
      setIsMultiSelectMode(false)
      if (selectedIds.length > 0) {
        const firstSelectedId = selectedIds[0]
        setSelectedId(firstSelectedId)
        setSelectedIds([firstSelectedId])
      }
    } else {
      // 複数選択モードを有効化
      setIsMultiSelectMode(true)
      if (selectedId && !selectedIds.includes(selectedId)) {
        setSelectedIds([...selectedIds, selectedId])
      }
    }
  }, [isMultiSelectMode, selectedId, selectedIds])

  return {
    selectedId,
    selectedIds,
    isMultiSelectMode,
    lastSelectedIndex,
    handleSelect,
    handleKeyboardRangeSelect,
    selectAll,
    clearSelection,
    toggleMultiSelectMode,
    setSelectedId,
    setSelectedIds,
    setIsMultiSelectMode
  }
}