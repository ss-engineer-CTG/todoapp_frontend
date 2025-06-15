// システムプロンプト準拠：Timeline統合ユーティリティ（ドラッグ機能対応版）
// 🔧 修正内容：ドラッグ関連エクスポートの追加

import { Task, Project } from '@core/types'
import { TaskRelationMap, TaskChildrenMap } from '../types'
import { logger } from '@core/utils'

// ===== 基本設定 =====
export const ZOOM_CONFIG = {
  min: 50,
  max: 150,
  default: 100,
  step: 10
} as const

// 🆕 追加：ドラッグ関連のエクスポート
export * from './dragHelpers'

// ===== 子タスクマップ構築関数 =====
export const buildTaskChildrenMap = (tasks: Task[], relationMap: TaskRelationMap): TaskChildrenMap => {
  const childrenMap: TaskChildrenMap = {}
  
  tasks.forEach(task => {
    const childrenIds = relationMap.childrenMap[task.id] || []
    childrenMap[task.id] = {
      hasChildren: childrenIds.length > 0,
      childrenCount: childrenIds.length
    }
  })
  
  return childrenMap
}

// ===== 時間範囲計算 =====
export const calculateTimeRange = (viewUnit: 'day' | 'week', today: Date) => {
  const beforeDays = Math.floor(365 * 0.3)
  const afterDays = Math.floor(365 * 0.7)
  
  const rawStartDate = new Date(today)
  rawStartDate.setDate(rawStartDate.getDate() - beforeDays)
  const rawEndDate = new Date(today)
  rawEndDate.setDate(rawEndDate.getDate() + afterDays)
  
  let actualStartDate = rawStartDate
  let actualEndDate = rawEndDate
  
  if (viewUnit === 'week') {
    actualStartDate = new Date(rawStartDate)
    while (actualStartDate.getDay() !== 1) {
      actualStartDate.setDate(actualStartDate.getDate() - 1)
    }
    
    actualEndDate = new Date(rawEndDate)
    while (actualEndDate.getDay() !== 0) {
      actualEndDate.setDate(actualEndDate.getDate() + 1)
    }
  }
  
  return {
    startDate: actualStartDate,
    endDate: actualEndDate,
    rawStartDate,
    rawEndDate,
    unit: viewUnit,
    label: viewUnit === 'day' ? '日表示' : '週表示'
  }
}

// ===== 表示日付配列生成 =====
export const generateVisibleDates = (startDate: Date, endDate: Date, viewUnit: 'day' | 'week') => {
  if (viewUnit === 'week') {
    const weeks = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      weeks.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 7)
    }
    return weeks
  } else {
    const dates = []
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return dates
  }
}

// ===== 境界判定 =====
export const isFirstDayOfMonth = (date: Date, index: number, visibleDates: Date[]): boolean => {
  return index === 0 || (index > 0 && visibleDates[index - 1].getMonth() !== date.getMonth())
}

export const isFirstDayOfWeek = (date: Date): boolean => {
  return date.getDay() === 1
}

// ===== 日付セルクラス取得 =====
export const getDateCellClass = (date: Date, today: Date, theme: string): string => {
  const isToday = date.toDateString() === today.toDateString()
  if (isToday) return theme === 'dark' ? 'bg-yellow-900/40 border-yellow-400' : 'bg-yellow-100 border-yellow-400'
  
  const isWeekendOrHoliday = date.getDay() === 0 || date.getDay() === 6
  if (isWeekendOrHoliday) {
    return theme === 'dark' ? 'bg-gray-800/40' : 'bg-gray-200/60'
  }
  return ''
}

