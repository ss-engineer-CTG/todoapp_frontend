// システムプロンプト準拠：タイムラインデータ管理フック
// DRY原則：データ処理ロジックの一元化、KISS原則：シンプルなデータ変換

import { useState, useCallback, useMemo } from 'react'
import { Task, Project } from '@core/types'
import { logger } from '@core/utils/core'
import { SAMPLE_TIMELINE_PROJECTS } from '@core/config'

// タイムライン用拡張タスク型
export interface TimelineTask extends Task {
  subtasks?: TimelineTask[]
  expanded?: boolean
  milestone?: boolean
  process?: string
  line?: string
}

// タイムライン用拡張プロジェクト型
export interface TimelineProject extends Project {
  expanded: boolean
  process: string
  line: string
  tasks: TimelineTask[]
}

// データ変換結果型
export interface DataConversionResult {
  success: boolean
  projects: TimelineProject[]
  errors: string[]
  warnings: string[]
}

// フックの戻り値型
export interface UseTimelineDataReturn {
  // データ状態
  projects: TimelineProject[]
  isLoading: boolean
  error: string | null
  
  // データ操作
  setProjects: (projects: TimelineProject[]) => void
  updateProject: (projectId: string, updates: Partial<TimelineProject>) => void
  updateTask: (projectId: string, taskId: string, updates: Partial<TimelineTask>) => void
  
  // プロジェクト操作
  toggleProject: (projectId: string) => void
  expandAllProjects: () => void
  collapseAllProjects: () => void
  
  // タスク操作
  toggleTask: (projectId: string, taskId: string) => void
  expandAllTasks: () => void
  collapseAllTasks: () => void
  
  // データ変換
  convertFromTasklist: (projects: Project[], tasks: Task[]) => DataConversionResult
  convertToTasklist: () => { projects: Project[], tasks: Task[] }
  
  // データリセット
  resetToSampleData: () => void
  clearData: () => void
}

/**
 * タイムラインデータ管理フック
 * システムプロンプト準拠：データ変換・管理の一元化
 */
