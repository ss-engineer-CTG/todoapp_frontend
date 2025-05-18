import { Project, Task, SubTask } from '../types/task';
import { formatDateDetailed } from '../utils/dateUtils';

/**
 * データエクスポートサービス
 * タスクやプロジェクトをCSV、JSONなどの形式でエクスポート
 */
class ExportService {
  /**
   * プロジェクトをJSONとしてエクスポート
   */
  exportProjectToJson(project: Project): string {
    return JSON.stringify(project, null, 2);
  }
  
  /**
   * 複数プロジェクトをJSONとしてエクスポート
   */
  exportProjectsToJson(projects: Project[]): string {
    return JSON.stringify(projects, null, 2);
  }
  
  /**
   * プロジェクトをCSVとしてエクスポート
   */
  exportProjectToCsv(project: Project): string {
    const lines: string[] = [];
    
    // CSVヘッダー
    lines.push('プロジェクト名,タスク名,サブタスク名,開始日,終了日,ステータス,備考');
    
    // プロジェクト内の各タスク
    for (const task of project.tasks) {
      // 親タスク行
      lines.push(this.formatCsvLine([
        project.name,
        task.name,
        '', // サブタスク名は空
        formatDateDetailed(task.start),
        formatDateDetailed(task.end),
        this.translateStatus(task.status),
        task.notes || ''
      ]));
      
      // サブタスク行
      for (const subtask of task.subtasks) {
        lines.push(this.formatCsvLine([
          project.name,
          task.name,
          subtask.name,
          formatDateDetailed(subtask.start),
          formatDateDetailed(subtask.end),
          this.translateStatus(subtask.status),
          subtask.notes || ''
        ]));
      }
    }
    
    return lines.join('\n');
  }
  
  /**
   * 複数プロジェクトをCSVとしてエクスポート
   */
  exportProjectsToCsv(projects: Project[]): string {
    const lines: string[] = [];
    
    // CSVヘッダー
    lines.push('プロジェクト名,タスク名,サブタスク名,開始日,終了日,ステータス,備考');
    
    // 各プロジェクト
    for (const project of projects) {
      // プロジェクト内の各タスク
      for (const task of project.tasks) {
        // 親タスク行
        lines.push(this.formatCsvLine([
          project.name,
          task.name,
          '', // サブタスク名は空
          formatDateDetailed(task.start),
          formatDateDetailed(task.end),
          this.translateStatus(task.status),
          task.notes || ''
        ]));
        
        // サブタスク行
        for (const subtask of task.subtasks) {
          lines.push(this.formatCsvLine([
            project.name,
            task.name,
            subtask.name,
            formatDateDetailed(subtask.start),
            formatDateDetailed(subtask.end),
            this.translateStatus(subtask.status),
            subtask.notes || ''
          ]));
        }
      }
    }
    
    return lines.join('\n');
  }
  
  /**
   * タスク一覧をマークダウンとしてエクスポート
   */
  exportTasksToMarkdown(project: Project): string {
    let markdown = `# ${project.name}\n\n`;
    
    // プロジェクトの説明文
    if (project.description) {
      markdown += `${project.description}\n\n`;
    }
    
    // 日付範囲
    if (project.startDate && project.endDate) {
      markdown += `期間: ${formatDateDetailed(project.startDate)} - ${formatDateDetailed(project.endDate)}\n\n`;
    }
    
    // タスク一覧
    markdown += `## タスク一覧\n\n`;
    
    for (const task of project.tasks) {
      // チェックボックス（完了済みの場合はチェック）
      const checkbox = task.status === 'completed' ? '[x]' : '[ ]';
      
      markdown += `- ${checkbox} **${task.name}** (${formatDateDetailed(task.start)} - ${formatDateDetailed(task.end)})\n`;
      
      // タスクの説明
      if (task.notes) {
        markdown += `  - ${task.notes.replace(/\n/g, '\n  - ')}\n`;
      }
      
      // サブタスク
      if (task.subtasks.length > 0) {
        for (const subtask of task.subtasks) {
          const subtaskCheckbox = subtask.status === 'completed' ? '[x]' : '[ ]';
          markdown += `  - ${subtaskCheckbox} ${subtask.name} (${formatDateDetailed(subtask.start)} - ${formatDateDetailed(subtask.end)})\n`;
          
          // サブタスクの説明
          if (subtask.notes) {
            markdown += `    - ${subtask.notes.replace(/\n/g, '\n    - ')}\n`;
          }
        }
      }
      
      markdown += '\n';
    }
    
    return markdown;
  }
  
