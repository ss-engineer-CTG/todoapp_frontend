import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Check } from 'lucide-react';
import { RootState } from '../../store/reducers';
import { Task, SubTask } from '../../types/task';
import { Project } from '../../types/project';
import { updateTaskStatus } from '../../store/slices/tasksSlice';
import { toggleTaskSelection } from '../../store/slices/uiSlice';

interface SubtaskItemProps {
  project: Project;
  task: Task;
  subtask: SubTask;
}

const SubtaskItem: React.FC<SubtaskItemProps> = ({ project, task, subtask }) => {
  const dispatch = useDispatch();
  const { selectedTasks, focusedTaskKey } = useSelector((state: RootState) => state.ui);
  const taskKey = `${project.id}-${task.id}-${subtask.id}`;
  const isSelected = selectedTasks.includes(taskKey);
  const isFocused = focusedTaskKey === taskKey;
  
  // タスクのステータスを更新
  const handleStatusUpdate = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(updateTaskStatus({ 
      projectId: project.id, 
      taskId: task.id, 
      subtaskId: subtask.id,
      status: subtask.status === 'completed' ? 'not-started' : 
              subtask.status === 'in-progress' ? 'completed' : 'in-progress'
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
    <div 
      className={`flex items-center py-1.5 px-3 pl-14 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer
                 ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}
                 ${isFocused ? 'ring-1 ring-indigo-500 dark:ring-indigo-400' : ''}`}
      onClick={handleTaskSelect}
    >
      <div className="flex-1 flex items-center">
        <button 
          className="mr-2 flex-shrink-0" 
          onClick={handleStatusUpdate}
          aria-label={subtask.status === 'completed' ? 'タスクを未完了に戻す' : 'タスクを完了としてマーク'}
        >
          {subtask.status === 'completed' ? (
            <div className="w-4 h-4 flex items-center justify-center rounded-full bg-green-500 text-white">
              <Check size={12} />
            </div>
          ) : subtask.status === 'overdue' ? (
            <div className="w-4 h-4 flex items-center justify-center rounded-full border-2 border-red-500"></div>
          ) : subtask.status === 'in-progress' ? (
            <div className="w-4 h-4 flex items-center justify-center rounded-full border-2 border-blue-500"></div>
          ) : (
            <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-full"></div>
          )}
        </button>
        <span 
          className={`text-sm ${subtask.status === 'completed' ? 'line-through text-gray-400 dark:text-gray-500' : subtask.status === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}
        >
          {subtask.name}
        </span>
      </div>
    </div>
  );
};

export default SubtaskItem;