import React, { useState } from 'react';
import { Task } from '../../models/task';
import TimelineItem from './TimelineItem';
import { useTaskContext } from '../../contexts/TaskContext';

interface TimelineItemListProps {
  tasks: Task[];
  startDate: Date;
  dayWidth: number;
  selectedTaskId: string | null;
  draggingTaskId: string | null;
  onTaskSelect: (taskId: string) => void;
  onTaskDragStart: (args: { taskId: string, type: 'start' | 'end' | 'move' }) => void;
  onTaskDragEnd: () => void;
  onEdit?: (taskId: string) => void;
  onNote?: (taskId: string) => void;
  onToggleCompletion?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

// 定数を直接定義
const LABEL_WIDTH = 200;
const ROW_HEIGHT = 40;

/**
 * タスク一覧表示コンポーネント
 * タイムライン上にタスクバーを表示する
 */
const TimelineItemList: React.FC<TimelineItemListProps> = ({
  tasks,
  startDate,
  dayWidth,
  selectedTaskId,
  draggingTaskId,
  onTaskSelect,
  onTaskDragStart,
  onTaskDragEnd,
  onEdit,
  onNote,
  onToggleCompletion,
  onDelete
}) => {
  const { getTaskHierarchy } = useTaskContext();
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  
  // タスク階層構造の取得
  const taskHierarchy = getTaskHierarchy();
  
  // マウスホバー処理
  const handleMouseEnter = (taskId: string) => {
    setHoveredTaskId(taskId);
  };
  
  const handleMouseLeave = () => {
    setHoveredTaskId(null);
  };
  
  // 再帰的にタスク行をレンダリング
  const renderTaskRows = (tasks: Task[], depth = 0, rowIndex = 0) => {
    let currentRowIndex = rowIndex;
    const rows: JSX.Element[] = [];
    
    tasks.forEach(task => {
      const isSelected = selectedTaskId === task.id;
      const isDragging = draggingTaskId === task.id;
      const isHovered = hoveredTaskId === task.id;
      
      // このタスクの子タスクを取得
      const childTasks = taskHierarchy.filter(t => t.parentId === task.id);
      
      rows.push(
        <TimelineItem
          key={task.id}
          task={task}
          rowIndex={currentRowIndex}
          depth={depth}
          dayWidth={dayWidth}
          startDate={startDate}
          rowHeight={ROW_HEIGHT}
          isSelected={isSelected}
          isDragging={isDragging}
          isHovered={isHovered}
          onSelect={() => onTaskSelect(task.id)}
          onDragStart={(type) => onTaskDragStart({ taskId: task.id, type })}
          onDragEnd={onTaskDragEnd}
          onEdit={onEdit ? () => onEdit(task.id) : undefined}
          onNote={onNote ? () => onNote(task.id) : undefined}
          onToggleCompletion={onToggleCompletion ? () => onToggleCompletion(task.id) : undefined}
          onDelete={onDelete ? () => onDelete(task.id) : undefined}
          onMouseEnter={() => handleMouseEnter(task.id)}
          onMouseLeave={handleMouseLeave}
        />
      );
      
      currentRowIndex++;
      
      // 子タスクがある場合は再帰的に処理
      if (childTasks.length > 0) {
        const childRows = renderTaskRows(childTasks, depth + 1, currentRowIndex);
        rows.push(...childRows.elements);
        currentRowIndex = childRows.nextRowIndex;
      }
    });
    
    return { elements: rows, nextRowIndex: currentRowIndex };
  };
  
  // ルートタスク（親を持たないタスク）
  const rootTasks = taskHierarchy.filter(task => !task.parentId);
  
  // タスク行のレンダリング
  const { elements: taskRows } = renderTaskRows(rootTasks);
  
  // 表の総高さ（行数 × 行の高さ）
  const totalHeight = tasks.length * ROW_HEIGHT;
  
  return (
    <div className="timeline-items-container relative">
      {/* タスク名ラベル列（固定表示） */}
      <div
        className="task-labels absolute top-0 left-0 bottom-0 bg-white border-r z-10"
        style={{ width: `${LABEL_WIDTH}px` }}
      >
        {taskHierarchy.map((task) => {
          const depth = task.parentId ? taskHierarchy.findIndex(t => t.id === task.parentId) + 1 : 0;
          
          return (
            <div
              key={task.id}
              className={`
                task-label flex items-center px-3
                ${selectedTaskId === task.id ? 'bg-blue-50' : ''}
                ${hoveredTaskId === task.id ? 'bg-gray-50' : ''}
              `}
              style={{
                height: `${ROW_HEIGHT}px`,
                paddingLeft: `${12 + depth * 20}px`
              }}
              onClick={() => onTaskSelect(task.id)}
              onMouseEnter={() => handleMouseEnter(task.id)}
              onMouseLeave={handleMouseLeave}
            >
              <span
                className={`
                  text-sm truncate
                  ${task.completed ? 'line-through text-gray-500' : 'text-gray-700'}
                `}
              >
                {task.title}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* タイムライングリッド */}
      <div
        className="timeline-grid absolute"
        style={{ left: `${LABEL_WIDTH}px`, height: `${totalHeight}px` }}
      >
        {/* タスク行 */}
        {taskRows}
      </div>
    </div>
  );
};

// コンポーネントに静的プロパティを追加
(TimelineItemList as any).LABEL_WIDTH = LABEL_WIDTH;
(TimelineItemList as any).ROW_HEIGHT = ROW_HEIGHT;

export default TimelineItemList;