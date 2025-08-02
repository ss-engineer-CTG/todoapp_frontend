import React, { useState, useCallback } from 'react'
import { Edit, X, Check } from 'lucide-react'
import { useTheme } from '@core/components/ThemeProvider'
import { useGoals } from '../../hooks/useGoals'
import { useCustomTags } from '../../hooks/useCustomTags'
import { Goal, CustomTag } from '../../types'
import { KeyboardNavigableModal } from '../common/KeyboardNavigableModal'
import { SelectableList, SelectableItem } from '../common/SelectableList'
import { 
  getColorClasses, 
  getNeutralClasses, 
  getInteractionClasses,
  getSelectionClasses,
  getButtonStyles,
  getInputStyles,
  getColorIndicator,
  combineClasses,
  type ColorVariant,
  type ThemeMode 
} from '../../utils/themeUtils'

interface TagSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTag: (tagId: string, tagType: 'goal' | 'custom') => void
  onSkipTag: () => void
  todoText: string
}

export const TagSelectionModal: React.FC<TagSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectTag,
  onSkipTag,
  todoText
}) => {
  const { resolvedTheme } = useTheme()
  const { goals } = useGoals()
  const { tags, updateTag } = useCustomTags()
  
  // 統一テーマシステムを使用 - resolvedThemeを直接使用
  const themeMode = resolvedTheme as ThemeMode
  const neutralClasses = getNeutralClasses(themeMode)
  const interactionClasses = getInteractionClasses(themeMode)
  
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editingTagName, setEditingTagName] = useState('')
  const [editingTagEmoji, setEditingTagEmoji] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // SelectableItemsに変換
  const selectableItems: SelectableItem[] = [
    // 目標項目
    ...goals.map(goal => ({
      id: `goal-${goal.id}`,
      label: `📚 ${goal.title}`,
      description: goal.description,
      color: goal.color,
      metadata: { type: 'goal', originalItem: goal }
    })),
    // カスタムタグ項目
    ...tags.map(tag => ({
      id: `tag-${tag.id}`,
      label: `${tag.emoji} ${tag.name}`,
      color: tag.color,
      metadata: { type: 'custom', originalItem: tag }
    }))
  ]

  // アイテム選択処理
  const handleItemSelect = useCallback((item: SelectableItem) => {
    const { type, originalItem } = item.metadata
    onSelectTag(originalItem.id, type)
  }, [onSelectTag])

  // 選択状態変更
  const handleSelectionChange = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  // カスタムキーボードハンドラー
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 編集中の場合は編集関連のキーのみ処理
    if (editingTagId) {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleCancelEdit()
      }
      return
    }

    // Tabキーでスキップ
    if (e.key === 'Tab') {
      e.preventDefault()
      onSkipTag()
      return
    }
  }, [editingTagId, onSkipTag])

  // タグの編集を開始
  const handleStartEditTag = useCallback((e: React.MouseEvent, tag: CustomTag) => {
    e.stopPropagation()
    setEditingTagId(tag.id)
    setEditingTagName(tag.name)
    setEditingTagEmoji(tag.emoji)
  }, [])


  // タグの編集をキャンセル
  const handleCancelEdit = () => {
    setEditingTagId(null)
    setEditingTagName('')
    setEditingTagEmoji('')
  }

  // タグの編集を保存
  const handleSaveEdit = async () => {
    if (!editingTagId || !editingTagName.trim()) return

    try {
      await updateTag(editingTagId, {
        name: editingTagName.trim(),
        emoji: editingTagEmoji || '📝'
      })
      handleCancelEdit()
    } catch (error) {
      console.error('Failed to update tag:', error)
    }
  }

  // 編集中のエンターキー処理
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  // 編集可能なアイテムを作成
  const createEditableItem = (tag: CustomTag, index: number): React.ReactNode => {
    const isEditing = editingTagId === tag.id
    
    if (!isEditing) return null
    
    return (
      <div className="flex items-center space-x-2 flex-1">
        <input
          type="text"
          value={editingTagEmoji}
          onChange={(e) => setEditingTagEmoji(e.target.value)}
          onKeyDown={handleEditKeyDown}
          className="w-8 px-1 py-0.5 text-xs border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
          placeholder="📝"
          maxLength={2}
        />
        <input
          type="text"
          value={editingTagName}
          onChange={(e) => setEditingTagName(e.target.value)}
          onKeyDown={handleEditKeyDown}
          className="flex-1 px-2 py-0.5 text-sm border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
          placeholder="タグ名"
          autoFocus
        />
        <button
          onClick={handleSaveEdit}
          className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 transition-colors"
          title="保存"
        >
          <Check size={12} />
        </button>
        <button
          onClick={handleCancelEdit}
          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 transition-colors"
          title="キャンセル"
        >
          <X size={12} />
        </button>
      </div>
    )
  }

  // デバッグ用：モーダルの状態を確認
  console.log('TagSelectionModal render:', { 
    isOpen, 
    goals: goals.length, 
    tags: tags.length, 
    todoText
  })
  
  if (!isOpen) {
    console.log('TagSelectionModal not rendering because isOpen is false')
    return null
  }
  
  console.log('TagSelectionModal rendering with isOpen=true')

  // 編集中でないアイテムを作成（カスタムタグ用の編集ボタン付き）
  const createCustomTagItem = (tag: CustomTag, globalIndex: number): SelectableItem => {
    const isEditing = editingTagId === tag.id
    
    return {
      id: `tag-${tag.id}`,
      label: isEditing ? '' : `${tag.emoji} ${tag.name}`,
      color: tag.color,
      disabled: isEditing,
      metadata: { 
        type: 'custom', 
        originalItem: tag, 
        isEditing,
        customContent: isEditing ? createEditableItem(tag, globalIndex) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-medium">
              {tag.emoji} {tag.name}
            </span>
            <button
              onClick={(e) => handleStartEditTag(e, tag)}
              className={combineClasses(
                'p-1 rounded transition-colors text-xs',
                neutralClasses.textSecondary,
                interactionClasses.hover
              )}
              title="タグを編集"
            >
              <Edit size={12} />
            </button>
          </div>
        )
      }
    }
  }

  // フィルター済みのSelectableItemsを作成
  const filteredSelectableItems: SelectableItem[] = [
    // 目標項目
    ...goals.map(goal => ({
      id: `goal-${goal.id}`,
      label: `📚 ${goal.title}`,
      description: goal.description,
      color: goal.color,
      metadata: { type: 'goal', originalItem: goal }
    })),
    // カスタムタグ項目（編集中のものも含む）
    ...tags.map((tag, index) => createCustomTagItem(tag, goals.length + index))
  ]
  
  // デバッグ用：フィルター済みアイテムの確認
  console.log('filteredSelectableItems created:', filteredSelectableItems.length, filteredSelectableItems)

  // カスタムレンダラー（編集中のアイテム用）
  const renderCustomItem = (item: SelectableItem, index: number) => {
    if (item.metadata?.customContent) {
      return item.metadata.customContent
    }
    return null
  }

  return (
    <KeyboardNavigableModal
      isOpen={isOpen}
      onClose={onClose}
      title="タスクにタグを選択"
      subtitle={`タスク: "${todoText}"`}
      onKeyDown={handleKeyDown}
      footer={
        <>
          <button
            onClick={onClose}
            className={getButtonStyles('ghost', 'blue', themeMode)}
          >
            キャンセル
          </button>
          <button
            onClick={onSkipTag}
            className={getButtonStyles('secondary', 'blue', themeMode)}
          >
            タグなしで追加
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* 目標セクション */}
        {goals.length > 0 && (
          <div>
            <div className="text-xs font-medium mb-2 text-gray-500 dark:text-gray-400">
              今月の目標
            </div>
            <SelectableList
              items={filteredSelectableItems.filter(item => item.metadata?.type === 'goal')}
              selectedIndex={selectedIndex < goals.length ? selectedIndex : -1}
              onSelect={handleItemSelect}
              onSelectionChange={handleSelectionChange}
              showCheckmark={true}
              size="md"
            />
          </div>
        )}

        {/* カスタムタグセクション */}
        {tags.length > 0 && (
          <div>
            <div className="text-xs font-medium mb-2 text-gray-500 dark:text-gray-400">
              カスタムタグ
            </div>
            <div className="space-y-2">
              {tags.map((tag, index) => {
                const globalIndex = goals.length + index
                const isEditing = editingTagId === tag.id
                const isSelected = selectedIndex === globalIndex
                
                return (
                  <div
                    key={`tag-${tag.id}`}
                    className={combineClasses(
                      'cursor-pointer rounded-lg border-2 transition-all duration-200 ease-in-out p-3',
                      isSelected ? getSelectionClasses(true, themeMode) : getSelectionClasses(false, themeMode),
                      tag.color ? getColorClasses(tag.color as ColorVariant, 'light', themeMode).background : neutralClasses.surfaceSecondary,
                      tag.color ? getColorClasses(tag.color as ColorVariant, 'light', themeMode).text : neutralClasses.text,
                      isEditing && interactionClasses.disabled
                    )}
                    onClick={isEditing ? undefined : () => {
                      setSelectedIndex(globalIndex)
                      handleItemSelect({
                        id: `tag-${tag.id}`,
                        label: `${tag.emoji} ${tag.name}`,
                        color: tag.color,
                        metadata: { type: 'custom', originalItem: tag }
                      })
                    }}
                    onMouseEnter={isEditing ? undefined : () => setSelectedIndex(globalIndex)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={combineClasses(
                        'w-3 h-3 rounded-full',
                        tag.color ? getColorIndicator(tag.color as ColorVariant) : 'bg-gray-500'
                      )} />
                      
                      <div className="flex-1">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editingTagEmoji}
                              onChange={(e) => setEditingTagEmoji(e.target.value)}
                              onKeyDown={handleEditKeyDown}
                              className={combineClasses(
                              'w-8 px-1 py-0.5 text-xs rounded',
                              getInputStyles(themeMode)
                            )}
                              placeholder="📝"
                              maxLength={2}
                            />
                            <input
                              type="text"
                              value={editingTagName}
                              onChange={(e) => setEditingTagName(e.target.value)}
                              onKeyDown={handleEditKeyDown}
                              className={combineClasses(
                              'flex-1 px-2 py-0.5 text-sm rounded',
                              getInputStyles(themeMode)
                            )}
                              placeholder="タグ名"
                              autoFocus
                            />
                            <button
                              onClick={handleSaveEdit}
                              className={combineClasses(
                              'p-1 rounded transition-colors text-green-600',
                              getColorClasses('green', 'light', themeMode).background
                            )}
                              title="保存"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className={combineClasses(
                              'p-1 rounded transition-colors text-red-600',
                              getColorClasses('rose', 'light', themeMode).background
                            )}
                              title="キャンセル"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {tag.emoji} {tag.name}
                            </span>
                            <button
                              onClick={(e) => handleStartEditTag(e, tag)}
                              className={combineClasses(
                'p-1 rounded transition-colors text-xs',
                neutralClasses.textSecondary,
                interactionClasses.hover
              )}
                              title="タグを編集"
                            >
                              <Edit size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {!isEditing && isSelected && (
                        <Check size={16} className="text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* オプションがない場合 */}
        {filteredSelectableItems.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">利用可能なタグがありません</p>
          </div>
        )}
      </div>
      
      {/* 操作ヒント */}
      <div className={combineClasses(
        'text-xs text-center mt-4',
        neutralClasses.textMuted
      )}>
        {editingTagId ? (
          'Enterで保存、Escapeでキャンセル'
        ) : (
          '↑↓ 矢印キーで選択、Enterで決定、Tabでスキップ、✏️でタグ編集、Escapeでキャンセル'
        )}
      </div>
    </KeyboardNavigableModal>
  )
}