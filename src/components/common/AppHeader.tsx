import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, Plus, Moon, Sun, Filter } from 'lucide-react';
import { RootState } from '../../store/reducers';
import { useTheme } from '../../context/ThemeContext';
import { setViewMode } from '../../store/slices/uiSlice';
import { useNotifications } from '../../hooks/useNotifications';
import { openTaskEditModal } from '../../store/slices/uiSlice';

const AppHeader: React.FC = () => {
  const dispatch = useDispatch();
  const { viewMode } = useSelector((state: RootState) => state.ui);
  const { theme, toggleTheme } = useTheme();
  const { notifications, markAllAsRead } = useNotifications();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // 通知ドロップダウンの表示切替
  const toggleNotifications = () => {
    setIsNotificationOpen(prev => !prev);
  };

  // 新規タスク追加モーダルを開く
  const handleAddNewTask = () => {
    dispatch(openTaskEditModal({ mode: 'create' }));
  };
  
  // 表示モードの変更
  const handleViewModeChange = (mode: 'all' | 'today' | 'overdue') => {
    dispatch(setViewMode(mode));
  };

  // 未読通知の数をカウント
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-2 px-4 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-lg font-medium text-gray-800 dark:text-gray-200">タイムラインToDoリスト</h1>
        
        <div className="ml-4 flex space-x-1">
          <button
            className={`px-3 py-1 text-sm font-medium rounded ${viewMode === 'all' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => handleViewModeChange('all')}
          >
            すべて
          </button>
          <button
            className={`px-3 py-1 text-sm font-medium rounded ${viewMode === 'today' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => handleViewModeChange('today')}
          >
            今日
          </button>
          <button
            className={`px-3 py-1 text-sm font-medium rounded ${viewMode === 'overdue' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => handleViewModeChange('overdue')}
          >
            遅延
          </button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* テーマ切替ボタン */}
        <button 
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        
        {/* フィルターボタン */}
        <div className="relative">
          <button 
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="フィルター"
          >
            <Filter size={18} />
          </button>
        </div>
        
        {/* 通知ボタン */}
        <div className="relative">
          <button 
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 relative"
            onClick={toggleNotifications}
            aria-label="通知"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          
          {/* 通知ドロップダウン */}
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-30 overflow-hidden">
              <div className="p-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">通知</h3>
                <button 
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                  onClick={markAllAsRead}
                >
                  すべて既読にする
                </button>
              </div>
              
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  通知はありません
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-3 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700 ${notification.read ? 'bg-white dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/30'}`}
                    >
                      <p className="text-xs text-gray-700 dark:text-gray-300">{notification.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 新規タスク追加ボタン */}
        <button 
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex items-center justify-center text-sm font-medium"
          onClick={handleAddNewTask}
        >
          <Plus size={16} className="mr-1.5" />
          新規タスク
        </button>
      </div>
    </header>
  );
};

export default AppHeader;