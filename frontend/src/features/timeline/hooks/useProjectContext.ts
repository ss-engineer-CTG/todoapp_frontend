// プロジェクトコンテキスト検出フック
// 選択行からプロジェクト情報を自動判定し、シームレスなタスク作成を支援

import { useMemo, useCallback } from 'react'
import { Task, Project } from '@core/types'
import { logger } from '@core/utils'

export interface ProjectContextInfo {
  // プロジェクト情報
  targetProjectId: string | null
  targetProject: Project | null
  
  // コンテキスト情報
  contextType: 'project-header' | 'task-row' | 'empty' | 'mixed'
  selectedTaskInfo: {
    taskId: string
    task: Task
    level: number
    parentId: string | null
  } | null
  
  // 階層情報
  suggestedLevel: number
  suggestedParentId: string | null
  
  // 信頼度
  confidence: 'high' | 'medium' | 'low'
}

export interface UseProjectContextProps {
  selectedTaskIds: Set<string>
  tasks: Task[]
  projects: Project[]
  lastActiveProjectId?: string | null
}

export interface UseProjectContextReturn {
  // 現在のコンテキスト情報
  contextInfo: ProjectContextInfo
  
  // プロジェクト判定結果
  getTargetProjectForTaskCreation: () => Project | null
  
  // 階層判定結果
  getTaskCreationContext: () => {
    parentId: string | null
    level: number
    contextDescription: string
  }
  
  // コンテキスト検証
  isValidContext: () => boolean
  getContextDescription: () => string
}

export const useProjectContext = (props: UseProjectContextProps): UseProjectContextReturn => {
  const { selectedTaskIds, tasks, projects, lastActiveProjectId } = props
  
  // 選択されたタスクの情報を取得
  const selectedTasks = useMemo(() => {
    return Array.from(selectedTaskIds)
      .map(id => tasks.find(t => t.id === id))
      .filter((task): task is Task => task !== undefined)
  }, [selectedTaskIds, tasks])
  
  // コンテキスト情報を計算
  const contextInfo = useMemo((): ProjectContextInfo => {
    // 選択がない場合
    if (selectedTasks.length === 0) {
      const fallbackProject = lastActiveProjectId ? 
        projects.find(p => p.id === lastActiveProjectId) : 
        projects[0] || null
        
      return {
        targetProjectId: fallbackProject?.id || null,
        targetProject: fallbackProject,
        contextType: 'empty',
        selectedTaskInfo: null,
        suggestedLevel: 0,
        suggestedParentId: null,
        confidence: fallbackProject ? 'medium' : 'low'
      }
    }
    
    // 単一選択の場合
    if (selectedTasks.length === 1) {
      const task = selectedTasks[0]!
      const project = projects.find(p => p.id === task.projectId)
      
      return {
        targetProjectId: project?.id || null,
        targetProject: project || null,
        contextType: 'task-row',
        selectedTaskInfo: {
          taskId: task.id,
          task,
          level: task.level,
          parentId: task.parentId
        },
        suggestedLevel: task.level, // 同レベルでタスク作成
        suggestedParentId: task.parentId, // 同じ親の下に作成
        confidence: 'high'
      }
    }
    
    // 複数選択の場合
    const projectIds = [...new Set(selectedTasks.map(t => t.projectId))]
    
    if (projectIds.length === 1) {
      // 同一プロジェクトの複数タスク選択
      const projectId = projectIds[0]!
      const project = projects.find(p => p.id === projectId)
      const firstTask = selectedTasks[0]!
      
      return {
        targetProjectId: projectId,
        targetProject: project || null,
        contextType: 'task-row',
        selectedTaskInfo: {
          taskId: firstTask.id,
          task: firstTask,
          level: firstTask.level,
          parentId: firstTask.parentId
        },
        suggestedLevel: firstTask.level,
        suggestedParentId: firstTask.parentId,
        confidence: 'medium'
      }
    } else {
      // 複数プロジェクトにまたがる選択
      const firstTask = selectedTasks[0]!
      const project = projects.find(p => p.id === firstTask.projectId)
      
      return {
        targetProjectId: firstTask.projectId,
        targetProject: project || null,
        contextType: 'mixed',
        selectedTaskInfo: {
          taskId: firstTask.id,
          task: firstTask,
          level: firstTask.level,
          parentId: firstTask.parentId
        },
        suggestedLevel: firstTask.level,
        suggestedParentId: firstTask.parentId,
        confidence: 'low'
      }
    }
  }, [selectedTasks, projects, lastActiveProjectId])
  
  // タスク作成対象プロジェクトを取得
  const getTargetProjectForTaskCreation = useCallback((): Project | null => {
    logger.info('Getting target project for task creation', {
      contextType: contextInfo.contextType,
      targetProjectId: contextInfo.targetProjectId,
      confidence: contextInfo.confidence
    })
    
    return contextInfo.targetProject
  }, [contextInfo])
  
  // タスク作成コンテキストを取得
  const getTaskCreationContext = useCallback(() => {
    const { suggestedLevel, suggestedParentId, contextType, selectedTaskInfo } = contextInfo
    
    let contextDescription = ''
    
    switch (contextType) {
      case 'empty':
        contextDescription = 'ルートレベルに新規タスクを作成'
        break
      case 'task-row':
        if (selectedTaskIds.size === 1 && selectedTaskInfo) {
          contextDescription = `「${selectedTaskInfo.task.name}」と同レベルに作成`
        } else {
          contextDescription = `選択タスクと同レベルに作成`
        }
        break
      case 'mixed':
        contextDescription = '複数プロジェクト選択 - 最初のタスクのプロジェクトに作成'
        break
      default:
        contextDescription = 'プロジェクトルートに作成'
    }
    
    logger.info('Task creation context determined', {
      parentId: suggestedParentId,
      level: suggestedLevel,
      contextDescription,
      contextType
    })
    
    return {
      parentId: suggestedParentId,
      level: suggestedLevel,
      contextDescription
    }
  }, [contextInfo, selectedTaskIds.size])
  
  // コンテキストの有効性を確認
  const isValidContext = useCallback((): boolean => {
    return contextInfo.targetProject !== null && contextInfo.confidence !== 'low'
  }, [contextInfo])
  
  // コンテキストの説明を取得
  const getContextDescription = useCallback((): string => {
    const { contextType, targetProject, confidence, selectedTaskInfo } = contextInfo
    
    if (!targetProject) {
      return 'プロジェクトが選択されていません'
    }
    
    const confidenceText = confidence === 'high' ? '' : 
                         confidence === 'medium' ? ' (推定)' : ' (要確認)'
    
    switch (contextType) {
      case 'empty':
        return `${targetProject.name} にルートタスクを作成${confidenceText}`
      case 'task-row':
        if (selectedTaskInfo) {
          return `${targetProject.name} の「${selectedTaskInfo.task.name}」と同レベルに作成${confidenceText}`
        }
        return `${targetProject.name} に作成${confidenceText}`
      case 'mixed':
        return `${targetProject.name} に作成 (複数プロジェクト選択)${confidenceText}`
      default:
        return `${targetProject.name} に作成${confidenceText}`
    }
  }, [contextInfo])
  
  return {
    contextInfo,
    getTargetProjectForTaskCreation,
    getTaskCreationContext,
    isValidContext,
    getContextDescription
  }
}