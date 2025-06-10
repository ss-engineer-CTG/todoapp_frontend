// システムプロンプト準拠：タイムライン制御UI分離コンポーネント
// KISS原則：制御部分のみ分離、DRY原則：既存UIコンポーネント活用

import React from 'react'
import {
  Factory, Sun, Moon, Filter, ZoomIn, ZoomOut, RotateCw, 
  Maximize2, Minimize2, ChevronLeft, ChevronRight
} from 'lucide-react'
import { TimelineControlsProps } from '../types'
import { ZOOM_CONFIG } from '../utils/timelineUtils'

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  zoomLevel,
  onZoomChange,
  viewUnit,
  onViewUnitChange,
  theme,
  onThemeToggle,
  onTodayClick,
  onExpandAll,
  onCollapseAll,
  onFitToScreen
}) => {
  const handleZoom = (newLevel: number) => {
    const clampedLevel = Math.max(ZOOM_CONFIG.min, Math.min(ZOOM_CONFIG.max, newLevel))
    onZoomChange(clampedLevel)
  }

  const zoomIn = () => handleZoom(zoomLevel + ZOOM_CONFIG.step)
  const zoomOut = () => handleZoom(zoomLevel - ZOOM_CONFIG.step)
  const resetZoom = () => handleZoom(ZOOM_CONFIG.default)

  // テーマに基づくクラス
  const getControlClasses = () => {
    return theme === 'dark' 
      ? {
          header: "bg-gray-900 border-gray-600",
          control: "bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-500",
          active: "bg-indigo-800 text-indigo-100 border-indigo-600"
        }
      : {
          header: "bg-white border-gray-300",
          control: "bg-white hover:bg-gray-50 text-gray-800 border-gray-400",
          active: "bg-indigo-100 text-indigo-800 border-indigo-300"
        }
  }

  const classes = getControlClasses()

  return (
    <div className="flex flex-col">
      {/* アプリヘッダー */}
      <header className={`${classes.header} border-b py-2 px-4 flex items-center justify-between`}>
        <div className="flex items-center">
          <Factory size={20} className="mr-2 text-indigo-600" />
          <h1 className="text-lg font-medium">製造プロジェクト ガントチャート</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 一括展開・折り畳みボタン */}
          <div className="flex items-center space-x-1 mr-4">
            <button 
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={onExpandAll}
              title="全て展開"
              aria-label="全て展開"
            >
              <Maximize2 size={18} />
            </button>
            <button 
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={onCollapseAll}
              title="全て折り畳み"
              aria-label="全て折り畳み"
            >
              <Minimize2 size={18} />
            </button>
          </div>

          {/* ズームコントロール */}
          <div className="flex items-center space-x-2 mr-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button 
              className="p-1 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              onClick={zoomOut}
              disabled={zoomLevel <= ZOOM_CONFIG.min}
              title="縮小"
              aria-label="縮小"
            >
              <ZoomOut size={16} />
            </button>
            
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min={ZOOM_CONFIG.min}
                max={ZOOM_CONFIG.max}
                step={ZOOM_CONFIG.step}
                value={zoomLevel}
                onChange={(e) => handleZoom(parseInt(e.target.value))}
                className="w-20 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
                title={`ズーム: ${zoomLevel}%`}
              />
              <span className="text-xs font-medium min-w-[2.5rem] text-center text-gray-600 dark:text-gray-400">
                {zoomLevel}%
              </span>
            </div>
            
            <button 
              className="p-1 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              onClick={zoomIn}
              disabled={zoomLevel >= ZOOM_CONFIG.max}
              title="拡大"
              aria-label="拡大"
            >
              <ZoomIn size={16} />
            </button>
            
            <button 
              className="p-1 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={resetZoom}
              title="リセット (100%)"
              aria-label="ズームリセット"
            >
              <RotateCw size={14} />
            </button>
            
            <button 
              className="p-1 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={onFitToScreen}
              title="画面にフィット"
              aria-label="画面にフィット"
            >
              <Maximize2 size={14} />
            </button>
          </div>

          {/* テーマ切替 */}
          <button 
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onThemeToggle}
            aria-label={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {/* フィルター */}
          <button 
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="フィルター"
          >
            <Filter size={18} />
          </button>
        </div>
      </header>
      
      {/* タイムラインコントロール */}
      <div className={`${classes.header} border-b px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center space-x-4">
          {/* 時間軸単位選択 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">表示単位:</span>
            {[
              { key: 'day' as const, label: '日表示', desc: '1年間 詳細表示' },
              { key: 'week' as const, label: '週表示', desc: '1年間 中期計画' }
            ].map((unit) => (
              <button
                key={unit.key}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewUnit === unit.key 
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => onViewUnitChange(unit.key)}
                title={unit.desc}
              >
                {unit.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 表示密度情報 */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {viewUnit === 'day' ? '日表示' : '週表示'} | {zoomLevel}%表示
          </div>
          
          {/* 期間ナビゲーション */}
          <div className={`flex items-center border ${classes.control} rounded-md overflow-hidden`}>
            <button 
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="前の期間へ"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              className={`px-3 py-1 text-sm border-l border-r ${classes.control}`}
              onClick={onTodayClick}
              title="今日の位置にスクロール"
            >
              今日
            </button>
            <button 
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="次の期間へ"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}