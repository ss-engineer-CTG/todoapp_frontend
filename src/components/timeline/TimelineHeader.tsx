import React from 'react';
import { format } from 'date-fns';
import { useTimelineContext } from '../../contexts/TimelineContext';

/**
 * タイムラインのヘッダーコンポーネント
 * 表示モード切替、ナビゲーション、ズーム操作などを提供
 */
const TimelineHeader: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    zoomLevel,
    setZoomLevel,
    navigate,
    startDate,
    endDate,
    showCompletedTasks,
    setShowCompletedTasks
  } = useTimelineContext();
  
  // ズームレベル変更（最小50%、最大200%）
  const handleZoomChange = (delta: number) => {
    const newZoomLevel = Math.min(200, Math.max(50, zoomLevel + delta));
    setZoomLevel(newZoomLevel);
  };
  
  // 完了タスク表示切替
  const handleShowCompletedTasksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowCompletedTasks(e.target.checked);
  };

  return (
    <div className="timeline-header p-3 border-b bg-gray-50 flex flex-wrap items-center justify-between gap-2">
      {/* 表示期間 */}
      <div className="text-sm font-medium text-gray-700">
        {format(startDate, 'yyyy/MM/dd')} - {format(endDate, 'yyyy/MM/dd')}
      </div>
      
      {/* 表示モード切替 */}
      <div className="view-mode-controls flex border rounded overflow-hidden">
        <button
          className={`px-3 py-1 text-sm ${viewMode === 'day' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
          onClick={() => setViewMode('day')}
        >
          日
        </button>
        <button
          className={`px-3 py-1 text-sm ${viewMode === 'week' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
          onClick={() => setViewMode('week')}
        >
          週
        </button>
        <button
          className={`px-3 py-1 text-sm ${viewMode === 'month' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
          onClick={() => setViewMode('month')}
        >
          月
        </button>
      </div>
      
      {/* 期間ナビゲーション */}
      <div className="navigation-controls flex items-center space-x-1">
        <button
          className="p-1 rounded hover:bg-gray-200"
          onClick={() => navigate('prev')}
          title="前へ"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          className="px-2 py-1 text-sm rounded hover:bg-gray-200"
          onClick={() => navigate('today')}
        >
          今日
        </button>
        <button
          className="p-1 rounded hover:bg-gray-200"
          onClick={() => navigate('next')}
          title="次へ"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* ズーム操作 */}
      <div className="zoom-controls flex items-center space-x-1">
        <button
          className="p-1 rounded hover:bg-gray-200"
          onClick={() => handleZoomChange(-10)}
          title="ズームアウト"
          disabled={zoomLevel <= 50}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="text-sm">{zoomLevel}%</span>
        <button
          className="p-1 rounded hover:bg-gray-200"
          onClick={() => handleZoomChange(10)}
          title="ズームイン"
          disabled={zoomLevel >= 200}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
      {/* 完了タスク表示切替 */}
      <div className="completed-tasks-control flex items-center">
        <label className="flex items-center text-sm text-gray-700">
          <input
            type="checkbox"
            className="mr-2 h-4 w-4"
            checked={showCompletedTasks}
            onChange={handleShowCompletedTasksChange}
          />
          完了済みを表示
        </label>
      </div>
      
      {/* ステータス凡例 */}
      <div className="status-legend flex items-center space-x-3 ml-auto">
        <div className="legend-item flex items-center">
          <span className="w-3 h-3 bg-red-300 border border-red-500 rounded-sm mr-1"></span>
          <span className="text-xs text-gray-700">遅延</span>
        </div>
        <div className="legend-item flex items-center">
          <span className="w-3 h-3 bg-blue-300 border border-blue-500 rounded-sm mr-1"></span>
          <span className="text-xs text-gray-700">進行中</span>
        </div>
        <div className="legend-item flex items-center">
          <span className="w-3 h-3 bg-green-300 border border-green-500 rounded-sm mr-1"></span>
          <span className="text-xs text-gray-700">未来</span>
        </div>
        <div className="legend-item flex items-center">
          <span className="w-3 h-3 bg-gray-300 border border-gray-500 rounded-sm mr-1"></span>
          <span className="text-xs text-gray-700">完了</span>
        </div>
      </div>
    </div>
  );
};

export default TimelineHeader;