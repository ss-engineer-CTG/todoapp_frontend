import React, { useState, useCallback, useRef } from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { LeftPanel } from './LeftPanel'
import { CenterPanel } from './CenterPanel'
import { RightPanel } from './RightPanel'

export const DailyFocusView: React.FC = () => {
  const { theme } = useTheme()
  
  // パネル幅の管理
  const [leftPanelWidth, setLeftPanelWidth] = useState(25) // 25%
  const [centerPanelWidth, setCenterPanelWidth] = useState(50) // 50%
  const [rightPanelWidth, setRightPanelWidth] = useState(25) // 25%
  
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
      const newRightWidth = 100 - newLeftWidth - centerPanelWidth
      
      if (newLeftWidth >= 15 && newLeftWidth <= 60 && newRightWidth >= 15) {
        setLeftPanelWidth(newLeftWidth)
        setRightPanelWidth(newRightWidth)
      }
    } else if (activeResizer === 'right') {
      // 右パネルのリサイズ
      const rightEdgeX = containerWidth - mouseX
      const newRightWidth = (rightEdgeX / containerWidth) * 100
      const newCenterWidth = 100 - leftPanelWidth - newRightWidth
      
      if (newCenterWidth >= 20 && newRightWidth >= 15 && newRightWidth <= 60) {
        setCenterPanelWidth(newCenterWidth)
        setRightPanelWidth(newRightWidth)
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
  }, [isResizing, handleMouseMove, handleMouseUp])
  
  return (
    <div 
      ref={containerRef}
      className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} pt-16 overflow-hidden`}
    >
      {/* 左パネル: 目標管理・学習時間トラッキング */}
      <div 
        className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} p-4 overflow-y-auto`}
        style={{ width: `${leftPanelWidth}%` }}
      >
        <LeftPanel />
      </div>
      
      {/* リサイズハンドル1 */}
      <div 
        className={`w-1 cursor-col-resize transition-colors ${
          theme === 'dark' ? 'bg-gray-600 hover:bg-blue-500' : 'bg-gray-300 hover:bg-blue-500'
        }`}
        onMouseDown={handleResizerMouseDown('left')}
      />
      
      {/* 中央パネル: ToDoリスト */}
      <div 
        className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} p-4 overflow-y-auto`}
        style={{ width: `${centerPanelWidth}%` }}
      >
        <CenterPanel />
      </div>
      
      {/* リサイズハンドル2 */}
      <div 
        className={`w-1 cursor-col-resize transition-colors ${
          theme === 'dark' ? 'bg-gray-600 hover:bg-blue-500' : 'bg-gray-300 hover:bg-blue-500'
        }`}
        onMouseDown={handleResizerMouseDown('right')}
      />
      
      {/* 右パネル: アウトプットメモ・成長可視化 */}
      <div 
        className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-4 overflow-y-auto`}
        style={{ width: `${rightPanelWidth}%` }}
      >
        <RightPanel />
      </div>
    </div>
  )
}