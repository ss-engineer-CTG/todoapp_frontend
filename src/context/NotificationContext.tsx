import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification } from '../types/notification';
import { generateId } from '../utils/taskUtils';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (text: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

// コンテキストをエクスポートするよう修正
export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // ローカルストレージから初期通知を取得
  const getInitialNotifications = (): Notification[] => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse notifications from localStorage:', e);
      }
    }
    return [];
  };
  
  const [notifications, setNotifications] = useState<Notification[]>(getInitialNotifications);
  
  // 通知をローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);
  
  // 新しい通知を追加
  const addNotification = (text: string) => {
    const newNotification: Notification = {
      id: generateId(),
      text,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 20)); // 最大20件まで保持
  };
  
  // 通知を既読にする
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };
  
  // 全ての通知を既読にする
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };
  
  // 通知を削除
  const removeNotification = (id: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
  };
  
  const value = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};