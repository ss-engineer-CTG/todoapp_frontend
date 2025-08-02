// 月次目標の通知センターコンポーネント

import React, { useState } from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { Bell, X, Archive, AlertTriangle, CheckCircle, Calendar, Settings } from 'lucide-react'
import { useMonthlyGoalsLifecycle, MonthlyGoalsNotification } from '../hooks/useMonthlyGoalsLifecycle'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export const MonthlyGoalsNotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose
}) => {
  const { resolvedTheme } = useTheme()
  const {
    notifications,
    lifecycleState,
    clearNotification,
    clearAllNotifications,
    manuallyArchiveExpiredGoals
  } = useMonthlyGoalsLifecycle()

  const [isArchiving, setIsArchiving] = useState(false)

  // 通知タイプ別のアイコンとスタイル
  const getNotificationIcon = (type: MonthlyGoalsNotification['type']) => {
    switch (type) {
      case 'goal-expired':
        return <AlertTriangle size={16} className="text-red-500" />
      case 'archive-completed':
        return <Archive size={16} className="text-green-500" />
      case 'month-end':
        return <Calendar size={16} className="text-blue-500" />
      default:
        return <Bell size={16} className="text-gray-500" />
    }
  }

  const getNotificationBgColor = (type: MonthlyGoalsNotification['type']) => {
    const baseClasses = 'border rounded-lg p-3'
    switch (type) {
      case 'goal-expired':
        return `${baseClasses} ${
          resolvedTheme === 'dark' 
            ? 'bg-red-900/20 border-red-800' 
            : 'bg-red-50 border-red-200'
        }`
      case 'archive-completed':
        return `${baseClasses} ${
          resolvedTheme === 'dark' 
            ? 'bg-green-900/20 border-green-800' 
            : 'bg-green-50 border-green-200'
        }`
      case 'month-end':
        return `${baseClasses} ${
          resolvedTheme === 'dark' 
            ? 'bg-blue-900/20 border-blue-800' 
            : 'bg-blue-50 border-blue-200'
        }`
      default:
        return `${baseClasses} ${
          resolvedTheme === 'dark' 
            ? 'bg-gray-700 border-gray-600' 
            : 'bg-gray-50 border-gray-200'
        }`
    }
  }

  // アーカイブ実行
  const handleQuickArchive = async () => {
    setIsArchiving(true)
    try {
      await manuallyArchiveExpiredGoals()
    } catch (error) {
      console.error('Quick archive failed:', error)
    } finally {
      setIsArchiving(false)
    }
  }

  // 通知の優先度を計算
  const getPriorityNotifications = () => {
    return notifications.sort((a, b) => {
      const priorityOrder = { 'goal-expired': 3, 'month-end': 2, 'archive-completed': 1 }
      return (priorityOrder[b.type] || 0) - (priorityOrder[a.type] || 0)
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end p-4">
      <div className={`w-full max-w-md mt-16 rounded-lg shadow-xl ${
        resolvedTheme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
      }`}>
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Bell size={20} className="text-rose-500" />
            <h2 className="text-lg font-semibold">通知センター</h2>
            {notifications.length > 0 && (
              <span className="px-2 py-1 text-xs bg-rose-600 text-white rounded-full">
                {notifications.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              resolvedTheme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* クイックアクション */}
        {lifecycleState.expiredGoals.length > 0 && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                緊急アクション
              </span>
            </div>
            <button
              onClick={handleQuickArchive}
              disabled={isArchiving}
              className={`w-full px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                isArchiving
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              <Archive size={16} />
              <span>
                {isArchiving 
                  ? 'アーカイブ中...' 
                  : `期限切れ目標をアーカイブ (${lifecycleState.expiredGoals.length}件)`
                }
              </span>
            </button>
          </div>
        )}

        {/* 通知リスト */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
              <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                新しい通知はありません
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {/* 全削除ボタン */}
              <div className="flex justify-end">
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  全て削除
                </button>
              </div>

              {/* 通知アイテム */}
              {getPriorityNotifications().map((notification, index) => (
                <div key={index} className={getNotificationBgColor(notification.type)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <p className={`text-sm ${
                          resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.timestamp.toLocaleString('ja-JP', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {notification.goalCount && (
                          <div className="flex items-center space-x-1 mt-1">
                            <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded">
                              {notification.goalCount}件
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => clearNotification(index)}
                      className={`p-1 rounded transition-colors ${
                        resolvedTheme === 'dark' 
                          ? 'hover:bg-gray-600 text-gray-400' 
                          : 'hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 設定フッター */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button className={`w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${
            resolvedTheme === 'dark' 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}>
            <Settings size={16} />
            <span>通知設定</span>
          </button>
        </div>
      </div>
    </div>
  )
}