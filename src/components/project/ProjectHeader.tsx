import React from 'react';
import { useDispatch } from 'react-redux';
import { ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Project } from '../../types/project';
import { toggleProject } from '../../store/slices/projectsSlice';

interface ProjectHeaderProps {
  project: Project;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project }) => {
  const dispatch = useDispatch();
  
  // プロジェクトの展開/折りたたみを切り替え
  const handleToggleProject = () => {
    dispatch(toggleProject(project.id));
  };
  
  return (
    <div 
      className="flex items-center py-2.5 px-4 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer bg-indigo-50 dark:bg-indigo-900/20 border-l-[6px] shadow-sm"
      onClick={handleToggleProject}
      style={{ borderLeftColor: project.color }}
    >
      <div className="flex-1 flex items-center">
        <button 
          className="mr-1.5 text-gray-600 dark:text-gray-300"
          aria-label={project.expanded ? 'プロジェクトを折りたたむ' : 'プロジェクトを展開する'}
        >
          {project.expanded 
            ? <ChevronDown size={18} /> 
            : <ChevronRight size={18} />}
        </button>
        <div 
          className="w-3.5 h-3.5 rounded-full mr-2.5" 
          style={{ backgroundColor: project.color }}
        ></div>
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
          {project.name}
        </span>
      </div>
      <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
        <MoreHorizontal size={16} />
      </button>
    </div>
  );
};

export default ProjectHeader;