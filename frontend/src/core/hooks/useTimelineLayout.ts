// システムプロンプト準拠：レイアウト管理の簡素化
// KISS原則：複雑な固定ヘッダーをCSS Gridで簡単に実現

import { useState, useEffect, useCallback, RefObject } from 'react'
import { TIMELINE_CONFIG, RESPONSIVE_BREAKPOINTS } from '@core/config/timeline'

// レイアウト状態の型定義
interface LayoutState {
  containerWidth: number
  containerHeight: number
  headerHeight: number
  sidebarWidth: number
  contentWidth: number
  contentHeight: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

// レイアウトフックの戻り値型
interface UseTimelineLayoutReturn {
  layoutState: LayoutState
  containerRef: RefObject<HTMLDivElement>
  headerRef: RefObject<HTMLDivElement>
  sidebarRef: RefObject<HTMLDivElement>
  contentRef: RefObject<HTMLDivElement>
  updateLayout: () => void
  getGridTemplateAreas: () => string
  getGridTemplateRows: () => string
  getGridTemplateColumns: () => string
}

/**
 * タイムラインレイアウト管理フック
 * システムプロンプト準拠：KISS原則でシンプルなCSS Grid実装
 */
export const useTimelineLayout = (): UseTimelineLayoutReturn => {
  
  // レイアウト状態
  const [layoutState, setLayoutState] = useState<LayoutState>({
    containerWidth: 0,
    containerHeight: 0,
    headerHeight: TIMELINE_CONFIG.LAYOUT.HEADER_HEIGHT,
    sidebarWidth: TIMELINE_CONFIG.LAYOUT.SIDEBAR_WIDTH,
    contentWidth: 0,
    contentHeight: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: true
  })

  // DOM参照
  const [containerRef, setContainerRef] = useState<RefObject<HTMLDivElement>>({ current: null })
  const [headerRef, setHeaderRef] = useState<RefObject<HTMLDivElement>>({ current: null })
  const [sidebarRef, setSidebarRef] = useState<RefObject<HTMLDivElement>>({ current: null })
  const [contentRef, setContentRef] = useState<RefObject<HTMLDivElement>>({ current: null })

  // 参照の初期化
  useEffect(() => {
    setContainerRef({ current: null })
    setHeaderRef({ current: null })
    setSidebarRef({ current: null })
    setContentRef({ current: null })
  }, [])

  // レスポンシブ判定
  const getResponsiveState = useCallback((width: number) => {
    return {
      isMobile: width < RESPONSIVE_BREAKPOINTS.MOBILE,
      isTablet: width >= RESPONSIVE_BREAKPOINTS.MOBILE && width < RESPONSIVE_BREAKPOINTS.DESKTOP,
      isDesktop: width >= RESPONSIVE_BREAKPOINTS.DESKTOP
    }
  }, [])

  // レイアウト更新処理
  const updateLayout = useCallback(() => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const responsiveState = getResponsiveState(rect.width)
    
    // モバイル・タブレット時のサイドバー幅調整
    let adjustedSidebarWidth = TIMELINE_CONFIG.LAYOUT.SIDEBAR_WIDTH
    if (responsiveState.isMobile) {
      adjustedSidebarWidth = Math.min(250, rect.width * 0.3)
    } else if (responsiveState.isTablet) {
      adjustedSidebarWidth = Math.min(280, rect.width * 0.25)
    }

    // モバイル時のヘッダー高さ調整
    let adjustedHeaderHeight = TIMELINE_CONFIG.LAYOUT.HEADER_HEIGHT
    if (responsiveState.isMobile) {
      adjustedHeaderHeight = Math.max(80, TIMELINE_CONFIG.LAYOUT.HEADER_HEIGHT * 0.8)
    }

    setLayoutState(prev => ({
      ...prev,
      containerWidth: rect.width,
      containerHeight: rect.height,
      headerHeight: adjustedHeaderHeight,
      sidebarWidth: adjustedSidebarWidth,
      contentWidth: rect.width - adjustedSidebarWidth,
      contentHeight: rect.height - adjustedHeaderHeight,
      ...responsiveState
    }))
  }, [containerRef, getResponsiveState])

