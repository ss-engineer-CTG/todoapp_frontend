import React from 'react';
import { useTimelineContext } from '../../contexts/TimelineContext';

/**
 * アプリケーションヘッダーコンポーネント
 * アプリのタイトルと基本的なコントロールを表示
 */
const Header: React.FC = () => {
  const { viewMode, setViewMode } = useTimelineContext();

  return (
    <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-gray-800">理想のToDoリスト</h1>
        <span className="text-sm font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">タイムラインビュー</span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex border rounded overflow-hidden">
          <button
            className={`px-3 py-1 text-sm ${viewMode === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setViewMode('day')}
          >
            日
          </button>
          <button
            className={`px-3 py-1 text-sm ${viewMode === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setViewMode('week')}
          >
            週
          </button>
          <button
            className={`px-3 py-1 text-sm ${viewMode === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setViewMode('month')}
          >
            月
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;