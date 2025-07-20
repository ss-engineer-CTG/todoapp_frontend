// 月次目標のライフサイクル管理フック

import { useState, useEffect, useCallback } from 'react'
import { Goal, getCurrentMonthString, isMonthlyGoalExpired } from '../types'
import { goalStorage } from '../utils/storage'

export interface MonthlyGoalsLifecycleState {
  currentMonthGoals: Goal[]
  expiredGoals: Goal[]
  archivedGoals: Goal[]
  isTransitioning: boolean
  lastArchiveDate: Date | null
}

export interface MonthlyGoalsNotification {
  type: 'month-end' | 'goal-expired' | 'archive-completed'
  message: string
  goalCount?: number
  timestamp: Date
}

export const useMonthlyGoalsLifecycle = () => {
  const [lifecycleState, setLifecycleState] = useState<MonthlyGoalsLifecycleState>({
    currentMonthGoals: [],
    expiredGoals: [],
    archivedGoals: [],
    isTransitioning: false,
    lastArchiveDate: null
  })

  const [notifications, setNotifications] = useState<MonthlyGoalsNotification[]>([])

  // 期限切れ目標の検出
  const detectExpiredGoals = useCallback((): Goal[] => {
    const allGoals = goalStorage.getAll()
    return allGoals.filter(goal => goal.isMonthlyGoal && isMonthlyGoalExpired(goal) && !goal.isCompleted)
  }, [])

  // 現在の月の目標を取得
  const getCurrentMonthGoals = useCallback((): Goal[] => {
    return goalStorage.getCurrentMonthGoals()
  }, [])

  // 月末処理の実行
  const performMonthEndArchiving = useCallback(async (): Promise<{ archived: Goal[], remaining: Goal[] }> => {
    setLifecycleState(prev => ({ ...prev, isTransitioning: true }))
    
    try {
      const result = goalStorage.archiveExpiredGoals()
      
      // 通知を追加
      if (result.archived.length > 0) {
        const notification: MonthlyGoalsNotification = {
          type: 'archive-completed',
          message: `${result.archived.length}件の期限切れ目標をアーカイブしました`,
          goalCount: result.archived.length,
          timestamp: new Date()
        }
        setNotifications(prev => [notification, ...prev].slice(0, 10)) // 最大10件保持
      }

      // 状態更新
      setLifecycleState(prev => ({
        ...prev,
        archivedGoals: result.archived,
        currentMonthGoals: getCurrentMonthGoals(),
        expiredGoals: [],
        lastArchiveDate: new Date(),
        isTransitioning: false
      }))

      return result
    } catch (error) {
      // エラーハンドリング（コンソールログは削除）
      setLifecycleState(prev => ({ ...prev, isTransitioning: false }))
      throw error
    }
  }, [getCurrentMonthGoals])

  // 手動アーカイブ実行
  const manuallyArchiveExpiredGoals = useCallback(async (): Promise<void> => {
    const expiredGoals = detectExpiredGoals()
    
    if (expiredGoals.length === 0) {
      const notification: MonthlyGoalsNotification = {
        type: 'archive-completed',
        message: 'アーカイブ対象の期限切れ目標はありません',
        timestamp: new Date()
      }
      setNotifications(prev => [notification, ...prev].slice(0, 10))
      return
    }

    await performMonthEndArchiving()
  }, [detectExpiredGoals, performMonthEndArchiving])

  // 月次目標の完了率計算
  const calculateMonthlyCompletionRate = useCallback((targetMonth?: string): number => {
    const month = targetMonth || getCurrentMonthString()
    const monthlyGoals = goalStorage.getMonthlyGoals(month)
    
    if (monthlyGoals.length === 0) return 0
    
    const completedGoals = monthlyGoals.filter(goal => goal.isCompleted || (goal.monthlyProgress || 0) >= 100)
    return Math.round((completedGoals.length / monthlyGoals.length) * 100)
  }, [])

  // 月次統計の取得
  const getMonthlyStatistics = useCallback((targetMonth?: string) => {
    const month = targetMonth || getCurrentMonthString()
    const monthlyGoals = goalStorage.getMonthlyGoals(month)
    
    const total = monthlyGoals.length
    const completed = monthlyGoals.filter(goal => goal.isCompleted || (goal.monthlyProgress || 0) >= 100).length
    const inProgress = monthlyGoals.filter(goal => !goal.isCompleted && (goal.monthlyProgress || 0) > 0 && (goal.monthlyProgress || 0) < 100).length
    const notStarted = monthlyGoals.filter(goal => !goal.isCompleted && (goal.monthlyProgress || 0) === 0).length
    const averageProgress = total > 0 ? Math.round(monthlyGoals.reduce((sum, goal) => sum + (goal.monthlyProgress || 0), 0) / total) : 0

    return {
      month,
      total,
      completed,
      inProgress,
      notStarted,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      averageProgress
    }
  }, [])

  // 通知のクリア
  const clearNotification = useCallback((index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // 自動チェック（アプリ起動時や日付変更時）
  const performAutoCheck = useCallback(() => {
    const currentMonthGoals = getCurrentMonthGoals()
    const expiredGoals = detectExpiredGoals()

    setLifecycleState(prev => ({
      ...prev,
      currentMonthGoals,
      expiredGoals
    }))

    // 期限切れ目標の通知
    if (expiredGoals.length > 0) {
      const notification: MonthlyGoalsNotification = {
        type: 'goal-expired',
        message: `${expiredGoals.length}件の目標が期限切れです`,
        goalCount: expiredGoals.length,
        timestamp: new Date()
      }
      setNotifications(prev => [notification, ...prev].slice(0, 10))
    }
  }, [getCurrentMonthGoals, detectExpiredGoals])

  // 初期化と定期チェック
  useEffect(() => {
    performAutoCheck()

    // 1日1回の自動チェック（ローカルストレージに最終チェック日を保存）
    const lastCheckDate = localStorage.getItem('monthly-goals-last-check')
    const today = new Date().toISOString().split('T')[0]
    
    if (lastCheckDate !== today) {
      localStorage.setItem('monthly-goals-last-check', today)
      performAutoCheck()
    }

    // 1時間ごとの自動チェック（期限切れ検出）
    const interval = setInterval(() => {
      performAutoCheck()
    }, 60 * 60 * 1000) // 1時間

    return () => clearInterval(interval)
  }, [performAutoCheck])

  return {
    lifecycleState,
    notifications,
    getCurrentMonthGoals,
    detectExpiredGoals,
    performMonthEndArchiving,
    manuallyArchiveExpiredGoals,
    calculateMonthlyCompletionRate,
    getMonthlyStatistics,
    clearNotification,
    clearAllNotifications,
    performAutoCheck
  }
}