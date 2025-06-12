// システムプロンプト準拠：アプリレベルヘッダーコンポーネント（画面幅対応版）
// KISS原則：シンプルな幅指定で画面サイズ対応

import React from 'react'
import {
  Factory, Sun, Moon, Filter,
  Maximize2, Minimize2
} from 'lucide-react'
import { AppHeaderProps } from '../types'

export const AppHeader: React.FC<AppHeaderProps> = ({
  theme,
  onThemeToggle,
  onExpandAll,
  onCollapseAll
}) => {
  // テーマに基づくクラス
  const getControlClasses = () => {
    return theme === 'dark' 
      ? {
          header: "bg-gray-900 border-gray-600",
          control: "bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-500"
        }
      : {
          header: "bg-white border-gray-300",
          control: "bg-white hover:bg-gray-50 text-gray-800 border-gray-400"
        }
  }

  const classes = getControlClasses()

  return (
    <header 
      className={`${classes.header} border-b py-2 px-4 flex items-center justify-between sticky top-0 z-50 w-full min-w-0`}
    >
      <div className="flex items-center min-w-0 flex-shrink-0">
        <Factory size={20} className="mr-2 text-indigo-600 flex-shrink-0" />
        <h1 className="text-lg font-medium truncate">製造プロジェクト ガントチャート</h1>
      </div>
      
      <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
        {/* 一括展開・折り畳みボタン */}
        <div className="hidden sm:flex items-center space-x-1 mr-4">
          <button 
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={onExpandAll}
            title="全て展開"
            aria-label="全て展開"
          >
            <Maximize2 size={18} />
          </button>
          <button 
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={onCollapseAll}
            title="全て折り畳み"
            aria-label="全て折り畳み"
          >
            <Minimize2 size={18} />
          </button>
        </div>

        {/* コンパクト版（モバイル表示） */}
        <div className="flex sm:hidden items-center space-x-1 mr-2">
          <button 
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={onExpandAll}
            title="全て展開"
            aria-label="全て展開"
          >
            <Maximize2 size={16} />
          </button>
          <button 
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={onCollapseAll}
            title="全て折り畳み"
            aria-label="全て折り畳み"
          >
            <Minimize2 size={16} />
          </button>
        </div>

        {/* テーマ切替 */}
        <button 
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          onClick={onThemeToggle}
          aria-label={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        
        {/* フィルター */}
        <button 
          className="hidden md:block p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          aria-label="フィルター"
        >
          <Filter size={18} />
        </button>
      </div>
    </header>
  )
}