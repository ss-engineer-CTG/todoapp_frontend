import React, { useEffect } from 'react';
import HomePage from './pages/HomePage';
import { TaskProvider } from './contexts/TaskContext';
import { TimelineProvider } from './contexts/TimelineContext';
import { initializeSampleData } from './utils/sampleData';
import './styles/globals.css';
import './styles/task.css';
import './styles/timeline.css';

/**
 * アプリケーションのルートコンポーネント
 * コンテキストプロバイダーと主要コンポーネントをセットアップ
 */
const App: React.FC = () => {
  // 初回レンダリング時にサンプルデータを初期化
  useEffect(() => {
    initializeSampleData();
  }, []);

  return (
    <TaskProvider>
      <TimelineProvider>
        <HomePage />
      </TimelineProvider>
    </TaskProvider>
  );
};

export default App;