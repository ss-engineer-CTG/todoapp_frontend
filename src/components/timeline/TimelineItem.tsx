import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/reducers';
import { Task, SubTask } from '../../types/task';
import { Project } from '../../types/project';
import TaskBar from './TaskBar';
import { toggleTask } from '../../store/slices/tasksSlice';

interface TimelineItemProps {
  project: Project;
  task: Task;
  subtask?: SubTask;
  isParent: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ 
  project, 
  task, 
  subtask, 
  isParent = true 
}) => {
  const dispatch = useDispatch();
  const { timelineStart, timelineScale, zoomLevel } = useSelector((state: RootState) => state.timeline);
  const { selectedTasks, focusedTaskKey } = useSelector((state: RootState) => state.ui);
  
  // スケールファクターを取得
  const getScaleFactor = () => {
    if (timelineScale === 'day') return 1;
    if (timelineScale === 'week') return 7;
    if (timelineScale === 'month') {
      const date = new Date(timelineStart);
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }
    return 1;
  };
  
  // ズームスケールに基づく1日あたりの幅を計算
  const dayWidth = 34 * (zoomLevel / 100);
  const scaleFactor = getScaleFactor();
  
  // TimelineItemの高さを計算
  const getItemHeight = () => {
    // 親タスクの場合は標準の高さ
    if (isParent) return 'h-8';
    
    // サブタスクの場合は若干低くする
    return 'h-7';
  };
  
  // タイムラインの日付を生成
  const generateTimelineDates = () => {
    const dates = [];
    let currentDate = new Date(timelineStart);
    const timelineEnd = new Date(timelineStart);
    
    if (timelineScale === 'day') {
      // 日ごとの表示のために十分な数の日付を生成
      timelineEnd.setDate(timelineEnd.getDate() + 60); // 十分な期間を確保
      
      while (currentDate <= timelineEnd) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (timelineScale === 'week') {
      // 週ごとの表示
      timelineEnd.setDate(timelineEnd.getDate() + 365); // 十分な期間を確保
      
      while (currentDate <= timelineEnd) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 7);
      }
    } else if (timelineScale === 'month') {
      // 月ごとの表示
      timelineEnd.setMonth(timelineEnd.getMonth() + 24); // 十分な期間を確保
      
      while (currentDate <= timelineEnd) {
        dates.push(new Date(currentDate));
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    
    return dates;
  };
  
  // 今日の日付を取得
  const { today } = useSelector((state: RootState) => state.timeline);
  
  // 曜日による背景色を取得
  const getDateCellColor = (date: Date) => {
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) return 'timeline-grid-cell today';
    if (date.getDay() === 0) return 'timeline-grid-cell weekend-sun';
    if (date.getDay() === 6) return 'timeline-grid-cell weekend-sat';
    
    return 'timeline-grid-cell';
  };
  
  const timelineDates = generateTimelineDates();
  
  // サブタスクを表示するかどうか
  const taskKey = subtask 
    ? `${project.id}-${task.id}-${subtask.id}` 
    : `${project.id}-${task.id}`;
  const isSelected = selectedTasks.includes(taskKey);
  const isFocused = focusedTaskKey === taskKey;
  
  // タスク展開/折りたたみの切り替え
  const handleTaskToggle = () => {
    if (isParent) {
      dispatch(toggleTask({ projectId: project.id, taskId: task.id }));
    }
  };
  
  return (
    <>
      <div 
        className={`relative ${getItemHeight()} hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer`}
        onClick={handleTaskToggle}
        id={`task-${taskKey}`}
        data-task-key={taskKey}
      >
        {/* 背景グリッド */}
        <div className="absolute inset-0">
          {timelineDates.map((date, index) => (
            <div 
              key={index} 
              className={`absolute top-0 bottom-0 ${getDateCellColor(date)}`}
              style={{ 
                left: `${index * dayWidth * scaleFactor}px`,
                width: `${dayWidth * scaleFactor}px` 
              }}
            ></div>
          ))}
        </div>
        
        {/* タスクバー */}
        <TaskBar
          project={project}
          task={task}
          subtask={subtask}
          isParent={isParent}
          isSelected={isSelected}
          isFocused={isFocused}
        />
      </div>
      
      {/* サブタスク行（親タスクが展開されている場合のみ表示） */}
      {isParent && task.expanded && task.subtasks && task.subtasks.length > 0 && (
        <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 ml-4">
          {task.subtasks.map(subtask => (
            <TimelineItem
              key={subtask.id}
              project={project}
              task={task}
              subtask={subtask}
              isParent={false}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default TimelineItem;