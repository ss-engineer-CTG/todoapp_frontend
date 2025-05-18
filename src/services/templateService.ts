import { Template, TemplateApplyOptions } from '../types/template';
import { store } from '../store/store';
import { 
  createTemplate as createTemplateAction, 
  updateTemplate, 
  deleteTemplate 
} from '../store/slices/templatesSlice';
import { taskService } from './taskService';
import { generateId } from '../utils/taskUtils';

/**
 * テンプレート操作サービス
 * タスクテンプレートの作成と適用を行うサービス層
 */
class TemplateService {
  /**
   * 新しいテンプレートを作成
   */
  createNewTemplate(
    name: string, 
    sourceType: 'selection' | 'project', 
    description?: string, 
    sourceId?: string, 
    taskKeys?: string[]
  ): string {
    const templateId = generateId();
    
    // taskCount計算
    let taskCount = 0;
    if (taskKeys && taskKeys.length > 0) {
      taskCount = taskKeys.length;
    } else if (sourceId && sourceType === 'project') {
      const { projects } = store.getState().projects;
      const project = projects.find(p => p.id === sourceId);
      if (project) {
        // プロジェクト内のすべてのタスク数（サブタスクを含む）を計算
        taskCount = project.tasks.reduce((count, task) => {
          return count + 1 + task.subtasks.length;
        }, 0);
      }
    }
    
    // テンプレート作成アクションをディスパッチ
    store.dispatch(createTemplateAction({
      name,
      description: description || '',
      sourceType,
      sourceId,
      taskKeys,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    return templateId;
  }
  
  /**
   * テンプレートを適用
   */
  applyTemplate(
    templateId: string, 
    options: TemplateApplyOptions
  ): string[] {
    const { templates } = store.getState().templates;
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }
    
    const createdTaskIds: string[] = [];
    
    // テンプレートの種類に応じて適用
    if (template.sourceType === 'selection' && template.taskKeys) {
      // 選択ベースのテンプレート
      createdTaskIds.push(...this.applySelectionTemplate(template, options));
    } else if (template.sourceType === 'project' && template.sourceId) {
      // プロジェクトベースのテンプレート
      createdTaskIds.push(...this.applyProjectTemplate(template, options));
    }
    
    return createdTaskIds;
  }
  
  /**
   * 選択ベースのテンプレートを適用
   */
  private applySelectionTemplate(
    template: Template, 
    options: TemplateApplyOptions
  ): string[] {
    const createdTaskIds: string[] = [];
    const { projects } = store.getState().projects;
    const { taskKeys } = template;
    
    if (!taskKeys || taskKeys.length === 0) {
      return createdTaskIds;
    }
    
    // テンプレート作成時の最初のタスクを基準にする
    const [firstProjectId, firstTaskId, firstSubtaskId] = taskKeys[0].split('-');
    let referenceDate: Date | null = null;
    
    // 最初のタスクの開始日を基準にする
    const firstProject = projects.find(p => p.id === firstProjectId);
    if (firstProject) {
      const firstTask = firstProject.tasks.find(t => t.id === firstTaskId);
      if (firstTask) {
        if (firstSubtaskId) {
          const firstSubtask = firstTask.subtasks.find(st => st.id === firstSubtaskId);
          if (firstSubtask) {
            referenceDate = new Date(firstSubtask.start);
          }
        } else {
          referenceDate = new Date(firstTask.start);
        }
      }
    }
    
    // 基準日がなければ今日を使用
    if (!referenceDate) {
      referenceDate = new Date();
    }
    
    const targetStartDate = options.startDate || new Date();
    const dateDiff = Math.ceil(
      (targetStartDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // 各タスクキーに対応するタスクをコピー
    for (const taskKey of taskKeys) {
      const [projectId, taskId, subtaskId] = taskKey.split('-');
      const project = projects.find(p => p.id === projectId);
      
      if (!project) continue;
      
      const task = project.tasks.find(t => t.id === taskId);
      if (!task) continue;
      
      // 完了タスクをスキップするオプションがある場合
      if (!options.includeCompleted) {
        if (subtaskId) {
          const subtask = task.subtasks.find(st => st.id === subtaskId);
          if (subtask && subtask.status === 'completed') {
            continue;
          }
        } else if (task.status === 'completed') {
          continue;
        }
      }
      
      if (subtaskId) {
        // サブタスクを複製
        const subtask = task.subtasks.find(st => st.id === subtaskId);
        if (!subtask) continue;
        
        // 日付を調整
        const start = new Date(subtask.start);
        const end = new Date(subtask.end);
        
        if (options.shiftDates) {
          start.setDate(start.getDate() + dateDiff);
          end.setDate(end.getDate() + dateDiff);
        }
        
        // 親タスクを先に作成（または探す）
        let parentTaskId: string | null = null;
        // 親タスクの検索ロジック...
        
        // サブタスクを作成
        const newSubtaskId = taskService.createNewTask(
          options.targetProjectId,
          {
            name: subtask.name,
            start: start.toISOString(),
            end: end.toISOString(),
            status: 'not-started', // ステータスはリセット
            notes: subtask.notes
          },
          parentTaskId
        );
        
        createdTaskIds.push(`${options.targetProjectId}-${parentTaskId}-${newSubtaskId}`);
      } else {
        // 親タスクを複製
        const start = new Date(task.start);
        const end = new Date(task.end);
        
        if (options.shiftDates) {
          start.setDate(start.getDate() + dateDiff);
          end.setDate(end.getDate() + dateDiff);
        }
        
        const newTaskId = taskService.createNewTask(
          options.targetProjectId,
          {
            name: task.name,
            start: start.toISOString(),
            end: end.toISOString(),
            status: 'not-started', // ステータスはリセット
            notes: task.notes
          }
        );
        
        createdTaskIds.push(`${options.targetProjectId}-${newTaskId}`);
        
        // サブタスクも複製
        for (const subtask of task.subtasks) {
          if (!options.includeCompleted && subtask.status === 'completed') {
            continue;
          }
          
          const subtaskStart = new Date(subtask.start);
          const subtaskEnd = new Date(subtask.end);
          
          if (options.shiftDates) {
            subtaskStart.setDate(subtaskStart.getDate() + dateDiff);
            subtaskEnd.setDate(subtaskEnd.getDate() + dateDiff);
          }
          
          const newSubtaskId = taskService.createNewTask(
            options.targetProjectId,
            {
              name: subtask.name,
              start: subtaskStart.toISOString(),
              end: subtaskEnd.toISOString(),
              status: 'not-started', // ステータスはリセット
              notes: subtask.notes
            },
            newTaskId
          );
          
          createdTaskIds.push(`${options.targetProjectId}-${newTaskId}-${newSubtaskId}`);
        }
      }
    }
    
    return createdTaskIds;
  }
  
  /**
   * プロジェクトベースのテンプレートを適用
   */
  private applyProjectTemplate(
    template: Template, 
    options: TemplateApplyOptions
  ): string[] {
    const createdTaskIds: string[] = [];
    const { projects } = store.getState().projects;
    const { sourceId } = template;
    
    if (!sourceId) {
      return createdTaskIds;
    }
    
    const sourceProject = projects.find(p => p.id === sourceId);
    if (!sourceProject) {
      return createdTaskIds;
    }
    
    // ソースプロジェクトの開始日を取得
    let referenceDate = sourceProject.startDate 
      ? new Date(sourceProject.startDate) 
      : new Date(Math.min(...sourceProject.tasks.map(t => new Date(t.start).getTime())));
    
    const targetStartDate = options.startDate || new Date();
    const dateDiff = Math.ceil(
      (targetStartDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // プロジェクト内のすべてのタスクをコピー
    for (const task of sourceProject.tasks) {
      // 完了タスクをスキップするオプション
      if (!options.includeCompleted && task.status === 'completed') {
        continue;
      }
      
      // 日付を調整
      const start = new Date(task.start);
      const end = new Date(task.end);
      
      if (options.shiftDates) {
        start.setDate(start.getDate() + dateDiff);
        end.setDate(end.getDate() + dateDiff);
      }
      
      // 新しいタスクを作成
      const newTaskId = taskService.createNewTask(
        options.targetProjectId,
        {
          name: task.name,
          start: start.toISOString(),
          end: end.toISOString(),
          status: 'not-started', // ステータスはリセット
          notes: task.notes
        }
      );
      
      createdTaskIds.push(`${options.targetProjectId}-${newTaskId}`);
      
      // サブタスクも複製
      for (const subtask of task.subtasks) {
        if (!options.includeCompleted && subtask.status === 'completed') {
          continue;
        }
        
        const subtaskStart = new Date(subtask.start);
        const subtaskEnd = new Date(subtask.end);
        
        if (options.shiftDates) {
          subtaskStart.setDate(subtaskStart.getDate() + dateDiff);
          subtaskEnd.setDate(subtaskEnd.getDate() + dateDiff);
        }
        
        const newSubtaskId = taskService.createNewTask(
          options.targetProjectId,
          {
            name: subtask.name,
            start: subtaskStart.toISOString(),
            end: subtaskEnd.toISOString(),
            status: 'not-started', // ステータスはリセット
            notes: subtask.notes
          },
          newTaskId
        );
        
        createdTaskIds.push(`${options.targetProjectId}-${newTaskId}-${newSubtaskId}`);
      }
    }
    
    return createdTaskIds;
  }
  
  /**
   * テンプレートを更新
   */
  updateTemplateData(templateId: string, data: Partial<Template>): void {
    store.dispatch(updateTemplate({
      id: templateId,
      template: data
    }));
  }
  
  /**
   * テンプレートを削除
   */
  removeTemplate(templateId: string): void {
    store.dispatch(deleteTemplate(templateId));
  }
  
  /**
   * テンプレート一覧を取得
   */
  getTemplates(): Template[] {
    const { templates } = store.getState().templates;
    return templates;
  }
  
  /**
   * テンプレートを検索
   */
  searchTemplates(searchText: string): Template[] {
    const { templates } = store.getState().templates;
    
    if (!searchText.trim()) {
      return templates;
    }
    
    const lowerText = searchText.toLowerCase();
    return templates.filter(template => 
      template.name.toLowerCase().includes(lowerText) || 
      template.description.toLowerCase().includes(lowerText)
    );
  }
}

export const templateService = new TemplateService();