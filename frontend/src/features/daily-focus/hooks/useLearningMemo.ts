import { useState, useEffect, useCallback } from 'react'
import { LearningMemo } from '../types'

export const useLearningMemo = () => {
  const [memo, setMemo] = useState<LearningMemo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // 本日の日付を取得
  const getTodayKey = useCallback((): string => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  }, [])

  // ローカルストレージのキー生成
  const getStorageKey = useCallback((date: string): string => {
    return `learning-memo-${date}`
  }, [])

  // メモの読み込み
  const loadMemo = useCallback(async (date?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const targetDate = date || getTodayKey()
      const storageKey = getStorageKey(targetDate)
      const savedMemo = localStorage.getItem(storageKey)
      
      if (savedMemo) {
        const parsedMemo = JSON.parse(savedMemo)
        setMemo({
          ...parsedMemo,
          date: targetDate,
          createdAt: new Date(parsedMemo.createdAt),
          updatedAt: new Date(parsedMemo.updatedAt)
        })
      } else {
        // 新しいメモを作成
        const newMemo: LearningMemo = {
          id: `memo-${Date.now()}`,
          date: targetDate,
          content: '',
          goals: [],
          achievements: [],
          challenges: [],
          reflections: '',
          tomorrowPlans: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
        setMemo(newMemo)
      }
    } catch (err) {
      setError('メモの読み込みに失敗しました')
      console.error('Failed to load memo:', err)
    } finally {
      setLoading(false)
    }
  }, [getTodayKey, getStorageKey])

  // メモの保存
  const saveMemo = useCallback(async (memoData: Partial<LearningMemo>) => {
    try {
      if (!memo) return

      const updatedMemo: LearningMemo = {
        ...memo,
        ...memoData,
        updatedAt: new Date()
      }

      const storageKey = getStorageKey(updatedMemo.date)
      localStorage.setItem(storageKey, JSON.stringify(updatedMemo))
      
      setMemo(updatedMemo)
      setLastSaved(new Date())
      setError(null)
    } catch (err) {
      setError('メモの保存に失敗しました')
      console.error('Failed to save memo:', err)
      throw err
    }
  }, [memo, getStorageKey])

  // メモの内容を更新
  const updateMemoContent = useCallback((content: string) => {
    if (!memo) return
    
    const updatedMemo = { ...memo, content }
    setMemo(updatedMemo)
  }, [memo])

  // 目標を追加
  const addGoal = useCallback((goal: string) => {
    if (!memo || !goal.trim()) return
    
    const updatedMemo = {
      ...memo,
      goals: [...memo.goals, goal.trim()]
    }
    setMemo(updatedMemo)
    saveMemo(updatedMemo)
  }, [memo, saveMemo])

  // 目標を削除
  const removeGoal = useCallback((index: number) => {
    if (!memo || index < 0 || index >= memo.goals.length) return
    
    const updatedMemo = {
      ...memo,
      goals: memo.goals.filter((_, i) => i !== index)
    }
    setMemo(updatedMemo)
    saveMemo(updatedMemo)
  }, [memo, saveMemo])

  // 達成事項を追加
  const addAchievement = useCallback((achievement: string) => {
    if (!memo || !achievement.trim()) return
    
    const updatedMemo = {
      ...memo,
      achievements: [...memo.achievements, achievement.trim()]
    }
    setMemo(updatedMemo)
    saveMemo(updatedMemo)
  }, [memo, saveMemo])

  // 達成事項を削除
  const removeAchievement = useCallback((index: number) => {
    if (!memo || index < 0 || index >= memo.achievements.length) return
    
    const updatedMemo = {
      ...memo,
      achievements: memo.achievements.filter((_, i) => i !== index)
    }
    setMemo(updatedMemo)
    saveMemo(updatedMemo)
  }, [memo, saveMemo])

  // 課題を追加
  const addChallenge = useCallback((challenge: string) => {
    if (!memo || !challenge.trim()) return
    
    const updatedMemo = {
      ...memo,
      challenges: [...memo.challenges, challenge.trim()]
    }
    setMemo(updatedMemo)
    saveMemo(updatedMemo)
  }, [memo, saveMemo])

  // 課題を削除
  const removeChallenge = useCallback((index: number) => {
    if (!memo || index < 0 || index >= memo.challenges.length) return
    
    const updatedMemo = {
      ...memo,
      challenges: memo.challenges.filter((_, i) => i !== index)
    }
    setMemo(updatedMemo)
    saveMemo(updatedMemo)
  }, [memo, saveMemo])

  // 振り返りを更新
  const updateReflections = useCallback((reflections: string) => {
    if (!memo) return
    
    const updatedMemo = { ...memo, reflections }
    setMemo(updatedMemo)
  }, [memo])

  // 明日の計画を更新
  const updateTomorrowPlans = useCallback((tomorrowPlans: string) => {
    if (!memo) return
    
    const updatedMemo = { ...memo, tomorrowPlans }
    setMemo(updatedMemo)
  }, [memo])

  // 自動保存
  const autoSave = useCallback(() => {
    if (!memo || !isEditing) return
    
    saveMemo(memo)
  }, [memo, isEditing, saveMemo])

  // 編集モードの切り替え
  const toggleEditing = useCallback(() => {
    setIsEditing(!isEditing)
    
    // 編集モードを終了する際に自動保存
    if (isEditing && memo) {
      saveMemo(memo)
    }
  }, [isEditing, memo, saveMemo])

  // 手動保存
  const manualSave = useCallback(() => {
    if (!memo) return
    saveMemo(memo)
  }, [memo, saveMemo])

  // メモの統計情報を取得
  const getMemoStats = useCallback(() => {
    if (!memo) return null
    
    return {
      totalGoals: memo.goals.length,
      totalAchievements: memo.achievements.length,
      totalChallenges: memo.challenges.length,
      hasReflections: memo.reflections.length > 0,
      hasTomorrowPlans: memo.tomorrowPlans.length > 0,
      completionRate: memo.goals.length > 0 ? memo.achievements.length / memo.goals.length : 0,
      wordCount: memo.content.length + memo.reflections.length + memo.tomorrowPlans.length
    }
  }, [memo])

  // 過去のメモを取得
  const getPastMemos = useCallback((days: number = 7): LearningMemo[] => {
    const memos: LearningMemo[] = []
    const today = new Date()
    
    for (let i = 1; i <= days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      const storageKey = getStorageKey(dateKey)
      const savedMemo = localStorage.getItem(storageKey)
      
      if (savedMemo) {
        try {
          const parsedMemo = JSON.parse(savedMemo)
          memos.push({
            ...parsedMemo,
            date: dateKey,
            createdAt: new Date(parsedMemo.createdAt),
            updatedAt: new Date(parsedMemo.updatedAt)
          })
        } catch (err) {
          console.error('Failed to parse memo:', err)
        }
      }
    }
    
    return memos.sort((a, b) => b.date.localeCompare(a.date))
  }, [getStorageKey])

  // メモのエクスポート
  const exportMemo = useCallback((format: 'text' | 'json' = 'text'): string => {
    if (!memo) return ''
    
    if (format === 'json') {
      return JSON.stringify(memo, null, 2)
    }
    
    // テキスト形式でエクスポート
    const lines: string[] = []
    lines.push(`# 学習メモ - ${memo.date}`)
    lines.push('')
    
    if (memo.content) {
      lines.push('## 内容')
      lines.push(memo.content)
      lines.push('')
    }
    
    if (memo.goals.length > 0) {
      lines.push('## 今日の目標')
      memo.goals.forEach(goal => lines.push(`- ${goal}`))
      lines.push('')
    }
    
    if (memo.achievements.length > 0) {
      lines.push('## 達成したこと')
      memo.achievements.forEach(achievement => lines.push(`- ${achievement}`))
      lines.push('')
    }
    
    if (memo.challenges.length > 0) {
      lines.push('## 課題・困ったこと')
      memo.challenges.forEach(challenge => lines.push(`- ${challenge}`))
      lines.push('')
    }
    
    if (memo.reflections) {
      lines.push('## 振り返り')
      lines.push(memo.reflections)
      lines.push('')
    }
    
    if (memo.tomorrowPlans) {
      lines.push('## 明日の計画')
      lines.push(memo.tomorrowPlans)
      lines.push('')
    }
    
    return lines.join('\n')
  }, [memo])

  // 初期化
  useEffect(() => {
    loadMemo()
  }, [loadMemo])

  // 自動保存の設定（5秒間隔）
  useEffect(() => {
    if (!isEditing) return
    
    const interval = setInterval(autoSave, 5000)
    return () => clearInterval(interval)
  }, [isEditing, autoSave])

  return {
    // 状態
    memo,
    loading,
    error,
    isEditing,
    lastSaved,
    
    // 基本操作
    loadMemo,
    saveMemo,
    updateMemoContent,
    toggleEditing,
    manualSave,
    
    // 目標管理
    addGoal,
    removeGoal,
    
    // 達成事項管理
    addAchievement,
    removeAchievement,
    
    // 課題管理
    addChallenge,
    removeChallenge,
    
    // その他の更新
    updateReflections,
    updateTomorrowPlans,
    
    // 統計・分析
    getMemoStats,
    getPastMemos,
    
    // エクスポート
    exportMemo
  }
}