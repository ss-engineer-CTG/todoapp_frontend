// src/components/common/TaskHierarchyUtility.tsx
import React from "react";
import { Task } from "../../types/Task";
import { getDirectChildTasks, getParentTask } from "../../utils/taskUtils"; 

interface TaskHierarchyProps {
  task: Task;
  tasks: Task[];
  renderItem: (task: Task, depth: number, isLast: boolean) => React.ReactNode;
  maxDepth?: number;
  currentDepth?: number;
  parentStack?: Task[];
}

/**
 * 階層構造を視覚的に表現するためのユーティリティコンポーネント
 */
export function TaskHierarchy({
  task,
  tasks,
  renderItem,
  maxDepth = 10,
  currentDepth = 0,
  parentStack = []
}: TaskHierarchyProps) {
  // 最大深度に達した場合は描画しない
  if (currentDepth > maxDepth) {
    return null;
  }

  // この親タスクの直接の子タスクを取得
  const childTasks = getDirectChildTasks(task, tasks);
  
  // 子タスクがない、または展開されていない場合
  if (childTasks.length === 0 || !task.expanded) {
    return (
      <div className="task-hierarchy-item">
        {renderItem(task, currentDepth, true)}
      </div>
    );
  }
  
  // 子タスクを含めて描画
  return (
    <div className="task-hierarchy-container">
      <div className="task-hierarchy-item">
        {renderItem(task, currentDepth, false)}
      </div>
      
      <div className="task-hierarchy-children" style={{ marginLeft: 20 }}>
        {childTasks.map((childTask, index) => (
          <TaskHierarchy
            key={childTask.id}
            task={childTask}
            tasks={tasks}
            renderItem={renderItem}
            maxDepth={maxDepth}
            currentDepth={currentDepth + 1}
            parentStack={[...parentStack, task]}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * タスクのパスを取得（親階層を辿る）
 */
export function getTaskPath(task: Task, tasks: Task[]): Task[] {
  const path: Task[] = [task];
  let currentTask: Task | null = task;
  
  while (currentTask) {
    const parent = getParentTask(currentTask, tasks);
    if (parent) {
      path.unshift(parent);
      currentTask = parent;
    } else {
      break;
    }
  }
  
  return path;
}

interface TaskPathDisplayProps {
  task: Task;
  tasks: Task[];
}

/**
 * タスクのパス（階層構造）を表示するコンポーネント
 */
export function TaskPathDisplay({ task, tasks }: TaskPathDisplayProps) {
  const path = getTaskPath(task, tasks);
  
  return (
    <div className="flex items-center text-sm text-gray-500">
      {path.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && <span className="mx-1">&gt;</span>}
          <span className={index === path.length - 1 ? "font-medium text-gray-700" : ""}>
            {item.name}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

interface TaskLevelIndicatorProps {
  level: number;
  isLast?: boolean;
}

/**
 * タスクのレベル（インデント）を視覚的に表示するコンポーネント
 */
export function TaskLevelIndicator({ level, isLast = false }: TaskLevelIndicatorProps) {
  if (level === 0) return null;
  
  return (
    <div className="flex items-center h-full">
      {Array.from({ length: level }).map((_, index) => (
        <div 
          key={index} 
          className={`w-4 ${
            index === level - 1 
              ? (isLast ? "border-l border-gray-300 h-1/2" : "border-l border-gray-300") 
              : "border-l border-gray-300"
          }`}
        />
      ))}
      {level > 0 && (
        <div className="w-2 border-t border-gray-300" />
      )}
    </div>
  );
}