// システムプロンプト準拠：Timeline階層表示専用ヘルパー関数（エラー修正版）
// 🔧 修正内容：不足関数追加、型誤字修正、エクスポート整理

import { TimelineTask, TimelineProject, HierarchyDisplayInfo, DynamicSizes, TimeRange } from '../types'
import { TaskRelationMap } from '@tasklist/types'
import { getDatePosition } from './timeline'
import { logger } from '@core/utils/core'

// ===== 階層表示制御 =====

/**
 * タスクの階層表示情報を計算
 */
export const calculateHierarchyDisplayInfo = (
  task: TimelineTask,
  allTasks: TimelineTask[],
  taskRelationMap: TaskRelationMap,
  dimensions: DynamicSizes
): HierarchyDisplayInfo => {
  try {
    const hasChildren = (taskRelationMap.childrenMap[task.id]?.length || 0) > 0
    
    const baseIndentWidth = Math.max(24, Math.round(32 * dimensions.zoomRatio))
    const indentLeft = task.level * baseIndentWidth
    
    const isVisible = isTaskVisible(task, allTasks, taskRelationMap)
    const connectionInfo = calculateConnectionInfo(task, allTasks, taskRelationMap, dimensions)
    
    return {
      taskId: task.id,
      level: task.level,
      hasChildren,
      isVisible,
      indentLeft,
      connectionInfo
    }
  } catch (error) {
    logger.error('Hierarchy display info calculation failed', { taskId: task.id, error })
    return {
      taskId: task.id,
      level: task.level || 0,
      hasChildren: false,
      isVisible: true,
      indentLeft: 0
    }
  }
}

/**
 * タスクの表示可否判定
 */
export const isTaskVisible = (
  task: TimelineTask,
  allTasks: TimelineTask[],
  taskRelationMap: TaskRelationMap
): boolean => {
  try {
    if (!task.parentId) return true
    
    let currentParentId: string | null = task.parentId
    
    while (currentParentId) {
      const parentTask = allTasks.find(t => t.id === currentParentId)
      if (!parentTask) break
      
      if (parentTask.collapsed) return false
      currentParentId = taskRelationMap.parentMap[currentParentId] || null
    }
    
    return true
  } catch (error) {
    logger.error('Task visibility check failed', { taskId: task.id, error })
    return true
  }
}

/**
 * 接続線描画情報計算
 */
const calculateConnectionInfo = (
  task: TimelineTask,
  allTasks: TimelineTask[],
  taskRelationMap: TaskRelationMap,
  dimensions: DynamicSizes
) => {
  try {
    if (!task.parentId || task.level === 0) return undefined
    
    const parentTask = allTasks.find(t => t.id === task.parentId)
    if (!parentTask) return undefined
    
    const baseIndentWidth = Math.max(24, Math.round(32 * dimensions.zoomRatio))
    const parentLeft = parentTask.level * baseIndentWidth
    
    const lineColor = getConnectionLineColor(task.level, dimensions.zoomRatio)
    
    return {
      showVerticalLine: true,
      showHorizontalLine: true,
      parentLeft,
      lineColor
    }
  } catch (error) {
    logger.error('Connection info calculation failed', { taskId: task.id, error })
    return undefined
  }
}

/**
 * 階層レベルに応じた接続線色計算
 */
const getConnectionLineColor = (level: number, zoomRatio: number): string => {
  const baseOpacity = Math.max(0.3, Math.min(0.8, zoomRatio))
  
  switch (level) {
    case 1: return `rgba(59, 130, 246, ${baseOpacity})`
    case 2: return `rgba(16, 185, 129, ${baseOpacity})`
    case 3: return `rgba(245, 158, 11, ${baseOpacity})`
    default: return `rgba(156, 163, 175, ${baseOpacity})`
  }
}

// ===== 階層フィルタリング =====

/**
 * Timeline表示用タスクフィルタリング
 */
export const filterTimelineTasks = (
  allTasks: TimelineTask[],
  project: TimelineProject,
  showCompleted: boolean,
  taskRelationMap: TaskRelationMap
): TimelineTask[] => {
  try {
    return allTasks.filter((task: TimelineTask) => {
      if (!task.id || !task.projectId) return false
      if (task.projectId !== project.id) return false
      if (!showCompleted && task.completed) return false
      if (task._isDraft) return false
      
      return isTaskVisible(task, allTasks, taskRelationMap)
    })
  } catch (error) {
    logger.error('Timeline task filtering failed', { projectId: project.id, error })
    return []
  }
}

// ===== 階層ソート =====

/**
 * Timeline用階層ソート
 */
