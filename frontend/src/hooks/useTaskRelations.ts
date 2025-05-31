import { useState, useEffect } from 'react'
import { Task, TaskRelationMap } from '../types'

export const useTaskRelations = (tasks: Task[]) => {
  const initializeTaskRelationMap = (taskList: Task[]): TaskRelationMap => {
    const childrenMap: { [parentId: string]: string[] } = {}
    const parentMap: { [childId: string]: string | null } = {}

    taskList.forEach((task) => {
      if (task.parentId === null) {
        childrenMap["root"] = childrenMap["root"] || []
        childrenMap["root"].push(task.id)
        parentMap[task.id] = null
      } else {
        childrenMap[task.parentId] = childrenMap[task.parentId] || []
        childrenMap[task.parentId].push(task.id)
        parentMap[task.id] = task.parentId
      }
    })

    return { childrenMap, parentMap }
  }

  const [taskRelationMap, setTaskRelationMap] = useState<TaskRelationMap>(
    initializeTaskRelationMap(tasks)
  )

  const updateTaskRelationMap = (updatedTasks: Task[]) => {
    setTaskRelationMap(initializeTaskRelationMap(updatedTasks))
  }

  useEffect(() => {
    updateTaskRelationMap(tasks)
  }, [tasks])

  // システムプロンプト準拠：子タスク存在判定の改善
  const hasChildTasks = (taskId: string): boolean => {
    try {
      const childrenIds = taskRelationMap.childrenMap[taskId]
      return Array.isArray(childrenIds) && childrenIds.length > 0
    } catch (error) {
      console.error('Error checking child tasks', { taskId, error })
      return false
    }
  }

  return {
    taskRelationMap,
    updateTaskRelationMap,
    hasChildTasks
  }
}