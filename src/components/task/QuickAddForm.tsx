import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/reducers';
import { createTask } from '../../store/slices/tasksSlice';
import { setQuickAddActive } from '../../store/slices/uiSlice';
import { useFeedback } from '../../hooks/useFeedback';

const QuickAddForm: React.FC = () => {
  const dispatch = useDispatch();
  const { projects } = useSelector((state: RootState) => state.projects);
  const { showFeedback } = useFeedback();
  const [taskName, setTaskName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [parentTaskId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 初期化
  useEffect(() => {
    // プロジェクトがある場合、最初のプロジェクトを選択
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
    
    // 入力フィールドにフォーカス
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [projects, selectedProjectId]);
  
  // クイック追加保存処理
  const handleQuickAddSave = () => {
    // 名前が空でないことを確認
    if (!taskName.trim()) {
      showFeedback('タスク名を入力してください', 'error');
      return;
    }
    
    // 開始日と終了日を設定 (今日から3日間をデフォルトに)
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 2); // 3日間
    
    // タスクデータを作成
    const taskData = {
      name: taskName,
      start: start.toISOString(),
      end: end.toISOString(),
      status: 'not-started',
      notes: ''
    };
    
    // タスク追加アクションをディスパッチ
    dispatch(createTask({
      projectId: selectedProjectId,
      parentTaskId,
      task: taskData
    }));
    
    showFeedback(`新規タスク「${taskName}」を追加しました`, 'success');
    dispatch(setQuickAddActive(false));
  };
  
  // キャンセル処理
  const handleCancel = () => {
    dispatch(setQuickAddActive(false));
  };
  
  return (
    <div className="fixed bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-40 w-64">
      <div className="p-3">
        <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
          クイック追加
        </div>
        <input
          type="text"
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 text-sm mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          placeholder="タスク名を入力..."
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          ref={inputRef}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleQuickAddSave();
            } else if (e.key === 'Escape') {
              handleCancel();
            }
          }}
        />
        
        <div className="flex justify-between">
          <select
            className="border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          
          <div>
            <button
              type="button"
              className="py-1 px-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 mr-1"
              onClick={handleCancel}
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleQuickAddSave}
              className="py-1 px-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickAddForm;