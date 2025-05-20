import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/reducers';
import { Task, SubTask } from '../../types/task';
import { Project } from '../../types/project';
import TaskBar from './TaskBar';
import { toggleTask } from '../../store/slices/tasksSlice';
import { TimelineGridContext } from './TimelineView';

interface TimelineItemProps {
  project: Project;
  task: Task;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ project, task }) => {
  const dispatch = useDispatch();
  const { selectedTasks, focusedTaskKey } = useSelector((state: RootState) => state.ui);
  const timelineGrid = useContext(TimelineGridContext);
  
  // 親タスクのタスクキーを生成
  const parentTaskKey = `${project.id}-${task.id}`;
  const isSelected = selectedTasks.includes(parentTaskKey);
  const isFocused = focusedTaskKey === parentTaskKey;
  
  // タスク展開/折りたたみの切り替え
  const handleTaskToggle = () => {
    dispatch(toggleTask({ projectId: project.id, taskId: task.id }));
  };

  // 曜日による背景色を取得
  const getDateCellColor = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isToday = date.getFullYear() === today.getFullYear() && 
                   date.getMonth() === today.getMonth() && 
                   date.getDate() === today.getDate();
    
    if (isToday) return 'timeline-grid-cell today';
    if (date.getDay() === 0) return 'timeline-grid-cell weekend-sun';
    if (date.getDay() === 6) return 'timeline-grid-cell weekend-sat';
    
    return 'timeline-grid-cell';
  };
  
  return (
    <>
      {/* 親タスク行 */}
      <div 
        className="relative h-8 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
        onClick={handleTaskToggle}
        id={`task-${parentTaskKey}`}
        data-task-key={parentTaskKey}
      >
        {/* 背景グリッド */}
        <div className="absolute inset-0">
          {timelineGrid.visibleDates.map((date) => (
            <div 
              key={date.getTime()} 
              className={`absolute top-0 bottom-0 ${getDateCellColor(date)}`}
              style={{ 
                left: `${timelineGrid.getDatePosition(date)}px`,
                width: `${timelineGrid.dayWidth}px` 
              }}
            ></div>
          ))}
        </div>
        
        {/* 親タスクバー */}
        <TaskBar
          project={project}
          task={task}
          isSelected={isSelected}
          isFocused={isFocused}
        />
      </div>
      
      {/* サブタスク行（親タスクが展開されている場合のみ表示） */}
      {task.expanded && task.subtasks && task.subtasks.length > 0 && (
        <div>
          {task.subtasks.map(subtask => (
            <SubTaskRow
              key={subtask.id}
              project={project}
              task={task}
              subtask={subtask}
            />
          ))}
        </div>
      )}
    </>
  );
};

// 子タスク行を専用のコンポーネントとして実装
interface SubTaskRowProps {
  project: Project;
  task: Task;
  subtask: SubTask;
}

const SubTaskRow: React.FC<SubTaskRowProps> = ({ project, task, subtask }) => {
  const { selectedTasks, focusedTaskKey } = useSelector((state: RootState) => state.ui);
  const timelineGrid = useContext(TimelineGridContext);
  
  // 子タスクのタスクキーを生成
  const subTaskKey = `${project.id}-${task.id}-${subtask.id}`;
  const isSelected = selectedTasks.includes(subTaskKey);
  const isFocused = focusedTaskKey === subTaskKey;
  
  // 曜日による背景色を取得
  const getDateCellColor = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isToday = date.getFullYear() === today.getFullYear() && 
                   date.getMonth() === today.getMonth() && 
                   date.getDate() === today.getDate();
    
    if (isToday) return 'timeline-grid-cell today';
    if (date.getDay() === 0) return 'timeline-grid-cell weekend-sun';
    if (date.getDay() === 6) return 'timeline-grid-cell weekend-sat';
    
    return 'timeline-grid-cell';
  };
  
  return (
    <div 
      className="relative h-8 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
      id={`task-${subTaskKey}`}
      data-task-key={subTaskKey}
    >
      {/* 背景グリッド */}
      <div className="absolute inset-0">
        {timelineGrid.visibleDates.map((date) => (
          <div 
            key={date.getTime()} 
            className={`absolute top-0 bottom-0 ${getDateCellColor(date)}`}
            style={{ 
              left: `${timelineGrid.getDatePosition(date)}px`,
              width: `${timelineGrid.dayWidth}px` 
            }}
          ></div>
        ))}
      </div>
      
      {/* 子タスクバー */}
      <TaskBar
        project={project}
        task={task}
        subtask={subtask}
        isSelected={isSelected}
        isFocused={isFocused}
      />
    </div>
  );
};

export default TimelineItem;