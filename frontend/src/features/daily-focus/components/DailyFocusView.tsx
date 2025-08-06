import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { LeftPanel } from './LeftPanel'
import { CenterPanel } from './CenterPanel'
import { RightPanel } from './RightPanel'
import { NotificationToast } from './NotificationToast'
import { dailyMemoStorage } from '../utils/storage'

export const DailyFocusView: React.FC = () => {
  const { resolvedTheme } = useTheme()
  
  // 選択された日付の管理
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0] || ''
  })
  
  // パネル幅の管理（レスポンシブ対応）
  const [leftPanelWidth, setLeftPanelWidth] = useState(25) // 25%
  const [centerPanelWidth, setCenterPanelWidth] = useState(50) // 50%
  // const [rightPanelWidth, setRightPanelWidth] = useState(25) // 25% - 右パネルはflex-1で自動調整
  
  // リサイズ状態
  const [isResizing, setIsResizing] = useState(false)
  const [activeResizer, setActiveResizer] = useState<'left' | 'right' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // リサイズ処理
  const handleResizerMouseDown = useCallback((resizer: 'left' | 'right') => {
    return (e: React.MouseEvent) => {
      setIsResizing(true)
      setActiveResizer(resizer)
      e.preventDefault()
    }
  }, [])
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !activeResizer || !containerRef.current) return
    
    const containerRect = containerRef.current.getBoundingClientRect()
    const containerWidth = containerRect.width
    const mouseX = e.clientX - containerRect.left
    
    if (activeResizer === 'left') {
      // 左パネルのリサイズ
      const newLeftWidth = (mouseX / containerWidth) * 100
      
      if (newLeftWidth >= 15 && newLeftWidth <= 60) {
        setLeftPanelWidth(newLeftWidth)
        // 右パネルはflex-1で自動的に残りの空間を占有
      }
    } else if (activeResizer === 'right') {
      // 右パネルのリサイズ（中央パネルの幅を調整）
      const newCenterWidth = (mouseX / containerWidth) * 100 - leftPanelWidth
      
      if (newCenterWidth >= 20 && newCenterWidth <= 60) {
        setCenterPanelWidth(newCenterWidth)
        // 右パネルはflex-1で自動的に残りの空間を占有
      }
    }
  }, [isResizing, activeResizer, centerPanelWidth, leftPanelWidth])
  
  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    setActiveResizer(null)
  }, [])
  
  // グローバルマウスイベント
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
      }
    }
    return undefined
  }, [isResizing, handleMouseMove, handleMouseUp])

  // 日付選択ハンドラー
  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date)
  }, [])

  // 今日に戻るハンドラー
  const handleBackToToday = useCallback(() => {
    const today = new Date().toISOString().split('T')[0] || ''
    setSelectedDate(today)
  }, [])

  // 初回マウント時の移行処理
  useEffect(() => {
    // アプリ起動時に既存のグローバルメモを今日のメモに移行
    const migrated = dailyMemoStorage.migrateFromGlobalMemo()
    if (migrated) {
      console.log('学習メモの移行が完了しました')
    }
  }, [])
  
  return (
    <>
      <div 
        ref={containerRef}
        className={`flex h-screen w-full ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} overflow-hidden`}
      >
        {/* 左パネル: 学習時間トラッキング */}
        <div 
          className={`${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-r ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} p-4 overflow-y-auto flex-shrink-0`}
          style={{ 
            width: `${leftPanelWidth}%`,
            minWidth: '280px'
          }}
        >
          <LeftPanel />
        </div>
        
        {/* リサイズハンドル1 */}
        <div 
          className={`w-1 cursor-col-resize transition-colors ${
            resolvedTheme === 'dark' ? 'bg-gray-600 hover:bg-blue-500' : 'bg-gray-300 hover:bg-blue-500'
          }`}
          onMouseDown={handleResizerMouseDown('left')}
        />
        
        {/* 中央パネル: 学習メモ */}
        <div 
          className={`${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-r ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} p-4 overflow-y-auto flex-shrink-0`}
          style={{ 
            width: `${centerPanelWidth}%`,
            minWidth: '400px'
          }}
        >
          <CenterPanel 
            selectedDate={selectedDate}
            onBackToToday={handleBackToToday}
          />
        </div>
        
        {/* リサイズハンドル2 */}
        <div 
          className={`w-1 cursor-col-resize transition-colors ${
            resolvedTheme === 'dark' ? 'bg-gray-600 hover:bg-blue-500' : 'bg-gray-300 hover:bg-blue-500'
          }`}
          onMouseDown={handleResizerMouseDown('right')}
        />
        
        {/* 右パネル: 成長可視化 */}
        <div 
          className={`${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-4 overflow-y-auto flex-1`}
          style={{ 
            minWidth: '320px'
          }}
        >
          <RightPanel onDateSelect={handleDateSelect} />
        </div>
      </div>
      
      {/* 通知トースト */}
      <NotificationToast />
    </>
  )
}