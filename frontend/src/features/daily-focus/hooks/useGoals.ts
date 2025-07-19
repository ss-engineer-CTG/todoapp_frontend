import { useState, useEffect, useCallback } from 'react'
import { Goal, ColorVariant, LearningCategory } from '../types'
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
      const loadedGoals = goalStorage.getAll()
      setGoals(loadedGoals)
    } catch (err) {
      setError('目標の読み込みに失敗しました')
      console.error('Failed to load goals:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 目標の追加
  const addGoal = useCallback(async (
    title: string,
    description: string,
    color: ColorVariant,
    category: LearningCategory
  ): Promise<Goal> => {
    try {
      const newGoal: Goal = {
        id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        description,
        color,
        category,
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

  // カテゴリ別の目標取得
  const getGoalsByCategory = useCallback((category: LearningCategory): Goal[] => {
    return goals.filter(goal => goal.category === category)
  }, [goals])

  // 完了済みの目標取得
  const getCompletedGoals = useCallback((): Goal[] => {
    return goals.filter(goal => goal.isCompleted)
  }, [goals])

  // 未完了の目標取得
  const getActiveGoals = useCallback((): Goal[] => {
    return goals.filter(goal => !goal.isCompleted)
  }, [goals])

  // 目標の統計
  const getGoalStats = useCallback(() => {
    const total = goals.length
    const completed = getCompletedGoals().length
    const active = getActiveGoals().length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    const categoryStats: Record<LearningCategory, { total: number; completed: number }> = {
      programming: { total: 0, completed: 0 },
      english: { total: 0, completed: 0 },
      health: { total: 0, completed: 0 },
      reading: { total: 0, completed: 0 },
      exercise: { total: 0, completed: 0 },
      other: { total: 0, completed: 0 }
    }

    goals.forEach(goal => {
      categoryStats[goal.category].total++
      if (goal.isCompleted) {
        categoryStats[goal.category].completed++
      }
    })

    return {
      total,
      completed,
      active,
      completionRate,
      categoryStats
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
    getCompletedGoals,
    getActiveGoals,
    getGoalStats,
    searchGoals,
    sortGoals,
    reload: loadGoals
  }
}