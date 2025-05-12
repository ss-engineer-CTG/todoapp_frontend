// src/hooks/useDialogInitializer.ts
import { useContext, useEffect } from "react";
import { TaskContext } from "../contexts/TaskContext";
import { UIContext } from "../contexts/UIContext";
import { logError, logInfo } from "../utils/logUtils";
import { Task } from "../types/Task";

/**
 * ダイアログを開く際のcurrentTask設定を確実に行うためのフック
 */
export function useDialogInitializer() {
  const { tasks } = useContext(TaskContext);
  const { 
    setCurrentTask, 
    isTaskDialogOpen, 
    isProjectDialogOpen, 
    selectedTaskId 
  } = useContext(UIContext);

  // タスク編集ダイアログが開かれた時の初期化処理
  useEffect(() => {
    if (isTaskDialogOpen && selectedTaskId) {
      const task = tasks.find(t => t.id === selectedTaskId);
      
      if (task && !task.isProject) {
        logInfo(`TaskDialog: Setting current task to ${task.name} (ID: ${task.id})`);
        setCurrentTask(task);
      } else if (!task) {
        logError(`TaskDialog: Selected task ID ${selectedTaskId} not found`);
      } else if (task.isProject) {
        logError(`TaskDialog: Selected task ID ${selectedTaskId} is a project, not a task`);
      }
    }
  }, [isTaskDialogOpen, selectedTaskId, tasks, setCurrentTask]);

  // プロジェクト編集ダイアログが開かれた時の初期化処理
  useEffect(() => {
    if (isProjectDialogOpen && selectedTaskId) {
      const project = tasks.find(t => t.id === selectedTaskId);
      
      if (project && project.isProject) {
        logInfo(`ProjectDialog: Setting current task to project ${project.name} (ID: ${project.id})`);
        setCurrentTask(project);
      } else if (!project) {
        logError(`ProjectDialog: Selected project ID ${selectedTaskId} not found`);
      } else if (!project.isProject) {
        logError(`ProjectDialog: Selected ID ${selectedTaskId} is not a project`);
      }
    }
  }, [isProjectDialogOpen, selectedTaskId, tasks, setCurrentTask]);

  // 新しいタスクの作成準備
  const prepareNewTask = (projectId: number): Task => {
    // プロジェクトの存在確認
    const project = tasks.find(t => t.projectId === projectId && t.isProject);
    if (!project) {
      logError(`Project with ID ${projectId} not found`);
      // 最初に見つかったプロジェクトを代わりに使用
      const firstProject = tasks.find(t => t.isProject);
      if (firstProject) {
        projectId = firstProject.projectId;
      } else {
        throw new Error("No projects available");
      }
    }

    const projectName = project?.name || "Unknown Project";
    const today = new Date().toISOString().split("T")[0];
    const newId = Math.max(...tasks.map(t => t.id), 0) + 1;

    return {
      id: newId,
      name: "",
      level: 1,
      isProject: false,
      startDate: today,
      dueDate: today,
      completed: false,
      assignee: "",
      notes: "",
      expanded: false,
      projectId,
      projectName,
      priority: "medium",
      tags: [],
    };
  };

  // 新しいプロジェクトの作成準備
  const prepareNewProject = (): Task => {
    const newId = Math.max(...tasks.map(t => t.id), 0) + 1;
    const projectId = Math.max(...tasks.filter(t => t.isProject).map(t => t.projectId), 0) + 1;
    const today = new Date().toISOString().split("T")[0];

    return {
      id: newId,
      name: "新しいプロジェクト",
      level: 0,
      isProject: true,
      startDate: today,
      dueDate: today,
      completed: false,
      assignee: "",
      notes: "",
      expanded: true,
      projectId,
      projectName: "新しいプロジェクト",
      priority: "medium",
      tags: [],
      color: "#4a6da7",
    };
  };

  return {
    prepareNewTask,
    prepareNewProject
  };
}