import React from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { Clock } from 'lucide-react'
import { useLearningSession } from '../hooks/useLearningSession'
import { LearningCategory, LEARNING_CATEGORIES } from '../types'

export const LeftPanel: React.FC = () => {
  const { resolvedTheme } = useTheme()
  const { 
    sessionState, 
    loading: sessionLoading, 
    startLearning, 
    pauseLearning, 
    resumeLearning, 
    stopLearning, 
    changeCategory, 
    getFormattedTimes 
  } = useLearningSession()

  // 学習開始
  const handleStartLearning = async () => {
    try {
      await startLearning(sessionState.currentCategory as LearningCategory)
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

  // カテゴリ変更
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    changeCategory(e.target.value as LearningCategory)
  }

  // ボタンの状態を取得
  const getButtonStates = () => {
    const { isActive, isPaused } = sessionState
    
    return {
      canStart: !isActive || isPaused,
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
    <div className="space-y-6">
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
        
        {/* カテゴリ選択と制御ボタン */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <label className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              カテゴリ:
            </label>
            <select 
              value={sessionState.currentCategory}
              onChange={handleCategoryChange}
              className={`flex-1 px-3 py-1 text-sm border rounded-md ${
                resolvedTheme === 'dark' 
                  ? 'border-gray-600 bg-gray-800 text-gray-200' 
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            >
              {LEARNING_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
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
        
        {/* 今日のカテゴリ別学習時間 */}
        <div className={`mt-4 p-3 rounded-lg ${
          resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <h4 className={`text-sm font-medium mb-2 ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            今日のカテゴリ別時間
          </h4>
          <div className="space-y-1 text-sm">
            {Object.entries(formattedTimes.categoryTotals).map(([category, time]) => {
              const categoryInfo = LEARNING_CATEGORIES.find(c => c.value === category)
              return (
                <div key={category} className="flex justify-between">
                  <span className={resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {categoryInfo?.label || category}
                  </span>
                  <span className="font-medium">{time}</span>
                </div>
              )
            })}
            {Object.keys(formattedTimes.categoryTotals).length === 0 && (
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