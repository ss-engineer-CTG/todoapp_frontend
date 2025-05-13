// src/components/common/AddTaskButton.tsx
import React, { useContext } from "react";
import { Plus } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { TaskContext } from "../../contexts/TaskContext";
import { UIContext } from "../../contexts/UIContext";
import { useTasks } from "../../hooks/useTasks";
import { logDebug } from "../../utils/logUtils";

interface AddTaskButtonProps extends ButtonProps {
  // 追加のprops
  variant?: "default" | "outline" | "secondary" | "ghost"; 
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
  forToday?: boolean; // 今日のタスクとして追加するかどうか
  projectId?: number; // 特定のプロジェクトに追加する場合に指定
  level?: number; // 特定のレベルで追加する場合に指定
  parentId?: number | null; // 親タスクを指定する場合
}

export default function AddTaskButton({
  variant = "default",
  size = "default",
  label = "新規タスク",
  forToday = false,
  projectId,
  level,
  parentId,
  ...props
}: AddTaskButtonProps) {
  const { tasks } = useContext(TaskContext);
  const { selectedTaskId } = useContext(UIContext);
  const { addNewTask } = useTasks();

  const handleAddTask = () => {
    try {
      // 新しいタスクを追加
      if (projectId !== undefined) {
        // プロジェクトIDが指定されている場合
        const project = tasks.find(t => t.projectId === projectId && t.isProject);
        if (project) {
          // 引数で渡された値を使用
          const actualLevel = level !== undefined ? level : 1;
          const actualParentId = parentId !== undefined ? parentId : null;
          
          logDebug(`タスク追加: projectId=${projectId}, level=${actualLevel}, parentId=${actualParentId}`);
          addNewTask(actualLevel, actualParentId, projectId, project.name);
        } else {
          logDebug("指定されたプロジェクトが見つかりません");
        }
      } else if (selectedTaskId) {
        // 選択タスクがある場合は親タスクとして追加
        const selectedTask = tasks.find(t => t.id === selectedTaskId);
        if (selectedTask) {
          if (selectedTask.isProject) {
            // プロジェクトの下に追加
            addNewTask(1, null, selectedTask.projectId, selectedTask.name);
          } else {
            // タスクの下に子タスクとして追加
            addNewTask(selectedTask.level + 1, selectedTaskId, selectedTask.projectId, selectedTask.projectName);
          }
        }
      } else {
        // デフォルト: 最初のプロジェクト直下に追加
        const firstProject = tasks.find(t => t.isProject);
        if (firstProject) {
          addNewTask(1, null, firstProject.projectId, firstProject.name);
        } else {
          logDebug("プロジェクトが見つかりません");
        }
      }
    } catch (error) {
      logDebug(`タスク追加エラー: ${error}`);
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