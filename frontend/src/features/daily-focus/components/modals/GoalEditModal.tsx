import React, { useState, useEffect } from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { X, Star, Save, Plus, Calendar } from 'lucide-react'
import { Goal, ColorVariant, COLOR_VARIANTS, getCurrentMonthString, getNextMonthString, formatMonthString } from '../../types'
import { useCustomTags } from '../../hooks/useCustomTags'

interface GoalEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onSaveMonthly?: (title: string, description: string, color: ColorVariant, targetMonth?: string) => Promise<void>
  onUpdate?: (goalId: string, updates: Partial<Goal>) => Promise<void>
  goal?: Goal | null
  mode: 'create' | 'edit' | 'monthly'
}

export const GoalEditModal: React.FC<GoalEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveMonthly,
  onUpdate,
  goal,
  mode
}) => {
  const { theme } = useTheme()
  const { getCategoryTags, getAllTags, getTagById } = useCustomTags()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    color: 'blue' as ColorVariant,
    tagIds: [] as string[],
    targetMonth: getCurrentMonthString() // 月次目標用
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
          tagIds: goal.tagIds || [],
          targetMonth: goal.monthlyTargetDate || getCurrentMonthString()
        })
      } else if (mode === 'monthly') {
        setFormData({
          title: '',
          description: '',
          color: 'rose', // 月次目標のデフォルト色
          tagIds: ['category-monthly-goals'], // 月次目標タグを自動選択
          targetMonth: getCurrentMonthString()
        })
      } else {
        setFormData({
          title: '',
          description: '',
          color: 'blue',
          tagIds: [],
          targetMonth: getCurrentMonthString()
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
      if (mode === 'monthly' && onSaveMonthly) {
        // 月次目標の作成
        await onSaveMonthly(
          formData.title,
          formData.description,
          formData.color,
          formData.targetMonth
        )
      } else if (mode === 'create') {
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
  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // 月の選択肢を生成
  const generateMonthOptions = () => {
    const options = []
    const currentMonth = getCurrentMonthString()
    const nextMonth = getNextMonthString()
    
    // 当月と来月の選択肢を追加
    options.push({
      value: currentMonth,
      label: formatMonthString(currentMonth)
    })
    
    options.push({
      value: nextMonth,
      label: formatMonthString(nextMonth)
    })
    
    return options
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
            {mode === 'monthly' ? (
              <Calendar size={20} className="text-rose-500" />
            ) : (
              <Star size={20} className="text-yellow-500" />
            )}
            <h2 className="text-lg font-semibold">
              {mode === 'monthly' ? '月次目標を追加' : 
               mode === 'create' ? '新しい目標を追加' : '目標を編集'}
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

          {/* 月次目標用：目標月選択 */}
          {mode === 'monthly' && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                目標月 *
              </label>
              <select
                value={formData.targetMonth}
                onChange={(e) => handleInputChange('targetMonth', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-700 text-gray-100' 
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              >
                {generateMonthOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className={`text-xs mt-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                月次目標は指定した月の終わりに自動的にアーカイブされます
              </p>
            </div>
          )}

          {/* タグ選択（月次目標以外） */}
          {mode !== 'monthly' && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                カテゴリタグ（任意）
              </label>
              <div className="space-y-2">
                {getCategoryTags().map(tag => (
                  <label
                    key={tag.id}
                    className={`flex items-center p-2 rounded-lg border cursor-pointer transition-colors ${
                      formData.tagIds.includes(tag.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : theme === 'dark'
                        ? 'border-gray-600 hover:bg-gray-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.tagIds.includes(tag.id)}
                      onChange={(e) => {
                        const newTagIds = e.target.checked
                          ? [...formData.tagIds, tag.id]
                          : formData.tagIds.filter(id => id !== tag.id)
                        handleInputChange('tagIds', newTagIds)
                      }}
                      className="mr-3 text-blue-600"
                    />
                    <span className="text-lg mr-2">{tag.emoji}</span>
                    <span className="flex-1">{tag.name}</span>
                    <div className={`w-3 h-3 rounded-full ${
                      tag.color === 'blue' ? 'bg-blue-500' :
                      tag.color === 'green' ? 'bg-green-500' :
                      tag.color === 'purple' ? 'bg-purple-500' :
                      tag.color === 'orange' ? 'bg-orange-500' :
                      tag.color === 'teal' ? 'bg-teal-500' :
                      'bg-rose-500'
                    }`} />
                  </label>
                ))}
              </div>
              {formData.tagIds.length === 0 && (
                <p className={`text-xs mt-1 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  カテゴリタグを選択すると、統計やフィルタリングで利用できます
                </p>
              )}
            </div>
          )}

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
              className={`flex-1 px-4 py-2 ${
                mode === 'monthly' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
              } text-white rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {mode === 'monthly' ? <Calendar size={16} /> : 
               mode === 'create' ? <Plus size={16} /> : <Save size={16} />}
              <span>
                {isSubmitting ? '保存中...' : 
                 mode === 'monthly' ? '月次目標を追加' :
                 mode === 'create' ? '追加' : '保存'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}