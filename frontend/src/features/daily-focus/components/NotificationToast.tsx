import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { X, Info, AlertTriangle, CheckCircle } from 'lucide-react'

interface NotificationData {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success'
  timestamp: number
}

export const NotificationToast: React.FC = () => {
  const { resolvedTheme } = useTheme()
  const [notifications, setNotifications] = useState<NotificationData[]>([])

  // 通知イベントリスナー
  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const { title, message, type } = event.detail
      const newNotification: NotificationData = {
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        message,
        type,
        timestamp: Date.now()
      }

      setNotifications(prev => [...prev, newNotification])

      // 5秒後に自動削除
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
      }, 5000)
    }

    window.addEventListener('showNotification', handleNotification as EventListener)
    return () => {
      window.removeEventListener('showNotification', handleNotification as EventListener)
    }
  }, [])

  // 手動で通知を削除
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // アイコンを取得
  const getIcon = (type: NotificationData['type']) => {
    switch (type) {
      case 'info':
        return <Info size={20} className="text-blue-600" />
      case 'warning':
        return <AlertTriangle size={20} className="text-yellow-600" />
      case 'success':
        return <CheckCircle size={20} className="text-green-600" />
      default:
        return <Info size={20} className="text-blue-600" />
    }
  }

  // 通知のスタイルを取得
  const getNotificationStyles = (type: NotificationData['type']) => {
    const baseStyles = resolvedTheme === 'dark' 
      ? 'bg-gray-800 border-gray-700 text-gray-100' 
      : 'bg-white border-gray-200 text-gray-900'

    const typeStyles = {
      info: resolvedTheme === 'dark' ? 'border-l-blue-500' : 'border-l-blue-600',
      warning: resolvedTheme === 'dark' ? 'border-l-yellow-500' : 'border-l-yellow-600',
      success: resolvedTheme === 'dark' ? 'border-l-green-500' : 'border-l-green-600'
    }

    return `${baseStyles} ${typeStyles[type]} border-l-4`
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[60] space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-5 duration-300 ${
            getNotificationStyles(notification.type)
          }`}
        >
          <div className="flex items-start space-x-3">
            {getIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium">
                {notification.title}
              </h4>
              <p className={`text-sm mt-1 ${
                resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => dismissNotification(notification.id)}
              className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
                resolvedTheme === 'dark' 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}