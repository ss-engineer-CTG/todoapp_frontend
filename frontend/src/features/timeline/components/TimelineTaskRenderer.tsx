// システムプロンプト準拠：Timeline再帰的タスク表示コンポーネント（新規作成）
// KISS原則：シンプルな再帰レンダリング
// DRY原則：TaskRelationMapベースの統一階層処理

import React, { useMemo, useCallback } from 'react'
import { TimelineTaskRendererProps } from '../types'
import { TimelineTaskRow } from './TimelineTaskRow'
import { TimelineHierarchy } from './TimelineHierarchy'
import { 
  calculateHierarchyDisplayInfo,
  isTaskVisible,
  sortTimelineTasksHierarchically
} from '../utils/hierarchy'
import { getHierarchyVisibilityControls } from '../utils/timeline'
import { logger } from '@core/utils/core'

export const TimelineTaskRenderer: React.FC<TimelineTaskRendererProps> = ({
  project,
  tasks,
  taskRelationMap,
  dimensions,
  timeRange,
  state,
  onToggleTask
}) => {
  
  // 表示制御設定
  const visibilityControls = useMemo(() => 
    getHierarchyVisibilityControls(state.zoomLevel),
    [state.zoomLevel]
  )

  // 表示対象タスクのフィルタリング・ソート
  const displayTasks = useMemo(() => {
    try {
      // プロジェクトに属するタスクのみ抽出
      const projectTasks = tasks.filter(task => task.projectId === project.id)
      
      if (projectTasks.length === 0) {
        return []
      }

      // 階層ソート適用
      const sortedTasks = sortTimelineTasksHierarchically(projectTasks, taskRelationMap)
      
      // 表示可否とレベル制限をチェック
      const visibleTasks = sortedTasks.filter(task => {
        // レベル制限チェック
        if (task.level > visibilityControls.maxVisibleLevel) {
          return false
        }
        
        // 表示可否チェック（親の折り畳み状態考慮）
        if (!isTaskVisible(task, tasks, taskRelationMap)) {
          return false
        }
        
        return true
      })

      logger.info('Display tasks filtered and sorted', {
        projectId: project.id,
        totalProjectTasks: projectTasks.length,
        sortedTasks: sortedTasks.length,
        visibleTasks: visibleTasks.length,
        maxLevel: visibilityControls.maxVisibleLevel
      })

      return visibleTasks

    } catch (error) {
      logger.error('Display tasks filtering failed', { 
        projectId: project.id,
        error 
      })
      return []
    }
  }, [
    tasks, 
    project.id, 
    taskRelationMap, 
    visibilityControls.maxVisibleLevel
  ])

  // 各タスクの階層表示情報計算
  const taskHierarchyInfoMap = useMemo(() => {
    const infoMap = new Map()
    
    try {
      displayTasks.forEach(task => {
        const hierarchyInfo = calculateHierarchyDisplayInfo(
          task,
          tasks,
          taskRelationMap,
          dimensions
        )
        infoMap.set(task.id, hierarchyInfo)
      })

      logger.info('Task hierarchy info calculated', {
        taskCount: displayTasks.length,
        infoMapSize: infoMap.size
      })

    } catch (error) {
      logger.error('Task hierarchy info calculation failed', { error })
    }

    return infoMap
  }, [displayTasks, tasks, taskRelationMap, dimensions])

  // タスクトグル処理
  const handleToggleTask = useCallback((taskId: string) => {
    logger.info('Task toggle requested', { 
      taskId,
      projectId: project.id,
      currentState: tasks.find(t => t.id === taskId)?.collapsed
    })
    onToggleTask(taskId)
  }, [onToggleTask, project.id, tasks])

  // 表示タスクが無い場合
  if (displayTasks.length === 0) {
    return (
      <div 
        className={`relative border-b-2 ${
          state.theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
        }`}
        style={{ height: `${dimensions.rowHeight.project}px` }}
      >
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          <span>このプロジェクトにはタスクがありません</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* 階層接続線描画 */}
      <TimelineHierarchy
        tasks={displayTasks}
        taskRelationMap={taskRelationMap}
        dimensions={dimensions}
        timeRange={timeRange}
        state={state}
      />

      {/* タスク行の再帰的レンダリング */}
      {displayTasks.map(task => {
        const hierarchyInfo = taskHierarchyInfoMap.get(task.id)
        
        // 階層情報が取得できない場合はスキップ
        if (!hierarchyInfo) {
          logger.warn('Hierarchy info not found for task', { taskId: task.id })
          return null
        }

        return (
          <TimelineTaskRow
            key={task.id}
            task={task}
            project={project}
            hierarchyInfo={hierarchyInfo}
            dimensions={dimensions}
            timeRange={timeRange}
            state={state}
            onToggleTask={handleToggleTask}
            taskRelationMap={taskRelationMap} // 追加
          />
        )
      })}

      {/* 階層統計情報（開発時・高ズーム時のみ） */}
      {process.env.NODE_ENV === 'development' && state.zoomLevel > 120 && (
        <div className="absolute bottom-0 right-0 pointer-events-none">
          <div className={`px-2 py-1 rounded text-xs ${
            state.theme === 'dark'
              ? 'bg-gray-900 text-gray-400 border border-gray-700'
              : 'bg-gray-100 text-gray-600 border border-gray-300'
          }`}>
            <div>プロジェクト: {project.name}</div>
            <div>表示タスク: {displayTasks.length}</div>
            <div>階層レベル: {Math.max(...displayTasks.map(t => t.level), 0) + 1}</div>
            <div>最大表示: L{visibilityControls.maxVisibleLevel}</div>
          </div>
        </div>
      )}

      {/* パフォーマンス警告（大量タスク時） */}
      {displayTasks.length > 100 && (
        <div className="absolute top-0 right-0 pointer-events-none">
          <div className={`px-2 py-1 rounded text-xs ${
            state.theme === 'dark'
              ? 'bg-yellow-900 text-yellow-300 border border-yellow-700'
              : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
          }`}>
            ⚠ 大量タスク表示中 ({displayTasks.length}件)
          </div>
        </div>
      )}
    </div>
  )
}