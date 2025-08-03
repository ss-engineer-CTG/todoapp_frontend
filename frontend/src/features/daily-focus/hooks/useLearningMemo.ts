import { useState, useEffect, useCallback } from 'react'
import { memoStorage } from '../utils/storage'

export const useLearningMemo = () => {
  const [memo, setMemo] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // メモの読み込み
  const loadMemo = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const savedMemo = memoStorage.get()
      setMemo(savedMemo || '')
    } catch (err) {
      setError('メモの読み込みに失敗しました')
      console.error('Failed to load memo:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // メモの保存
  const saveMemo = useCallback(async (content?: string) => {
    try {
      const memoToSave = content !== undefined ? content : memo
      memoStorage.save(memoToSave)
      setMemo(memoToSave)
      setLastSaved(new Date())
      setError(null)
    } catch (err) {
      setError('メモの保存に失敗しました')
      console.error('Failed to save memo:', err)
      throw err
    }
  }, [memo])

  // メモの内容を更新
  const updateMemoContent = useCallback((content: string) => {
    setMemo(content)
  }, [])

  // 自動保存
  const autoSave = useCallback(() => {
    if (!isEditing) return
    saveMemo()
  }, [isEditing, saveMemo])

  // 編集モードの切り替え
  const toggleEditing = useCallback(() => {
    setIsEditing(!isEditing)
    
    // 編集モードを終了する際に自動保存
    if (isEditing) {
      saveMemo()
    }
  }, [isEditing, saveMemo])

  // 手動保存
  const manualSave = useCallback(() => {
    saveMemo()
  }, [saveMemo])

  // メモのクリア
  const clearMemo = useCallback(() => {
    setMemo('')
    memoStorage.clear()
  }, [])

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
    clearMemo
  }
}