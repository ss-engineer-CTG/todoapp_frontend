// システムプロンプト準拠：ビュー切り替えUI分離（リファクタリング：UI責任分離）
// リファクタリング対象：TodoApp.tsx からビュー切り替えボタンのUI処理を抽出

import React, { useEffect } from 'react'
import { AppViewMode } from '@core/types'
import { Calendar, List } from 'lucide-react'

interface ViewSwitcherProps {
  viewMode: AppViewMode
  onViewModeChange: (mode: AppViewMode) => Promise<void>
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  viewMode,
  onViewModeChange
}) => {
  // ===== キーボードショートカット =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault()
        onViewModeChange('timeline')
      } else if (e.ctrlKey && e.key === 'l') {
        e.preventDefault()
        onViewModeChange('tasklist')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onViewModeChange])

  return (
    <div className="absolute top-4 left-4 z-50 flex bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        className={`px-3 py-2 text-sm font-medium rounded-none border-r border-gray-200 dark:border-gray-700 flex items-center space-x-2 transition-colors ${
          viewMode === 'tasklist' 
            ? 'bg-blue-600 text-white' 
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
        onClick={() => onViewModeChange('tasklist')}
        title="リストビュー (Ctrl+L)"
      >
        <List size={16} />
        <span>リスト</span>
      </button>
      <button
        className={`px-3 py-2 text-sm font-medium rounded-none flex items-center space-x-2 transition-colors ${
          viewMode === 'timeline'
            ? 'bg-blue-600 text-white' 
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
        onClick={() => onViewModeChange('timeline')}
        title="タイムラインビュー (Ctrl+T)"
      >
        <Calendar size={16} />
        <span>タイムライン</span>
      </button>
    </div>
  )
}