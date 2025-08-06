import { useState, useEffect, useCallback } from 'react'
import { dailyMemoStorage } from '../utils/storage'
import { DailyMemo } from '../types'

export const useDailyMemo = (selectedDate: string) => {
  const [memo, setMemo] = useState<string>('')
  const [currentMemoData, setCurrentMemoData] = useState<DailyMemo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // 指定日付のメモ読み込み
  const loadMemo = useCallback(async (date: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const savedMemo = dailyMemoStorage.getByDate(date)
      if (savedMemo) {
        setMemo(savedMemo.content)
        setCurrentMemoData(savedMemo)
        setLastSaved(savedMemo.updatedAt)
      } else {
        setMemo('')
        setCurrentMemoData(null)
        setLastSaved(null)
      }
    } catch (err) {
      setError('メモの読み込みに失敗しました')
      console.error('Failed to load memo:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // メモの保存
  const saveMemo = useCallback(async (content?: string, date?: string) => {
    try {
      const memoToSave = content !== undefined ? content : memo
      const dateToSave = date || selectedDate
      
      const savedMemo = dailyMemoStorage.updateByDate(dateToSave, memoToSave)
      setCurrentMemoData(savedMemo)
      setMemo(memoToSave)
      setLastSaved(savedMemo.updatedAt)
      setError(null)
      
      return savedMemo
    } catch (err) {
      setError('メモの保存に失敗しました')
      console.error('Failed to save memo:', err)
      throw err
    }
  }, [memo, selectedDate])

  // メモの内容を更新
  const updateMemoContent = useCallback((content: string) => {
    setMemo(content)
  }, [])

  // 自動保存
  const autoSave = useCallback(() => {
    if (!isEditing || memo.trim() === '') return
    saveMemo()
  }, [isEditing, memo, saveMemo])

  // 編集モードの切り替え
  const toggleEditing = useCallback(() => {
    // 編集モードを終了する際に自動保存
    if (isEditing && memo.trim() !== '') {
      saveMemo()
    }
    setIsEditing(!isEditing)
  }, [isEditing, memo, saveMemo])

  // 手動保存
  const manualSave = useCallback(() => {
    if (memo.trim() !== '') {
      saveMemo()
    }
  }, [memo, saveMemo])

  // メモのクリア（選択した日付のみ）
  const clearMemo = useCallback(() => {
    setMemo('')
    // 空の内容で保存することでクリア
    saveMemo('')
  }, [saveMemo])

  // 今日の日付を取得
  const getTodayString = useCallback((): string => {
    return new Date().toISOString().split('T')[0] || ''
  }, [])

  // 日付が今日かどうか判定
  const isToday = useCallback((date: string): boolean => {
    return date === getTodayString()
  }, [getTodayString])

  // 日付が変更された時にメモを読み込み
  useEffect(() => {
    if (selectedDate) {
      loadMemo(selectedDate)
    }
  }, [selectedDate, loadMemo])

  // 自動保存の設定（5秒間隔）
  useEffect(() => {
    if (!isEditing) return
    
    const interval = setInterval(autoSave, 5000)
    return () => clearInterval(interval)
  }, [isEditing, autoSave])

  return {
    // 状態
    memo,
    currentMemoData,
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
    clearMemo,
    
    // ユーティリティ
    getTodayString,
    isToday: isToday(selectedDate),
    wordCount: currentMemoData?.wordCount || 0
  }
}

// 後方互換性のため、既存のuseLearningMemoも残す
export const useLearningMemo = () => {
  const today = new Date().toISOString().split('T')[0] || ''
  return useDailyMemo(today)
}