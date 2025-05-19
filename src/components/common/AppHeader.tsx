import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Moon, Sun, Plus, Filter } from 'lucide-react';
import { RootState } from '../../store/reducers';
import { useTheme } from '../../context/ThemeContext';
import { setViewMode } from '../../store/slices/uiSlice';
import { openTaskEditModal } from '../../store/slices/uiSlice';

const AppHeader: React.FC = () => {
  const dispatch = useDispatch();
  const { viewMode } = useSelector((state: RootState) => state.ui);
  const { theme, toggleTheme } = useTheme();

  // 新規タスク追加モーダルを開く
  const handleAddNewTask = () => {
    dispatch(openTaskEditModal({ mode: 'create' }));
  };
  
  // 表示モードの変更
  const handleViewModeChange = (mode: 'all' | 'today' | 'overdue') => {
    dispatch(setViewMode(mode));
  };

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