export const useTimelineData = (
  initialProjects: TimelineProject[] = []
): UseTimelineDataReturn => {

  // データ状態
  const [projects, setProjectsState] = useState<TimelineProject[]>(initialProjects)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // エラーハンドリング付きの安全な状態更新
  const safeUpdate = useCallback((updateFn: () => TimelineProject[]) => {
    try {
      setError(null)
      const updatedProjects = updateFn()
      setProjectsState(updatedProjects)
      return updatedProjects
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'データ更新エラー'
      setError(errorMessage)
      logger.error('Timeline data update failed', { error: err })
      return projects // 既存データを返す
    }
  }, [projects])

  // プロジェクト設定
  const setProjects = useCallback((newProjects: TimelineProject[]) => {
    safeUpdate(() => newProjects)
  }, [safeUpdate])

  // プロジェクト更新
  const updateProject = useCallback((projectId: string, updates: Partial<TimelineProject>) => {
    safeUpdate(() => 
      projects.map(project => 
        project.id === projectId 
          ? { ...project, ...updates }
          : project
      )
    )
  }, [projects, safeUpdate])

  // タスク更新
  const updateTask = useCallback((
    projectId: string, 
    taskId: string, 
    updates: Partial<TimelineTask>
  ) => {
    safeUpdate(() => 
      projects.map(project => {
        if (project.id !== projectId) return project
        
        return {
          ...project,
          tasks: project.tasks.map(task => {
            if (task.id === taskId) {
              return { ...task, ...updates }
            }
            
            // サブタスクの更新もチェック
            if (task.subtasks) {
              return {
                ...task,
                subtasks: task.subtasks.map(subtask =>
                  subtask.id === taskId ? { ...subtask, ...updates } : subtask
                )
              }
            }
            
            return task
          })
        }
      })
    )
  }, [projects, safeUpdate])

  // プロジェクト展開/折り畳み
  const toggleProject = useCallback((projectId: string) => {
    updateProject(projectId, { 
      expanded: !projects.find(p => p.id === projectId)?.expanded 
    })
  }, [projects, updateProject])

  // 全プロジェクト展開
  const expandAllProjects = useCallback(() => {
    safeUpdate(() => 
      projects.map(project => ({ ...project, expanded: true }))
    )
  }, [projects, safeUpdate])

  // 全プロジェクト折り畳み
  const collapseAllProjects = useCallback(() => {
    safeUpdate(() => 
      projects.map(project => ({ ...project, expanded: false }))
    )
  }, [projects, safeUpdate])

  // タスク展開/折り畳み
  const toggleTask = useCallback((projectId: string, taskId: string) => {
    const project = projects.find(p => p.id === projectId)
    const task = project?.tasks.find(t => t.id === taskId)
    
    if (task) {
      updateTask(projectId, taskId, { expanded: !task.expanded })
    }
  }, [projects, updateTask])

  // 全タスク展開
  const expandAllTasks = useCallback(() => {
    safeUpdate(() => 
      projects.map(project => ({
        ...project,
        tasks: project.tasks.map(task => ({ 
          ...task, 
          expanded: true,
          subtasks: task.subtasks?.map(subtask => ({ ...subtask, expanded: true }))
        }))
      }))
    )
  }, [projects, safeUpdate])

  // 全タスク折り畳み
  const collapseAllTasks = useCallback(() => {
    safeUpdate(() => 
      projects.map(project => ({
        ...project,
        tasks: project.tasks.map(task => ({ 
          ...task, 
          expanded: false,
          subtasks: task.subtasks?.map(subtask => ({ ...subtask, expanded: false }))
        }))
      }))
    )
  }, [projects, safeUpdate])

  // タスクリストからタイムライン形式への変換
  const convertFromTasklist = useCallback((
    tasklistProjects: Project[], 
    tasklistTasks: Task[]
  ): DataConversionResult => {
    const errors: string[] = []
    const warnings: string[] = []
    
    try {
      setIsLoading(true)
      
      const timelineProjects: TimelineProject[] = tasklistProjects.map(project => {
        // プロジェクトに属するルートタスクを取得
        const projectTasks = tasklistTasks.filter(task => 
          task.projectId === project.id && !task.parentId
        )
        
        const convertedTasks: TimelineTask[] = projectTasks.map(task => {
          // サブタスクを取得
          const subtasks = tasklistTasks
            .filter(t => t.parentId === task.id)
            .map(subtask => ({
              ...subtask,
              status: subtask.completed ? 'completed' as const : 
                     (subtask.dueDate && new Date() > subtask.dueDate) ? 'overdue' as const :
                     'not-started' as const,
              milestone: false,
              expanded: false
            }))

          // 親タスクのステータス判定
          let status: 'completed' | 'in-progress' | 'not-started' | 'overdue'
          if (task.completed) {
            status = 'completed'
          } else if (task.dueDate && new Date() > task.dueDate) {
            status = 'overdue'
          } else if (subtasks.some(st => st.status === 'in-progress' || st.status === 'completed')) {
            status = 'in-progress'
          } else {
            status = 'not-started'
          }

          return {
            ...task,
            status,
            milestone: false,
            expanded: !task.collapsed,
            subtasks: subtasks.length > 0 ? subtasks : undefined,
            process: 'プロジェクト',
            line: '全体'
          }
        })

        return {
          ...project,
          expanded: !project.collapsed,
          process: 'プロジェクト',
          line: '全体',
          tasks: convertedTasks
        }
      })

      setProjectsState(timelineProjects)
      setError(null)
      
      logger.info('Tasklist to timeline conversion completed', {
        projectCount: timelineProjects.length,
        taskCount: tasklistTasks.length
      })

      return {
        success: true,
        projects: timelineProjects,
        errors,
        warnings
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'データ変換エラー'
      errors.push(errorMessage)
      setError(errorMessage)
      logger.error('Tasklist to timeline conversion failed', { error: err })
      
      return {
        success: false,
        projects: [],
        errors,
        warnings
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // タイムラインからタスクリスト形式への変換
  const convertToTasklist = useCallback((): { projects: Project[], tasks: Task[] } => {
    try {
      const tasklistProjects: Project[] = projects.map(project => ({
        id: project.id,
        name: project.name,
        color: project.color,
        collapsed: !project.expanded,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }))

      const tasklistTasks: Task[] = []
      
      projects.forEach(project => {
        project.tasks.forEach(task => {
          // 親タスクを追加
          tasklistTasks.push({
            id: task.id,
            name: task.name,
            projectId: task.projectId,
            parentId: task.parentId,
            completed: task.status === 'completed',
            startDate: task.startDate,
            dueDate: task.dueDate,
            completionDate: task.completionDate,
            notes: task.notes || '',
            assignee: task.assignee || '自分',
            level: task.level,
            collapsed: !task.expanded,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt
          })

          // サブタスクを追加
          if (task.subtasks) {
            task.subtasks.forEach(subtask => {
              tasklistTasks.push({
                id: subtask.id,
                name: subtask.name,
                projectId: subtask.projectId,
                parentId: task.id, // 親タスクのIDを設定
                completed: subtask.status === 'completed',
                startDate: subtask.startDate,
                dueDate: subtask.dueDate,
                completionDate: subtask.completionDate,
                notes: subtask.notes || '',
                assignee: subtask.assignee || '自分',
                level: (subtask.level || 0) + 1,
                collapsed: !subtask.expanded,
                createdAt: subtask.createdAt,
                updatedAt: subtask.updatedAt
              })
            })
          }
        })
      })

      logger.info('Timeline to tasklist conversion completed', {
        projectCount: tasklistProjects.length,
        taskCount: tasklistTasks.length
      })

      return { projects: tasklistProjects, tasks: tasklistTasks }
      
    } catch (err) {
      logger.error('Timeline to tasklist conversion failed', { error: err })
      return { projects: [], tasks: [] }
    }
  }, [projects])

  // サンプルデータリセット
  const resetToSampleData = useCallback(() => {
    try {
      setIsLoading(true)
      setError(null)
      
      // SAMPLE_TIMELINE_PROJECTS をディープコピー
      const sampleData = JSON.parse(JSON.stringify(SAMPLE_TIMELINE_PROJECTS)) as TimelineProject[]
      setProjectsState(sampleData)
      
      logger.info('Reset to sample data completed')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'サンプルデータ読み込みエラー'
      setError(errorMessage)
      logger.error('Sample data reset failed', { error: err })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // データクリア
  const clearData = useCallback(() => {
    setProjectsState([])
    setError(null)
    logger.info('Timeline data cleared')
  }, [])

  // 統計情報（メモ化）
  const statistics = useMemo(() => {
    const totalProjects = projects.length
    const totalTasks = projects.reduce((sum, project) => sum + project.tasks.length, 0)
    const totalSubtasks = projects.reduce((sum, project) => 
      sum + project.tasks.reduce((taskSum, task) => 
        taskSum + (task.subtasks?.length || 0), 0
      ), 0
    )
    
    return {
      totalProjects,
      totalTasks,
      totalSubtasks,
      totalItems: totalProjects + totalTasks + totalSubtasks
    }
  }, [projects])

  return {
    projects,
    isLoading,
    error,
    setProjects,
    updateProject,
    updateTask,
    toggleProject,
    expandAllProjects,
    collapseAllProjects,
    toggleTask,
    expandAllTasks,
    collapseAllTasks,
    convertFromTasklist,
    convertToTasklist,
    resetToSampleData,
    clearData
  }
}

// 便利なフック：プロジェクト操作のみ
export const useTimelineProjects = (projects: TimelineProject[]) => {
  const [projectStates, setProjectStates] = useState(
    projects.map(p => ({ id: p.id, expanded: p.expanded }))
  )

  const toggleProject = useCallback((projectId: string) => {
    setProjectStates(prev => 
      prev.map(state => 
        state.id === projectId 
          ? { ...state, expanded: !state.expanded }
          : state
      )
    )
  }, [])

  const expandAll = useCallback(() => {
    setProjectStates(prev => prev.map(state => ({ ...state, expanded: true })))
  }, [])

  const collapseAll = useCallback(() => {
    setProjectStates(prev => prev.map(state => ({ ...state, expanded: false })))
  }, [])

  return {
    projectStates,
    toggleProject,
    expandAll,
    collapseAll
  }
}

// 便利なフック：データ変換のみ
export const useTimelineConverter = () => {
  const [isConverting, setIsConverting] = useState(false)
  const [conversionError, setConversionError] = useState<string | null>(null)

  const convertTasklistToTimeline = useCallback(async (
    projects: Project[], 
    tasks: Task[]
  ): Promise<TimelineProject[]> => {
    setIsConverting(true)
    setConversionError(null)
    
    try {
      // 実際の変換ロジック（useTimelineDataと同様）
      const timelineProjects: TimelineProject[] = projects.map(project => {
        const projectTasks = tasks.filter(task => 
          task.projectId === project.id && !task.parentId
        )
        
        const convertedTasks: TimelineTask[] = projectTasks.map(task => {
          const subtasks = tasks
            .filter(t => t.parentId === task.id)
            .map(subtask => ({
              ...subtask,
              status: subtask.completed ? 'completed' as const : 'not-started' as const,
              milestone: false,
              expanded: false
            }))

          return {
            ...task,
            status: task.completed ? 'completed' as const : 'not-started' as const,
            milestone: false,
            expanded: !task.collapsed,
            subtasks: subtasks.length > 0 ? subtasks : undefined
          }
        })

        return {
          ...project,
          expanded: !project.collapsed,
          process: 'プロジェクト',
          line: '全体',
          tasks: convertedTasks
        }
      })

      return timelineProjects
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'データ変換エラー'
      setConversionError(errorMessage)
      throw err
    } finally {
      setIsConverting(false)
    }
  }, [])

  return {
    isConverting,
    conversionError,
    convertTasklistToTimeline
  }
}
