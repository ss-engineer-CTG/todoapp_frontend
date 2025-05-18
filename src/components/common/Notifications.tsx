import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Bell, X, Check } from 'lucide-react';
import { RootState } from '../../store/reducers';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification } from '../../types/notification';

interface NotificationsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  
  // 通知をクリックした時の処理
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    // 通知の種類に応じた処理（タスクへの移動など）
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="notifications-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose}></div>
      
      <div className="relative min-h-screen flex items-start justify-end p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full ml-auto mr-2 mt-16 max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100" id="notifications-title">
              通知一覧
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={markAllAsRead}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                すべて既読
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              >
                <span className="sr-only">閉じる</span>
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                <Bell size={24} className="mb-2 opacity-50" />
                <p>通知はありません</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <li key={notification.id} className={`${notification.read ? '' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                    <button
                      className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-start"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 dark:text-gray-200">{notification.text}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          新規
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 rounded"
              onClick={onClose}
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;