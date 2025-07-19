import React from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { GripVertical } from 'lucide-react'

interface ResizeHandleProps {
  position: 'left' | 'right'
  onMouseDown: (event: React.MouseEvent) => void
  isResizing: boolean
  className?: string
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  position,
  onMouseDown,
  isResizing,
  className = ''
}) => {
  const { theme } = useTheme()

  return (
    <div
      className={`
        resize-handle 
        resize-handle-${position}
        ${className}
        ${isResizing ? 'resizing' : ''}
        flex items-center justify-center
        w-2 h-full cursor-col-resize
        hover:bg-blue-500/20 transition-colors
        group relative
        ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}
      `}
      onMouseDown={onMouseDown}
      title={`${position === 'left' ? '左' : '右'}パネルをリサイズ`}
    >
      {/* リサイズハンドルのビジュアル */}
      <div
        className={`
          w-1 h-8 rounded-full transition-all duration-200
          ${
            isResizing
              ? 'bg-blue-500'
              : theme === 'dark'
              ? 'bg-gray-500 group-hover:bg-blue-400'
              : 'bg-gray-400 group-hover:bg-blue-500'
          }
        `}
      />
      
      {/* ホバー時のアイコン */}
      <div
        className={`
          absolute inset-0 flex items-center justify-center
          opacity-0 group-hover:opacity-100 transition-opacity duration-200
          ${isResizing ? 'opacity-100' : ''}
        `}
      >
        <GripVertical 
          size={14} 
          className={`
            ${
              isResizing
                ? 'text-blue-500'
                : theme === 'dark'
                ? 'text-gray-300'
                : 'text-gray-600'
            }
          `}
        />
      </div>
      
      {/* リサイズ中のオーバーレイ */}
      {isResizing && (
        <div
          className="
            fixed inset-0 bg-transparent z-50 cursor-col-resize
            pointer-events-none
          "
        />
      )}
    </div>
  )
}