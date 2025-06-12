// システムプロンプト準拠：ヘッダー分離コンポーネント
// KISS原則：シンプルなヘッダー実装、DRY原則：設定値による一元管理

import React, { useMemo } from 'react'
import { 
  Factory, Sun, Moon, Filter, ZoomIn, ZoomOut, RotateCw, 
  Maximize2, Minimize2, ChevronLeft, ChevronRight 
} from 'lucide-react'
import { TIMELINE_CONFIG, getDisplayLevel } from '@core/config/timeline'
import { generateTimelineClasses } from '@core/utils/layout'

// Props型定義
interface TimelineHeaderProps {
  // ズーム制御
  zoomLevel: number
  onZoomChange: (level: number) => void
  
  // 表示制御
  viewUnit: 'day' | 'week'
  onViewUnitChange: (unit: 'day' | 'week') => void
  
  // テーマ制御
  theme: 'light' | 'dark'
  onThemeToggle: () => void
  
  // ナビゲーション
  onTodayClick: () => void
  onPreviousPeriod?: () => void
  onNextPeriod?: () => void
  
  // 表示制御
  onExpandAll: () => void
  onCollapseAll: () => void
  onFitToScreen: () => void
  
  // 追加機能
  className?: string
  style?: React.CSSProperties
}

/**
 * タイムラインヘッダーコンポーネント
 * システムプロンプト準拠：ヘッダー機能の分離・簡素化
 */
