import { useState, useEffect, useCallback } from 'react'
import { Goal, ColorVariant, LearningCategory, getCurrentMonthString } from '../types'
import { goalStorage } from '../utils/storage'

export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 目標の読み込み
  const loadGoals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('useGoals: Loading goals...')
      const loadedGoals = goalStorage.getAll()
      console.log('useGoals: Loaded goals:', loadedGoals)
      setGoals(loadedGoals)
    } catch (err) {
      setError('目標の読み込みに失敗しました')
      console.error('Failed to load goals:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 目標の追加（新しいタグシステム対応）
  const addGoal = useCallback(async (
    title: string,
    description: string,
    color: ColorVariant,
    tagIds: string[] = [],
    category?: LearningCategory // 後方互換性のためオプション
  ): Promise<Goal> => {
    try {
      const newGoal: Goal = {
        id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        description,
        color,
        tagIds,
        category: category || 'other', // 後方互換性
        createdAt: new Date(),
        updatedAt: new Date(),
        isCompleted: false
      }

      const updatedGoals = goalStorage.add(newGoal)
      setGoals(updatedGoals)
      return newGoal
    } catch (err) {
      setError('目標の追加に失敗しました')
      console.error('Failed to add goal:', err)
      throw err
    }
  }, [])

  // 目標の更新
  const updateGoal = useCallback(async (
    goalId: string,
    updates: Partial<Goal>
  ): Promise<void> => {
    try {
      const updatedGoals = goalStorage.update(goalId, updates)
      setGoals(updatedGoals)
    } catch (err) {
      setError('目標の更新に失敗しました')
      console.error('Failed to update goal:', err)
      throw err
    }
  }, [])

  // 目標の削除
  const deleteGoal = useCallback(async (goalId: string): Promise<void> => {
    try {
      const updatedGoals = goalStorage.delete(goalId)
      setGoals(updatedGoals)
    } catch (err) {
      setError('目標の削除に失敗しました')
      console.error('Failed to delete goal:', err)
      throw err
    }
  }, [])

  // 目標の完了状態の切り替え
  const toggleGoalCompletion = useCallback(async (goalId: string): Promise<void> => {
    try {
      const goal = goals.find(g => g.id === goalId)
      if (!goal) return

      const updates: Partial<Goal> = {
        isCompleted: !goal.isCompleted,
        completedAt: !goal.isCompleted ? new Date() : undefined
      }

      await updateGoal(goalId, updates)
    } catch (err) {
      setError('目標の完了状態の切り替えに失敗しました')
      console.error('Failed to toggle goal completion:', err)
      throw err
    }
  }, [goals, updateGoal])

  // IDによる目標の取得
  const getGoalById = useCallback((goalId: string): Goal | null => {
    return goals.find(goal => goal.id === goalId) || null
  }, [goals])

  // カテゴリ別の目標取得（後方互換性）
  const getGoalsByCategory = useCallback((category: LearningCategory): Goal[] => {
    return goals.filter(goal => goal.category === category)
  }, [goals])
  
  // タグ別の目標取得（新しいタグシステム）
  const getGoalsByTag = useCallback((tagId: string): Goal[] => {
    return goals.filter(goal => goal.tagIds && goal.tagIds.includes(tagId))
  }, [goals])
  
  // 複数タグにマッチする目標取得
  const getGoalsByTags = useCallback((tagIds: string[]): Goal[] => {
    if (tagIds.length === 0) return goals
    return goals.filter(goal => 
      goal.tagIds && goal.tagIds.some(tagId => tagIds.includes(tagId))
    )
  }, [goals])

  // 完了済みの目標取得
  const getCompletedGoals = useCallback((): Goal[] => {
    return goals.filter(goal => goal.isCompleted)
  }, [goals])

  // 未完了の目標取得
  const getActiveGoals = useCallback((): Goal[] => {
    return goals.filter(goal => !goal.isCompleted)
  }, [goals])

  // 目標の統計（タグシステム対応）
  const getGoalStats = useCallback(() => {
    const total = goals.length
    const completed = getCompletedGoals().length
    const active = getActiveGoals().length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // 後方互換性：カテゴリ統計
    const categoryStats: Record<LearningCategory, { total: number; completed: number }> = {
      programming: { total: 0, completed: 0 },
      english: { total: 0, completed: 0 },
      health: { total: 0, completed: 0 },
      reading: { total: 0, completed: 0 },
      exercise: { total: 0, completed: 0 },
      other: { total: 0, completed: 0 },
      'monthly-goals': { total: 0, completed: 0 }
    }

    goals.forEach(goal => {
      if (goal.category) {
        categoryStats[goal.category].total++
        if (goal.isCompleted) {
          categoryStats[goal.category].completed++
        }
      }
    })
    
    // 新しいタグ統計
    const tagStats: Record<string, { total: number; completed: number }> = {}
    
    goals.forEach(goal => {
      if (goal.tagIds && goal.tagIds.length > 0) {
        goal.tagIds.forEach(tagId => {
          if (!tagStats[tagId]) {
            tagStats[tagId] = { total: 0, completed: 0 }
          }
          tagStats[tagId].total++
          if (goal.isCompleted) {
            tagStats[tagId].completed++
          }
        })
      }
    })

    return {
      total,
      completed,
      active,
      completionRate,
      categoryStats,
      tagStats
    }
  }, [goals, getCompletedGoals, getActiveGoals])

  // 目標の検索
  const searchGoals = useCallback((query: string): Goal[] => {
    if (!query.trim()) return goals

    const lowerQuery = query.toLowerCase()
    return goals.filter(goal => 
      goal.title.toLowerCase().includes(lowerQuery) ||
      goal.description.toLowerCase().includes(lowerQuery)
    )
  }, [goals])

  // 目標の並び替え
  const sortGoals = useCallback((
    sortBy: 'title' | 'createdAt' | 'updatedAt' | 'category',
    order: 'asc' | 'desc' = 'asc'
  ): Goal[] => {
    return [...goals].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
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
  }, [goals])

  // 初期化
  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  // 月次目標関連関数
  const createMonthlyGoal = useCallback(async (
    title: string,
    description: string,
    color: ColorVariant,
    targetMonth?: string
  ): Promise<Goal> => {
    try {
      const monthlyGoal: Goal = {
        id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        description,
        color,
        isMonthlyGoal: true,
        monthlyTargetDate: targetMonth || getCurrentMonthString(),
        monthlyProgress: 0,
        tagIds: ['category-monthly-goals'],
        category: 'monthly-goals',
        createdAt: new Date(),
        updatedAt: new Date(),
        isCompleted: false
      }

      const updatedGoals = goalStorage.add(monthlyGoal)
      setGoals(updatedGoals)
      return monthlyGoal
    } catch (err) {
      setError('月次目標の作成に失敗しました')
      console.error('Failed to create monthly goal:', err)
      throw err
    }
  }, [])

  const getMonthlyGoals = useCallback((targetMonth?: string): Goal[] => {
    return goalStorage.getMonthlyGoals(targetMonth)
  }, [goals])

  const getCurrentMonthGoals = useCallback((): Goal[] => {
    return goalStorage.getCurrentMonthGoals()
  }, [goals])

  const updateMonthlyProgress = useCallback(async (goalId: string, progress: number): Promise<void> => {
    try {
      const updatedGoals = goalStorage.updateMonthlyProgress(goalId, progress)
      setGoals(updatedGoals)
    } catch (err) {
      setError('月次目標の進捗更新に失敗しました')
      console.error('Failed to update monthly progress:', err)
      throw err
    }
  }, [])

  const archiveExpiredGoals = useCallback(async (): Promise<{ archived: Goal[], remaining: Goal[] }> => {
    try {
      const result = goalStorage.archiveExpiredGoals()
      setGoals(goalStorage.getAll())
      return result
    } catch (err) {
      setError('期限切れ目標のアーカイブに失敗しました')
      console.error('Failed to archive expired goals:', err)
      throw err
    }
  }, [])

  return {
    goals,
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleGoalCompletion,
    getGoalById,
    getGoalsByCategory,
    getGoalsByTag,
    getGoalsByTags,
    getCompletedGoals,
    getActiveGoals,
    getGoalStats,
    searchGoals,
    sortGoals,
    
    // 月次目標関連
    createMonthlyGoal,
    getMonthlyGoals,
    getCurrentMonthGoals,
    updateMonthlyProgress,
    archiveExpiredGoals,
    
    reload: loadGoals
  }
}