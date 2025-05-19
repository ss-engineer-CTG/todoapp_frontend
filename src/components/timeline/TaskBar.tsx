import React, { useRef, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Check, Edit, Copy } from 'lucide-react';
import { RootState } from '../../store/reducers';
import { Project, Task, SubTask } from '../../types/task';
import { setHoverInfo, startDrag } from '../../store/slices/timelineSlice';
import { toggleTaskSelection, setInlineEditTask, openTaskEditModal } from '../../store/slices/uiSlice';
import { duplicateTask } from '../../store/slices/tasksSlice';
import { formatDate } from '../../utils/dateUtils';
import { getStatusStyle } from '../../utils/taskUtils';
import { TimelineGridContext } from './TimelineView';

interface TaskBarProps {
  project: Project;
  task: Task;
  subtask?: SubTask;
  isSelected: boolean;
  isFocused: boolean;
}

const TaskBar: React.FC<TaskBarProps> = ({
  project,
  task,
  subtask,
  isSelected,
  isFocused
}) => {
  const dispatch = useDispatch();
  const { dragInfo } = useSelector((state: RootState) => state.timeline);
  const { inlineEditTask } = useSelector((state: RootState) => state.ui);
  const taskBarRef = useRef<HTMLDivElement>(null);
  const timelineGrid = useContext(TimelineGridContext);
  
  // 現在のタスクデータ
  const currentData = subtask || task;
  const projectId = project.id;
  const taskId = task.id;
  const subtaskId = subtask?.id;
  const taskKey = subtask ? `${projectId}-${taskId}-${subtaskId}` : `${projectId}-${taskId}`;
  
  // インライン編集中かどうか
  const isInlineEditing = inlineEditTask && 
                         inlineEditTask.projectId === projectId && 
                         inlineEditTask.taskId === taskId && 
                         inlineEditTask.subtaskId === subtaskId;
  
  // ドラッグ中かどうか
  const isDragging = dragInfo && 
                     dragInfo.projectId === projectId && 
                     dragInfo.taskId === taskId && 
                     dragInfo.subtaskId === subtaskId;
  
  // タスク位置を計算
  const getTaskPosition = () => {
    if (!currentData || !currentData.start || !currentData.end) return { left: 0, width: 0 };
    
    // 日付オブジェクトに変換し、時間部分を正規化
    const taskStart = new Date(currentData.start);
    taskStart.setHours(0, 0, 0, 0);
    
    const taskEnd = new Date(currentData.end);
    taskEnd.setHours(0, 0, 0, 0);
    
    // 無効な日付の場合はデフォルト値を返す
    if (isNaN(taskStart.getTime()) || isNaN(taskEnd.getTime())) {
      return { left: 0, width: 0 };
    }
    
    // 開始日からの日数を計算
    const startPosition = timelineGrid.getDatePosition(taskStart);
    
    // タスクの期間（日数）を計算 - 終了日も含めるため +1 する
    const durationMs = taskEnd.getTime() - taskStart.getTime();
    const durationDays = (durationMs / (1000 * 60 * 60 * 24)) + 1;
    const width = durationDays * timelineGrid.dayWidth;
    
    return {
      left: startPosition,
      width: width
    };
  };
  
  // ステータスに基づく色とスタイルを取得
  const statusStyle = getStatusStyle(currentData.status, project.color);
  
  // タスク選択の切り替え
  const handleTaskSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleTaskSelection({ 
      taskKey, 
      ctrlKey: e.ctrlKey, 
      shiftKey: e.shiftKey 
    }));
  };
  
  // タスク詳細ポップアップの表示
  const handleShowTaskDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // マウス位置に基づいてポップアップ位置を計算
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      x: rect.right + 10,
      y: rect.top
    };
    
    dispatch(setHoverInfo({
      projectId,
      taskId,
      subtaskId,
      task: currentData,
      projectColor: project.color,
      position
    }));
  };
  
  // タスク詳細ポップアップを非表示
  const handleHideTaskDetails = () => {
    dispatch(setHoverInfo(null));
  };
  
  // インライン編集を開始
  const handleStartInlineEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    dispatch(setInlineEditTask({
      projectId,
      taskId,
      subtaskId,
      name: currentData.name
    }));
  };
  
  // ドラッグ開始
  const handleStartDrag = (e: React.MouseEvent, type: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    e.preventDefault();
    
    dispatch(startDrag({
      projectId,
      taskId,
      subtaskId,
      type,
      initialX: e.clientX,
      startX: e.clientX,
      taskStart: new Date(currentData.start),
      taskEnd: new Date(currentData.end),
      daysDelta: 0
    }));
  };
  
  // タスク編集モーダルを開く
  const handleEditTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(openTaskEditModal({ 
      mode: 'edit',
      projectId,
      taskId,
      subtaskId 
    }));
  };
  
  // タスク複製
  const handleDuplicateTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(duplicateTask({ projectId, taskId, subtaskId }));
  };
  
  // ドラッグ中のタスクバーのスタイルを生成
  const getDraggedTaskBarStyle = () => {
    if (!isDragging || !dragInfo) return {};
    
    if (dragInfo.type === 'move') {
      const dayWidth = timelineGrid.dayWidth;
      return {
        transform: `translateX(${dragInfo.daysDelta * dayWidth}px)`,
        opacity: 0.7,
        zIndex: 50,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      };
    } else if (dragInfo.type === 'resize-start') {
      const dayWidth = timelineGrid.dayWidth;
      const deltaWidth = -dragInfo.daysDelta * dayWidth;
      return {
        width: `calc(100% + ${deltaWidth}px)`,
        transform: `translateX(${-deltaWidth}px)`,
        opacity: 0.7,
        zIndex: 50
      };
    } else if (dragInfo.type === 'resize-end') {
      const dayWidth = timelineGrid.dayWidth;
      const deltaWidth = dragInfo.daysDelta * dayWidth;
      return {
        width: `calc(100% + ${deltaWidth}px)`,
        opacity: 0.7,
        zIndex: 50
      };
    }
    
    return {};
  };
  
  const position = getTaskPosition();
  
  return (
    <>
      <div
        ref={taskBarRef}
        className={`absolute h-6 rounded-sm shadow-sm flex items-center group task-bar
                   ${isSelected ? 'ring-2 ring-indigo-500' : ''} 
                   ${isFocused ? 'ring-2 ring-indigo-700' : ''} 
                   ${isDragging ? 'dragging' : ''}`}
        style={{ 
          left: `${position.left}px`,
          width: `${position.width}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: statusStyle.backgroundColor,
          color: statusStyle.textColor,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: statusStyle.borderColor,
          ...getDraggedTaskBarStyle(),
          zIndex: isSelected || isFocused ? 10 : 1
        }}
        onClick={handleTaskSelection}
        onMouseEnter={handleShowTaskDetails}
        onMouseLeave={handleHideTaskDetails}
        onDoubleClick={handleStartInlineEdit}
        data-task-key={taskKey}
      >
        {/* 開始日ドラッグハンドル */}
        <div 
          className="drag-handle start absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize z-10 hover:bg-indigo-500/20"
          onMouseDown={(e) => handleStartDrag(e, 'resize-start')}
          aria-label="開始日を調整"
        ></div>
        
        {/* インライン編集中 */}
        {isInlineEditing ? (
          <input
            type="text"
            className="px-2 text-xs font-medium w-full h-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
            value={inlineEditTask.name}
            onChange={(e) => dispatch(setInlineEditTask({ ...inlineEditTask, name: e.target.value }))}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                dispatch(setInlineEditTask(null));
              } else if (e.key === 'Escape') {
                dispatch(setInlineEditTask(null));
              }
            }}
          />
        ) : (
          <div 
            className="px-2 text-xs font-medium truncate flex-1 h-full flex items-center cursor-move"
            onMouseDown={(e) => handleStartDrag(e, 'move')}
          >
            {currentData.status === 'completed' && (
              <Check size={12} className="mr-1" />
            )}
            {currentData.name}
          </div>
        )}
        
        {/* 終了日ドラッグハンドル */}
        <div 
          className="drag-handle end absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize z-10 hover:bg-indigo-500/20"
          onMouseDown={(e) => handleStartDrag(e, 'resize-end')}
          aria-label="終了日を調整"
        ></div>
        
        {/* タスク操作メニュー (ホバー時に表示) */}
        <div className="absolute right-3 top-0 bottom-0 flex items-center pr-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button 
            className="p-1 text-white bg-gray-500 bg-opacity-50 rounded hover:bg-opacity-80 mr-1"
            onClick={handleEditTask}
            aria-label="タスクを編集"
          >
            <Edit size={10} />
          </button>
          <button 
            className="p-1 text-white bg-gray-500 bg-opacity-50 rounded hover:bg-opacity-80 mr-1"
            onClick={handleDuplicateTask}
            aria-label="タスクを複製"
          >
            <Copy size={10} />
          </button>
        </div>
      </div>
      
      {/* 日付変更ツールチップ */}
      {isDragging && dragInfo && (
        <div 
          className="absolute bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-md shadow-lg z-50 whitespace-nowrap"
          style={{ 
            left: position.left + position.width / 2,
            top: '-24px',
            transform: 'translateX(-50%)'
          }}
        >
          {dragInfo.type === 'move' && dragInfo.taskStart && dragInfo.taskEnd ? (
            <>
              {formatDate(new Date(dragInfo.taskStart.getTime() + dragInfo.daysDelta * 86400000))} - 
              {formatDate(new Date(dragInfo.taskEnd.getTime() + dragInfo.daysDelta * 86400000))}
            </>
          ) : dragInfo.type === 'resize-start' && dragInfo.taskStart ? (
            <>開始日: {formatDate(new Date(dragInfo.taskStart.getTime() + dragInfo.daysDelta * 86400000))}</>
          ) : dragInfo.type === 'resize-end' && dragInfo.taskEnd ? (
            <>終了日: {formatDate(new Date(dragInfo.taskEnd.getTime() + dragInfo.daysDelta * 86400000))}</>
          ) : null}
        </div>
      )}
    </>
  );
};

export default TaskBar;