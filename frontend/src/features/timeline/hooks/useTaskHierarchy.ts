// システムプロンプト準拠：階層制御専用フック（単一責任原則）
// 新規作成：階層操作ロジックの集約、状態管理の責任分離

import { useState, useCallback, useMemo } from 'react'
import { TimelineTask, TimelineProject } from '../types'
import { 
  buildTaskHierarchy, 
  flattenHierarchyForDisplay,
  toggleTaskExpansion,
  expandTasksToLevel,
  collapseTasksFromLevel,
  calculateTaskDepth
} from '../utils/hierarchy'
import { logger } from '@core/utils/core'

interface UseTaskHierarchyProps {
  projects: TimelineProject[]
  onProjectsUpdate: (projects: TimelineProject[]) => void
}

interface UseTaskHierarchyReturn {
  // 計算されたデータ
  hierarchicalProjects: TimelineProject[]
  displayTasks: { [projectId: string]: TimelineTask[] }
  hierarchyStats: {
    maxDepth: number
    totalTasks: number
    visibleTasks: number
  }
  
  // 階層制御操作
  toggleTaskAtLevel: (projectId: string, taskId: string) => void
  expandAllToLevel: (level: number) => void
  collapseAllFromLevel: (level: number) => void
  expandProject: (projectId: string) => void
  collapseProject: (projectId: string) => void
  
  // 一括操作
  expandAllProjects: () => void
  collapseAllProjects: () => void
  resetToDefaultExpansion: () => void
  
  // 階層情報取得
  getTaskHierarchyPath: (projectId: string, taskId: string) => string[]
  getTaskLevel: (projectId: string, taskId: string) => number
  getChildrenCount: (projectId: string, taskId: string) => number
}

