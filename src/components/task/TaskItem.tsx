import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { RootState } from '../../store/reducers';
import { Task } from '../../types/task';
import { Project } from '../../types/project';
import { toggleTask, updateTaskStatus } from '../../store/slices/tasksSlice';
import { toggleTaskSelection } from '../../store/slices/uiSlice';
import SubtaskItem from './SubtaskItem';

interface TaskItemProps {
  project: Project;
  task: Task;
}

const TaskItem: React.FC<TaskItemProps> = ({ project, task }) => {
  const dispatch = useDispatch();
  const { selectedTasks, focusedTaskKey } = useSelector((state: RootState) => state.ui);
  const taskKey = `${project.id}-${task.id}`;
  const isSelected = selectedTasks.includes(taskKey);
  const isFocused = focusedTaskKey === taskKey;
  
  // タスクの展開/折りたたみを切り替える
  const handleToggleTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleTask({ projectId: project.id, taskId: task.id }));
  };
  
  // タスクのステータスを更新
  const handleStatusUpdate = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(updateTaskStatus({ 
      projectId: project.id, 
      taskId: task.id, 
      status: task.status === 'completed' ? 'not-started' : 
              task.status === 'in-progress' ? 'completed' : 'in-progress'
    }));
  };
  
  // タスク選択
  const handleTaskSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleTaskSelection({ 
      taskKey, 
      ctrlKey: e.ctrlKey, 
      shiftKey: e.shiftKey 
    }));
  };
  
  return (
    <div>
      <div 
        className={`flex items-center py-1.5 px-3 pl-8 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer 
                   ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''} 
                   ${isFocused ? 'ring-1 ring-indigo-500 dark:ring-indigo-400' : ''}`}
        onClick={handleTaskSelect}
      >
        <div className="flex-1 flex items-center">
          {task.subtasks.length > 0 ? (
            <button 
              className="mr-1 text-gray-500 dark:text-gray-400"
              onClick={handleToggleTask}
            >
              {task.expanded 
                ? <ChevronDown size={16} /> 
                : <ChevronRight size={16} />}
            </button>
          ) : (
            <div className="w-4 mr-1"></div>
          )}
          
          <div className="flex items-center">
            <button 
              className="mr-2 flex-shrink-0" 
              onClick={handleStatusUpdate}
              aria-label={task.status === 'completed' ? 'タスクを未完了に戻す' : 'タスクを完了としてマーク'}
            >
              {task.status === 'completed' ? (
                <div className="w-4 h-4 flex items-center justify-center rounded-full bg-green-500 text-white">
                  <Check size={12} />
                </div>
              ) : task.status === 'overdue' ? (
                <div className="w-4 h-4 flex items-center justify-center rounded-full border-2 border-red-500"></div>
              ) : task.status === 'in-progress' ? (
                <div className="w-4 h-4 flex items-center justify-center rounded-full border-2 border-blue-500"></div>
              ) : (
                <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-full"></div>
              )}
            </button>
            <span 
              className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-400 dark:text-gray-500' : task.status === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}
            >
              {task.name}
            </span>
          </div>
        </div>
        
        {/* 期間表示を削除 */}
      </div>
      
      {/* サブタスク */}
      {task.expanded && task.subtasks.map(subtask => (
        <SubtaskItem 
          key={subtask.id} 
          project={project} 
          task={task} 
          subtask={subtask} 
        />
      ))}
    </div>
  );
};

export default TaskItem;