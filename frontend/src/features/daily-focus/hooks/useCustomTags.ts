import { useState, useEffect, useCallback } from 'react'
import { CustomTag, ColorVariant, LearningCategory } from '../types'
import { tagStorage } from '../utils/storage'

export const useCustomTags = () => {
  const [tags, setTags] = useState<CustomTag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // タグの読み込み
  const loadTags = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('useCustomTags: Loading tags...')
      const loadedTags = tagStorage.getAll()
      console.log('useCustomTags: Loaded tags:', loadedTags)
      setTags(loadedTags)
    } catch (err) {
      setError('タグの読み込みに失敗しました')
      console.error('Failed to load tags:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // タグの追加
  const addTag = useCallback(async (
    name: string,
    emoji: string,
    color: ColorVariant,
    category: LearningCategory
  ): Promise<CustomTag> => {
    try {
      const newTag: CustomTag = {
        id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        emoji,
        color,
        category,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const updatedTags = tagStorage.add(newTag)
      setTags(updatedTags)
      return newTag
    } catch (err) {
      setError('タグの追加に失敗しました')
      console.error('Failed to add tag:', err)
      throw err
    }
  }, [])

  // タグの更新
  const updateTag = useCallback(async (
    tagId: string,
    updates: Partial<CustomTag>
  ): Promise<void> => {
    try {
      const updatedTags = tagStorage.update(tagId, updates)
      setTags(updatedTags)
    } catch (err) {
      setError('タグの更新に失敗しました')
      console.error('Failed to update tag:', err)
      throw err
    }
  }, [])

  // タグの削除
  const deleteTag = useCallback(async (tagId: string): Promise<void> => {
    try {
      const updatedTags = tagStorage.delete(tagId)
      setTags(updatedTags)
    } catch (err) {
      setError('タグの削除に失敗しました')
      console.error('Failed to delete tag:', err)
      throw err
    }
  }, [])

  // IDによるタグの取得
  const getTagById = useCallback((tagId: string): CustomTag | null => {
    return tags.find(tag => tag.id === tagId) || null
  }, [tags])

  // カテゴリ別のタグ取得
  const getTagsByCategory = useCallback((category: LearningCategory): CustomTag[] => {
    return tags.filter(tag => tag.category === category)
  }, [tags])

  // デフォルトタグの取得
  const getDefaultTags = useCallback((): CustomTag[] => {
    return tags.filter(tag => tag.isDefault)
  }, [tags])

  // カスタムタグの取得
  const getCustomTags = useCallback((): CustomTag[] => {
    return tags.filter(tag => !tag.isDefault)
  }, [tags])

  // タグの検索
  const searchTags = useCallback((query: string): CustomTag[] => {
    if (!query.trim()) return tags

    const lowerQuery = query.toLowerCase()
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(lowerQuery) ||
      tag.emoji.includes(query)
    )
  }, [tags])

  // タグの並び替え
  const sortTags = useCallback((
    sortBy: 'name' | 'createdAt' | 'updatedAt' | 'category',
    order: 'asc' | 'desc' = 'asc'
  ): CustomTag[] => {
    return [...tags].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'createdAt':
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
          break
        case 'updatedAt':
          aValue = a.updatedAt.getTime()
          bValue = b.updatedAt.getTime()
          break
        case 'category':
          aValue = a.category
          bValue = b.category
          break
        default:
          return 0
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1
      if (aValue > bValue) return order === 'asc' ? 1 : -1
      return 0
    })
  }, [tags])

  // タグの統計情報
  const getTagStats = useCallback(() => {
    const total = tags.length
    const defaultTags = getDefaultTags().length
    const customTags = getCustomTags().length

    const categoryStats: Record<LearningCategory, number> = {
      programming: 0,
      english: 0,
      health: 0,
      reading: 0,
      exercise: 0,
      other: 0
    }

    tags.forEach(tag => {
      categoryStats[tag.category]++
    })

    const colorStats: Record<ColorVariant, number> = {
      blue: 0,
      green: 0,
      purple: 0,
      orange: 0,
      teal: 0,
      rose: 0
    }

    tags.forEach(tag => {
      colorStats[tag.color]++
    })

    return {
      total,
      defaultTags,
      customTags,
      categoryStats,
      colorStats
    }
  }, [tags, getDefaultTags, getCustomTags])

  // タグの色クラスを取得
  const getTagColorClasses = useCallback((color: ColorVariant, theme: 'light' | 'dark' = 'light'): string => {
    const colorMap = {
      blue: theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800',
      green: theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800',
      purple: theme === 'dark' ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800',
      orange: theme === 'dark' ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800',
      teal: theme === 'dark' ? 'bg-teal-900 text-teal-200' : 'bg-teal-100 text-teal-800',
      rose: theme === 'dark' ? 'bg-rose-900 text-rose-200' : 'bg-rose-100 text-rose-800'
    }
    return colorMap[color]
  }, [])

  // タグの表示テキストを取得
  const getTagDisplayText = useCallback((tag: CustomTag): string => {
    return `${tag.emoji} ${tag.name}`
  }, [])

  // バルクアップデート（複数タグの一括更新）
  const bulkUpdateTags = useCallback(async (
    updates: Array<{ id: string; updates: Partial<CustomTag> }>
  ): Promise<void> => {
    try {
      let currentTags = tags

      for (const { id, updates: tagUpdates } of updates) {
        const updatedTags = tagStorage.update(id, tagUpdates)
        currentTags = updatedTags
      }

      setTags(currentTags)
    } catch (err) {
      setError('タグの一括更新に失敗しました')
      console.error('Failed to bulk update tags:', err)
      throw err
    }
  }, [tags])

  // タグの複製
  const duplicateTag = useCallback(async (tagId: string): Promise<CustomTag> => {
    try {
      const originalTag = getTagById(tagId)
      if (!originalTag) {
        throw new Error('Tag not found')
      }

      const duplicatedTag: CustomTag = {
        ...originalTag,
        id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `${originalTag.name} (コピー)`,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const updatedTags = tagStorage.add(duplicatedTag)
      setTags(updatedTags)
      return duplicatedTag
    } catch (err) {
      setError('タグの複製に失敗しました')
      console.error('Failed to duplicate tag:', err)
      throw err
    }
  }, [getTagById])

  // タグの検証
  const validateTag = useCallback((
    name: string,
    emoji: string,
    excludeId?: string
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!name.trim()) {
      errors.push('タグ名は必須です')
    }

    if (name.length > 50) {
      errors.push('タグ名は50文字以内で入力してください')
    }

    if (!emoji.trim()) {
      errors.push('絵文字は必須です')
    }

    // 重複チェック
    const existingTag = tags.find(tag => 
      tag.name.toLowerCase() === name.toLowerCase() && 
      tag.id !== excludeId
    )

    if (existingTag) {
      errors.push('同じ名前のタグが既に存在します')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }, [tags])

  // 初期化
  useEffect(() => {
    loadTags()
  }, [loadTags])

  return {
    // 状態
    tags,
    loading,
    error,
    
    // 操作
    addTag,
    updateTag,
    deleteTag,
    bulkUpdateTags,
    duplicateTag,
    
    // 取得
    getTagById,
    getTagsByCategory,
    getDefaultTags,
    getCustomTags,
    
    // 検索・並び替え
    searchTags,
    sortTags,
    
    // 統計・ユーティリティ
    getTagStats,
    getTagColorClasses,
    getTagDisplayText,
    validateTag,
    
    // リロード
    reload: loadTags
  }
}