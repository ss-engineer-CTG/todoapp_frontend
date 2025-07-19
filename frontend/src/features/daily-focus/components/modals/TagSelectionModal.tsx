import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { X, Edit, Check } from 'lucide-react'
import { useGoals } from '../../hooks/useGoals'
import { useCustomTags } from '../../hooks/useCustomTags'
import { Goal, CustomTag } from '../../types'

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
  const { theme } = useTheme()
  const { goals } = useGoals()
  const { tags, updateTag } = useCustomTags()
  
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editingTagName, setEditingTagName] = useState('')
  const [editingTagEmoji, setEditingTagEmoji] = useState('')

  // すべての選択可能なオプション
  const allOptions = [
    ...goals.map(goal => ({ type: 'goal' as const, item: goal })),
    ...tags.map(tag => ({ type: 'custom' as const, item: tag }))
  ]

  // モーダルが開かれた時の初期化
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0)
    }
  }, [isOpen])

  // キーボードナビゲーション
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, allOptions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (allOptions[selectedIndex]) {
          const option = allOptions[selectedIndex]
          onSelectTag(option.item.id, option.type)
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [isOpen, allOptions, selectedIndex, onSelectTag, onClose])

  // グローバルキーボードイベント
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  // 目標の色クラスを取得
  const getGoalColorClasses = (goal: Goal) => {
    const colorMap = {
      blue: theme === 'dark' ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-800',
      green: theme === 'dark' ? 'bg-green-900/20 text-green-200' : 'bg-green-50 text-green-800',
      purple: theme === 'dark' ? 'bg-purple-900/20 text-purple-200' : 'bg-purple-50 text-purple-800',
      orange: theme === 'dark' ? 'bg-orange-900/20 text-orange-200' : 'bg-orange-50 text-orange-800',
      teal: theme === 'dark' ? 'bg-teal-900/20 text-teal-200' : 'bg-teal-50 text-teal-800',
      rose: theme === 'dark' ? 'bg-rose-900/20 text-rose-200' : 'bg-rose-50 text-rose-800'
    }
    return colorMap[goal.color] || colorMap.blue
  }

  // カスタムタグの色クラスを取得
  const getCustomTagColorClasses = (tag: CustomTag) => {
    const colorMap = {
      blue: theme === 'dark' ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-800',
      green: theme === 'dark' ? 'bg-green-900/20 text-green-200' : 'bg-green-50 text-green-800',
      purple: theme === 'dark' ? 'bg-purple-900/20 text-purple-200' : 'bg-purple-50 text-purple-800',
      orange: theme === 'dark' ? 'bg-orange-900/20 text-orange-200' : 'bg-orange-50 text-orange-800',
      teal: theme === 'dark' ? 'bg-teal-900/20 text-teal-200' : 'bg-teal-50 text-teal-800',
      rose: theme === 'dark' ? 'bg-rose-900/20 text-rose-200' : 'bg-rose-50 text-rose-800'
    }
    return colorMap[tag.color] || colorMap.blue
  }

  // 選択されたオプションのクラス
  const getSelectedOptionClasses = (index: number) => {
    return selectedIndex === index
      ? 'ring-2 ring-blue-400 border-blue-400'
      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
  }

  // オプションのクリック
  const handleOptionClick = (option: typeof allOptions[0]) => {
    onSelectTag(option.item.id, option.type)
  }

  // タグの編集を開始
  const handleStartEditTag = (e: React.MouseEvent, tag: CustomTag) => {
    e.stopPropagation()
    setEditingTagId(tag.id)
    setEditingTagName(tag.name)
    setEditingTagEmoji(tag.emoji)
  }

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div 
        className={`w-full max-w-md rounded-lg shadow-xl ${
          theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold">タスクにタグを選択</h2>
            <p className={`text-sm mt-1 p-2 rounded ${
              theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              タスク: "{todoText}"
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* オプション一覧 */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {/* 目標タグ */}
            {goals.length > 0 && (
              <div>
                <div className={`text-xs font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  今月の目標
                </div>
                {goals.map((goal, index) => (
                  <div
                    key={`goal-${goal.id}`}
                    className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                      getGoalColorClasses(goal)
                    } ${getSelectedOptionClasses(index)}`}
                    onClick={() => handleOptionClick({ type: 'goal', item: goal })}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        goal.color === 'blue' ? 'bg-blue-500' :
                        goal.color === 'green' ? 'bg-green-500' :
                        goal.color === 'purple' ? 'bg-purple-500' :
                        goal.color === 'orange' ? 'bg-orange-500' :
                        goal.color === 'teal' ? 'bg-teal-500' :
                        'bg-rose-500'
                      }`} />
                      <span className="text-sm font-medium">
                        📚 {goal.title}
                      </span>
                      {selectedIndex === index && (
                        <Check size={16} className="text-blue-600 ml-auto" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* カスタムタグ */}
            {tags.length > 0 && (
              <div>
                <div className={`text-xs font-medium mb-2 mt-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  カスタムタグ
                </div>
                {tags.map((tag, index) => {
                  const globalIndex = goals.length + index
                  const isEditing = editingTagId === tag.id
                  
                  return (
                    <div
                      key={`tag-${tag.id}`}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        getCustomTagColorClasses(tag)
                      } ${getSelectedOptionClasses(globalIndex)} ${
                        isEditing ? '' : 'cursor-pointer'
                      }`}
                      onClick={isEditing ? undefined : () => handleOptionClick({ type: 'custom', item: tag })}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1">
                          <div className={`w-3 h-3 rounded-full ${
                            tag.color === 'blue' ? 'bg-blue-500' :
                            tag.color === 'green' ? 'bg-green-500' :
                            tag.color === 'purple' ? 'bg-purple-500' :
                            tag.color === 'orange' ? 'bg-orange-500' :
                            tag.color === 'teal' ? 'bg-teal-500' :
                            'bg-rose-500'
                          }`} />
                          
                          {isEditing ? (
                            <div className="flex items-center space-x-2 flex-1">
                              <input
                                type="text"
                                value={editingTagEmoji}
                                onChange={(e) => setEditingTagEmoji(e.target.value)}
                                onKeyDown={handleEditKeyDown}
                                className={`w-8 px-1 py-0.5 text-xs border rounded ${
                                  theme === 'dark' 
                                    ? 'border-gray-600 bg-gray-700 text-gray-200' 
                                    : 'border-gray-300 bg-white text-gray-900'
                                }`}
                                placeholder="📝"
                                maxLength={2}
                              />
                              <input
                                type="text"
                                value={editingTagName}
                                onChange={(e) => setEditingTagName(e.target.value)}
                                onKeyDown={handleEditKeyDown}
                                className={`flex-1 px-2 py-0.5 text-sm border rounded ${
                                  theme === 'dark' 
                                    ? 'border-gray-600 bg-gray-700 text-gray-200' 
                                    : 'border-gray-300 bg-white text-gray-900'
                                }`}
                                placeholder="タグ名"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <span className="text-sm font-medium">
                              {tag.emoji} {tag.name}
                            </span>
                          )}
                          
                          {!isEditing && selectedIndex === globalIndex && (
                            <Check size={16} className="text-blue-600" />
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                className={`p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 transition-colors`}
                                title="保存"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className={`p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 transition-colors`}
                                title="キャンセル"
                              >
                                <X size={12} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => handleStartEditTag(e, tag)}
                              className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-xs ${
                                theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                              }`}
                              title="タグを編集"
                            >
                              <Edit size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* オプションがない場合 */}
            {allOptions.length === 0 && (
              <div className={`text-center py-8 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <p className="text-sm">利用可能なタグがありません</p>
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="flex justify-end space-x-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-gray-200' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            キャンセル
          </button>
          <button
            onClick={onSkipTag}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            タグなしで追加
          </button>
        </div>

        {/* 操作ヒント */}
        <div className={`px-4 pb-4 text-xs text-center ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {editingTagId ? (
            'Enterで保存、Escapeでキャンセル'
          ) : (
            '↑↓ 矢印キーで選択、Enterで決定、✏️でタグ編集、Escapeでキャンセル'
          )}
        </div>
      </div>
    </div>
  )
}