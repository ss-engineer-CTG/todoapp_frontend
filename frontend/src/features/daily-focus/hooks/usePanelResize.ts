import { useState, useCallback, useEffect, useRef } from 'react'

export interface PanelSizes {
  leftPanel: number
  centerPanel: number
  rightPanel: number
}

export interface ResizeHandle {
  isResizing: boolean
  startX: number
  startSizes: PanelSizes
  activeHandle: 'left' | 'right' | null
}

const DEFAULT_SIZES: PanelSizes = {
  leftPanel: 30,
  centerPanel: 40,
  rightPanel: 30
}

const MIN_PANEL_SIZE = 20
const MAX_PANEL_SIZE = 60

export const usePanelResize = () => {
  const [panelSizes, setPanelSizes] = useState<PanelSizes>(() => {
    // ローカルストレージから保存されたサイズを復元
    const savedSizes = localStorage.getItem('daily-focus-panel-sizes')
    if (savedSizes) {
      try {
        return JSON.parse(savedSizes)
      } catch (error) {
        console.error('Failed to parse saved panel sizes:', error)
      }
    }
    return DEFAULT_SIZES
  })

  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>({
    isResizing: false,
    startX: 0,
    startSizes: DEFAULT_SIZES,
    activeHandle: null
  })

  const containerRef = useRef<HTMLDivElement>(null)

  // パネルサイズをローカルストレージに保存
  const savePanelSizes = useCallback((sizes: PanelSizes) => {
    localStorage.setItem('daily-focus-panel-sizes', JSON.stringify(sizes))
  }, [])

  // リサイズ開始
  const startResize = useCallback((
    event: React.MouseEvent,
    handle: 'left' | 'right'
  ) => {
    event.preventDefault()
    setResizeHandle({
      isResizing: true,
      startX: event.clientX,
      startSizes: { ...panelSizes },
      activeHandle: handle
    })
  }, [panelSizes])

  // リサイズ中の処理
  const handleResize = useCallback((event: MouseEvent) => {
    if (!resizeHandle.isResizing || !resizeHandle.activeHandle) return

    const deltaX = event.clientX - resizeHandle.startX
    const containerWidth = containerRef.current?.offsetWidth || 1200
    const deltaPercent = (deltaX / containerWidth) * 100

    const newSizes = { ...resizeHandle.startSizes }

    if (resizeHandle.activeHandle === 'left') {
      // 左パネルと中央パネルの境界をリサイズ
      const newLeftSize = Math.max(
        MIN_PANEL_SIZE,
        Math.min(MAX_PANEL_SIZE, resizeHandle.startSizes.leftPanel + deltaPercent)
      )
      const newCenterSize = Math.max(
        MIN_PANEL_SIZE,
        Math.min(MAX_PANEL_SIZE, resizeHandle.startSizes.centerPanel - deltaPercent)
      )

      // 制約を満たす場合のみ更新
      if (newLeftSize + newCenterSize + resizeHandle.startSizes.rightPanel <= 100) {
        newSizes.leftPanel = newLeftSize
        newSizes.centerPanel = newCenterSize
      }
    } else if (resizeHandle.activeHandle === 'right') {
      // 中央パネルと右パネルの境界をリサイズ
      const newCenterSize = Math.max(
        MIN_PANEL_SIZE,
        Math.min(MAX_PANEL_SIZE, resizeHandle.startSizes.centerPanel + deltaPercent)
      )
      const newRightSize = Math.max(
        MIN_PANEL_SIZE,
        Math.min(MAX_PANEL_SIZE, resizeHandle.startSizes.rightPanel - deltaPercent)
      )

      // 制約を満たす場合のみ更新
      if (resizeHandle.startSizes.leftPanel + newCenterSize + newRightSize <= 100) {
        newSizes.centerPanel = newCenterSize
        newSizes.rightPanel = newRightSize
      }
    }

    setPanelSizes(newSizes)
  }, [resizeHandle])

  // リサイズ終了
  const stopResize = useCallback(() => {
    if (resizeHandle.isResizing) {
      setResizeHandle({
        isResizing: false,
        startX: 0,
        startSizes: DEFAULT_SIZES,
        activeHandle: null
      })
      savePanelSizes(panelSizes)
    }
  }, [resizeHandle.isResizing, panelSizes, savePanelSizes])

  // デフォルトサイズにリセット
  const resetToDefault = useCallback(() => {
    setPanelSizes(DEFAULT_SIZES)
    savePanelSizes(DEFAULT_SIZES)
  }, [savePanelSizes])

  // プリセットサイズの適用
  const applyPreset = useCallback((preset: 'balanced' | 'focus-left' | 'focus-center' | 'focus-right') => {
    let newSizes: PanelSizes

    switch (preset) {
      case 'balanced':
        newSizes = { leftPanel: 33, centerPanel: 34, rightPanel: 33 }
        break
      case 'focus-left':
        newSizes = { leftPanel: 50, centerPanel: 30, rightPanel: 20 }
        break
      case 'focus-center':
        newSizes = { leftPanel: 20, centerPanel: 60, rightPanel: 20 }
        break
      case 'focus-right':
        newSizes = { leftPanel: 20, centerPanel: 30, rightPanel: 50 }
        break
      default:
        newSizes = DEFAULT_SIZES
    }

    setPanelSizes(newSizes)
    savePanelSizes(newSizes)
  }, [savePanelSizes])

  // マウスイベントのリスナー設定
  useEffect(() => {
    if (resizeHandle.isResizing) {
      document.addEventListener('mousemove', handleResize)
      document.addEventListener('mouseup', stopResize)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleResize)
        document.removeEventListener('mouseup', stopResize)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
    
    return () => {
      // クリーンアップ（resizing=falseの場合）
    }
  }, [resizeHandle.isResizing, handleResize, stopResize])

  // リサイズハンドルのプロパティを取得
  const getResizeHandleProps = useCallback((handle: 'left' | 'right') => {
    return {
      onMouseDown: (event: React.MouseEvent) => startResize(event, handle),
      className: `resize-handle resize-handle-${handle}`,
      'data-handle': handle
    }
  }, [startResize])

  // パネルのスタイルを取得
  const getPanelStyle = useCallback((panel: keyof PanelSizes) => {
    return {
      width: `${panelSizes[panel]}%`,
      minWidth: `${MIN_PANEL_SIZE}%`,
      maxWidth: `${MAX_PANEL_SIZE}%`,
      transition: resizeHandle.isResizing ? 'none' : 'width 0.2s ease'
    }
  }, [panelSizes, resizeHandle.isResizing])

  // パネルサイズの状態を取得
  const getPanelSizeStatus = useCallback(() => {
    const total = panelSizes.leftPanel + panelSizes.centerPanel + panelSizes.rightPanel
    const isValid = total <= 100 && 
      Object.values(panelSizes).every(size => size >= MIN_PANEL_SIZE && size <= MAX_PANEL_SIZE)

    return {
      total,
      isValid,
      leftPanel: {
        size: panelSizes.leftPanel,
        isMinimum: panelSizes.leftPanel <= MIN_PANEL_SIZE,
        isMaximum: panelSizes.leftPanel >= MAX_PANEL_SIZE
      },
      centerPanel: {
        size: panelSizes.centerPanel,
        isMinimum: panelSizes.centerPanel <= MIN_PANEL_SIZE,
        isMaximum: panelSizes.centerPanel >= MAX_PANEL_SIZE
      },
      rightPanel: {
        size: panelSizes.rightPanel,
        isMinimum: panelSizes.rightPanel <= MIN_PANEL_SIZE,
        isMaximum: panelSizes.rightPanel >= MAX_PANEL_SIZE
      }
    }
  }, [panelSizes])

  return {
    // 状態
    panelSizes,
    resizeHandle,
    containerRef,
    
    // 操作
    startResize,
    resetToDefault,
    applyPreset,
    
    // ヘルパー
    getResizeHandleProps,
    getPanelStyle,
    getPanelSizeStatus,
    
    // 定数
    MIN_PANEL_SIZE,
    MAX_PANEL_SIZE,
    DEFAULT_SIZES
  }
}