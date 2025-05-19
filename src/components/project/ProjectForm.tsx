import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { addProject } from '../../store/slices/projectsSlice';
import { setProjectFormActive } from '../../store/slices/uiSlice';
import { useFeedback } from '../../hooks/useFeedback';
import { colorConstants } from '../../constants/colorConstants';

const ProjectForm: React.FC = () => {
  const dispatch = useDispatch();
  const { showFeedback } = useFeedback();
  const [projectName, setProjectName] = useState('');
  const [projectColor, setProjectColor] = useState(colorConstants.PROJECT_COLORS[0]);
  const [projectDescription, setProjectDescription] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 初期化
  useEffect(() => {
    // カラーをランダムに選択
    const randomIndex = Math.floor(Math.random() * colorConstants.PROJECT_COLORS.length);
    setProjectColor(colorConstants.PROJECT_COLORS[randomIndex]);
    
    // 入力フィールドにフォーカス
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // プロジェクト追加保存処理
  const handleProjectSave = () => {
    // 名前が空でないことを確認
    if (!projectName.trim()) {
      showFeedback('プロジェクト名を入力してください', 'error');
      return;
    }
    
    // プロジェクトデータを作成
    const projectData = {
      name: projectName,
      color: projectColor,
      description: projectDescription,
      expanded: true,
      tasks: []
    };
    
    // プロジェクト追加アクションをディスパッチ
    dispatch(addProject(projectData));
    
    showFeedback(`新規プロジェクト「${projectName}」を追加しました`, 'success');
    dispatch(setProjectFormActive(false));
  };
  
  // キャンセル処理
  const handleCancel = () => {
    dispatch(setProjectFormActive(false));
  };
  
  return (
    <div className="fixed bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-40 w-72">
      <div className="p-3">
        <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
          新規プロジェクト
        </div>
        
        {/* プロジェクト名入力 */}
        <div className="mb-3">
          <input
            type="text"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="プロジェクト名を入力..."
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            ref={inputRef}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleProjectSave();
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
          />
        </div>
        
        {/* プロジェクトカラー選択 */}
        <div className="mb-3">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            プロジェクトカラー
          </label>
          <div className="flex flex-wrap gap-2">
            {colorConstants.PROJECT_COLORS.map((color) => (
              <button
                key={color}
                className={`w-6 h-6 rounded-full border ${projectColor === color ? 'border-gray-800 dark:border-white border-2' : 'border-gray-300 dark:border-gray-600'}`}
                style={{ backgroundColor: color }}
                onClick={() => setProjectColor(color)}
                aria-label={`カラー ${color}`}
              />
            ))}
          </div>
        </div>
        
        {/* プロジェクト説明 */}
        <div className="mb-3">
          <textarea
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="プロジェクトの説明（オプション）"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="flex justify-between mt-3">
          <button
            type="button"
            className="py-1 px-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={handleCancel}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleProjectSave}
            className="py-1 px-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;