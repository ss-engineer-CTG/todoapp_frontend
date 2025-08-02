import React, { useState } from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { Settings, RotateCcw, Layout, Maximize2, Minimize2 } from 'lucide-react'
import { usePanelResize } from '../hooks/usePanelResize'

export const PanelResizeControls: React.FC = () => {
  const { resolvedTheme } = useTheme()
  const { 
    panelSizes, 
    resetToDefault, 
    applyPreset, 
    getPanelSizeStatus 
  } = usePanelResize()
  
  const [isOpen, setIsOpen] = useState(false)
  const sizeStatus = getPanelSizeStatus()

  const presets = [
    {
      id: 'balanced',
      name: 'バランス',
      icon: Layout,
      description: '33% - 34% - 33%',
      sizes: { left: 33, center: 34, right: 33 }
    },
    {
      id: 'focus-left',
      name: '左フォーカス',
      icon: Minimize2,
      description: '50% - 30% - 20%',
      sizes: { left: 50, center: 30, right: 20 }
    },
    {
      id: 'focus-center',
      name: '中央フォーカス',
      icon: Maximize2,
      description: '20% - 60% - 20%',
      sizes: { left: 20, center: 60, right: 20 }
    },
    {
      id: 'focus-right',
      name: '右フォーカス',
      icon: Minimize2,
      description: '20% - 30% - 50%',
      sizes: { left: 20, center: 30, right: 50 }
    }
  ]

  return (
    <div className="relative">
      {/* トリガーボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          p-2 rounded-lg transition-colors
          ${resolvedTheme === 'dark' 
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }
        `}
        title="パネルサイズ設定"
      >
        <Settings size={16} />
      </button>

      {/* 設定パネル */}
      {isOpen && (
        <div
          className={`
            absolute top-12 right-0 z-50 w-80 p-4 rounded-lg shadow-lg border
            ${resolvedTheme === 'dark' 
              ? 'bg-gray-800 border-gray-700 text-gray-100' 
              : 'bg-white border-gray-200 text-gray-900'
            }
          `}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">パネルサイズ設定</h3>
            <button
              onClick={() => setIsOpen(false)}
              className={`
                p-1 rounded transition-colors
                ${resolvedTheme === 'dark' 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
                }
              `}
            >
              ×
            </button>
          </div>

          {/* 現在のサイズ表示 */}
          <div className="mb-4">
            <h4 className="text-xs font-medium mb-2">現在のサイズ</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>左パネル:</span>
                <span className={`font-mono ${sizeStatus.leftPanel.isMinimum ? 'text-orange-500' : ''}`}>
                  {Math.round(panelSizes.leftPanel)}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span>中央パネル:</span>
                <span className={`font-mono ${sizeStatus.centerPanel.isMinimum ? 'text-orange-500' : ''}`}>
                  {Math.round(panelSizes.centerPanel)}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span>右パネル:</span>
                <span className={`font-mono ${sizeStatus.rightPanel.isMinimum ? 'text-orange-500' : ''}`}>
                  {Math.round(panelSizes.rightPanel)}%
                </span>
              </div>
            </div>
          </div>

          {/* プリセット */}
          <div className="mb-4">
            <h4 className="text-xs font-medium mb-2">プリセット</h4>
            <div className="space-y-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id as any)}
                  className={`
                    w-full p-2 rounded-lg text-left transition-colors
                    ${resolvedTheme === 'dark' 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-gray-50 hover:bg-gray-100'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <preset.icon size={14} />
                    <div className="flex-1">
                      <div className="text-xs font-medium">{preset.name}</div>
                      <div className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {preset.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* リセットボタン */}
          <button
            onClick={resetToDefault}
            className={`
              w-full p-2 rounded-lg transition-colors flex items-center justify-center space-x-2
              ${resolvedTheme === 'dark' 
                ? 'bg-blue-900/20 hover:bg-blue-900/30 text-blue-400' 
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
              }
            `}
          >
            <RotateCcw size={14} />
            <span className="text-xs">デフォルトに戻す</span>
          </button>

          {/* 使用方法 */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-medium mb-2">使用方法</h4>
            <div className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>パネル間の境界線をドラッグしてサイズを調整できます。</p>
              <p className="mt-1">最小サイズ: 20%、最大サイズ: 60%</p>
            </div>
          </div>

          {/* 警告メッセージ */}
          {!sizeStatus.isValid && (
            <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="text-xs text-orange-700 dark:text-orange-300">
                パネルサイズに制約があります。調整してください。
              </div>
            </div>
          )}
        </div>
      )}

      {/* 背景クリックで閉じる */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}