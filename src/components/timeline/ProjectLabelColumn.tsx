import React, { useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Project } from '../../types/task';
import { toggleProject } from '../../store/slices/projectsSlice';

interface ProjectLabelColumnProps {
  projects: Project[];
  scrollTop: number;
  onProjectToggle: (projectId: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const ProjectLabelColumn: React.FC<ProjectLabelColumnProps> = ({
  projects,
  scrollTop,
  onProjectToggle,
  containerRef
}) => {
  const dispatch = useDispatch();
  const columnRef = useRef<HTMLDivElement>(null);

  // コンテナのスクロールに合わせて、このカラムもスクロール
  useEffect(() => {
    if (columnRef.current) {
      columnRef.current.scrollTop = scrollTop;
    }
  }, [scrollTop]);

  // プロジェクトの展開/折りたたみを切り替え
  const handleToggleProject = (projectId: string) => {
    dispatch(toggleProject(projectId));
    onProjectToggle(projectId);
  };

  return (
    <div 
      ref={columnRef}
      className="w-48 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0 z-10"
      style={{ 
        position: 'sticky', 
        left: 0,
        height: containerRef.current ? containerRef.current.clientHeight : '100%',
        overflow: 'hidden'
      }}
    >
      {/* プロジェクトヘッダー行（各プロジェクトのラベル） */}
      <div className="relative" style={{ overflow: 'hidden' }}>
        {projects.map(project => (
          <div key={project.id}>
            {/* プロジェクトヘッダー */}
            <div 
              className="h-8 flex items-center cursor-pointer sticky left-0 pl-2 pr-2"
              onClick={() => handleToggleProject(project.id)}
              style={{ 
                backgroundImage: `linear-gradient(to right, ${project.color}30, ${project.color}10)`,
                borderLeft: `4px solid ${project.color}`
              }}
            >
              <button 
                className="mr-1 text-gray-700 dark:text-gray-300"
                aria-label={project.expanded ? 'プロジェクトを折りたたむ' : 'プロジェクトを展開する'}
              >
                {project.expanded 
                  ? <ChevronDown size={16} /> 
                  : <ChevronRight size={16} />}
              </button>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                {project.name}
              </span>
            </div>
            
            {/* 展開されている場合にタスク用のスペースを表示 */}
            {project.expanded && project.tasks.map(task => (
              <div key={task.id}>
                {/* タスク行のプレースホルダー */}
                <div className="h-8"></div>
                
                {/* 展開されているサブタスク用のスペース */}
                {task.expanded && task.subtasks && task.subtasks.map(subtask => (
                  <div key={subtask.id} className="h-7"></div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectLabelColumn;