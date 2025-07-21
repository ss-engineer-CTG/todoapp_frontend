// システムプロンプト準拠：ドラッグ選択矩形コンポーネント
// 機能：ドラッグ選択中の視覚的矩形表示

import React from 'react'

interface DragSelectionRectangleProps {
  startY: number
  currentY: number
  isVisible: boolean
  theme: 'light' | 'dark'
}

export const DragSelectionRectangle: React.FC<DragSelectionRectangleProps> = ({
  startY,
  currentY,
  isVisible,
  theme
}) => {
  if (!isVisible) return null

  const minY = Math.min(startY, currentY)
  const maxY = Math.max(startY, currentY)
  const height = maxY - minY

  // 最小サイズを確保
  if (height < 5) return null

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        top: `${minY}px`,
        left: 0,
        right: 0,
        height: `${height}px`,
        backgroundColor: theme === 'dark' 
          ? 'rgba(59, 130, 246, 0.15)' 
          : 'rgba(37, 99, 235, 0.1)',
        border: `2px solid ${theme === 'dark' ? '#3b82f6' : '#2563eb'}`,
        borderStyle: 'dashed',
        borderRadius: '4px',
        transition: 'all 0.1s ease-out'
      }}
    >
      {/* オプション：選択範囲の情報表示 */}
      <div
        className={`absolute top-1 left-2 text-xs font-medium px-2 py-1 rounded ${
          theme === 'dark' 
            ? 'bg-blue-900 text-blue-200' 
            : 'bg-blue-100 text-blue-800'
        }`}
      >
        ドラッグ選択中
      </div>
    </div>
  )
}