"use client"

import type { Project, Task } from "@/types/todo"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

export class ExportService {
  // JSON形式でエクスポート
  static exportToJSON(projects: Project[], tasks: Task[]): string {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      projects,
      tasks: tasks.map(task => ({
        ...task,
        startDate: task.startDate.toISOString(),
        dueDate: task.dueDate.toISOString(),
        completionDate: task.completionDate?.toISOString() || null
      }))
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  // CSV形式でエクスポート
  static exportToCSV(projects: Project[], tasks: Task[]): string {
    const headers = [
      'プロジェクト名',
      'タスク名',
      'レベル',
      '完了',
      '開始日',
      '期限日',
      '完了日',
      '担当者',
      'メモ',
      'ステータス'
    ]

    const rows = tasks.map(task => {
      const project = projects.find(p => p.id === task.projectId)
      return [
        project?.name || '',
        task.name,
        task.level.toString(),
        task.completed ? '完了' : '未完了',
        format(task.startDate, 'yyyy/MM/dd', { locale: ja }),
        format(task.dueDate, 'yyyy/MM/dd', { locale: ja }),
        task.completionDate ? format(task.completionDate, 'yyyy/MM/dd', { locale: ja }) : '',
        task.assignee,
        task.notes,
        this.getStatusLabel(task.status || 'not-started')
      ]
    })

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')

    return csvContent
  }

  // Markdown形式でエクスポート
  static exportToMarkdown(projects: Project[], tasks: Task[]): string {
    let markdown = '# プロジェクト・タスク一覧\n\n'
    markdown += `エクスポート日時: ${format(new Date(), 'yyyy年MM月dd日 HH:mm', { locale: ja })}\n\n`

    projects.forEach(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id)
      
      if (projectTasks.length === 0) return

      markdown += `## ${project.name}\n\n`
      
      const rootTasks = projectTasks.filter(task => task.parentId === null)
      
      rootTasks.forEach(rootTask => {
        markdown += this.generateTaskMarkdown(rootTask, projectTasks, 0)
      })
      
      markdown += '\n'
    })

    return markdown
  }

  // タスクのMarkdown生成（再帰）
  private static generateTaskMarkdown(task: Task, allTasks: Task[], depth: number): string {
    const indent = '  '.repeat(depth)
    const checkbox = task.completed ? '[x]' : '[ ]'
    const status = this.getStatusEmoji(task.status || 'not-started')
    
    let markdown = `${indent}- ${checkbox} ${status} **${task.name}**\n`
    
    // タスク詳細
    if (task.notes || task.assignee !== '自分') {
      markdown += `${indent}  - 期限: ${format(task.dueDate, 'yyyy/MM/dd', { locale: ja })}\n`
      if (task.assignee !== '自分') {
        markdown += `${indent}  - 担当: ${task.assignee}\n`
      }
      if (task.notes) {
        markdown += `${indent}  - メモ: ${task.notes}\n`
      }
    }
    
    // 子タスク
    const childTasks = allTasks.filter(t => t.parentId === task.id)
    childTasks.forEach(childTask => {
      markdown += this.generateTaskMarkdown(childTask, allTasks, depth + 1)
    })
    
    return markdown
  }

  // ファイルダウンロード
  static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  // ステータスラベル取得
  private static getStatusLabel(status: Task['status']): string {
    switch (status) {
      case 'completed': return '完了'
      case 'in-progress': return '進行中'
      case 'overdue': return '遅延'
      case 'not-started': 
      default: return '未着手'
    }
  }

  // ステータス絵文字取得
  private static getStatusEmoji(status: Task['status']): string {
    switch (status) {
      case 'completed': return '✅'
      case 'in-progress': return '🔄'
      case 'overdue': return '⚠️'
      case 'not-started': 
      default: return '📋'
    }
  }

  // JSONからインポート
  static importFromJSON(jsonString: string): { projects: Project[], tasks: Task[] } | null {
    try {
      const data = JSON.parse(jsonString)
      
      if (!data.projects || !data.tasks) {
        throw new Error('Invalid data format')
      }
      
      const tasks = data.tasks.map((task: any) => ({
        ...task,
        startDate: new Date(task.startDate),
        dueDate: new Date(task.dueDate),
        completionDate: task.completionDate ? new Date(task.completionDate) : null
      }))
      
      return {
        projects: data.projects,
        tasks
      }
    } catch (error) {
      console.error('Failed to import JSON:', error)
      return null
    }
  }
}