export const useTaskHierarchy = ({
  projects,
  onProjectsUpdate
}: UseTaskHierarchyProps): UseTaskHierarchyReturn => {

  // ===== 階層データ構築 =====
  
  const hierarchicalProjects = useMemo(() => {
    try {
      return projects.map(project => {
        // フラットなタスク配列から階層構造を構築
        const flatTasks = project.tasks || []
        const hierarchicalTasks = buildTaskHierarchy(flatTasks)
        
        logger.info('Built task hierarchy for project', {
          projectId: project.id,
          flatTaskCount: flatTasks.length,
          hierarchicalTaskCount: hierarchicalTasks.length
        })
        
        return {
          ...project,
          tasks: hierarchicalTasks
        }
      })
    } catch (error) {
      logger.error('Failed to build hierarchical projects', { error })
      return projects
    }
  }, [projects])

  // ===== 表示用フラットデータ =====
  
  const displayTasks = useMemo(() => {
    const result: { [projectId: string]: TimelineTask[] } = {}
    
    hierarchicalProjects.forEach(project => {
      if (project.expanded && project.tasks) {
        result[project.id] = flattenHierarchyForDisplay(project.tasks)
      } else {
        result[project.id] = []
      }
    })
    
    return result
  }, [hierarchicalProjects])

  // ===== 階層統計情報 =====
  
  const hierarchyStats = useMemo(() => {
    let maxDepth = 0
    let totalTasks = 0
    let visibleTasks = 0
    
    hierarchicalProjects.forEach(project => {
      const countTasks = (tasks: TimelineTask[], depth = 0): void => {
        tasks.forEach(task => {
          totalTasks++
          maxDepth = Math.max(maxDepth, depth)
          
          if (project.expanded) {
            visibleTasks++
          }
          
          if (task.subtasks && task.subtasks.length > 0) {
            countTasks(task.subtasks, depth + 1)
          }
        })
      }
      
      if (project.tasks) {
        countTasks(project.tasks)
      }
    })
    
    Object.values(displayTasks).forEach(tasks => {
      visibleTasks += tasks.length
    })
    
    return { maxDepth, totalTasks, visibleTasks }
  }, [hierarchicalProjects, displayTasks])

  // ===== 階層制御操作 =====
  
  /**
   * 特定タスクの展開状態を切り替え
   */
  const toggleTaskAtLevel = useCallback((projectId: string, taskId: string) => {
    try {
      const updatedProjects = hierarchicalProjects.map(project => {
        if (project.id !== projectId) return project
        
        return {
          ...project,
          tasks: project.tasks ? toggleTaskExpansion(project.tasks, taskId) : []
        }
      })
      
      logger.info('Toggled task expansion', { projectId, taskId })
      onProjectsUpdate(updatedProjects)
    } catch (error) {
      logger.error('Failed to toggle task expansion', { projectId, taskId, error })
    }
  }, [hierarchicalProjects, onProjectsUpdate])

  /**
   * 指定レベルまですべてのタスクを展開
   */
  const expandAllToLevel = useCallback((level: number) => {
    try {
      const updatedProjects = hierarchicalProjects.map(project => ({
        ...project,
        expanded: true,
        tasks: project.tasks ? expandTasksToLevel(project.tasks, level) : []
      }))
      
      logger.info('Expanded all tasks to level', { level })
      onProjectsUpdate(updatedProjects)
    } catch (error) {
      logger.error('Failed to expand tasks to level', { level, error })
    }
  }, [hierarchicalProjects, onProjectsUpdate])

  /**
   * 指定レベル以下のすべてのタスクを折り畳み
   */
  const collapseAllFromLevel = useCallback((level: number) => {
    try {
      const updatedProjects = hierarchicalProjects.map(project => ({
        ...project,
        tasks: project.tasks ? collapseTasksFromLevel(project.tasks, level) : []
      }))
      
      logger.info('Collapsed all tasks from level', { level })
      onProjectsUpdate(updatedProjects)
    } catch (error) {
      logger.error('Failed to collapse tasks from level', { level, error })
    }
  }, [hierarchicalProjects, onProjectsUpdate])

  /**
   * 特定プロジェクトのすべてのタスクを展開
   */
  const expandProject = useCallback((projectId: string) => {
    try {
      const updatedProjects = hierarchicalProjects.map(project => {
        if (project.id !== projectId) return project
        
        return {
          ...project,
          expanded: true,
          tasks: project.tasks ? expandTasksToLevel(project.tasks, 999) : []
        }
      })
      
      logger.info('Expanded all tasks in project', { projectId })
      onProjectsUpdate(updatedProjects)
    } catch (error) {
      logger.error('Failed to expand project tasks', { projectId, error })
    }
  }, [hierarchicalProjects, onProjectsUpdate])

  /**
   * 特定プロジェクトのすべてのタスクを折り畳み
   */
  const collapseProject = useCallback((projectId: string) => {
    try {
      const updatedProjects = hierarchicalProjects.map(project => {
        if (project.id !== projectId) return project
        
        return {
          ...project,
          expanded: true, // プロジェクト自体は展開状態を維持
          tasks: project.tasks ? collapseTasksFromLevel(project.tasks, 0) : []
        }
      })
      
      logger.info('Collapsed all tasks in project', { projectId })
      onProjectsUpdate(updatedProjects)
    } catch (error) {
      logger.error('Failed to collapse project tasks', { projectId, error })
    }
  }, [hierarchicalProjects, onProjectsUpdate])

  // ===== 一括操作 =====
  
  /**
   * すべてのプロジェクトとタスクを展開
   */
  const expandAllProjects = useCallback(() => {
    try {
      const updatedProjects = hierarchicalProjects.map(project => ({
        ...project,
        expanded: true,
        tasks: project.tasks ? expandTasksToLevel(project.tasks, 999) : []
      }))
      
      logger.info('Expanded all projects and tasks')
      onProjectsUpdate(updatedProjects)
    } catch (error) {
      logger.error('Failed to expand all projects', { error })
    }
  }, [hierarchicalProjects, onProjectsUpdate])

  /**
   * すべてのプロジェクトとタスクを折り畳み
   */
  const collapseAllProjects = useCallback(() => {
    try {
      const updatedProjects = hierarchicalProjects.map(project => ({
        ...project,
        expanded: false,
        tasks: project.tasks ? collapseTasksFromLevel(project.tasks, 0) : []
      }))
      
      logger.info('Collapsed all projects and tasks')
      onProjectsUpdate(updatedProjects)
    } catch (error) {
      logger.error('Failed to collapse all projects', { error })
    }
  }, [hierarchicalProjects, onProjectsUpdate])

  /**
   * デフォルトの展開状態にリセット
   */
  const resetToDefaultExpansion = useCallback(() => {
    try {
      const updatedProjects = hierarchicalProjects.map(project => ({
        ...project,
        expanded: true,
        tasks: project.tasks ? expandTasksToLevel(project.tasks, 1) : [] // 2階層まで展開
      }))
      
      logger.info('Reset to default expansion state')
      onProjectsUpdate(updatedProjects)
    } catch (error) {
      logger.error('Failed to reset expansion state', { error })
    }
  }, [hierarchicalProjects, onProjectsUpdate])

  // ===== 階層情報取得 =====
  
  /**
   * タスクの階層パスを取得（例: ["プロジェクト", "親タスク", "子タスク"]）
   */
  const getTaskHierarchyPath = useCallback((projectId: string, taskId: string): string[] => {
    const project = hierarchicalProjects.find(p => p.id === projectId)
    if (!project || !project.tasks) return []
    
    const findPath = (tasks: TimelineTask[], path: string[] = []): string[] | null => {
      for (const task of tasks) {
        const currentPath = [...path, task.name]
        
        if (task.id === taskId) {
          return currentPath
        }
        
        if (task.subtasks && task.subtasks.length > 0) {
          const result = findPath(task.subtasks, currentPath)
          if (result) return result
        }
      }
      return null
    }
    
    return findPath(project.tasks) || []
  }, [hierarchicalProjects])

  /**
   * タスクの階層レベルを取得
   */
  const getTaskLevel = useCallback((projectId: string, taskId: string): number => {
    const project = hierarchicalProjects.find(p => p.id === projectId)
    if (!project || !project.tasks) return 0
    
    const findLevel = (tasks: TimelineTask[]): number => {
      for (const task of tasks) {
        if (task.id === taskId) {
          return task.level || 0
        }
        
        if (task.subtasks && task.subtasks.length > 0) {
          const level = findLevel(task.subtasks)
          if (level >= 0) return level
        }
      }
      return -1
    }
    
    return Math.max(0, findLevel(project.tasks))
  }, [hierarchicalProjects])

  /**
   * タスクの直接の子要素数を取得
   */
  const getChildrenCount = useCallback((projectId: string, taskId: string): number => {
    const project = hierarchicalProjects.find(p => p.id === projectId)
    if (!project || !project.tasks) return 0
    
    const findTask = (tasks: TimelineTask[]): TimelineTask | null => {
      for (const task of tasks) {
        if (task.id === taskId) {
          return task
        }
        
        if (task.subtasks && task.subtasks.length > 0) {
          const found = findTask(task.subtasks)
          if (found) return found
        }
      }
      return null
    }
    
    const task = findTask(project.tasks)
    return task?.subtasks?.length || 0
  }, [hierarchicalProjects])

  return {
    // 計算されたデータ
    hierarchicalProjects,
    displayTasks,
    hierarchyStats,
    
    // 階層制御操作
    toggleTaskAtLevel,
    expandAllToLevel,
    collapseAllFromLevel,
    expandProject,
    collapseProject,
    
    // 一括操作
    expandAllProjects,
    collapseAllProjects,
    resetToDefaultExpansion,
    
    // 階層情報取得
    getTaskHierarchyPath,
    getTaskLevel,
    getChildrenCount
  }
}