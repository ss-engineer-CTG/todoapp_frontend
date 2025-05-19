import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut 
} from 'lucide-react';
import { 
  setTimelineScale, 
  zoomIn, 
  zoomOut, 
  navigateTimeline 
} from '../../store/slices/timelineSlice';
import { RootState } from '../../store/reducers';
import { useFeedback } from '../../hooks/useFeedback';
import FilterPanel from '../common/FilterPanel';

const TimelineHeader: React.FC = () => {
  const dispatch = useDispatch();
  const { timelineScale, zoomLevel } = useSelector((state: RootState) => state.timeline);
  const { showFeedback } = useFeedback();

  // タイムラインスケール切替ハンドラー
  const handleScaleChange = (scale: 'day' | 'week' | 'month') => {
    dispatch(setTimelineScale(scale));
    
    const scaleLabels = {
      'day': '日',
      'week': '週',
      'month': '月'
    };
    
    showFeedback(`${scaleLabels[scale]}表示に切り替えました`, 'success');
  };

  // 期間ナビゲーションハンドラー
  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    dispatch(navigateTimeline(direction));
    showFeedback(
      direction === 'prev' ? '前の期間へ移動しました' : 
      direction === 'next' ? '次の期間へ移動しました' : 
      '今日を中心に表示しました'
    );
  };

  // ズーム操作ハンドラー
  const handleZoom = (direction: 'in' | 'out') => {
    if (direction === 'in') {
      dispatch(zoomIn());
      showFeedback('ズームイン');
    } else {
      dispatch(zoomOut());
      showFeedback('ズームアウト');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <button 
          className={`px-3 py-1 text-sm font-medium rounded ${timelineScale === 'day' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          onClick={() => handleScaleChange('day')}
        >
          日表示
        </button>
        <button 
          className={`px-3 py-1 text-sm font-medium rounded ${timelineScale === 'week' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          onClick={() => handleScaleChange('week')}
        >
          週表示
        </button>
        <button 
          className={`px-3 py-1 text-sm font-medium rounded ${timelineScale === 'month' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          onClick={() => handleScaleChange('month')}
        >
          月表示
        </button>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* 期間ナビゲーション */}
        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
          <button 
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => handleNavigate('prev')}
            title="前の期間へ"
            aria-label="前の期間へ"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            className="px-3 py-1 text-sm border-l border-r border-gray-300 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-600 dark:text-gray-300"
            onClick={() => handleNavigate('today')}
          >
            今日
          </button>
          <button 
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => handleNavigate('next')}
            title="次の期間へ"
            aria-label="次の期間へ"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* ズームコントロール */}
        <div className="ml-2 flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
          <button 
            className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-md"
            onClick={() => handleZoom('out')}
            title="ズームアウト"
            aria-label="ズームアウト"
            disabled={zoomLevel <= 50}
          >
            <ZoomOut size={16} />
          </button>
          <span className="px-2 text-sm text-gray-600 dark:text-gray-300 border-l border-r border-gray-300 dark:border-gray-600">
            {zoomLevel}%
          </span>
          <button 
            className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-md"
            onClick={() => handleZoom('in')}
            title="ズームイン"
            aria-label="ズームイン"
            disabled={zoomLevel >= 200}
          >
            <ZoomIn size={16} />
          </button>
        </div>
        
        {/* フィルターパネル */}
        <FilterPanel />
      </div>
    </div>
  );
};

export default TimelineHeader;