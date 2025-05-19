import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/reducers';
import TimelineItem from './TimelineItem';

const TimelineItemList: React.FC = () => {
  const { today } = useSelector((state: RootState) => state.timeline);
  const { viewMode, displayCompletedTasks } = useSelector((state: RootState) => state.ui);
  const { projects } = useSelector((state: RootState) => state.projects);
  
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
  
  // 表示するタスクがない場合
  if (filteredProjects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">表示するタスクがありません</p>
          <p className="mt-2">フィルターを変更するか、新しいタスクを追加してください</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative">
      {filteredProjects.map(project => (
        <div key={project.id} className="border-b border-gray-200 dark:border-gray-700">
          {/* プロジェクトヘッダー行 */}
          <div 
            className="h-8 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer relative"
            data-project-id={project.id}
          >
            {/* タイムラインのグリッド背景は TimelineItem 内で描画 */}
          </div>
          
          {/* プロジェクト内のタスク */}
          {project.expanded && project.tasks.map(task => (
            <TimelineItem 
              key={task.id} 
              project={project} 
              task={task} 
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default TimelineItemList;