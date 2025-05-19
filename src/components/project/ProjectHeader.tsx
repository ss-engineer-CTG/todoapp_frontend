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
  
  // 選択カラーの背景色スタイルを生成
  const getBackgroundStyle = () => {
    return {
      backgroundColor: project.color,
      color: '#FFFFFF',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
    };
  };
  
  return (
    <div 
      className="project-header flex items-center cursor-pointer rounded-md my-1 py-3 px-4 shadow-md transition-all duration-200"
      onClick={handleToggleProject}
      style={{
        ...getBackgroundStyle(),
        borderLeftWidth: '6px',
        borderLeftColor: project.color,
        borderLeftStyle: 'solid'
      }}
    >
      <div className="flex-1 flex items-center">
        <button 
          className="mr-2 text-white"
          aria-label={project.expanded ? 'プロジェクトを折りたたむ' : 'プロジェクトを展開する'}
        >
          {project.expanded 
            ? <ChevronDown size={20} /> 
            : <ChevronRight size={20} />}
        </button>
        <span className="text-base font-bold">
          {project.name}
        </span>
      </div>
      <button className="text-white p-1.5 rounded-full hover:bg-white/20">
        <MoreHorizontal size={18} />
      </button>
    </div>
  );
};

export default ProjectHeader;