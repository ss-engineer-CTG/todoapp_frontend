import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { Star, Clock, Edit, Trash2, Plus } from 'lucide-react'
import { useGoals } from '../hooks/useGoals'
import { useSelection } from '../hooks/useSelection'
import { useLearningSession } from '../hooks/useLearningSession'
import { GoalEditModal } from './modals/GoalEditModal'
import { Goal, LearningCategory, ColorVariant, LEARNING_CATEGORIES, getCurrentMonthString, formatMonthString } from '../types'
import { formatDateString } from '../utils/timeUtils'
import { initializeStorage } from '../utils/storage'

export const LeftPanel: React.FC = () => {
  const { theme } = useTheme()
  const { 
    goals, 
    loading: goalsLoading, 
    addGoal, 
    updateGoal, 
    deleteGoal,
    createMonthlyGoal,
    getCurrentMonthGoals,
    updateMonthlyProgress
  } = useGoals()
  const { selection, getSelectableProps } = useSelection()
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
  
  // モーダル状態
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'monthly'>('create')
  
  // 月次目標関連状態
  const [monthlyGoals, setMonthlyGoals] = useState<Goal[]>([])
  const [currentMonth] = useState(getCurrentMonthString())

  // 初期化
  useEffect(() => {
    initializeStorage()
  }, [])
  
  // 月次目標のロード
  useEffect(() => {
    const loadMonthlyGoals = () => {
      const currentMonthGoals = getCurrentMonthGoals()
      setMonthlyGoals(currentMonthGoals)
    }
    
    loadMonthlyGoals()
  }, [goals, getCurrentMonthGoals])

  // 目標を削除
  const handleDeleteGoal = useCallback(async (goalId: string) => {
    if (window.confirm('この目標を削除してもよろしいですか？')) {
      try {
        await deleteGoal(goalId)
      } catch (error) {
        // エラーハンドリング（サイレント）
      }
    }
  }, [deleteGoal])

  // 削除イベントの処理
  useEffect(() => {
    const handleDeleteSelected = (event: CustomEvent) => {
      const { type, id } = event.detail
      if (type === 'goal' && id) {
        handleDeleteGoal(id)
      }
    }

    window.addEventListener('deleteSelected', handleDeleteSelected as EventListener)
    return () => {
      window.removeEventListener('deleteSelected', handleDeleteSelected as EventListener)
    }
  }, [handleDeleteGoal])
  
  // 月次目標作成
  const handleCreateMonthlyGoal = () => {
    setEditingGoal(null)
    setModalMode('monthly')
    setIsGoalModalOpen(true)
  }
  
  // 月次目標の進捗更新
  const handleUpdateProgress = async (goalId: string, progress: number) => {
    try {
      await updateMonthlyProgress(goalId, progress)
      const updatedMonthlyGoals = getCurrentMonthGoals()
      setMonthlyGoals(updatedMonthlyGoals)
    } catch (error) {
      // エラーハンドリング（サイレント）
    }
  }

  // 目標の色クラスを取得
  const getGoalColorClasses = (goal: Goal) => {
    const colorMap = {
      blue: theme === 'dark' ? 'bg-blue-900/20 border-blue-800 text-blue-100' : 'bg-blue-50 border-blue-200 text-blue-900',
      green: theme === 'dark' ? 'bg-green-900/20 border-green-800 text-green-100' : 'bg-green-50 border-green-200 text-green-900',
      purple: theme === 'dark' ? 'bg-purple-900/20 border-purple-800 text-purple-100' : 'bg-purple-50 border-purple-200 text-purple-900',
      orange: theme === 'dark' ? 'bg-orange-900/20 border-orange-800 text-orange-100' : 'bg-orange-50 border-orange-200 text-orange-900',
      teal: theme === 'dark' ? 'bg-teal-900/20 border-teal-800 text-teal-100' : 'bg-teal-50 border-teal-200 text-teal-900',
      rose: theme === 'dark' ? 'bg-rose-900/20 border-rose-800 text-rose-100' : 'bg-rose-50 border-rose-200 text-rose-900'
    }
    return colorMap[goal.color] || colorMap.blue
  }

  // 目標の説明文の色クラスを取得
  const getGoalDescriptionColorClasses = (goal: Goal) => {
    const colorMap = {
      blue: theme === 'dark' ? 'text-blue-300' : 'text-blue-700',
      green: theme === 'dark' ? 'text-green-300' : 'text-green-700',
      purple: theme === 'dark' ? 'text-purple-300' : 'text-purple-700',
      orange: theme === 'dark' ? 'text-orange-300' : 'text-orange-700',
      teal: theme === 'dark' ? 'text-teal-300' : 'text-teal-700',
      rose: theme === 'dark' ? 'text-rose-300' : 'text-rose-700'
    }
    return colorMap[goal.color] || colorMap.blue
  }
  
  // 月次目標の進捗バーコンポーネント
  const MonthlyGoalProgressBar = ({ goal }: { goal: Goal }) => {
    const progress = goal.monthlyProgress || 0
    
    return (
      <div className="mt-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">進捗</span>
          <span className="text-xs font-medium">{progress}%</span>
        </div>
        <div className={`w-full h-2 rounded-full ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
        }`}>
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              goal.color === 'blue' ? 'bg-blue-500' :
              goal.color === 'green' ? 'bg-green-500' :
              goal.color === 'purple' ? 'bg-purple-500' :
              goal.color === 'orange' ? 'bg-orange-500' :
              goal.color === 'teal' ? 'bg-teal-500' :
              'bg-rose-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <button 
            onClick={() => handleUpdateProgress(goal.id, Math.max(0, progress - 10))}
            className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            disabled={progress <= 0}
          >
            -10%
          </button>
          <button 
            onClick={() => handleUpdateProgress(goal.id, Math.min(100, progress + 10))}
            className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            disabled={progress >= 100}
          >
            +10%
          </button>
        </div>
      </div>
    )
  }

  // 新しい目標を追加
  const handleAddGoal = () => {
    setEditingGoal(null)
    setModalMode('create')
    setIsGoalModalOpen(true)
  }

  // 目標を編集
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setModalMode('edit')
    setIsGoalModalOpen(true)
  }

  // 目標の保存
  const handleSaveGoal = async (goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addGoal(goalData.title, goalData.description, goalData.color, goalData.tagIds, goalData.category)
      setIsGoalModalOpen(false)
    } catch (error) {
      // エラーハンドリング（サイレント）
    }
  }

  // 月次目標の保存
  const handleSaveMonthlyGoal = async (title: string, description: string, color: ColorVariant, targetMonth?: string) => {
    try {
      await createMonthlyGoal(title, description, color, targetMonth)
      const updatedMonthlyGoals = getCurrentMonthGoals()
      setMonthlyGoals(updatedMonthlyGoals)
      setIsGoalModalOpen(false)
    } catch (error) {
      // エラーハンドリング（サイレント）
    }
  }

  // 目標の更新
  const handleUpdateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      await updateGoal(goalId, updates)
      setIsGoalModalOpen(false)
    } catch (error) {
      // エラーハンドリング（サイレント）
    }
  }

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

  if (goalsLoading || sessionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 今月の目標セクション */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-lg font-semibold flex items-center ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            🗓️ 今月の目標
          </h2>
          <button
            onClick={handleCreateMonthlyGoal}
            className={`p-1 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="月次目標を追加"
          >
            <Plus size={16} />
          </button>
        </div>
        
        <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {formatMonthString(currentMonth)}
        </p>
        
        {/* 月次目標リスト */}
        <div className="space-y-3 mb-6">
          {monthlyGoals.length === 0 ? (
            <div className={`text-center py-6 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <p className="text-sm">今月の目標がありません</p>
              <button 
                onClick={handleCreateMonthlyGoal}
                className="text-xs mt-2 px-3 py-1 bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors"
              >
                目標を追加
              </button>
            </div>
          ) : (
            monthlyGoals.map((goal) => (
              <div
                key={goal.id}
                {...getSelectableProps(goal.id, 'goal')}
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ease-in-out hover:bg-opacity-80 hover:scale-[1.01] ${
                  getGoalColorClasses(goal)
                } ${getSelectableProps(goal.id, 'goal').className}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">
                      {goal.title}
                    </h3>
                    <p className={`text-xs mt-1 ${getGoalDescriptionColorClasses(goal)}`}>
                      {goal.description}
                    </p>
                    <MonthlyGoalProgressBar goal={goal} />
                  </div>
                  
                  {/* 選択された目標のアクションボタン */}
                  {selection.selectedGoalId === goal.id && (
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditGoal(goal)
                        }}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                        title="編集"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteGoal(goal.id)
                        }}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                        title="削除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* 既存の目標セクション */}
      <div className="mb-6">
        <h2 className={`text-lg font-semibold mb-2 flex items-center ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
          <Star className="mr-2" size={20} />
          目標
        </h2>
        <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {formatDateString(new Date()).split(' ')[0]}
        </p>
        
        {/* 目標リスト */}
        <div className="space-y-3">
          {goals.map((goal) => (
            <div
              key={goal.id}
              {...getSelectableProps(goal.id, 'goal')}
              className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ease-in-out hover:bg-opacity-80 hover:scale-[1.01] ${
                getGoalColorClasses(goal)
              } ${getSelectableProps(goal.id, 'goal').className}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium">
                    {goal.title}
                  </h3>
                  <p className={`text-sm mt-1 ${getGoalDescriptionColorClasses(goal)}`}>
                    {goal.description}
                  </p>
                </div>
                
                {/* 目標が選択されている場合のアクションボタン */}
                {selection.selectedGoalId === goal.id && (
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditGoal(goal)
                      }}
                      className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                      title="編集"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteGoal(goal.id)
                      }}
                      className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-red-600"
                      title="削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* 新しい目標追加 */}
        <button 
          onClick={handleAddGoal}
          className={`w-full mt-4 p-2 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center space-x-2 ${
            theme === 'dark' 
              ? 'border-gray-600 text-gray-400 hover:border-gray-500' 
              : 'border-gray-300 text-gray-500 hover:border-gray-400'
          }`}
        >
          <Plus size={16} />
          <span>新しい目標を追加</span>
        </button>
      </div>
      
      {/* 学習時間トラッキング */}
      <div className={`p-4 rounded-lg border ${
        theme === 'dark' 
          ? 'bg-blue-900/20 border-blue-800' 
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
      }`}>
        <h3 className={`text-md font-semibold mb-3 flex items-center ${
          theme === 'dark' ? 'text-blue-100' : 'text-blue-900'
        }`}>
          <Clock className="mr-2" size={18} />
          学習時間トラッキング
        </h3>
        
        {/* 現在のセッション状態 */}
        <div className={`mb-4 p-3 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-blue-700' 
            : 'bg-white border-blue-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              現在のセッション
            </span>
            <span className={`text-lg font-bold ${
              sessionState.isActive ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {formattedTimes.currentSession}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              今日の累計
            </span>
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
              {formattedTimes.todayTotal}
            </span>
          </div>
        </div>
        
        {/* カテゴリ選択と制御ボタン */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              カテゴリ:
            </label>
            <select 
              value={sessionState.currentCategory}
              onChange={handleCategoryChange}
              className={`flex-1 px-3 py-1 text-sm border rounded-md ${
                theme === 'dark' 
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
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <h4 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            今日のカテゴリ別時間
          </h4>
          <div className="space-y-1 text-sm">
            {Object.entries(formattedTimes.categoryTotals).map(([category, time]) => {
              const categoryInfo = LEARNING_CATEGORIES.find(c => c.value === category)
              return (
                <div key={category} className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {categoryInfo?.label || category}
                  </span>
                  <span className="font-medium">{time}</span>
                </div>
              )
            })}
            {Object.keys(formattedTimes.categoryTotals).length === 0 && (
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                今日はまだ学習時間がありません
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 目標編集モーダル */}
      <GoalEditModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleSaveGoal}
        onSaveMonthly={handleSaveMonthlyGoal}
        onUpdate={handleUpdateGoal}
        goal={editingGoal}
        mode={modalMode}
      />
    </div>
  )
}