  // リサイズイベントの監視
  useEffect(() => {
    const handleResize = () => {
      // デバウンス処理
      const timeoutId = setTimeout(updateLayout, 100)
      return () => clearTimeout(timeoutId)
    }

    window.addEventListener('resize', handleResize)
    
    // 初回実行
    updateLayout()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [updateLayout])

  // CSS Grid Template Areas の生成
  const getGridTemplateAreas = useCallback((): string => {
    if (layoutState.isMobile) {
      // モバイル：ヘッダーとコンテンツのみ
      return `
        "header"
        "content"
      `
    } else {
      // デスクトップ・タブレット：サイドバー付き
      return `
        "header header"
        "sidebar content"
      `
    }
  }, [layoutState.isMobile])

  // CSS Grid Template Rows の生成
  const getGridTemplateRows = useCallback((): string => {
    return `${layoutState.headerHeight}px 1fr`
  }, [layoutState.headerHeight])

  // CSS Grid Template Columns の生成
  const getGridTemplateColumns = useCallback((): string => {
    if (layoutState.isMobile) {
      return '1fr'
    } else {
      return `${layoutState.sidebarWidth}px 1fr`
    }
  }, [layoutState.isMobile, layoutState.sidebarWidth])

  // 参照を設定するヘルパー関数
  const setContainerRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      containerRef.current = node
      updateLayout()
    }
  }, [updateLayout])

  const setHeaderRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      headerRef.current = node
    }
  }, [])

  const setSidebarRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      sidebarRef.current = node
    }
  }, [])

  const setContentRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      contentRef.current = node
    }
  }, [])

  // 修正された参照オブジェクト
  const mutableContainerRef = {
    current: containerRef.current,
    [Symbol.iterator]: function* () { yield containerRef.current },
    [Symbol.toStringTag]: 'RefObject'
  } as RefObject<HTMLDivElement>

  const mutableHeaderRef = {
    current: headerRef.current,
    [Symbol.iterator]: function* () { yield headerRef.current },
    [Symbol.toStringTag]: 'RefObject'
  } as RefObject<HTMLDivElement>

  const mutableSidebarRef = {
    current: sidebarRef.current,
    [Symbol.iterator]: function* () { yield sidebarRef.current },
    [Symbol.toStringTag]: 'RefObject'
  } as RefObject<HTMLDivElement>

  const mutableContentRef = {
    current: contentRef.current,
    [Symbol.iterator]: function* () { yield contentRef.current },
    [Symbol.toStringTag]: 'RefObject'
  } as RefObject<HTMLDivElement>

  // コールバック参照を設定
  useEffect(() => {
    Object.defineProperty(mutableContainerRef, 'current', {
      set: setContainerRefCallback,
      get: () => containerRef.current
    })
    Object.defineProperty(mutableHeaderRef, 'current', {
      set: setHeaderRefCallback,
      get: () => headerRef.current
    })
    Object.defineProperty(mutableSidebarRef, 'current', {
      set: setSidebarRefCallback,
      get: () => sidebarRef.current
    })
    Object.defineProperty(mutableContentRef, 'current', {
      set: setContentRefCallback,
      get: () => contentRef.current
    })
  }, [setContainerRefCallback, setHeaderRefCallback, setSidebarRefCallback, setContentRefCallback])

  return {
    layoutState,
    containerRef: mutableContainerRef,
    headerRef: mutableHeaderRef,
    sidebarRef: mutableSidebarRef,
    contentRef: mutableContentRef,
    updateLayout,
    getGridTemplateAreas,
    getGridTemplateRows,
    getGridTemplateColumns
  }
}

// レイアウトCSS生成ヘルパー
export const generateTimelineLayoutCSS = (
  templateAreas: string,
  templateRows: string,
  templateColumns: string
): React.CSSProperties => {
  return {
    display: 'grid',
    gridTemplateAreas: templateAreas,
    gridTemplateRows: templateRows,
    gridTemplateColumns: templateColumns,
    height: '100vh',
    width: '100vw',
    overflow: 'hidden'
  }
}

// グリッドエリア名定数
export const GRID_AREAS = {
  HEADER: 'header',
  SIDEBAR: 'sidebar', 
  CONTENT: 'content'
} as const
