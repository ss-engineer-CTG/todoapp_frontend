import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { X } from 'lucide-react';
import { RootState } from '../../store/reducers';
import TemplateList from './TemplateList';
import TemplateForm from './TemplateForm';

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ isOpen, onClose }) => {
  const { templates } = useSelector((state: RootState) => state.templates);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  if (!isOpen) return null;
  
  // 検索クエリでテンプレートをフィルタリング
  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            テンプレート管理
          </h2>
          <button 
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
            onClick={onClose}
          >
            <span className="sr-only">閉じる</span>
            <X size={20} />
          </button>
        </div>
        
        {/* タブナビゲーション */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'list' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setActiveTab('list')}
          >
            テンプレート一覧
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'create' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setActiveTab('create')}
          >
            新規テンプレート
          </button>
        </div>
        
        <div className="p-4">
          {activeTab === 'list' ? (
            <div>
              {/* 検索フィールド */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="テンプレートを検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* テンプレート一覧 */}
              <TemplateList 
                templates={filteredTemplates} 
                onApply={() => {}} 
                onDelete={() => {}} 
              />
            </div>
          ) : (
            <TemplateForm onSave={() => setActiveTab('list')} onCancel={() => setActiveTab('list')} />
          )}
        </div>
        
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-right border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;