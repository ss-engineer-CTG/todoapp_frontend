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
      className="flex items-center py-1.5 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
      onClick={handleToggleProject}
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
          className="w-2 h-2 rounded-full mr-2" 
          style={{ backgroundColor: project.color }}
        ></div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
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