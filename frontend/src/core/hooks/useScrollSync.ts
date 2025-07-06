// システムプロンプト準拠：スクロール同期処理の一元化（軽量化版）
// 🔧 修正内容：TIMELINE_CONFIG参照を統合設定に変更

import { useCallback, useRef, RefObject } from 'react'
import { APP_CONFIG } from '@core/config'

// スクロール同期フックの型定義
interface UseScrollSyncProps {
  primaryRef: RefObject<HTMLElement>
  secondaryRef: RefObject<HTMLElement>
  direction?: 'horizontal' | 'vertical' | 'both'
  enabled?: boolean
}

interface ScrollSyncHandlers {
  handlePrimaryScroll: (e: React.UIEvent<HTMLElement>) => void
  handleSecondaryScroll: (e: React.UIEvent<HTMLElement>) => void
  syncToPrimary: (scrollLeft?: number, scrollTop?: number) => void
  syncToSecondary: (scrollLeft?: number, scrollTop?: number) => void
}

/**
 * スクロール同期フック
 * システムプロンプト準拠：KISS原則でシンプルな同期実装
 */
export const useScrollSync = ({
  primaryRef,
  secondaryRef,
  direction = 'horizontal',
  enabled = true
}: UseScrollSyncProps): ScrollSyncHandlers => {
  
  // 無限ループ防止用フラグ
  const isSyncingRef = useRef(false)
  
  // デバウンス用タイマー
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 安全なスクロール実行
  const safeScrollTo = useCallback((
    element: HTMLElement | null,
    scrollLeft?: number,
    scrollTop?: number
  ) => {
    if (!element || !enabled) return

    // 現在の値との差分チェック（不要な処理を避ける）
    const threshold = APP_CONFIG.TIMELINE.SCROLL.SYNC_THRESHOLD
    const needsHorizontalSync = scrollLeft !== undefined && 
      Math.abs(element.scrollLeft - scrollLeft) > threshold
    const needsVerticalSync = scrollTop !== undefined && 
      Math.abs(element.scrollTop - scrollTop) > threshold

    if (!needsHorizontalSync && !needsVerticalSync) return

    // スクロール実行
    if (direction === 'horizontal' && needsHorizontalSync) {
      element.scrollLeft = scrollLeft!
    } else if (direction === 'vertical' && needsVerticalSync) {
      element.scrollTop = scrollTop!
    } else if (direction === 'both') {
      if (needsHorizontalSync) element.scrollLeft = scrollLeft!
      if (needsVerticalSync) element.scrollTop = scrollTop!
    }
  }, [direction, enabled])

  // プライマリ要素のスクロールハンドラー
  const handlePrimaryScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    if (!enabled || isSyncingRef.current) return

    const target = e.currentTarget
    if (!target || !secondaryRef.current) return

    // デバウンス処理
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      isSyncingRef.current = true
      
      safeScrollTo(
        secondaryRef.current,
        target.scrollLeft,
        target.scrollTop
      )
      
      // 少し遅延してフラグをリセット
      setTimeout(() => {
        isSyncingRef.current = false
      }, APP_CONFIG.TIMELINE.SCROLL.DEBOUNCE_MS)
    }, APP_CONFIG.TIMELINE.SCROLL.DEBOUNCE_MS)

  }, [enabled, secondaryRef, safeScrollTo])

  // セカンダリ要素のスクロールハンドラー
  const handleSecondaryScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    if (!enabled || isSyncingRef.current) return

    const target = e.currentTarget
    if (!target || !primaryRef.current) return

    // デバウンス処理
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      isSyncingRef.current = true
      
      safeScrollTo(
        primaryRef.current,
        target.scrollLeft,
        target.scrollTop
      )
      
      // 少し遅延してフラグをリセット
      setTimeout(() => {
        isSyncingRef.current = false
      }, APP_CONFIG.TIMELINE.SCROLL.DEBOUNCE_MS)
    }, APP_CONFIG.TIMELINE.SCROLL.DEBOUNCE_MS)

  }, [enabled, primaryRef, safeScrollTo])

  // プライマリ要素への強制同期
  const syncToPrimary = useCallback((scrollLeft?: number, scrollTop?: number) => {
    if (!enabled) return

    const primaryElement = primaryRef.current
    if (!primaryElement) return

    isSyncingRef.current = true
    safeScrollTo(primaryElement, scrollLeft, scrollTop)
    
    setTimeout(() => {
      isSyncingRef.current = false
    }, APP_CONFIG.TIMELINE.SCROLL.DEBOUNCE_MS)
  }, [enabled, primaryRef, safeScrollTo])

  // セカンダリ要素への強制同期
  const syncToSecondary = useCallback((scrollLeft?: number, scrollTop?: number) => {
    if (!enabled) return

    const secondaryElement = secondaryRef.current
    if (!secondaryElement) return

    isSyncingRef.current = true
    safeScrollTo(secondaryElement, scrollLeft, scrollTop)
    
    setTimeout(() => {
      isSyncingRef.current = false
    }, APP_CONFIG.TIMELINE.SCROLL.DEBOUNCE_MS)
  }, [enabled, secondaryRef, safeScrollTo])

  // クリーンアップ
  const cleanup = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    isSyncingRef.current = false
  }, [])

  // コンポーネントアンマウント時のクリーンアップ
  const originalHandlePrimaryScroll = handlePrimaryScroll
  const originalHandleSecondaryScroll = handleSecondaryScroll

  return {
    handlePrimaryScroll: useCallback((e: React.UIEvent<HTMLElement>) => {
      originalHandlePrimaryScroll(e)
      return () => cleanup()
    }, [originalHandlePrimaryScroll, cleanup]),
    
    handleSecondaryScroll: useCallback((e: React.UIEvent<HTMLElement>) => {
      originalHandleSecondaryScroll(e)
      return () => cleanup()
    }, [originalHandleSecondaryScroll, cleanup]),
    
    syncToPrimary,
    syncToSecondary
  }
}

// 便利なラッパーフック：水平スクロール専用
export const useHorizontalScrollSync = (
  primaryRef: RefObject<HTMLElement>,
  secondaryRef: RefObject<HTMLElement>,
  enabled = true
) => {
  return useScrollSync({
    primaryRef,
    secondaryRef,
    direction: 'horizontal',
    enabled
  })
}

// 便利なラッパーフック：垂直スクロール専用
export const useVerticalScrollSync = (
  primaryRef: RefObject<HTMLElement>,
  secondaryRef: RefObject<HTMLElement>,
  enabled = true
) => {
  return useScrollSync({
    primaryRef,
    secondaryRef,
    direction: 'vertical',
    enabled
  })
}