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
      className="flex items-center py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer bg-gray-100 dark:bg-gray-750 border-l-4"
      onClick={handleToggleProject}
      style={{ borderLeftColor: project.color }}
    >
      <div className="flex-1 flex items-center">
        <button 
          className="mr-1 text-gray-500 dark:text-gray-400"
          aria-label={project.expanded ? 'プロジェクトを折りたたむ' : 'プロジェクトを展開する'}
        >
          {project.expanded 
            ? <ChevronDown size={16} /> 
            : <ChevronRight size={16} />}
        </button>
        <div 
          className="w-3 h-3 rounded-full mr-2" 
          style={{ backgroundColor: project.color }}
        ></div>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {project.name}
        </span>
      </div>
      <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
        <MoreHorizontal size={16} />
      </button>
    </div>
  );
};

export default ProjectHeader;