// 月次目標のレポート・統計表示コンポーネント

import React, { useState } from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { TrendingUp, Target, Clock, Archive, Bell, BarChart3, CheckCircle, PlayCircle } from 'lucide-react'
import { useMonthlyGoalsLifecycle } from '../hooks/useMonthlyGoalsLifecycle'
import { getCurrentMonthString, getNextMonthString, formatMonthString } from '../types'

export const MonthlyGoalsReport: React.FC = () => {
  const { theme } = useTheme()
  const {
    lifecycleState,
    notifications,
    getMonthlyStatistics,
    manuallyArchiveExpiredGoals,
    clearNotification,
    clearAllNotifications
  } = useMonthlyGoalsLifecycle()

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString())
  const [isArchiving, setIsArchiving] = useState(false)

  // 統計データの取得
  const currentMonthStats = getMonthlyStatistics(selectedMonth)
  const previousMonth = (() => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const prevDate = new Date(year, month - 2, 1) // month-2 because months are 0-indexed
    return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  })()
  const previousMonthStats = getMonthlyStatistics(previousMonth)

  // アーカイブ実行
  const handleArchiveExpiredGoals = async () => {
    setIsArchiving(true)
    try {
      await manuallyArchiveExpiredGoals()
    } catch (error) {
      // エラーハンドリング（サイレント）
    } finally {
      setIsArchiving(false)
    }
  }

  // 月選択オプション
  const generateMonthOptions = () => {
    const options = []
    const current = getCurrentMonthString()
    const next = getNextMonthString()
    
    // 過去3ヶ月も追加
    for (let i = 3; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      options.push({
        value: monthStr,
        label: formatMonthString(monthStr) + (monthStr === current ? ' (今月)' : '')
      })
    }
    
    // 来月も追加
    options.push({
      value: next,
      label: formatMonthString(next) + ' (来月)'
    })
    
    return options
  }

  // 進捗率の色を取得
  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 dark:text-green-400'
    if (rate >= 60) return 'text-blue-600 dark:text-blue-400'
    if (rate >= 40) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className={`p-4 rounded-lg border ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 size={20} className="text-rose-500" />
          <h2 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
          }`}>
            月次目標レポート
          </h2>
        </div>
        
        {/* 月選択 */}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className={`px-3 py-1 text-sm border rounded-md ${
            theme === 'dark' 
              ? 'border-gray-600 bg-gray-700 text-gray-200' 
              : 'border-gray-300 bg-white text-gray-900'
          }`}
        >
          {generateMonthOptions().map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 通知セクション */}
      {notifications.length > 0 && (
        <div className={`mb-6 p-3 rounded-lg border ${
          theme === 'dark' ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Bell size={16} className="text-yellow-600" />
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'
              }`}>
                通知 ({notifications.length})
              </span>
            </div>
            <button
              onClick={clearAllNotifications}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              全てクリア
            </button>
          </div>
          <div className="space-y-1">
            {notifications.slice(0, 3).map((notification, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
                onClick={() => clearNotification(index)}
              >
                <span className={theme === 'dark' ? 'text-yellow-100' : 'text-yellow-700'}>
                  {notification.message}
                </span>
                <span className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  ×
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 統計カード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 総目標数 */}
        <div className={`p-3 rounded-lg border ${
          theme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center space-x-2 mb-1">
            <Target size={16} className="text-blue-600" />
            <span className={`text-xs font-medium ${
              theme === 'dark' ? 'text-blue-200' : 'text-blue-700'
            }`}>
              総目標数
            </span>
          </div>
          <div className={`text-xl font-bold ${
            theme === 'dark' ? 'text-blue-100' : 'text-blue-900'
          }`}>
            {currentMonthStats.total}
          </div>
          {previousMonthStats.total > 0 && (
            <div className="text-xs text-gray-500">
              前月: {previousMonthStats.total}
            </div>
          )}
        </div>

        {/* 完了率 */}
        <div className={`p-3 rounded-lg border ${
          theme === 'dark' ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center space-x-2 mb-1">
            <CheckCircle size={16} className="text-green-600" />
            <span className={`text-xs font-medium ${
              theme === 'dark' ? 'text-green-200' : 'text-green-700'
            }`}>
              完了率
            </span>
          </div>
          <div className={`text-xl font-bold ${getProgressColor(currentMonthStats.completionRate)}`}>
            {currentMonthStats.completionRate}%
          </div>
          {previousMonthStats.total > 0 && (
            <div className="text-xs text-gray-500">
              前月: {previousMonthStats.completionRate}%
            </div>
          )}
        </div>

        {/* 進行中 */}
        <div className={`p-3 rounded-lg border ${
          theme === 'dark' ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center space-x-2 mb-1">
            <PlayCircle size={16} className="text-yellow-600" />
            <span className={`text-xs font-medium ${
              theme === 'dark' ? 'text-yellow-200' : 'text-yellow-700'
            }`}>
              進行中
            </span>
          </div>
          <div className={`text-xl font-bold ${
            theme === 'dark' ? 'text-yellow-100' : 'text-yellow-900'
          }`}>
            {currentMonthStats.inProgress}
          </div>
          <div className="text-xs text-gray-500">
            未着手: {currentMonthStats.notStarted}
          </div>
        </div>

        {/* 平均進捗 */}
        <div className={`p-3 rounded-lg border ${
          theme === 'dark' ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200'
        }`}>
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp size={16} className="text-purple-600" />
            <span className={`text-xs font-medium ${
              theme === 'dark' ? 'text-purple-200' : 'text-purple-700'
            }`}>
              平均進捗
            </span>
          </div>
          <div className={`text-xl font-bold ${
            theme === 'dark' ? 'text-purple-100' : 'text-purple-900'
          }`}>
            {currentMonthStats.averageProgress}%
          </div>
          {previousMonthStats.total > 0 && (
            <div className="text-xs text-gray-500">
              前月: {previousMonthStats.averageProgress}%
            </div>
          )}
        </div>
      </div>

      {/* 期限切れ目標の管理 */}
      {lifecycleState.expiredGoals.length > 0 && (
        <div className={`mb-6 p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Clock size={16} className="text-red-600" />
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-red-200' : 'text-red-700'
              }`}>
                期限切れ目標 ({lifecycleState.expiredGoals.length}件)
              </span>
            </div>
            <button
              onClick={handleArchiveExpiredGoals}
              disabled={isArchiving}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                isArchiving
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isArchiving ? 'アーカイブ中...' : 'アーカイブ実行'}
            </button>
          </div>
          <div className="space-y-2">
            {lifecycleState.expiredGoals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="flex items-center justify-between text-sm">
                <span className={theme === 'dark' ? 'text-red-100' : 'text-red-700'}>
                  {goal.title}
                </span>
                <span className="text-xs text-gray-500">
                  進捗: {goal.monthlyProgress || 0}%
                </span>
              </div>
            ))}
            {lifecycleState.expiredGoals.length > 3 && (
              <div className="text-xs text-gray-500">
                他 {lifecycleState.expiredGoals.length - 3} 件...
              </div>
            )}
          </div>
        </div>
      )}

      {/* アーカイブ履歴 */}
      {lifecycleState.lastArchiveDate && (
        <div className={`p-3 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <Archive size={16} className="text-gray-600" />
            <span className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              最新アーカイブ
            </span>
          </div>
          <div className="text-xs text-gray-500">
            実行日時: {lifecycleState.lastArchiveDate.toLocaleString('ja-JP')}
          </div>
          {lifecycleState.archivedGoals.length > 0 && (
            <div className="text-xs text-gray-500">
              アーカイブ件数: {lifecycleState.archivedGoals.length}件
            </div>
          )}
        </div>
      )}
    </div>
  )
}