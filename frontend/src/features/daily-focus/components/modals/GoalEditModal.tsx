import React, { useState, useEffect } from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { X, Star, Save, Plus } from 'lucide-react'
import { Goal, ColorVariant, LearningCategory, LEARNING_CATEGORIES, COLOR_VARIANTS } from '../../types'

interface GoalEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onUpdate?: (goalId: string, updates: Partial<Goal>) => Promise<void>
  goal?: Goal | null
  mode: 'create' | 'edit'
}

export const GoalEditModal: React.FC<GoalEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  goal,
  mode
}) => {
  const { theme } = useTheme()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    color: 'blue' as ColorVariant,
    category: 'programming' as LearningCategory
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // モーダルが開かれた時の初期化
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && goal) {
        setFormData({
          title: goal.title,
          description: goal.description,
          color: goal.color,
          category: goal.category
        })
      } else {
        setFormData({
          title: '',
          description: '',
          color: 'blue',
          category: 'programming'
        })
      }
      setErrors({})
    }
  }, [isOpen, mode, goal])

  // フォームのバリデーション
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルは必須です'
    } else if (formData.title.length > 100) {
      newErrors.title = 'タイトルは100文字以内で入力してください'
    }

    if (!formData.description.trim()) {
      newErrors.description = '説明は必須です'
    } else if (formData.description.length > 500) {
      newErrors.description = '説明は500文字以内で入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    try {
      if (mode === 'create') {
        await onSave({
          ...formData,
          isCompleted: false
        })
      } else if (mode === 'edit' && goal && onUpdate) {
        await onUpdate(goal.id, formData)
      }
      onClose()
    } catch (error) {
      console.error('Goal save error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 入力値の変更
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
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
          <div className="flex items-center space-x-2">
            <Star size={20} className="text-yellow-500" />
            <h2 className="text-lg font-semibold">
              {mode === 'create' ? '新しい目標を追加' : '目標を編集'}
            </h2>
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

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* タイトル */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              タイトル *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${
                theme === 'dark' 
                  ? 'border-gray-600 bg-gray-700 text-gray-100' 
                  : 'border-gray-300 bg-white text-gray-900'
              } ${errors.title ? 'border-red-500' : ''}`}
              placeholder="目標のタイトルを入力"
              maxLength={100}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* 説明 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              説明 *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg resize-none ${
                theme === 'dark' 
                  ? 'border-gray-600 bg-gray-700 text-gray-100' 
                  : 'border-gray-300 bg-white text-gray-900'
              } ${errors.description ? 'border-red-500' : ''}`}
              placeholder="目標の詳細な説明を入力"
              rows={3}
              maxLength={500}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
            <p className={`mt-1 text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {formData.description.length}/500文字
            </p>
          </div>

          {/* カテゴリ */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              カテゴリ
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg ${
                theme === 'dark' 
                  ? 'border-gray-600 bg-gray-700 text-gray-100' 
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            >
              {LEARNING_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* 色選択 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              色
            </label>
            <div className="flex space-x-2">
              {COLOR_VARIANTS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleInputChange('color', color.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color.value 
                      ? 'border-gray-900 dark:border-gray-100 scale-110' 
                      : 'border-gray-300 dark:border-gray-600'
                  } ${
                    color.value === 'blue' ? 'bg-blue-500' :
                    color.value === 'green' ? 'bg-green-500' :
                    color.value === 'purple' ? 'bg-purple-500' :
                    color.value === 'orange' ? 'bg-orange-500' :
                    color.value === 'teal' ? 'bg-teal-500' :
                    'bg-rose-500'
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* ボタン */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {mode === 'create' ? <Plus size={16} /> : <Save size={16} />}
              <span>{isSubmitting ? '保存中...' : mode === 'create' ? '追加' : '保存'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}