import React, { useState, useEffect } from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { X, Save, Plus, Edit, Trash2 } from 'lucide-react'
import { useCustomTags } from '../../hooks/useCustomTags'
import { CustomTag, ColorVariant, COLOR_VARIANTS } from '../../types'

interface TagEditModalProps {
  isOpen: boolean
  onClose: () => void
  editingFromTagSelection?: boolean
}

export const TagEditModal: React.FC<TagEditModalProps> = ({
  isOpen,
  onClose,
  editingFromTagSelection = false
}) => {
  const { resolvedTheme } = useTheme()
  const { getCustomTags, getCategoryTags, addTag, updateTag, deleteTag, validateTag } = useCustomTags()
  
  // カスタムタグのみを編集対象とする（カテゴリタグは編集不可）
  const customTags = getCustomTags()
  
  const [editingTags, setEditingTags] = useState<{
    [key: string]: { name: string; emoji: string; color: ColorVariant; parentTagId?: string }
  }>({})
  const [newTag, setNewTag] = useState({
    name: '',
    emoji: '',
    color: 'orange' as ColorVariant,
    parentTagId: '' as string
  })
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // モーダルが開かれた時の初期化
  useEffect(() => {
    if (isOpen) {
      // 既存のタグを編集用の状態に設定
      const initialEditingTags = customTags.reduce((acc, tag) => {
        acc[tag.id] = {
          name: tag.name,
          emoji: tag.emoji,
          color: tag.color,
          parentTagId: tag.parentTagId
        }
        return acc
      }, {} as typeof editingTags)
      
      setEditingTags(initialEditingTags)
      setNewTag({
        name: '',
        emoji: '',
        color: 'orange',
        parentTagId: ''
      })
      setIsAddingNew(false)
      setErrors({})
    }
  }, [isOpen, customTags])

  // 既存タグの更新
  const handleUpdateTag = (tagId: string, field: string, value: string) => {
    setEditingTags(prev => ({
      ...prev,
      [tagId]: {
        ...prev[tagId],
        [field]: value
      }
    }))
    
    // エラーをクリア
    if (errors[tagId]) {
      setErrors(prev => ({ ...prev, [tagId]: '' }))
    }
  }

  // 新しいタグの更新
  const handleUpdateNewTag = (field: string, value: string) => {
    setNewTag(prev => ({ ...prev, [field]: value }))
    
    // エラーをクリア
    if (errors.newTag) {
      setErrors(prev => ({ ...prev, newTag: '' }))
    }
  }

  // バリデーション
  const validateAllTags = (): boolean => {
    const newErrors: { [key: string]: string } = {}
    
    // 既存タグのバリデーション
    Object.entries(editingTags).forEach(([tagId, tagData]) => {
      const validation = validateTag(tagData.name, tagData.emoji, tagId)
      if (!validation.isValid) {
        newErrors[tagId] = validation.errors.join(', ')
      }
    })
    
    // 新しいタグのバリデーション
    if (isAddingNew) {
      const validation = validateTag(newTag.name, newTag.emoji)
      if (!validation.isValid) {
        newErrors.newTag = validation.errors.join(', ')
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 保存
  const handleSave = async () => {
    if (!validateAllTags()) return
    
    setIsSubmitting(true)
    try {
      // 既存タグの更新
      const updatePromises = Object.entries(editingTags).map(([tagId, tagData]) => {
        const originalTag = customTags.find(t => t.id === tagId)
        if (originalTag) {
          const hasChanges = 
            originalTag.name !== tagData.name ||
            originalTag.emoji !== tagData.emoji ||
            originalTag.color !== tagData.color ||
            originalTag.parentTagId !== tagData.parentTagId
          
          if (hasChanges) {
            return updateTag(tagId, tagData)
          }
        }
        return Promise.resolve()
      })
      
      await Promise.all(updatePromises)
      
      // 新しいタグの追加
      if (isAddingNew) {
        await addTag(newTag.name, newTag.emoji, newTag.color, {
          parentTagId: newTag.parentTagId || undefined,
          isCategory: false
        })
      }
      
      onClose()
    } catch (error) {
      console.error('Tag save error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // タグ削除
  const handleDeleteTag = async (tagId: string) => {
    if (window.confirm('このタグを削除してもよろしいですか？')) {
      try {
        await deleteTag(tagId)
        setEditingTags(prev => {
          const newTags = { ...prev }
          delete newTags[tagId]
          return newTags
        })
      } catch (error) {
        console.error('Tag delete error:', error)
      }
    }
  }

  // 新しいタグの追加モード切り替え
  const toggleAddingNew = () => {
    setIsAddingNew(!isAddingNew)
    if (!isAddingNew) {
      setNewTag({
        name: '',
        emoji: '',
        color: 'orange',
        parentTagId: ''
      })
    }
  }

  // ESCキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // 色の表示クラス
  const getColorDisplayClass = (color: ColorVariant) => {
    const colorMap = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      teal: 'bg-teal-500',
      rose: 'bg-rose-500'
    }
    return colorMap[color]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
      <div 
        className={`w-full max-w-2xl rounded-lg shadow-xl ${
          resolvedTheme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
        } max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">カスタムタグ編集</h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              resolvedTheme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 space-y-4">
          {/* 既存タグの編集 */}
          {customTags.map(tag => (
            <div 
              key={tag.id} 
              className={`p-4 rounded-lg border ${
                resolvedTheme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getColorDisplayClass(editingTags[tag.id]?.color || tag.color)}`} />
                  <span className="text-sm font-medium">既存タグ</span>
                </div>
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                  title="削除"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${
                    resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    名前
                  </label>
                  <input
                    type="text"
                    value={editingTags[tag.id]?.name || tag.name}
                    onChange={(e) => handleUpdateTag(tag.id, 'name', e.target.value)}
                    className={`w-full px-2 py-1 text-sm border rounded ${
                      resolvedTheme === 'dark' 
                        ? 'border-gray-600 bg-gray-800 text-gray-100' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                    placeholder="タグ名"
                  />
                </div>
                
                <div>
                  <label className={`block text-xs font-medium mb-1 ${
                    resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    絵文字
                  </label>
                  <input
                    type="text"
                    value={editingTags[tag.id]?.emoji || tag.emoji}
                    onChange={(e) => handleUpdateTag(tag.id, 'emoji', e.target.value)}
                    className={`w-full px-2 py-1 text-sm border rounded ${
                      resolvedTheme === 'dark' 
                        ? 'border-gray-600 bg-gray-800 text-gray-100' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                    placeholder="🎯"
                  />
                </div>
                
                <div>
                  <label className={`block text-xs font-medium mb-1 ${
                    resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    色
                  </label>
                  <div className="flex space-x-1">
                    {COLOR_VARIANTS.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => handleUpdateTag(tag.id, 'color', color.value)}
                        className={`w-6 h-6 rounded-full border-2 ${
                          (editingTags[tag.id]?.color || tag.color) === color.value 
                            ? 'border-gray-900 dark:border-gray-100' 
                            : 'border-gray-300 dark:border-gray-600'
                        } ${getColorDisplayClass(color.value)}`}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className={`block text-xs font-medium mb-1 ${
                    resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    親カテゴリ
                  </label>
                  <select
                    value={editingTags[tag.id]?.parentTagId || tag.parentTagId || ''}
                    onChange={(e) => handleUpdateTag(tag.id, 'parentTagId', e.target.value)}
                    className={`w-full px-2 py-1 text-sm border rounded ${
                      resolvedTheme === 'dark' 
                        ? 'border-gray-600 bg-gray-800 text-gray-100' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  >
                    <option value="">なし</option>
                    {getCategoryTags().map(categoryTag => (
                      <option key={categoryTag.id} value={categoryTag.id}>
                        {categoryTag.emoji} {categoryTag.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {errors[tag.id] && (
                <p className="mt-2 text-sm text-red-500">{errors[tag.id]}</p>
              )}
            </div>
          ))}

          {/* 新しいタグ追加 */}
          {isAddingNew && (
            <div className={`p-4 rounded-lg border-2 border-dashed ${
              resolvedTheme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
            }`}>
              <div className="flex items-center space-x-2 mb-3">
                <Plus size={16} className="text-green-600" />
                <span className="text-sm font-medium">新しいタグ</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${
                    resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    名前
                  </label>
                  <input
                    type="text"
                    value={newTag.name}
                    onChange={(e) => handleUpdateNewTag('name', e.target.value)}
                    className={`w-full px-2 py-1 text-sm border rounded ${
                      resolvedTheme === 'dark' 
                        ? 'border-gray-600 bg-gray-800 text-gray-100' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                    placeholder="タグ名"
                  />
                </div>
                
                <div>
                  <label className={`block text-xs font-medium mb-1 ${
                    resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    絵文字
                  </label>
                  <input
                    type="text"
                    value={newTag.emoji}
                    onChange={(e) => handleUpdateNewTag('emoji', e.target.value)}
                    className={`w-full px-2 py-1 text-sm border rounded ${
                      resolvedTheme === 'dark' 
                        ? 'border-gray-600 bg-gray-800 text-gray-100' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                    placeholder="🎯"
                  />
                </div>
                
                <div>
                  <label className={`block text-xs font-medium mb-1 ${
                    resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    色
                  </label>
                  <div className="flex space-x-1">
                    {COLOR_VARIANTS.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => handleUpdateNewTag('color', color.value)}
                        className={`w-6 h-6 rounded-full border-2 ${
                          newTag.color === color.value 
                            ? 'border-gray-900 dark:border-gray-100' 
                            : 'border-gray-300 dark:border-gray-600'
                        } ${getColorDisplayClass(color.value)}`}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className={`block text-xs font-medium mb-1 ${
                    resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    親カテゴリ
                  </label>
                  <select
                    value={newTag.parentTagId}
                    onChange={(e) => handleUpdateNewTag('parentTagId', e.target.value)}
                    className={`w-full px-2 py-1 text-sm border rounded ${
                      resolvedTheme === 'dark' 
                        ? 'border-gray-600 bg-gray-800 text-gray-100' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  >
                    <option value="">なし</option>
                    {getCategoryTags().map(categoryTag => (
                      <option key={categoryTag.id} value={categoryTag.id}>
                        {categoryTag.emoji} {categoryTag.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {errors.newTag && (
                <p className="mt-2 text-sm text-red-500">{errors.newTag}</p>
              )}
            </div>
          )}

          {/* 新しいタグ追加ボタン */}
          {!isAddingNew && (
            <button
              onClick={toggleAddingNew}
              className={`w-full p-3 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                resolvedTheme === 'dark' 
                  ? 'border-gray-600 text-gray-400 hover:border-gray-500' 
                  : 'border-gray-300 text-gray-500 hover:border-gray-400'
              }`}
            >
              <Plus size={16} />
              <span>新しいタグを追加</span>
            </button>
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className={`px-4 py-2 border rounded-lg transition-colors ${
              resolvedTheme === 'dark' 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {editingFromTagSelection ? 'タグ選択に戻る' : 'キャンセル'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Save size={16} />
            <span>{isSubmitting ? '保存中...' : '保存'}</span>
          </button>
        </div>

        {/* ヒント */}
        <div className={`px-4 pb-4 text-xs text-center ${
          resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          絵文字を含めて設定できます
        </div>
      </div>
    </div>
  )
}