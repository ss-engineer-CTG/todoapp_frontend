import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Filter, Calendar, Clock, ChevronDown } from 'lucide-react';
import { setViewMode, toggleCompletedTasks } from '../../store/slices/uiSlice';
import { RootState } from '../../store/reducers';
import { useFeedback } from '../../hooks/useFeedback';

interface FilterPanelProps {
  className?: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();
  const { viewMode, displayCompletedTasks } = useSelector((state: RootState) => state.ui);
  const { showFeedback } = useFeedback();
  const ref = useRef<HTMLDivElement>(null);
  
  // フィルターの定義
  const filters = [
    { id: 'all', name: 'すべて表示', icon: <Calendar size={14} /> },
    { id: 'today', name: '今日の予定', icon: <Clock size={14} /> },
    { id: 'overdue', name: '遅延タスク', icon: <Clock size={14} className="text-red-500" /> }
  ];
  
  // フィルター変更ハンドラー
  const handleFilterChange = (filterId: 'all' | 'today' | 'overdue') => {
    dispatch(setViewMode(filterId));
    setIsOpen(false);
    showFeedback(`フィルター「${filters.find(f => f.id === filterId)?.name}」を適用しました`);
  };
  
  // 完了タスク表示切替ハンドラー
  const handleCompletedTasksToggle = () => {
    dispatch(toggleCompletedTasks());
    showFeedback(displayCompletedTasks ? '完了タスクを非表示にしました' : '完了タスクを表示します');
  };
  
  // 外側クリック検出でドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className={`relative ${className}`} ref={ref}>
      <button 
        className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full flex items-center"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Filter size={16} />
        <ChevronDown size={14} className="ml-1" />
      </button>
      
      {isOpen && (
        <div className="absolute top-8 right-0 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-30">
          <div className="py-1 px-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">表示フィルター</h3>
          </div>
          
          {filters.map(filter => (
            <button
              key={filter.id}
              className={`w-full text-left px-3 py-2 flex items-center text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${viewMode === filter.id ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : ''}`}
              onClick={() => handleFilterChange(filter.id as 'all' | 'today' | 'overdue')}
            >
              <span className="mr-2">{filter.icon}</span>
              <span>{filter.name}</span>
            </button>
          ))}
          
          <div className="border-t border-gray-100 dark:border-gray-700 px-3 py-2">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={displayCompletedTasks}
                onChange={handleCompletedTasksToggle}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-600"
              />
              <span>完了タスクを表示</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;