import { Project, ProjectStats } from '../types/project';
import { Task } from '../types/task';
import { store } from '../store/store';
import { 
  addProject, 
  updateProject, 
  deleteProject, 
  toggleProject 
} from '../store/slices/projectsSlice';
import { generateId } from '../utils/taskUtils';
import { colorConstants } from '../constants/colorConstants';

/**
 * プロジェクト操作サービス
 * プロジェクトの作成、編集、削除などの操作を行うサービス層
 */
class ProjectService {
  /**
   * 新しいプロジェクトを作成
   */
  createNewProject(projectData: Omit<Project, 'id' | 'tasks' | 'expanded'>): string {
    const projectId = generateId();
    
    // カラーが指定されていない場合はランダムな色を設定
    const color = projectData.color || this.getRandomProjectColor();
    
    store.dispatch(addProject({
      ...projectData,
      color,
      expanded: true
    }));
    
    return projectId;
  }
  
  /**
   * プロジェクトを更新
   */
  updateProjectData(projectId: string, projectData: Partial<Project>): void {
    store.dispatch(updateProject({
      id: projectId,
      project: projectData
    }));
  }
  
  /**
   * プロジェクトを削除
   */
  removeProject(projectId: string): void {
    store.dispatch(deleteProject(projectId));
  }
  
  /**
   * プロジェクトの展開/折りたたみを切り替え
   */
  toggleProjectExpanded(projectId: string): void {
    store.dispatch(toggleProject(projectId));
  }
  
  /**
   * プロジェクトの統計情報を取得
   */
  getProjectStats(projectId: string): ProjectStats | null {
    const { projects } = store.getState().projects;
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return null;
    
    const totalTasks = this.countAllTasks(project);
    const completedTasks = this.countCompletedTasks(project);
    const overdueCount = this.countOverdueTasks(project);
    const completionPercentage = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;
    
    let remainingDays = undefined;
    if (project.endDate) {
      const now = new Date();
      const endDate = new Date(project.endDate);
      if (endDate > now) {
        remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        remainingDays = 0;
      }
    }
    
    return {
      totalTasks,
      completedTasks,
      overdueCount,
      completionPercentage,
      remainingDays
    };
  }
  
  /**
   * すべてのタスク数を計算（サブタスクを含む）
   */
  private countAllTasks(project: Project): number {
    let count = 0;
    
    for (const task of project.tasks) {
      count++; // 親タスクをカウント
      count += task.subtasks.length; // サブタスクをカウント
    }
    
    return count;
  }
  
  /**
   * 完了タスク数を計算（サブタスクを含む）
   */
  private countCompletedTasks(project: Project): number {
    let count = 0;
    
    for (const task of project.tasks) {
      if (task.status === 'completed') {
        count++; // 完了した親タスクをカウント
      }
      
      // 完了したサブタスクをカウント
      count += task.subtasks.filter(st => st.status === 'completed').length;
    }
    
    return count;
  }
  
  /**
   * 遅延タスク数を計算（サブタスクを含む）
   */
  private countOverdueTasks(project: Project): number {
    let count = 0;
    const today = new Date();
    
    for (const task of project.tasks) {
      // 完了タスクは遅延としてカウントしない
      if (task.status !== 'completed') {
        const endDate = new Date(task.end);
        if (endDate < today) {
          count++; // 遅延した親タスクをカウント
        }
      }
      
      // 遅延したサブタスクをカウント
      for (const subtask of task.subtasks) {
        if (subtask.status !== 'completed') {
          const endDate = new Date(subtask.end);
          if (endDate < today) {
            count++;
          }
        }
      }
    }
    
    return count;
  }
  
  /**
   * ランダムなプロジェクトカラーを取得
   */
  getRandomProjectColor(): string {
    const colors = colorConstants.PROJECT_COLORS;
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  /**
   * プロジェクトを取得
   */
  getProject(projectId: string): Project | null {
    const { projects } = store.getState().projects;
    return projects.find(p => p.id === projectId) || null;
  }
  
  /**
   * タスクの追加先プロジェクトの候補を取得
   */
  getProjectOptions() {
    const { projects } = store.getState().projects;
    return projects.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color
    }));
  }
}

export const projectService = new ProjectService();