export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  zoomLevel,
  onZoomChange,
  viewUnit,
  onViewUnitChange,
  theme,
  onThemeToggle,
  onTodayClick,
  onPreviousPeriod,
  onNextPeriod,
  onExpandAll,
  onCollapseAll,
  onFitToScreen,
  className,
  style
}) => {

  // ズーム制御関数
  const handleZoom = (newLevel: number) => {
    const clampedLevel = Math.max(
      TIMELINE_CONFIG.ZOOM.MIN, 
      Math.min(TIMELINE_CONFIG.ZOOM.MAX, newLevel)
    )
    onZoomChange(clampedLevel)
  }

  const zoomIn = () => handleZoom(zoomLevel + TIMELINE_CONFIG.ZOOM.STEP)
  const zoomOut = () => handleZoom(zoomLevel - TIMELINE_CONFIG.ZOOM.STEP)
  const resetZoom = () => handleZoom(TIMELINE_CONFIG.ZOOM.DEFAULT)

  // 表示レベル取得
  const displayLevel = useMemo(() => getDisplayLevel(zoomLevel), [zoomLevel])

  // テーマに基づくスタイルクラス
  const getThemeClasses = () => {
    return theme === 'dark' 
      ? {
          header: "bg-gray-900 border-gray-600 text-white",
          control: "bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-500",
          active: "bg-indigo-800 text-indigo-100 border-indigo-600",
          secondary: "bg-gray-700 hover:bg-gray-600"
        }
      : {
          header: "bg-white border-gray-300 text-gray-900",
          control: "bg-white hover:bg-gray-50 text-gray-800 border-gray-400",
          active: "bg-indigo-100 text-indigo-800 border-indigo-300",
          secondary: "bg-gray-100 hover:bg-gray-200"
        }
  }

  const themeClasses = getThemeClasses()

  // ヘッダークラス名生成
  const headerClassName = generateTimelineClasses(
    TIMELINE_CONFIG.CSS_CLASSES.HEADER,
    [className || ''].filter(Boolean)
  )

  return (
    <div 
      className={`${headerClassName} ${themeClasses.header} border-b-2 shadow-sm`}
      style={{
        height: `${TIMELINE_CONFIG.LAYOUT.HEADER_HEIGHT}px`,
        gridArea: 'header',
        ...style
      }}
    >
      {/* アプリケーションヘッダー行 */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center">
          <Factory size={20} className="mr-2 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-lg font-semibold">製造プロジェクト ガントチャート</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 一括操作ボタン */}
          <div className="flex items-center space-x-1 mr-4">
            <button 
              className={`p-1.5 rounded-md transition-colors duration-150 ${themeClasses.secondary}`}
              onClick={onExpandAll}
              title="全て展開"
              aria-label="全プロジェクト・タスクを展開"
            >
              <Maximize2 size={16} />
            </button>
            <button 
              className={`p-1.5 rounded-md transition-colors duration-150 ${themeClasses.secondary}`}
              onClick={onCollapseAll}
              title="全て折り畳み"
              aria-label="全プロジェクト・タスクを折り畳み"
            >
              <Minimize2 size={16} />
            </button>
          </div>

          {/* テーマ切り替え */}
          <button 
            className={`p-1.5 rounded-md transition-colors duration-150 ${themeClasses.secondary}`}
            onClick={onThemeToggle}
            title={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            aria-label={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          
          {/* フィルターボタン */}
          <button 
            className={`p-1.5 rounded-md transition-colors duration-150 ${themeClasses.secondary}`}
            title="フィルター"
            aria-label="表示フィルター"
          >
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* コントロールヘッダー行 */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-4">
          {/* 表示単位選択 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground mr-2">表示単位:</span>
            {[
              { key: 'day' as const, label: '日', desc: '日単位の詳細表示' },
              { key: 'week' as const, label: '週', desc: '週単位の中期計画表示' }
            ].map((unit) => (
              <button
                key={unit.key}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-150 ${
                  viewUnit === unit.key 
                    ? themeClasses.active
                    : themeClasses.control
                }`}
                onClick={() => onViewUnitChange(unit.key)}
                title={unit.desc}
                aria-pressed={viewUnit === unit.key}
              >
                {unit.label}
              </button>
            ))}
          </div>

          {/* ズーム制御 */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg border ${themeClasses.control}`}>
            <button 
              className={`p-1 rounded-md transition-colors duration-150 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50`}
              onClick={zoomOut}
              disabled={zoomLevel <= TIMELINE_CONFIG.ZOOM.MIN}
              title="縮小"
              aria-label="ズームアウト"
            >
              <ZoomOut size={14} />
            </button>
            
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min={TIMELINE_CONFIG.ZOOM.MIN}
                max={TIMELINE_CONFIG.ZOOM.MAX}
                step={TIMELINE_CONFIG.ZOOM.STEP}
                value={zoomLevel}
                onChange={(e) => handleZoom(parseInt(e.target.value))}
                className="w-20 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
                title={`ズーム: ${zoomLevel}%`}
                aria-label={`ズームレベル ${zoomLevel}%`}
              />
              <span className="text-xs font-medium min-w-[2.5rem] text-center text-muted-foreground">
                {zoomLevel}%
              </span>
            </div>
            
            <button 
              className={`p-1 rounded-md transition-colors duration-150 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50`}
              onClick={zoomIn}
              disabled={zoomLevel >= TIMELINE_CONFIG.ZOOM.MAX}
              title="拡大"
              aria-label="ズームイン"
            >
              <ZoomIn size={14} />
            </button>
            
            <button 
              className={`p-1 rounded-md transition-colors duration-150 hover:bg-gray-200 dark:hover:bg-gray-600`}
              onClick={resetZoom}
              title="リセット (100%)"
              aria-label="ズームリセット"
            >
              <RotateCw size={12} />
            </button>
            
            <button 
              className={`p-1 rounded-md transition-colors duration-150 hover:bg-gray-200 dark:hover:bg-gray-600`}
              onClick={onFitToScreen}
              title="画面にフィット"
              aria-label="画面にフィット"
            >
              <Maximize2 size={12} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 表示情報 */}
          <div className={`text-xs px-2 py-1 rounded-md ${themeClasses.secondary}`}>
            {viewUnit === 'day' ? '日表示' : '週表示'} | {zoomLevel}% | {displayLevel}
          </div>
          
          {/* 期間ナビゲーション */}
          <div className={`flex items-center border rounded-md overflow-hidden ${themeClasses.control}`}>
            {onPreviousPeriod && (
              <button 
                className={`p-1.5 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700`}
                onClick={onPreviousPeriod}
                title="前の期間へ"
                aria-label="前の期間へ移動"
              >
                <ChevronLeft size={14} />
              </button>
            )}
            
            <button 
              className={`px-3 py-1 text-sm border-l border-r font-medium transition-colors duration-150 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 ${themeClasses.control}`}
              onClick={onTodayClick}
              title="今日の位置にスクロール"
              aria-label="今日の位置にスクロール"
            >
              今日
            </button>
            
            {onNextPeriod && (
              <button 
                className={`p-1.5 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700`}
                onClick={onNextPeriod}
                title="次の期間へ"
                aria-label="次の期間へ移動"
              >
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimelineHeader
