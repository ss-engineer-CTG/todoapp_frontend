import React from 'react';
import { CheckCircle, Trash, Calendar, UserCircle } from 'lucide-react';
import { Template } from '../../types/template';
import { formatDate } from '../../utils/dateUtils';

interface TemplateListProps {
  templates: Template[];
  onApply: (template: Template) => void;
  onDelete: (templateId: string) => void;
}

const TemplateList: React.FC<TemplateListProps> = ({ templates, onApply, onDelete }) => {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center">
        <div className="text-gray-400 dark:text-gray-500 mb-2">
          <File size={36} />
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-2">テンプレートがありません</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          新しいテンプレートを作成するには「新規テンプレート」タブを選択してください
        </p>
      </div>
    );
  }
  
  return (
    <div className="overflow-y-auto max-h-96">
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {templates.map(template => (
          <li key={template.id} className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">{template.name}</h3>
                <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Calendar size={12} className="mr-1" />
                  <span>作成日: {formatDate(template.createdAt)}</span>
                  {template.taskCount > 0 && (
                    <span className="ml-3">{template.taskCount}個のタスク</span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded"
                  onClick={() => onApply(template)}
                  aria-label="このテンプレートを適用"
                >
                  <CheckCircle size={16} />
                </button>
                <button 
                  className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                  onClick={() => onDelete(template.id)}
                  aria-label="このテンプレートを削除"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
            
            {template.description && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {template.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TemplateList;