import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus } from 'lucide-react';
import { RootState } from '../../store/reducers';
import { setProjectFormActive } from '../../store/slices/uiSlice';
import ProjectHeader from '../project/ProjectHeader';
import TaskItem from './TaskItem';

const TaskList: React.FC = () => {
  const dispatch = useDispatch();
  const { projects } = useSelector((state: RootState) => state.projects);
  const { viewMode, displayCompletedTasks } = useSelector((state: RootState) => state.ui);
  const { today } = useSelector((state: RootState) => state.timeline);
  
  // フィルタリングされたプロジェクトを取得
  const getFilteredProjects = () => {
    let result = [...projects];

    // 表示モードによるフィルタリング
    if (viewMode !== 'all') {
      result = result.map(project => {
        const filteredTasks = project.tasks.filter(task => {
          // 今日のタスク
          if (viewMode === 'today') {
            const taskStart = new Date(task.start);
            const taskEnd = new Date(task.end);
            return (today >= taskStart && today <= taskEnd);
          }
          // 遅延タスク
          else if (viewMode === 'overdue') {
            const taskEnd = new Date(task.end);
            return (taskEnd < today && task.status !== 'completed');
          }
          return true;
        });

        // サブタスクにも同じフィルタリングを適用
        const tasksWithFilteredSubtasks = filteredTasks.map(task => {
          if (!task.subtasks) return task;

          const filteredSubtasks = task.subtasks.filter(subtask => {
            // 今日のタスク
            if (viewMode === 'today') {
              const subtaskStart = new Date(subtask.start);
              const subtaskEnd = new Date(subtask.end);
              return (today >= subtaskStart && today <= subtaskEnd);
            }
            // 遅延タスク
            else if (viewMode === 'overdue') {
              const subtaskEnd = new Date(subtask.end);
              return (subtaskEnd < today && subtask.status !== 'completed');
            }
            return true;
          });

          return { ...task, subtasks: filteredSubtasks };
        });

        return { ...project, tasks: tasksWithFilteredSubtasks };
      });
    }

    // 完了タスクの表示/非表示
    if (!displayCompletedTasks) {
      result = result.map(project => {
        const filteredTasks = project.tasks.filter(task => task.status !== 'completed');
        
        // サブタスクの完了状態も制御
        const tasksWithFilteredSubtasks = filteredTasks.map(task => {
          if (!task.subtasks) return task;
          
          const filteredSubtasks = task.subtasks.filter(subtask => 
            subtask.status !== 'completed'
          );
          
          return { ...task, subtasks: filteredSubtasks };
        });
        
        return { ...project, tasks: filteredTasks.length > 0 ? tasksWithFilteredSubtasks : [] };
      });
      
      // 全てのタスクが空のプロジェクトを除外
      result = result.filter(project => project.tasks.length > 0);
    }

    return result;
  };
  
  const filteredProjects = getFilteredProjects();
  
  // プロジェクト作成フォームを開始
  const handleCreateProject = () => {
    dispatch(setProjectFormActive(true));
  };
  
  // ビューが空かどうかチェック
  const isViewEmpty = filteredProjects.length === 0 || 
                      filteredProjects.every(project => project.tasks.length === 0);
  
  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="py-2 px-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">プロジェクトとタスク</div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isViewEmpty ? (
          <div className="flex flex-col items-center justify-center h-32 p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {viewMode === 'all' 
                ? 'プロジェクトやタスクがありません' 
                : '表示条件に合うタスクがありません'}
            </p>
            <button 
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              onClick={handleCreateProject}
            >
              + 新しいプロジェクトを追加
            </button>
          </div>
        ) : (
          <>
            {filteredProjects.map(project => (
              <div key={project.id} className="mb-1">
                {/* プロジェクトヘッダー */}
                <ProjectHeader project={project} />
                
                {/* タスク一覧 */}
                {project.expanded && project.tasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    project={project} 
                    task={task} 
                  />
                ))}
              </div>
            ))}
          </>
        )}
      </div>
      
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <button 
          className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center justify-center text-sm font-medium"
          onClick={handleCreateProject}
        >
          <Plus size={14} className="mr-1" />
          新規プロジェクト
        </button>
      </div>
    </div>
  );
};

export default TaskList;