import { useState, useEffect, useCallback, useRef } from 'react'
import { LearningSession, LearningSessionState, LearningCategory } from '../types'
import { sessionStorage, statsStorage } from '../utils/storage'
import { 
  formatTime, 
  getTodayDateString, 
  calculateTotalTimeToday, 
  calculateCategoryTimes,
  createTimer,
  createVisibilityHandler
} from '../utils/timeUtils'

export const useLearningSession = () => {
  const [sessionState, setSessionState] = useState<LearningSessionState>({
    currentSession: null,
    isActive: false,
    isPaused: false,
    currentCategory: 'programming',
    elapsedTime: 0,
    todayTotal: 0,
    categoryTotals: {}
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // タイマーの参照
  const timerRef = useRef<(() => void) | null>(null)
  const visibilityHandlerRef = useRef<(() => void) | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)

  // セッションの読み込み
  const loadSession = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const currentSession = sessionStorage.getCurrentSession()
      const sessions = sessionStorage.getTodaySessions()
      
      const todayTotal = calculateTotalTimeToday(sessions)
      const categoryTotals = calculateCategoryTimes(sessions)
      
      // 復元時の状態設定
      const isActive = currentSession?.isActive || false
      const isPaused = currentSession?.isPaused || false
      
      // アクティブなセッションがある場合、タイマーを開始
      if (isActive && !isPaused && currentSession) {
        startTimeRef.current = currentSession.startTime.getTime()
        pausedTimeRef.current = currentSession.pausedTime
        
        // タイマー開始
        timerRef.current = createTimer(updateTimer, 1000)
      }
      
      setSessionState(prev => ({
        ...prev,
        currentSession,
        isActive,
        isPaused,
        currentCategory: currentSession?.category || 'programming',
        elapsedTime: currentSession?.isActive && !currentSession.isPaused ? 
          Date.now() - currentSession.startTime.getTime() + currentSession.pausedTime : 0,
        todayTotal,
        categoryTotals
      }))
    } catch (err) {
      setError('学習セッションの読み込みに失敗しました')
      console.error('Failed to load learning session:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // タイマーの更新
  const updateTimer = useCallback(() => {
    setSessionState(prev => {
      if (prev.isActive && !prev.isPaused && prev.currentSession) {
        const currentTime = Date.now()
        const elapsed = currentTime - startTimeRef.current + prev.currentSession.pausedTime
        
        return {
          ...prev,
          elapsedTime: elapsed
        }
      }
      return prev
    })
  }, [])

  // 学習開始（新しいタグシステム対応）
  const startLearning = useCallback(async (
    categoryOrTagIds: LearningCategory | string[], 
    goalId?: string,
    legacyCategory?: LearningCategory // 後方互換性
  ) => {
    try {
      setError(null)
      
      // タグシステムとカテゴリシステムの判定
      const isTagMode = Array.isArray(categoryOrTagIds)
      const tagIds = isTagMode ? categoryOrTagIds : []
      const category = isTagMode ? (legacyCategory || 'other') : (categoryOrTagIds as LearningCategory)
      
      const newSession: LearningSession = {
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tagIds: tagIds.length > 0 ? tagIds : undefined,
        category, // 後方互換性
        startTime: new Date(),
        pausedTime: 0,
        totalTime: 0,
        isActive: true,
        isPaused: false,
        goalId
      }
      
      sessionStorage.setCurrentSession(newSession)
      startTimeRef.current = Date.now()
      pausedTimeRef.current = 0
      
      setSessionState(prev => ({
        ...prev,
        currentSession: newSession,
        isActive: true,
        isPaused: false,
        currentCategory: category,
        elapsedTime: 0
      }))
      
      // 既存のタイマーを停止
      if (timerRef.current) {
        timerRef.current()
      }
      
      // タイマー開始
      timerRef.current = createTimer(updateTimer, 1000)
      
      console.log('学習開始:', { 
        mode: isTagMode ? 'tag' : 'category',
        tagIds, 
        category, 
        goalId 
      })
    } catch (err) {
      setError('学習開始に失敗しました')
      console.error('Failed to start learning:', err)
      throw err
    }
  }, [updateTimer])

  // 学習一時停止
  const pauseLearning = useCallback(async () => {
    try {
      setError(null)
      
      if (!sessionState.currentSession || !sessionState.isActive) return
      
      const currentTime = Date.now()
      const sessionTime = currentTime - sessionState.currentSession.startTime.getTime()
      pausedTimeRef.current += sessionTime
      
      const updatedSession = {
        ...sessionState.currentSession,
        isPaused: true,
        pausedTime: pausedTimeRef.current
      }
      
      sessionStorage.setCurrentSession(updatedSession)
      
      setSessionState(prev => ({
        ...prev,
        currentSession: updatedSession,
        isPaused: true
      }))
      
      // タイマー停止
      if (timerRef.current) {
        timerRef.current()
        timerRef.current = null
      }
      
      console.log('学習一時停止')
    } catch (err) {
      setError('学習一時停止に失敗しました')
      console.error('Failed to pause learning:', err)
      throw err
    }
  }, [sessionState.currentSession, sessionState.isActive])

  // 学習再開
  const resumeLearning = useCallback(async () => {
    try {
      setError(null)
      
      if (!sessionState.currentSession || sessionState.isActive) return
      
      const updatedSession = {
        ...sessionState.currentSession,
        isPaused: false
      }
      
      sessionStorage.setCurrentSession(updatedSession)
      startTimeRef.current = Date.now()
      
      setSessionState(prev => ({
        ...prev,
        currentSession: updatedSession,
        isPaused: false
      }))
      
      // 既存のタイマーを停止
      if (timerRef.current) {
        timerRef.current()
      }
      
      // タイマー再開
      timerRef.current = createTimer(updateTimer, 1000)
      
      console.log('学習再開')
    } catch (err) {
      setError('学習再開に失敗しました')
      console.error('Failed to resume learning:', err)
      throw err
    }
  }, [sessionState.currentSession, sessionState.isActive, updateTimer])

  // 学習終了
  const stopLearning = useCallback(async (notes?: string) => {
    try {
      setError(null)
      
      if (!sessionState.currentSession) return
      
      const currentTime = Date.now()
      let totalTime = sessionState.currentSession.pausedTime
      
      if (sessionState.isActive && !sessionState.isPaused) {
        totalTime += currentTime - sessionState.currentSession.startTime.getTime()
      }
      
      const completedSession: LearningSession = {
        ...sessionState.currentSession,
        endTime: new Date(),
        totalTime,
        isActive: false,
        isPaused: false,
        notes
      }
      
      // セッションを保存
      sessionStorage.add(completedSession)
      sessionStorage.setCurrentSession(null)
      
      // 統計を更新
      const today = getTodayDateString()
      const todaySessions = sessionStorage.getTodaySessions()
      const newTodayTotal = calculateTotalTimeToday(todaySessions)
      const newCategoryTotals = calculateCategoryTimes(todaySessions)
      
      // 日次統計を更新
      await statsStorage.updateOrCreate(today, {
        totalTime: newTodayTotal,
        categoryTimes: newCategoryTotals,
        sessionsCount: todaySessions.length
      })
      
      setSessionState(prev => ({
        ...prev,
        currentSession: null,
        isActive: false,
        isPaused: false,
        elapsedTime: 0,
        todayTotal: newTodayTotal,
        categoryTotals: newCategoryTotals
      }))
      
      // タイマー停止
      if (timerRef.current) {
        timerRef.current()
        timerRef.current = null
      }
      
      console.log('学習終了。総時間:', Math.floor(totalTime / 1000 / 60), '分')
      return completedSession
    } catch (err) {
      setError('学習終了に失敗しました')
      console.error('Failed to stop learning:', err)
      throw err
    }
  }, [sessionState.currentSession, sessionState.isActive, sessionState.isPaused])

  // カテゴリ変更（後方互換性）
  const changeCategory = useCallback(async (category: LearningCategory) => {
    try {
      setError(null)
      
      if (!sessionState.currentSession) {
        setSessionState(prev => ({
          ...prev,
          currentCategory: category
        }))
        return
      }
      
      const updatedSession = {
        ...sessionState.currentSession,
        category
      }
      
      sessionStorage.setCurrentSession(updatedSession)
      
      setSessionState(prev => ({
        ...prev,
        currentSession: updatedSession,
        currentCategory: category
      }))
    } catch (err) {
      setError('カテゴリ変更に失敗しました')
      console.error('Failed to change category:', err)
      throw err
    }
  }, [sessionState.currentSession])
  
  // タグ変更（新しいタグシステム）
  const changeTags = useCallback(async (tagIds: string[]) => {
    try {
      setError(null)
      
      if (!sessionState.currentSession) {
        // セッションがない場合は何もしない
        return
      }
      
      const updatedSession = {
        ...sessionState.currentSession,
        tagIds: tagIds.length > 0 ? tagIds : undefined
      }
      
      sessionStorage.setCurrentSession(updatedSession)
      
      setSessionState(prev => ({
        ...prev,
        currentSession: updatedSession
      }))
      
      console.log('タグ変更:', tagIds)
    } catch (err) {
      setError('タグ変更に失敗しました')
      console.error('Failed to change tags:', err)
      throw err
    }
  }, [sessionState.currentSession])

  // 今日の統計を取得
  const getTodayStats = useCallback(() => {
    const sessions = sessionStorage.getTodaySessions()
    const totalTime = calculateTotalTimeToday(sessions)
    const categoryTimes = calculateCategoryTimes(sessions)
    
    return {
      totalTime,
      categoryTimes,
      sessionsCount: sessions.length,
      averageSessionTime: sessions.length > 0 ? totalTime / sessions.length : 0
    }
  }, [])

  // フォーマット済みの時間を取得
  const getFormattedTimes = useCallback(() => {
    return {
      currentSession: formatTime(sessionState.elapsedTime),
      todayTotal: formatTime(sessionState.todayTotal),
      categoryTotals: Object.entries(sessionState.categoryTotals).reduce((acc, [category, time]) => {
        acc[category] = formatTime(time)
        return acc
      }, {} as Record<string, string>)
    }
  }, [sessionState.elapsedTime, sessionState.todayTotal, sessionState.categoryTotals])

  // 通知機能
  const showNotification = useCallback((title: string, message: string, type: 'info' | 'warning' | 'success' = 'info') => {
    // カスタムイベントで通知を送信
    const notificationEvent = new CustomEvent('showNotification', {
      detail: { title, message, type }
    })
    window.dispatchEvent(notificationEvent)
  }, [])

  // PCロック検知の設定
  useEffect(() => {
    const handleVisible = () => {
      console.log('PCロック解除検知')
      if (sessionState.currentSession && sessionState.isPaused) {
        showNotification(
          '学習セッション',
          'PCのロックが解除されました。学習を再開しますか？',
          'info'
        )
      }
    }
    
    const handleHidden = () => {
      console.log('PCロック検知')
      if (sessionState.isActive && !sessionState.isPaused) {
        showNotification(
          '学習セッション',
          'PCロックを検知しました。学習を自動的に一時停止します。',
          'warning'
        )
        pauseLearning()
      }
    }
    
    visibilityHandlerRef.current = createVisibilityHandler(handleVisible, handleHidden)
    
    return () => {
      if (visibilityHandlerRef.current) {
        visibilityHandlerRef.current()
      }
    }
  }, [sessionState.isActive, sessionState.isPaused, sessionState.currentSession, pauseLearning, showNotification])

  // 初期化
  useEffect(() => {
    loadSession()
  }, [loadSession])

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        timerRef.current()
      }
      if (visibilityHandlerRef.current) {
        visibilityHandlerRef.current()
      }
    }
  }, [])

  return {
    // 状態
    sessionState,
    loading,
    error,
    
    // 操作
    startLearning,
    pauseLearning,
    resumeLearning,
    stopLearning,
    changeCategory,
    changeTags,
    
    // 統計
    getTodayStats,
    getFormattedTimes,
    
    // ユーティリティ
    reload: loadSession
  }
}