// 詳細エリアTab順序ナビゲーション（page.tsx準拠）
import { useEffect, RefObject } from 'react'

interface UseTabNavigationProps {
  isActive: boolean
  refs: {
    taskName: RefObject<HTMLInputElement>
    startDate: RefObject<HTMLButtonElement>
    dueDate: RefObject<HTMLButtonElement>
    notes: RefObject<HTMLTextAreaElement>
  }
}

export const useTabNavigation = ({ isActive, refs }: UseTabNavigationProps) => {
  
  const handleTabNavigation = (e: KeyboardEvent) => {
    if (!isActive || e.key !== 'Tab') return

    const isShiftTab = e.shiftKey
    const activeElement = document.activeElement

    // タスク名フィールド
    if (activeElement === refs.taskName.current) {
      if (!isShiftTab) {
        e.preventDefault()
        refs.startDate.current?.focus()
      }
    }
    // 開始日フィールド
    else if (activeElement === refs.startDate.current) {
      if (isShiftTab) {
        e.preventDefault()
        refs.taskName.current?.focus()
      } else {
        e.preventDefault()
        refs.dueDate.current?.focus()
      }
    }
    // 期限日フィールド
    else if (activeElement === refs.dueDate.current) {
      if (isShiftTab) {
        e.preventDefault()
        refs.startDate.current?.focus()
      } else {
        e.preventDefault()
        refs.notes.current?.focus()
      }
    }
    // メモフィールド
    else if (activeElement === refs.notes.current) {
      if (isShiftTab) {
        e.preventDefault()
        refs.dueDate.current?.focus()
      }
      // 最後のフィールドの場合、通常のTab動作を許可
    }
  }

  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', handleTabNavigation)
      return () => {
        document.removeEventListener('keydown', handleTabNavigation)
      }
    }
  }, [isActive, refs])

  // 最初のフィールドにフォーカスする関数
  const focusFirst = () => {
    refs.taskName.current?.focus()
  }

  return {
    focusFirst
  }
}