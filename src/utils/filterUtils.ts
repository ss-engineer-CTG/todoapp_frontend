import { Project, Task, SubTask } from '../types/task';

// タスクをステータスでフィルタリング
export const filterTasksByStatus = (
  tasks: Task[], 
  status: string | string[]
): Task[] => {
  const statusArray = Array.isArray(status) ? status : [status];
  return tasks.filter(task => statusArray.includes(task.status));
};

// 今日のタスクをフィルタリング
export const filterTodayTasks = (tasks: Task[], today: Date): Task[] => {
  return tasks.filter(task => {
    const taskStart = new Date(task.start);
    const taskEnd = new Date(task.end);
    return (today >= taskStart && today <= taskEnd);
  });
};

// 遅延タスクをフィルタリング
export const filterOverdueTasks = (tasks: Task[], today: Date): Task[] => {
  return tasks.filter(task => {
    const taskEnd = new Date(task.end);
    return (taskEnd < today && task.status !== 'completed');
  });
};

// サブタスクがある親タスクのみを取得
export const filterTasksWithSubtasks = (tasks: Task[]): Task[] => {
  return tasks.filter(task => task.subtasks && task.subtasks.length > 0);
};

// サブタスクをステータスでフィルタリング
export const filterSubtasksByStatus = (
  task: Task, 
  status: string | string[]
): SubTask[] => {
  const statusArray = Array.isArray(status) ? status : [status];
  return task.subtasks.filter(subtask => statusArray.includes(subtask.status));
};

// プロジェクトとタスクを日付範囲でフィルタリング
export const filterProjectsByDateRange = (
  projects: Project[], 
  startDate: Date, 
  endDate: Date
): Project[] => {
  return projects.map(project => {
    const filteredTasks = project.tasks.filter(task => {
      const taskStart = new Date(task.start);
      const taskEnd = new Date(task.end);
      
      // タスクの期間が表示範囲と重なっているか
      return !(taskEnd < startDate || taskStart > endDate);
    });
    
    // サブタスクにも同じフィルタリングを適用
    const tasksWithFilteredSubtasks = filteredTasks.map(task => {
      if (!task.subtasks || task.subtasks.length === 0) return task;
      
      const filteredSubtasks = task.subtasks.filter(subtask => {
        const subtaskStart = new Date(subtask.start);
        const subtaskEnd = new Date(subtask.end);
        
        return !(subtaskEnd < startDate || subtaskStart > endDate);
      });
      
      return { ...task, subtasks: filteredSubtasks };
    });
    
    return { ...project, tasks: tasksWithFilteredSubtasks };
  }).filter(project => project.tasks.length > 0); // 空のプロジェクトを除外
};

// テキスト検索でタスクをフィルタリング
export const searchTasks = (
  projects: Project[], 
  searchText: string
): Project[] => {
  if (!searchText.trim()) return projects;
  
  const searchLower = searchText.toLowerCase();
  
  return projects.map(project => {
    // プロジェクト名が検索テキストに一致するか
    const projectMatches = project.name.toLowerCase().includes(searchLower);
    
    const filteredTasks = project.tasks.filter(task => {
      // タスク名かノートが検索テキストに一致するか
      const taskMatches = 
        task.name.toLowerCase().includes(searchLower) || 
        (task.notes && task.notes.toLowerCase().includes(searchLower));
      
      // サブタスクを検索
      const filteredSubtasks = task.subtasks.filter(subtask => 
        subtask.name.toLowerCase().includes(searchLower) || 
        (subtask.notes && subtask.notes.toLowerCase().includes(searchLower))
      );
      
      // サブタスクが一致していれば親タスクも含める
      return taskMatches || filteredSubtasks.length > 0;
    });
    
    // プロジェクトが一致していれば全タスクを含める
    return projectMatches 
      ? project 
      : { ...project, tasks: filteredTasks };
  }).filter(project => project.tasks.length > 0); // 空のプロジェクトを除外
};