// ===== 週背景色取得 =====
export const getWeekBackground = (date: Date, startDate: Date, theme: string): string => {
  const mondayOfWeek = new Date(date)
  const daysSinceMonday = (date.getDay() + 6) % 7
  mondayOfWeek.setDate(date.getDate() - daysSinceMonday)
  
  const weekNumber = Math.floor((mondayOfWeek.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return weekNumber % 2 === 0 ? 
    (theme === 'dark' ? 'bg-gray-900/60' : 'bg-gray-50/60') : 
    (theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/60')
}

// 全プロジェクト統計計算
export interface ProjectTimelineStats {
  projectId: string
  projectName: string
  projectColor: string
  totalTasks: number
  completedTasks: number
  activeTasks: number
  overdueTasks: number
  completionRate: number
  earliestStartDate: Date | null
  latestDueDate: Date | null
  averageTaskLevel: number
}

export const calculateAllProjectsStats = (
  projects: Project[], 
  tasks: Task[]
): ProjectTimelineStats[] => {
  try {
    logger.info('Calculating timeline statistics for all projects', {
      projectCount: projects.length,
      taskCount: tasks.length
    })

    const stats = projects.map(project => {
      const projectTasks = tasks.filter(task => 
        task.projectId === project.id && !task._isDraft
      )

      const completedTasks = projectTasks.filter(task => task.completed).length
      const activeTasks = projectTasks.filter(task => !task.completed).length
      
      const today = new Date()
      const overdueTasks = projectTasks.filter(task => 
        !task.completed && task.dueDate && new Date(task.dueDate) < today
      ).length

      const validStartDates = projectTasks
        .map(task => task.startDate)
        .filter(date => date && date instanceof Date)
        .sort((a, b) => a.getTime() - b.getTime())
      
      const validDueDates = projectTasks
        .map(task => task.dueDate)
        .filter(date => date && date instanceof Date)
        .sort((a, b) => a.getTime() - b.getTime())

      const totalLevels = projectTasks.reduce((sum, task) => sum + (task.level || 0), 0)
      const averageTaskLevel = projectTasks.length > 0 ? 
        Math.round((totalLevels / projectTasks.length) * 100) / 100 : 0

      const projectStat: ProjectTimelineStats = {
        projectId: project.id,
        projectName: project.name,
        projectColor: project.color,
        totalTasks: projectTasks.length,
        completedTasks,
        activeTasks,
        overdueTasks,
        completionRate: projectTasks.length > 0 ? 
          Math.round((completedTasks / projectTasks.length) * 100) : 0,
        earliestStartDate: validStartDates.length > 0 ? validStartDates[0] : null,
        latestDueDate: validDueDates.length > 0 ? validDueDates[validDueDates.length - 1] : null,
        averageTaskLevel
      }

      logger.debug('Project statistics calculated', {
        projectId: project.id,
        projectName: project.name,
        stats: projectStat
      })

      return projectStat
    })

    const totalStats = {
      totalProjects: stats.length,
      totalTasks: stats.reduce((sum, stat) => sum + stat.totalTasks, 0),
      totalCompleted: stats.reduce((sum, stat) => sum + stat.completedTasks, 0),
      totalOverdue: stats.reduce((sum, stat) => sum + stat.overdueTasks, 0),
      averageCompletionRate: stats.length > 0 ? 
        Math.round(stats.reduce((sum, stat) => sum + stat.completionRate, 0) / stats.length) : 0
    }

    logger.info('All projects timeline statistics completed', {
      ...totalStats,
      topPerformingProjects: stats
        .filter(stat => stat.totalTasks > 0)
        .sort((a, b) => b.completionRate - a.completionRate)
        .slice(0, 3)
        .map(stat => ({
          name: stat.projectName,
          completionRate: stat.completionRate,
          totalTasks: stat.totalTasks
        }))
    })

    return stats
  } catch (error) {
    logger.error('All projects statistics calculation failed', { error })
    return []
  }
}

// プロジェクト横断タイムライン範囲計算
export const calculateCrossProjectTimeRange = (
  tasks: Task[],
  viewUnit: 'day' | 'week'
): {
  globalStartDate: Date
  globalEndDate: Date
  projectDateRanges: { [projectId: string]: { start: Date; end: Date } }
} => {
  try {
    logger.info('Calculating cross-project time range', {
      taskCount: tasks.length,
      viewUnit
    })

    const validTasks = tasks.filter(task => 
      !task._isDraft && 
      task.startDate && 
      task.dueDate &&
      task.startDate instanceof Date &&
      task.dueDate instanceof Date
    )

    if (validTasks.length === 0) {
      const today = new Date()
      return {
        globalStartDate: today,
        globalEndDate: today,
        projectDateRanges: {}
      }
    }

    const allStartDates = validTasks.map(task => task.startDate).sort((a, b) => a.getTime() - b.getTime())
    const allDueDates = validTasks.map(task => task.dueDate).sort((a, b) => a.getTime() - b.getTime())

    const globalStartDate = allStartDates[0]
    const globalEndDate = allDueDates[allDueDates.length - 1]

    const projectDateRanges: { [projectId: string]: { start: Date; end: Date } } = {}
    
    const projectIds = [...new Set(validTasks.map(task => task.projectId))]
    
    projectIds.forEach(projectId => {
      const projectTasks = validTasks.filter(task => task.projectId === projectId)
      const projectStartDates = projectTasks.map(task => task.startDate).sort((a, b) => a.getTime() - b.getTime())
      const projectDueDates = projectTasks.map(task => task.dueDate).sort((a, b) => a.getTime() - b.getTime())
      
      if (projectStartDates.length > 0 && projectDueDates.length > 0) {
        projectDateRanges[projectId] = {
          start: projectStartDates[0],
          end: projectDueDates[projectDueDates.length - 1]
        }
      }
    })

    logger.info('Cross-project time range calculated', {
      globalRange: {
        start: globalStartDate.toISOString().split('T')[0],
        end: globalEndDate.toISOString().split('T')[0]
      },
      projectCount: Object.keys(projectDateRanges).length,
      projectRanges: Object.entries(projectDateRanges).reduce((acc, [projectId, range]) => {
        acc[projectId] = {
          start: range.start.toISOString().split('T')[0],
          end: range.end.toISOString().split('T')[0],
          durationDays: Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24))
        }
        return acc
      }, {} as { [key: string]: { start: string; end: string; durationDays: number } })
    })

    return {
      globalStartDate,
      globalEndDate,
      projectDateRanges
    }
  } catch (error) {
    logger.error('Cross-project time range calculation failed', { error })
    const today = new Date()
    return {
      globalStartDate: today,
      globalEndDate: today,
      projectDateRanges: {}
    }
  }
}

// プロジェクト重複タスク検出
export const detectCrossProjectTaskConflicts = (
  tasks: Task[]
): {
  conflictingTasks: Array<{
    task1: Task
    task2: Task
    conflictType: 'date_overlap' | 'same_assignee_overlap' | 'dependency_conflict'
    severity: 'low' | 'medium' | 'high'
  }>
  conflictSummary: {
    totalConflicts: number
    byProject: { [projectId: string]: number }
    bySeverity: { low: number; medium: number; high: number }
  }
} => {
  try {
    logger.info('Detecting cross-project task conflicts', {
      taskCount: tasks.length
    })

    const validTasks = tasks.filter(task => 
      !task._isDraft && 
      task.startDate && 
      task.dueDate &&
      task.startDate instanceof Date &&
      task.dueDate instanceof Date
    )

    const conflicts: Array<{
      task1: Task
      task2: Task
      conflictType: 'date_overlap' | 'same_assignee_overlap' | 'dependency_conflict'
      severity: 'low' | 'medium' | 'high'
    }> = []

    for (let i = 0; i < validTasks.length; i++) {
      for (let j = i + 1; j < validTasks.length; j++) {
        const task1 = validTasks[i]
        const task2 = validTasks[j]

        if (task1.projectId === task2.projectId) continue

        const task1Start = task1.startDate.getTime()
        const task1End = task1.dueDate.getTime()
        const task2Start = task2.startDate.getTime()
        const task2End = task2.dueDate.getTime()

        const hasDateOverlap = !(task1End < task2Start || task2End < task1Start)
        const sameAssignee = task1.assignee === task2.assignee

        if (hasDateOverlap && sameAssignee) {
          conflicts.push({
            task1,
            task2,
            conflictType: 'same_assignee_overlap',
            severity: 'high'
          })
        } else if (hasDateOverlap) {
          conflicts.push({
            task1,
            task2,
            conflictType: 'date_overlap',
            severity: 'medium'
          })
        }
      }
    }

    const conflictSummary = {
      totalConflicts: conflicts.length,
      byProject: {} as { [projectId: string]: number },
      bySeverity: {
        low: conflicts.filter(c => c.severity === 'low').length,
        medium: conflicts.filter(c => c.severity === 'medium').length,
        high: conflicts.filter(c => c.severity === 'high').length
      }
    }

    conflicts.forEach(conflict => {
      const project1 = conflict.task1.projectId
      const project2 = conflict.task2.projectId
      
      conflictSummary.byProject[project1] = (conflictSummary.byProject[project1] || 0) + 1
      conflictSummary.byProject[project2] = (conflictSummary.byProject[project2] || 0) + 1
    })

    logger.info('Cross-project task conflicts detected', {
      ...conflictSummary,
      highSeverityConflicts: conflicts
        .filter(c => c.severity === 'high')
        .map(c => ({
          task1: { id: c.task1.id, name: c.task1.name, project: c.task1.projectId },
          task2: { id: c.task2.id, name: c.task2.name, project: c.task2.projectId },
          type: c.conflictType
        }))
    })

    return {
      conflictingTasks: conflicts,
      conflictSummary
    }
  } catch (error) {
    logger.error('Cross-project conflict detection failed', { error })
    return {
      conflictingTasks: [],
      conflictSummary: {
        totalConflicts: 0,
        byProject: {},
        bySeverity: { low: 0, medium: 0, high: 0 }
      }
    }
  }
}

// タイムライン表示最適化計算
export const optimizeTimelineDisplay = (
  projects: Project[],
  tasks: Task[],
  viewportWidth: number,
  zoomLevel: number
): {
  recommendedCellWidth: number
  recommendedRowHeight: number
  visibilityRecommendations: {
    showProjectNames: boolean
    showTaskDetails: boolean
    showConnectionLines: boolean
    useCompactMode: boolean
  }
  performanceScore: number
} => {
  try {
    const totalProjects = projects.length
    const totalTasks = tasks.filter(task => !task._isDraft).length
    const avgTasksPerProject = totalProjects > 0 ? totalTasks / totalProjects : 0

    const baseCellWidth = Math.max(20, Math.min(50, viewportWidth / 52))
    const recommendedCellWidth = Math.round(baseCellWidth * (zoomLevel / 100))

    const baseRowHeight = totalTasks > 100 ? 32 : totalTasks > 50 ? 40 : 48
    const recommendedRowHeight = Math.round(baseRowHeight * (zoomLevel / 100))

    const visibilityRecommendations = {
      showProjectNames: totalProjects <= 20,
      showTaskDetails: totalTasks <= 200 && zoomLevel >= 75,
      showConnectionLines: totalTasks <= 100 && zoomLevel >= 50,
      useCompactMode: totalTasks > 150 || totalProjects > 10
    }

    let performanceScore = 100
    if (totalTasks > 500) performanceScore -= 30
    else if (totalTasks > 200) performanceScore -= 15
    if (totalProjects > 20) performanceScore -= 20
    else if (totalProjects > 10) performanceScore -= 10
    if (zoomLevel > 150) performanceScore -= 15
    else if (zoomLevel < 50) performanceScore -= 10

    performanceScore = Math.max(0, Math.min(100, performanceScore))

    logger.info('Timeline display optimization calculated', {
      totalProjects,
      totalTasks,
      avgTasksPerProject: Math.round(avgTasksPerProject * 10) / 10,
      recommendedCellWidth,
      recommendedRowHeight,
      visibilityRecommendations,
      performanceScore
    })

    return {
      recommendedCellWidth,
      recommendedRowHeight,
      visibilityRecommendations,
      performanceScore
    }
  } catch (error) {
    logger.error('Timeline display optimization failed', { error })
    return {
      recommendedCellWidth: 30,
      recommendedRowHeight: 40,
      visibilityRecommendations: {
        showProjectNames: true,
        showTaskDetails: true,
        showConnectionLines: true,
        useCompactMode: false
      },
      performanceScore: 50
    }
  }
}