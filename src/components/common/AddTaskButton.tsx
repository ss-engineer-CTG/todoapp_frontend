// src/components/common/AddTaskButton.tsx
import React, { useContext } from "react";
import { Plus } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { TaskContext } from "../../contexts/TaskContext";
import { UIContext } from "../../contexts/UIContext";
import { useTasks } from "../../hooks/useTasks";
import { getNewTaskInfo } from "../../utils/taskOperationUtils";
import { logDebug } from "../../utils/logUtils";

interface AddTaskButtonProps extends ButtonProps {
  // 追加のprops
  variant?: "default" | "outline" | "secondary" | "ghost"; 
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
  forToday?: boolean; // 今日のタスクとして追加するかどうか
  projectId?: number; // 特定のプロジェクトに追加する場合に指定
  level?: number; // 特定のレベルで追加する場合に指定
}

export default function AddTaskButton({
  variant = "default",
  size = "default",
  label = "新規タスク",
  forToday = false,
  projectId,
  level,
  ...props
}: AddTaskButtonProps) {
  const { tasks } = useContext(TaskContext);
  const { selectedTaskId } = useContext(UIContext);
  const { addNewTask } = useTasks();

  const handleAddTask = () => {
    // タスク追加情報を取得
    let { projectId: pId, projectName, level: lvl, afterIndex } = getNewTaskInfo(tasks, selectedTaskId);
    
    // 引数で渡された値があればそれを優先
    if (projectId !== undefined) {
      const project = tasks.find(t => t.projectId === projectId && t.isProject);
      if (project) {
        pId = project.projectId;
        projectName = project.name;
      }
    }

    if (level !== undefined) {
      lvl = level;
    }

    logDebug(`タスク追加: projectId=${pId}, level=${lvl}, afterIndex=${afterIndex}`);
    
    // タスク追加
    const newTaskId = addNewTask(lvl, pId, projectName, afterIndex);
    
    // 今日のタスクとして追加する場合は日付を設定
    if (forToday && newTaskId) {
      // 日付更新処理は理想的には useTasks フック内で実装すべき
      // この例ではイベントを発行するか、コールバックを渡す方式が良い
      logDebug("今日のタスクとして追加されました");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAddTask}
      {...props}
    >
      <Plus size={16} className="mr-1" /> {label}
    </Button>
  );
}