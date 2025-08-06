import React, { useState } from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { Clock } from 'lucide-react'
import { useLearningSession } from '../hooks/useLearningSession'
import { TagSelector } from './TagSelector'
import { tagStorage } from '../utils/tagStorage'

export const LeftPanel: React.FC = () => {
  const { resolvedTheme } = useTheme()
  const { 
    sessionState, 
    loading: sessionLoading, 
    startLearning, 
    pauseLearning, 
    resumeLearning, 
    stopLearning, 
    changeTags, 
    getFormattedTimes 
  } = useLearningSession()

  // タグシステム用の状態管理
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(() => {
    return sessionState.currentSession?.tagIds || []
  })

  // 学習開始
  const handleStartLearning = async () => {
    try {
      if (selectedTagIds.length === 0) {
        // タグが選択されていない場合はエラー
        return
      }
      await startLearning(selectedTagIds)
    } catch (error) {
      // エラーハンドリング（サイレント）
    }
  }

  // 学習一時停止
  const handlePauseLearning = async () => {
    try {
      await pauseLearning()
    } catch (error) {
      // エラーハンドリング（サイレント）
    }
  }

  // 学習再開
  const handleResumeLearning = async () => {
    try {
      await resumeLearning()
    } catch (error) {
      // エラーハンドリング（サイレント）
    }
  }

  // 学習終了
  const handleStopLearning = async () => {
    try {
      await stopLearning()
    } catch (error) {
      // エラーハンドリング（サイレント）
    }
  }

  // タグ変更
  const handleTagsChange = async (tagIds: string[]) => {
    setSelectedTagIds(tagIds)
    if (sessionState.currentSession) {
      await changeTags(tagIds)
    }
  }

  // ボタンの状態を取得
  const getButtonStates = () => {
    const { isActive, isPaused } = sessionState
    const hasSelectedTags = selectedTagIds.length > 0
    
    return {
      canStart: (!isActive || isPaused) && hasSelectedTags,
      canPause: isActive && !isPaused,
      canStop: isActive,
      startText: isPaused ? '▶️ 再開' : '▶️ 学習開始',
      startAction: isPaused ? handleResumeLearning : handleStartLearning
    }
  }

  const buttonStates = getButtonStates()
  const formattedTimes = getFormattedTimes()

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-16">
      {/* 学習時間トラッキング */}
      <div className={`p-4 rounded-lg border ${
        resolvedTheme === 'dark' 
          ? 'bg-blue-900/20 border-blue-800' 
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
      }`}>
        <h3 className={`text-md font-semibold mb-3 flex items-center ${
          resolvedTheme === 'dark' ? 'text-blue-100' : 'text-blue-900'
        }`}>
          <Clock className="mr-2" size={18} />
          学習時間トラッキング
        </h3>
        
        {/* 現在のセッション状態 */}
        <div className={`mb-4 p-3 rounded-lg border ${
          resolvedTheme === 'dark' 
            ? 'bg-gray-800 border-blue-700' 
            : 'bg-white border-blue-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              現在のセッション
            </span>
            <span className={`text-lg font-bold ${
              sessionState.isActive ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {formattedTimes.currentSession}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              今日の累計
            </span>
            <span className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
              {formattedTimes.todayTotal}
            </span>
          </div>
        </div>
        
        {/* タグ選択と制御ボタン */}
        <div className="space-y-3">
          <div className="space-y-2">
            <label className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              学習タグ:
            </label>
            <TagSelector
              selectedTagIds={selectedTagIds}
              onTagsChange={handleTagsChange}
              placeholder="学習内容のタグを選択..."
              maxTags={3}
            />
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={buttonStates.startAction}
              disabled={!buttonStates.canStart}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
                buttonStates.canStart 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              {buttonStates.startText}
            </button>
            <button 
              onClick={handlePauseLearning}
              disabled={!buttonStates.canPause}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
                buttonStates.canPause 
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              ⏸️ 一時停止
            </button>
            <button 
              onClick={handleStopLearning}
              disabled={!buttonStates.canStop}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
                buttonStates.canStop 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              ⏹️ 終了
            </button>
          </div>
        </div>
        
        {/* 今日のタグ別学習時間 */}
        <div className={`mt-4 p-3 rounded-lg ${
          resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <h4 className={`text-sm font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            今日のタグ別時間
          </h4>
          <div className="space-y-1 text-sm">
            {Object.entries(formattedTimes.tagTotals || {}).map(([tagId, time]) => {
              if (tagId === 'untagged') {
                return (
                  <div key={tagId} className="flex justify-between">
                    <span className={resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      未分類
                    </span>
                    <span className="font-medium">{time}</span>
                  </div>
                )
              }
              
              const tag = tagStorage.getTag(tagId)
              if (!tag) return null
              
              // タグの色クラスを取得（TagSelectorと同じ関数を使用）
              const getTagColorClass = (color: string) => {
                const colorMap = {
                  blue: 'bg-blue-100 text-blue-800 border-blue-200',
                  green: 'bg-green-100 text-green-800 border-green-200',
                  purple: 'bg-purple-100 text-purple-800 border-purple-200',
                  orange: 'bg-orange-100 text-orange-800 border-orange-200',
                  teal: 'bg-teal-100 text-teal-800 border-teal-200',
                  rose: 'bg-rose-100 text-rose-800 border-rose-200'
                }
                
                if (resolvedTheme === 'dark') {
                  const darkColorMap = {
                    blue: 'bg-blue-900/50 text-blue-200 border-blue-700',
                    green: 'bg-green-900/50 text-green-200 border-green-700',
                    purple: 'bg-purple-900/50 text-purple-200 border-purple-700',
                    orange: 'bg-orange-900/50 text-orange-200 border-orange-700',
                    teal: 'bg-teal-900/50 text-teal-200 border-teal-700',
                    rose: 'bg-rose-900/50 text-rose-200 border-rose-700'
                  }
                  return darkColorMap[color as keyof typeof darkColorMap] || darkColorMap.blue
                }
                
                return colorMap[color as keyof typeof colorMap] || colorMap.blue
              }
              
              return (
                <div key={tagId} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border mr-2 ${getTagColorClass(tag.color)}`}>
                      {tag.emoji && <span className="mr-1">{tag.emoji}</span>}
                      {tag.name}
                    </span>
                  </div>
                  <span className="font-medium">{time}</span>
                </div>
              )
            })}
            {Object.keys(formattedTimes.tagTotals || {}).length === 0 && (
              <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                今日はまだ学習時間がありません
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}