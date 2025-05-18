import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '../../types/notification';
import { generateId } from '../../utils/taskUtils';

interface NotificationsState {
  notifications: Notification[];
}

// 初期ステート
const initialState: NotificationsState = {
  notifications: [
    { 
      id: 'n1', 
      text: 'モックアップデザインのタスクが明日締め切りです', 
      read: false,
      createdAt: new Date('2025-05-16').toISOString(),
      type: 'info'
    }
  ]
};

// 通知スライス
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // 通知の追加
    addNotification: (state, action: PayloadAction<{ 
      text: string; 
      type?: 'info' | 'warning' | 'error' | 'success';
    }>) => {
      const { text, type = 'info' } = action.payload;
      
      const newNotification: Notification = {
        id: generateId(),
        text,
        type,
        read: false,
        createdAt: new Date().toISOString()
      };
      
      state.notifications.unshift(newNotification);
      
      // 最大20件までに制限
      if (state.notifications.length > 20) {
        state.notifications = state.notifications.slice(0, 20);
      }
    },
    
    // 通知を既読にする
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    
    // すべての通知を既読にする
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    
    // 通知の削除
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    // すべての通知の削除
    clearAllNotifications: (state) => {
      state.notifications = [];
    }
  },
});

// アクションエクスポート
export const { 
  addNotification, 
  markAsRead, 
  markAllAsRead, 
  removeNotification, 
  clearAllNotifications 
} = notificationsSlice.actions;

export default notificationsSlice.reducer;