import React, { useState, useEffect, useCallback, useRef, useId } from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { Check } from 'lucide-react'
import { 
  getColorClasses, 
  getNeutralClasses, 
  getSelectionClasses, 
  getColorIndicator,
  combineClasses,
  type ColorVariant,
  type ThemeMode 
} from '../../utils/themeUtils'

export interface SelectableItem {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  color?: ColorVariant
  disabled?: boolean
  metadata?: Record<string, any>
}

interface SelectableListProps {
  items: SelectableItem[]
  selectedIndex?: number
  onSelect: (item: SelectableItem, index: number) => void
  onSelectionChange?: (index: number) => void
  className?: string
  itemClassName?: string
  showCheckmark?: boolean
  allowKeyboardNavigation?: boolean
  orientation?: 'vertical' | 'horizontal'
  size?: 'sm' | 'md' | 'lg'
  // アクセシビリティ関連
  ariaLabel?: string
  ariaDescribedBy?: string
  multiSelect?: boolean
  role?: 'listbox' | 'radiogroup' | 'menu'
}

export const SelectableList: React.FC<SelectableListProps> = ({
  items,
  selectedIndex: controlledSelectedIndex,
  onSelect,
  onSelectionChange,
  className = '',
  itemClassName = '',
  showCheckmark = true,
  allowKeyboardNavigation = true,
  orientation = 'vertical',
  size = 'md',
  ariaLabel,
  ariaDescribedBy,
  multiSelect = false,
  role = 'listbox'
}) => {
  const { resolvedTheme } = useTheme()
  const [internalSelectedIndex, setInternalSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  // 制御されたコンポーネントか内部状態か
  const selectedIndex = controlledSelectedIndex !== undefined ? controlledSelectedIndex : internalSelectedIndex
  
  const activeDescendantId = selectedIndex !== undefined && items[selectedIndex] 
    ? `${listId}-item-${selectedIndex}` : undefined

  // サイズに応じたクラス
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'p-2 text-sm'
      case 'md':
        return 'p-3 text-sm'
      case 'lg':
        return 'p-4 text-base'
      default:
        return 'p-3 text-sm'
    }
  }

  // 統一テーマシステムを使用 - resolvedThemeを直接使用
  const themeMode = resolvedTheme as ThemeMode
  const neutralClasses = getNeutralClasses(themeMode)

  // 選択状態のクラス（統一テーマシステム使用）
  const getItemSelectionClasses = (index: number, item: SelectableItem) => {
    const baseClasses = `cursor-pointer rounded-lg border-2 transition-all duration-200 ease-in-out ${getSizeClasses()}`
    
    if (item.disabled) {
      return combineClasses(
        baseClasses,
        'opacity-50 cursor-not-allowed border-transparent',
        neutralClasses.surfaceTertiary,
        neutralClasses.textMuted
      )
    }

    const isSelected = selectedIndex === index
    const selectionStyles = getSelectionClasses(isSelected, themeMode)
    
    let backgroundClasses = ''
    if (item.color) {
      const colorClasses = getColorClasses(item.color, 'light', themeMode)
      backgroundClasses = combineClasses(colorClasses.background, colorClasses.text)
    } else {
      backgroundClasses = combineClasses(
        isSelected ? getColorClasses('blue', 'light', themeMode).background : neutralClasses.surfaceSecondary,
        isSelected ? getColorClasses('blue', 'light', themeMode).text : neutralClasses.text
      )
    }

    return combineClasses(
      baseClasses,
      backgroundClasses,
      selectionStyles,
      !isSelected && (themeMode === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100')
    )
  }

  // アイテムの色インジケーター
  const getItemColorIndicator = (item: SelectableItem) => {
    if (!item.color) return ''
    return getColorIndicator(item.color)
  }

  // 選択状態の変更
  const handleSelectionChange = useCallback((newIndex: number) => {
    if (controlledSelectedIndex === undefined) {
      setInternalSelectedIndex(newIndex)
    }
    onSelectionChange?.(newIndex)
  }, [controlledSelectedIndex, onSelectionChange])

  // キーボードナビゲーション
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!allowKeyboardNavigation || items.length === 0) return

    const validItems = items.filter(item => !item.disabled)
    if (validItems.length === 0) return

    switch (event.key) {
      case orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight': {
        event.preventDefault()
        const nextIndex = Math.min(selectedIndex + 1, items.length - 1)
        if (!items[nextIndex]?.disabled) {
          handleSelectionChange(nextIndex)
          // 選択された要素を画面内に表示
          setTimeout(() => {
            const element = listRef.current?.querySelector(`[data-item-index="${nextIndex}"]`)
            element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }, 0)
        }
        break
      }

      case orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft': {
        event.preventDefault()
        const prevIndex = Math.max(selectedIndex - 1, 0)
        if (!items[prevIndex]?.disabled) {
          handleSelectionChange(prevIndex)
          // 選択された要素を画面内に表示
          setTimeout(() => {
            const element = listRef.current?.querySelector(`[data-item-index="${prevIndex}"]`)
            element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }, 0)
        }
        break
      }

      case 'Enter':
      case ' ': {
        event.preventDefault()
        const selectedItem = items[selectedIndex]
        if (selectedItem && !selectedItem.disabled) {
          onSelect(selectedItem, selectedIndex)
        }
        break
      }
    }
  }, [allowKeyboardNavigation, items, selectedIndex, orientation, handleSelectionChange, onSelect])

  // アイテムのクリック
  const handleItemClick = useCallback((item: SelectableItem, index: number) => {
    if (item.disabled) return
    handleSelectionChange(index)
    onSelect(item, index)
  }, [handleSelectionChange, onSelect])

  // アイテムのホバー
  const handleItemHover = useCallback((index: number) => {
    if (items[index]?.disabled) return
    handleSelectionChange(index)
  }, [handleSelectionChange, items])

  // キーボードイベントの設定
  useEffect(() => {
    if (allowKeyboardNavigation) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [allowKeyboardNavigation, handleKeyDown])

  return (
    <div 
      ref={listRef}
      className={combineClasses('space-y-2', className)}
      role={role}
      aria-orientation={orientation}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-activedescendant={activeDescendantId}
      aria-multiselectable={multiSelect}
      tabIndex={allowKeyboardNavigation ? 0 : -1}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          id={`${listId}-item-${index}`}
          data-item-index={index}
          className={combineClasses(getItemSelectionClasses(index, item), itemClassName)}
          onClick={() => handleItemClick(item, index)}
          onMouseEnter={() => handleItemHover(index)}
          role={role === 'radiogroup' ? 'radio' : role === 'menu' ? 'menuitem' : 'option'}
          aria-selected={role !== 'menu' ? selectedIndex === index : undefined}
          aria-checked={role === 'radiogroup' ? selectedIndex === index : undefined}
          aria-disabled={item.disabled}
          aria-label={item.label}
          aria-describedby={item.description ? `${listId}-item-${index}-desc` : undefined}
          tabIndex={-1}
        >
          <div className="flex items-center space-x-3">
            {/* アイコン */}
            {item.icon && (
              <div className="flex-shrink-0">
                {item.icon}
              </div>
            )}

            {/* カラーインジケーター */}
            {item.color && (
              <div className={combineClasses(
                'w-3 h-3 rounded-full flex-shrink-0',
                getItemColorIndicator(item)
              )} />
            )}

            {/* ラベルと説明 */}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {item.label}
              </div>
              {item.description && (
                <div 
                  id={`${listId}-item-${index}-desc`}
                  className={combineClasses('text-xs mt-1', neutralClasses.textTertiary)}
                  role="note"
                >
                  {item.description}
                </div>
              )}
            </div>

            {/* チェックマーク */}
            {showCheckmark && selectedIndex === index && !item.disabled && (
              <Check 
                size={16} 
                className="text-blue-600 flex-shrink-0" 
                aria-hidden="true"
                role="img"
                aria-label="選択済み"
              />
            )}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className={combineClasses('text-center py-8', neutralClasses.textMuted)}>
          <p className="text-sm">項目がありません</p>
        </div>
      )}
    </div>
  )
}