// システムプロンプト準拠：タイムライン統合コントロール（テーマ統合版）
// 🔧 修正内容：独自テーマ状態除去・ThemeProvider統合

import React from 'react'
import {
  ZoomIn, ZoomOut, RotateCw, Maximize2, ChevronLeft, ChevronRight,
  Sun, Moon, Minimize2, ArrowLeft, Calendar, Focus, FolderMinus,
  ChevronDown, Factory
} from 'lucide-react'
import { TimelineControlsProps } from '../types'
import { useTheme } from '@core/components/ThemeProvider'
import { ZOOM_CONFIG } from '../utils'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@core/components/ui/dropdown-menu'
import { Button } from '@core/components/ui/button'

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  zoomLevel,
  onZoomChange,
  viewUnit,
  onViewUnitChange,
  onTodayClick,
  onFitToScreen,
  onExpandAll,
  onCollapseAll,
  onCollapseAllParents,
  onViewModeChange,
  // 🆕 プロジェクト選択機能
  projects = [],
  activeProjectId = null,
  onActiveProjectChange
}) => {
  // 🔧 修正：ThemeProviderのテーマを使用
  const { resolvedTheme, setTheme } = useTheme()

  const handleZoom = (newLevel: number) => {
    const clampedLevel = Math.max(ZOOM_CONFIG.min, Math.min(ZOOM_CONFIG.max, newLevel))
    onZoomChange(clampedLevel)
  }

  const zoomIn = () => handleZoom(zoomLevel + ZOOM_CONFIG.step)
  const zoomOut = () => handleZoom(zoomLevel - ZOOM_CONFIG.step)
  const resetZoom = () => handleZoom(ZOOM_CONFIG.default)


  // 🆕 プロジェクト選択ハンドラー
  const handleProjectSelect = (projectId: string | null) => {
    if (onActiveProjectChange) {
      onActiveProjectChange(projectId)
    }
  }

  // アクティブプロジェクトの情報を取得
  const activeProject = activeProjectId ? projects.find(p => p.id === activeProjectId) : null
  const hasProjects = projects.length > 0
  const hasActiveProject = activeProject !== null

  // 🔧 修正：テーマ切り替え関数
  const handleThemeToggle = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  // テーマに基づくクラス
  const getControlClasses = () => {
    return resolvedTheme === 'dark' 
      ? {
          header: "bg-gray-900 border-gray-600",
          control: "bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-500",
          active: "bg-indigo-800 text-indigo-100 border-indigo-600",
          backButton: "bg-blue-700 hover:bg-blue-600 text-white border-blue-500"
        }
      : {
          header: "bg-white border-gray-300",
          control: "bg-white hover:bg-gray-50 text-gray-800 border-gray-400",
          active: "bg-indigo-100 text-indigo-800 border-indigo-300",
          backButton: "bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
        }
  }

  const classes = getControlClasses()

  return (
    <div className="w-full">
      {/* アプリケーションヘッダー */}
      <header className={`${classes.header} border-b py-2 px-4 flex items-center justify-between sticky top-0 z-50 w-full min-w-0`}>
        <div className="flex items-center min-w-0 flex-shrink-0">
          {/* ViewSwitcher統一 */}
          <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              className={`px-2 py-2 text-sm font-medium rounded-none border-r border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors ${
                'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => onViewModeChange && onViewModeChange('tasklist')}
              title="リストビュー (Ctrl+L)"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              className={`px-2 py-2 text-sm font-medium rounded-none border-r border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors ${
                'bg-blue-600 text-white'
              }`}
              title="タイムラインビュー (Ctrl+T)"
            >
              <Calendar size={16} />
            </button>
            <button
              className={`px-2 py-2 text-sm font-medium rounded-none flex items-center justify-center transition-colors ${
                'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => onViewModeChange && onViewModeChange('daily-focus')}
              title="Daily Focus View (Ctrl+F)"
            >
              <Focus size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 flex-shrink-0 ml-4">
          {/* 🆕 プロジェクト選択ドロップダウン */}
          {hasProjects && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`h-8 min-w-0 ${hasActiveProject ? 'border-blue-300 bg-blue-50 dark:bg-blue-950 dark:border-blue-700' : ''}`}
                >
                  <Factory 
                    size={14} 
                    className="mr-1"
                    style={{ color: activeProject?.color || '#6b7280' }}
                  />
                  <span className="hidden sm:inline mr-1">作成対象:</span>
                  <span 
                    className="max-w-24 truncate text-xs sm:text-sm font-medium"
                    style={{ color: activeProject?.color || undefined }}
                  >
                    {activeProject ? activeProject.name : '自動選択'}
                  </span>
                  <ChevronDown size={12} className="ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>タスク作成対象プロジェクト</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => handleProjectSelect(null)}
                  className={`flex items-center gap-2 cursor-pointer ${
                    !activeProjectId ? 'bg-blue-50 dark:bg-blue-950' : ''
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500" />
                  <div className="flex-1">
                    <span>自動選択モード</span>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      選択行からプロジェクトを判定
                    </div>
                  </div>
                  {!activeProjectId && <span className="ml-auto text-xs text-blue-600">✓</span>}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {projects.map(project => (
                  <DropdownMenuItem 
                    key={project.id}
                    onClick={() => handleProjectSelect(project.id)}
                    className={`flex items-center gap-2 cursor-pointer ${
                      activeProjectId === project.id ? 'bg-blue-50 dark:bg-blue-950' : ''
                    }`}
                  >
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="truncate">{project.name}</span>
                    {activeProjectId === project.id && (
                      <span className="ml-auto text-xs text-blue-600">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 一括展開・折り畳みボタン */}
          <div className="hidden sm:flex items-center space-x-1">
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
            {onCollapseAllParents && (
              <button 
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={onCollapseAllParents}
                title="子タスク持ちタスクを一括折り畳み"
                aria-label="子タスク持ちタスクを一括折り畳み"
              >
                <FolderMinus size={18} />
              </button>
            )}
          </div>

          {/* テーマ切替 */}
          <button 
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
            onClick={handleThemeToggle}
            aria-label={resolvedTheme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
          >
            {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* タイムラインコントロール */}
      <div className={`${classes.header} border-b px-4 py-2 flex items-center justify-between sticky top-[57px] z-40 w-full min-w-0`}>
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          {/* 時間軸単位選択 */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-400 mr-2">表示単位:</span>
            <span className="sm:hidden text-xs text-gray-600 dark:text-gray-400 mr-1">単位:</span>
            {[
              { key: 'day' as const, label: '日表示', shortLabel: '日', desc: '1年間 詳細表示' },
              { key: 'week' as const, label: '週表示', shortLabel: '週', desc: '1年間 中期計画' }
            ].map((unit) => (
              <button
                key={unit.key}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors flex-shrink-0 ${
                  viewUnit === unit.key 
                    ? classes.active
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => onViewUnitChange(unit.key)}
                title={unit.desc}
              >
                <span className="hidden sm:inline">{unit.label}</span>
                <span className="sm:hidden">{unit.shortLabel}</span>
              </button>
            ))}
          </div>

          {/* ズームコントロール */}
          <div className="flex items-center space-x-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0">
            <button 
              className="p-1 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              onClick={zoomOut}
              disabled={zoomLevel <= ZOOM_CONFIG.min}
              title="縮小"
              aria-label="縮小"
            >
              <ZoomOut size={16} />
            </button>
            
            <div className="hidden md:flex items-center space-x-2">
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
            
            <div className="md:hidden">
              <span className="text-xs font-medium px-1 text-gray-600 dark:text-gray-400">
                {zoomLevel}%
              </span>
            </div>
            
            <button 
              className="p-1 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              onClick={zoomIn}
              disabled={zoomLevel >= ZOOM_CONFIG.max}
              title="拡大"
              aria-label="拡大"
            >
              <ZoomIn size={16} />
            </button>
            
            <button 
              className="p-1 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={resetZoom}
              title="リセット (100%)"
              aria-label="ズームリセット"
            >
              <RotateCw size={14} />
            </button>
            
            <button 
              className="hidden lg:block p-1 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={onFitToScreen}
              title="画面にフィット"
              aria-label="画面にフィット"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
          {/* 表示密度情報 */}
          <div className="hidden lg:block text-xs text-gray-500 dark:text-gray-400">
            {viewUnit === 'day' ? '日表示' : '週表示'} | {zoomLevel}%表示
          </div>
          
          {/* 期間ナビゲーション */}
          <div className={`flex items-center border ${classes.control} rounded-md overflow-hidden`}>
            <button 
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="前の期間へ"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              className={`px-3 py-1 text-sm border-l border-r ${classes.control} transition-colors`}
              onClick={onTodayClick}
              title="今日の位置にスクロール"
            >
              <span className="hidden sm:inline">今日</span>
              <span className="sm:hidden">今</span>
            </button>
            <button 
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="次の期間へ"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* モバイル用フィットボタン */}
          <button 
            className="lg:hidden p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={onFitToScreen}
            title="画面にフィット"
            aria-label="画面にフィット"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}