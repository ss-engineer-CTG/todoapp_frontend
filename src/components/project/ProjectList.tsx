import React from 'react';
import { useSelector } from 'react-redux';
import { Plus } from 'lucide-react';
import { RootState } from '../../store/reducers';
import ProjectHeader from './ProjectHeader';
import TaskList from '../task/TaskList';

const ProjectList: React.FC = () => {
  const { projects } = useSelector((state: RootState) => state.projects);
  
  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="py-2 px-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">プロジェクト</div>
        <button 
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center"
          aria-label="新規プロジェクト"
        >
          <Plus size={14} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              プロジェクトがありません
            </p>
            <button className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
              + 新しいプロジェクトを追加
            </button>
          </div>
        ) : (
          projects.map(project => (
            <ProjectHeader key={project.id} project={project} />
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectList;