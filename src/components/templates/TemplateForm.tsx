import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/reducers';
import { createTemplate } from '../../store/slices/templatesSlice';
import { useFeedback } from '../../hooks/useFeedback';

interface TemplateFormProps {
  onSave: () => void;
  onCancel: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ onSave, onCancel }) => {
  const dispatch = useDispatch();
  const { selectedTasks } = useSelector((state: RootState) => state.ui);
  const { projects } = useSelector((state: RootState) => state.projects);
  const { showFeedback } = useFeedback();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<'selection' | 'project'>('selection');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  // 選択タスクに基づくテンプレート作成
  const createFromSelection = () => {
    if (selectedTasks.length === 0) {
      showFeedback('テンプレート作成には最低1つのタスクを選択してください', 'error');
      return false;
    }
    return true;
  };
  
  // プロジェクトに基づくテンプレート作成
  const createFromProject = () => {
    if (!selectedProjectId) {
      showFeedback('プロジェクトを選択してください', 'error');
      return false;
    }
    
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project || project.tasks.length === 0) {
      showFeedback('選択したプロジェクトにはタスクがありません', 'error');
      return false;
    }
    
    return true;
  };
  
  // テンプレート保存
  const handleSave = () => {
    if (!name.trim()) {
      showFeedback('テンプレート名を入力してください', 'error');
      return;
    }
    
    let isValid = false;
    
    if (sourceType === 'selection') {
      isValid = createFromSelection();
    } else {
      isValid = createFromProject();
    }
    
    if (!isValid) return;
    
    dispatch(createTemplate({
      name,
      description,
      sourceType,
      sourceId: sourceType === 'project' ? selectedProjectId : undefined,
      taskKeys: sourceType === 'selection' ? selectedTasks : undefined
    }));
    
    showFeedback(`テンプレート「${name}」を作成しました`, 'success');
    onSave();
  };
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">テンプレート名</label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="例: ウェブサイト制作プロジェクト"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">説明 (オプション)</label>
        <textarea 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-20"
          placeholder="このテンプレートの説明や用途などを入力してください"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">テンプレート作成元</label>
        <div className="space-y-2">
          <div className="flex items-center">
            <input 
              type="radio" 
              id="source-selection" 
              value="selection"
              checked={sourceType === 'selection'}
              onChange={() => setSourceType('selection')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
            />
            <label htmlFor="source-selection" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              選択中のタスク ({selectedTasks.length}個)
            </label>
          </div>
          
          <div className="flex items-center">
            <input 
              type="radio" 
              id="source-project" 
              value="project"
              checked={sourceType === 'project'}
              onChange={() => setSourceType('project')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
            />
            <label htmlFor="source-project" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              プロジェクト全体
            </label>
          </div>
        </div>
      </div>
      
      {sourceType === 'project' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">プロジェクト選択</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">プロジェクトを選択</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.tasks.length}個のタスク)
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          onClick={onCancel}
        >
          キャンセル
        </button>
        <button
          type="button"
          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          onClick={handleSave}
        >
          保存
        </button>
      </div>
    </div>
  );
};

export default TemplateForm;