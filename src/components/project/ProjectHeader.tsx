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
      className="project-header flex items-center cursor-pointer"
      onClick={handleToggleProject}
      style={{ borderLeftColor: project.color }}
    >
      <div className="flex-1 flex items-center">
        <button 
          className="mr-2 text-indigo-600 dark:text-indigo-400"
          aria-label={project.expanded ? 'プロジェクトを折りたたむ' : 'プロジェクトを展開する'}
        >
          {project.expanded 
            ? <ChevronDown size={20} /> 
            : <ChevronRight size={20} />}
        </button>
        <div 
          className="w-5 h-5 rounded-full mr-3 ring-2 ring-white dark:ring-gray-800" 
          style={{ backgroundColor: project.color }}
        ></div>
        <span className="text-base font-bold">
          {project.name}
        </span>
      </div>
      <button className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
        <MoreHorizontal size={18} />
      </button>
    </div>
  );
};

export default ProjectHeader;