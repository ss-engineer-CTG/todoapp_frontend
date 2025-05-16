import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import TimelineView from '../components/timeline/TimelineView';
import TaskList from '../components/task/TaskList';
import TaskForm from '../components/task/TaskForm';

/**
 * メインページコンポーネント
 * アプリケーションのメイン画面
 */
const HomePage: React.FC = () => {
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'list'>('timeline');
  
  // タスク追加フォームの表示/非表示を切り替え
  const toggleAddTaskForm = () => {
    setShowAddTaskForm(prev => !prev);
  };
  
  // フォーム送信後の処理
  const handleTaskFormSubmit = () => {
    setShowAddTaskForm(false);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* ヘッダーセクション */}
        <div className="flex justify-between items-center mb-6">
          <div className="tabs">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'timeline' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('timeline')}
            >
              タイムラインビュー
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'list' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('list')}
            >
              リスト表示
            </button>
          </div>
          
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600"
            onClick={toggleAddTaskForm}
          >
            タスク追加
          </button>
        </div>
        
        {/* タスク追加フォーム */}
        {showAddTaskForm && (
          <div className="mb-6">
            <TaskForm
              onSubmit={handleTaskFormSubmit}
              onCancel={() => setShowAddTaskForm(false)}
            />
          </div>
        )}
        
        {/* メインコンテンツ */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'timeline' ? (
            <TimelineView className="h-[70vh]" />
          ) : (
            <div className="p-4">
              <TaskList />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;