  /**
   * タスク一覧をHTML形式でエクスポート
   */
  exportTasksToHtml(project: Project): string {
    let html = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${project.name} - タスク一覧</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #333; max-width: 800px; margin: 0 auto; padding: 1rem; }
          h1 { color: #2563eb; }
          h2 { color: #4b5563; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; margin-top: 2rem; }
          .task { margin-bottom: 1rem; padding: 0.5rem; border-left: 3px solid #3b82f6; padding-left: 1rem; }
          .task.completed { border-left-color: #10b981; }
          .task-header { display: flex; justify-content: space-between; align-items: center; }
          .task-title { font-weight: bold; font-size: 1.1rem; }
          .task-date { color: #6b7280; font-size: 0.9rem; }
          .task-status { padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.8rem; }
          .status-completed { background-color: #d1fae5; color: #065f46; }
          .status-in-progress { background-color: #dbeafe; color: #1e40af; }
          .status-not-started { background-color: #f3f4f6; color: #4b5563; }
          .status-overdue { background-color: #fee2e2; color: #b91c1c; }
          .task-notes { color: #6b7280; margin-top: 0.5rem; font-size: 0.9rem; }
          .subtasks { margin-top: 0.5rem; margin-left: 1.5rem; }
          .subtask { margin-bottom: 0.5rem; padding: 0.5rem; border-left: 2px solid #93c5fd; padding-left: 0.75rem; }
          .subtask.completed { border-left-color: #6ee7b7; }
          .subtask-header { display: flex; justify-content: space-between; align-items: center; }
          .subtask-title { font-weight: normal; }
        </style>
      </head>
      <body>
        <h1>${project.name}</h1>
    `;
    
    // プロジェクトの説明文
    if (project.description) {
      html += `<p>${project.description}</p>`;
    }
    
    // 日付範囲
    if (project.startDate && project.endDate) {
      html += `<p>期間: ${formatDateDetailed(project.startDate)} - ${formatDateDetailed(project.endDate)}</p>`;
    }
    
    // タスク一覧
    html += `<h2>タスク一覧</h2>`;
    
    for (const task of project.tasks) {
      const taskStatusClass = `status-${task.status}`;
      const taskStatusText = this.translateStatus(task.status);
      const isCompleted = task.status === 'completed' ? 'completed' : '';
      
      html += `
        <div class="task ${isCompleted}">
          <div class="task-header">
            <div class="task-title">${task.name}</div>
            <div class="task-date">${formatDateDetailed(task.start)} - ${formatDateDetailed(task.end)}</div>
          </div>
          <div class="task-header" style="margin-top: 0.5rem;">
            <span class="task-status ${taskStatusClass}">${taskStatusText}</span>
          </div>
      `;
      
      // タスクの説明
      if (task.notes) {
        html += `<div class="task-notes">${task.notes.replace(/\n/g, '<br>')}</div>`;
      }
      
      // サブタスク
      if (task.subtasks.length > 0) {
        html += `<div class="subtasks">`;
        
        for (const subtask of task.subtasks) {
          const subtaskStatusClass = `status-${subtask.status}`;
          const subtaskStatusText = this.translateStatus(subtask.status);
          const isSubtaskCompleted = subtask.status === 'completed' ? 'completed' : '';
          
          html += `
            <div class="subtask ${isSubtaskCompleted}">
              <div class="subtask-header">
                <div class="subtask-title">${subtask.name}</div>
                <div class="task-date">${formatDateDetailed(subtask.start)} - ${formatDateDetailed(subtask.end)}</div>
              </div>
              <div class="task-header" style="margin-top: 0.5rem;">
                <span class="task-status ${subtaskStatusClass}">${subtaskStatusText}</span>
              </div>
          `;
          
          // サブタスクの説明
          if (subtask.notes) {
            html += `<div class="task-notes">${subtask.notes.replace(/\n/g, '<br>')}</div>`;
          }
          
          html += `</div>`; // subtask
        }
        
        html += `</div>`; // subtasks
      }
      
      html += `</div>`; // task
    }
    
    html += `
      </body>
      </html>
    `;
    
    return html;
  }
  
  /**
   * CSVライン用にデータをフォーマット（ダブルクォートでエスケープ）
   */
  private formatCsvLine(data: string[]): string {
    return data.map(item => {
      // ダブルクォートをエスケープし、全体をダブルクォートで囲む
      const escaped = item.replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',');
  }
  
  /**
   * ステータスを日本語に変換
   */
  private translateStatus(status: string): string {
    switch (status) {
      case 'completed': return '完了';
      case 'in-progress': return '進行中';
      case 'not-started': return '未開始';
      case 'overdue': return '遅延';
      default: return status;
    }
  }
  
  /**
   * データのダウンロード
   */
  downloadData(data: string, filename: string, mimeType: string): void {
    // ブラウザ環境でのみ実行
    if (typeof window !== 'undefined') {
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      
      // リソース解放
      URL.revokeObjectURL(url);
    }
  }
}

export const exportService = new ExportService();