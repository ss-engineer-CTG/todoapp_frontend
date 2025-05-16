import React from 'react';
import HomePage from './pages/HomePage';
import { TaskProvider } from './contexts/TaskContext';
import { TimelineProvider } from './contexts/TimelineContext';
import './styles/globals.css';
import './styles/task.css';
import './styles/timeline.css';

/**
 * アプリケーションのルートコンポーネント
 * コンテキストプロバイダーと主要コンポーネントをセットアップ
 */
const App: React.FC = () => {
  return (
    <TaskProvider>
      <TimelineProvider>
        <HomePage />
      </TimelineProvider>
    </TaskProvider>
  );
};

export default App;