export const sortTimelineTasksHierarchically = (
  tasks: TimelineTask[],
  taskRelationMap: TaskRelationMap
): TimelineTask[] => {
  try {
    if (tasks.length === 0) return []

    const sortedTasks: TimelineTask[] = []
    const rootTasks = tasks.filter(task => !task.parentId)
    const sortedRootTasks = rootTasks.sort((a, b) => {
      const dueDateA = new Date(a.dueDate).getTime()
      const dueDateB = new Date(b.dueDate).getTime()
      return dueDateA - dueDateB
    })

    const addTaskWithChildren = (task: TimelineTask) => {
      sortedTasks.push(task)
      
      const childTaskIds = taskRelationMap.childrenMap[task.id] || []
      const childTasks = childTaskIds
        .map(childId => tasks.find(t => t.id === childId))
        .filter((child): child is TimelineTask => child !== undefined)
      
      const sortedChildTasks = childTasks.sort((a, b) => {
        const dueDateA = new Date(a.dueDate).getTime()
        const dueDateB = new Date(b.dueDate).getTime()
        return dueDateA - dueDateB
      })
      
      sortedChildTasks.forEach(child => addTaskWithChildren(child))
    }

    sortedRootTasks.forEach(rootTask => addTaskWithChildren(rootTask))

    logger.info('Timeline hierarchical sorting completed', {
      inputCount: tasks.length,
      outputCount: sortedTasks.length,
      rootTaskCount: rootTasks.length
    })

    return sortedTasks
  } catch (error) {
    logger.error('Timeline hierarchical sorting failed', { error })
    return tasks
  }
}

// ===== 階層操作ヘルパー =====

/**
 * 指定タスクの全子孫タスクID取得
 */
export const getAllDescendantTaskIds = (
  taskId: string,
  taskRelationMap: TaskRelationMap
): string[] => {
  try {
    const descendantIds: string[] = []
    const childIds = taskRelationMap.childrenMap[taskId] || []
    
    childIds.forEach(childId => {
      descendantIds.push(childId)
      descendantIds.push(...getAllDescendantTaskIds(childId, taskRelationMap))
    })
    
    return descendantIds
  } catch (error) {
    logger.error('Get descendant task IDs failed', { taskId, error })
    return []
  }
}

/**
 * 指定タスクの子タスク数取得（再帰的）
 */
export const getChildTaskCount = (
  taskId: string,
  taskRelationMap: TaskRelationMap
): number => {
  try {
    const directChildren = taskRelationMap.childrenMap[taskId] || []
    let totalCount = directChildren.length
    
    directChildren.forEach(childId => {
      totalCount += getChildTaskCount(childId, taskRelationMap)
    })
    
    return totalCount
  } catch (error) {
    logger.error('Get child task count failed', { taskId, error })
    return 0
  }
}

/**
 * 🔧 修正：階層バッジ表示用のカウント計算（追加）
 */
export const calculateHierarchyBadgeCount = (
  taskId: string,
  taskRelationMap: TaskRelationMap
): { directChildren: number, totalDescendants: number } => {
  try {
    const directChildren = taskRelationMap.childrenMap[taskId]?.length || 0
    
    const getTotalDescendants = (id: string): number => {
      const children = taskRelationMap.childrenMap[id] || []
      let total = children.length
      children.forEach(childId => {
        total += getTotalDescendants(childId)
      })
      return total
    }
    
    const totalDescendants = getTotalDescendants(taskId)
    
    return { directChildren, totalDescendants }
  } catch (error) {
    logger.error('Hierarchy badge count calculation failed', { taskId, error })
    return { directChildren: 0, totalDescendants: 0 }
  }
}

/**
 * 階層レベル制限チェック
 */
export const isMaxHierarchyLevel = (level: number, maxLevel: number = 10): boolean => {
  return level >= maxLevel
}

/**
 * 🔧 修正：Timeline用接続線座標計算（型修正）
 */
export const calculateConnectionLineCoordinates = (
  parentTask: TimelineTask,
  childTask: TimelineTask,
  timeRange: TimeRange,
  dimensions: DynamicSizes // 修正: DimensicSizes → DynamicSizes
) => {
  try {
    const parentStartPos = getDatePosition(
      parentTask.startDate,
      timeRange.startDate,
      dimensions.cellWidth,
      'day'
    )
    
    const childStartPos = getDatePosition(
      childTask.startDate,
      timeRange.startDate,
      dimensions.cellWidth,
      'day'
    )
    
    const baseIndentWidth = Math.max(24, Math.round(32 * dimensions.zoomRatio))
    const parentIndent = parentTask.level * baseIndentWidth
    const childIndent = childTask.level * baseIndentWidth
    
    return {
      verticalLine: {
        left: parentStartPos + parentIndent + 20,
        top: 0,
        height: dimensions.rowHeight.task,
        width: Math.max(1, Math.round(2 * dimensions.zoomRatio))
      },
      horizontalLine: {
        left: Math.min(parentStartPos + parentIndent + 20, childStartPos + childIndent),
        top: dimensions.rowHeight.task / 2,
        width: Math.abs(childStartPos + childIndent - (parentStartPos + parentIndent + 20)),
        height: Math.max(1, Math.round(2 * dimensions.zoomRatio))
      }
    }
  } catch (error) {
    logger.error('Connection line coordinates calculation failed', { 
      parentId: parentTask.id, 
      childId: childTask.id, 
      error 
    })
    return null
  }
}

// ===== 表示密度調整 =====

/**
 * ズームレベルに応じた階層表示密度調整
 */
export const getHierarchyDisplayDensity = (zoomLevel: number) => {
  if (zoomLevel <= 30) return 'minimal'
  if (zoomLevel <= 50) return 'compact'
  if (zoomLevel <= 80) return 'reduced'
  return 'full'
}

/**
 * 表示密度に応じた階層制限
 */
export const getMaxDisplayLevel = (density: string): number => {
  switch (density) {
    case 'minimal': return 1
    case 'compact': return 2
    case 'reduced': return 3
    default: return 10
  }
}