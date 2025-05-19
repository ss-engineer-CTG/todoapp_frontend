import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TimelineView from './components/timeline/TimelineView';
import AppHeader from './components/common/AppHeader';
import FeedbackToast from './components/common/FeedbackToast';
import { initializeProjects } from './store/slices/projectsSlice';
import { initializeTimeline } from './store/slices/timelineSlice';
import ProjectForm from './components/project/ProjectForm';
import { RootState } from './store/reducers';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { projectFormActive } = useSelector((state: RootState) => state.ui);

  // アプリケーションの初期化
  useEffect(() => {
    // プロジェクトとタスクの初期データをロード
    dispatch(initializeProjects());
    
    // タイムライン表示設定を初期化
    dispatch(initializeTimeline());
    
    // キーボードイベントリスナーの登録（グローバルショートカット用）
    const handleKeyDown = () => {
      // グローバルなキーボードショートカット処理
      // 各コンポーネント固有のショートカットは対応するコンポーネントで処理
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // クリーンアップ関数
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <AppHeader />
      <main className="flex-1 overflow-hidden">
        <TimelineView />
      </main>
      <FeedbackToast />
      
      {/* プロジェクト作成フォーム */}
      {projectFormActive && <ProjectForm />}
    </div>
  );
};

export default App;