// システムプロンプト準拠：Timeline階層管理・接続線描画コンポーネント（新規作成）
// KISS原則：シンプルな接続線描画ロジック
// DRY原則：計算ロジックの共通化

import React, { useMemo } from 'react'
import { TimelineHierarchyProps } from '../types'
import { 
  calculateConnectionLinePosition,
  getDatePosition,
  calculateHierarchyIndent,
  getHierarchyColor,
  getHierarchyVisibilityControls
} from '../utils/timeline'
import { 
  calculateHierarchyDisplayInfo,
  getAllDescendantTaskIds
} from '../utils/hierarchy'
import { logger } from '@core/utils/core'

export const TimelineHierarchy: React.FC<TimelineHierarchyProps> = ({
  tasks,
  taskRelationMap,
  dimensions,
  timeRange,
  state
}) => {
  
  // 表示制御設定
  const visibilityControls = useMemo(() => 
    getHierarchyVisibilityControls(state.zoomLevel),
    [state.zoomLevel]
  )

  // 接続線情報計算
  const connectionLines = useMemo(() => {
    if (!visibilityControls.showConnectionLines || tasks.length === 0) {
      return []
    }

    const lines: Array<{
      id: string
      parentTask: any
      childTask: any
      coordinates: any
      color: string
      zIndex: number
    }> = []

    try {
      tasks.forEach(task => {
        // 子タスクとの接続線を計算
        const childIds = taskRelationMap.childrenMap[task.id] || []
        
        childIds.forEach(childId => {
          const childTask = tasks.find(t => t.id === childId)
          if (!childTask) return

          // 両方のタスクが表示可能レベルの場合のみ接続線を描画
          if (task.level > visibilityControls.maxVisibleLevel || 
              childTask.level > visibilityControls.maxVisibleLevel) {
            return
          }

          // 親が折り畳まれている場合は子の接続線は描画しない
          if (task.collapsed) return

          const parentStartPos = getDatePosition(
            task.startDate,
            timeRange.startDate,
            dimensions.cellWidth,
            state.viewUnit
          )

          const childStartPos = getDatePosition(
            childTask.startDate,
            timeRange.startDate,
            dimensions.cellWidth,
            state.viewUnit
          )

          const coordinates = calculateConnectionLinePosition(
            task.level,
            childTask.level,
            parentStartPos,
            childStartPos,
            dimensions.zoomRatio
          )

          const lineColor = getHierarchyColor(
            childTask.level, 
            '#6b7280', // gray-500 base
            state.theme
          )

          lines.push({
            id: `${task.id}-${childTask.id}`,
            parentTask: task,
            childTask: childTask,
            coordinates,
            color: lineColor,
            zIndex: Math.max(1, 5 - childTask.level) // 深い階層ほど低いz-index
          })
        })
      })

      logger.info('Connection lines calculated', {
        taskCount: tasks.length,
        connectionCount: lines.length,
        zoomLevel: state.zoomLevel
      })

    } catch (error) {
      logger.error('Connection line calculation failed', { error })
    }

    return lines
  }, [tasks, taskRelationMap, dimensions, timeRange, state.viewUnit, state.zoomLevel, visibilityControls])

  // 階層背景ストライプ
  const hierarchyStripes = useMemo(() => {
    if (!visibilityControls.showConnectionLines || state.zoomLevel <= 40) {
      return []
    }

    const stripes: Array<{
      id: string
      level: number
      left: number
      width: number
      color: string
    }> = []

    try {
      // レベルごとにストライプを生成
      for (let level = 1; level <= visibilityControls.maxVisibleLevel; level++) {
        const levelTasks = tasks.filter(t => t.level === level)
        if (levelTasks.length === 0) continue

        const indentLeft = calculateHierarchyIndent(level, dimensions.zoomRatio)
        const stripeWidth = Math.max(4, Math.round(8 * dimensions.zoomRatio))
        
        const baseColor = level === 1 ? '#e5e7eb' : // gray-200
                         level === 2 ? '#f3f4f6' : // gray-100
                         level === 3 ? '#f9fafb' : // gray-50
                         '#ffffff' // white

        const color = getHierarchyColor(level, baseColor, state.theme)

        stripes.push({
          id: `stripe-level-${level}`,
          level,
          left: indentLeft - stripeWidth / 2,
          width: stripeWidth,
          color
        })
      }
    } catch (error) {
      logger.error('Hierarchy stripe calculation failed', { error })
    }

    return stripes
  }, [tasks, dimensions, state.zoomLevel, state.theme, visibilityControls])

  // 階層レベル表示が無効な場合は何も描画しない
  if (!visibilityControls.showConnectionLines) {
    return null
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* 階層背景ストライプ */}
      {hierarchyStripes.map(stripe => (
        <div
          key={stripe.id}
          className="absolute inset-y-0 opacity-20"
          style={{
            left: `${stripe.left}px`,
            width: `${stripe.width}px`,
            backgroundColor: stripe.color,
            zIndex: 0
          }}
        />
      ))}

      {/* 接続線レンダリング */}
      {connectionLines.map(line => (
        <div key={line.id} className="absolute">
          {/* 垂直接続線 */}
          <div
            className="absolute opacity-70 rounded-full shadow-sm"
            style={{
              left: `${line.coordinates.vertical.left}px`,
              top: `${line.coordinates.vertical.top}px`,
              width: `${line.coordinates.vertical.width}px`,
              height: `${line.coordinates.vertical.height}px`,
              backgroundColor: line.color,
              zIndex: line.zIndex
            }}
          />

          {/* 水平接続線 */}
          <div
            className="absolute opacity-70 rounded-full shadow-sm"
            style={{
              left: `${line.coordinates.horizontal.left}px`,
              top: `${line.coordinates.horizontal.top}px`,
              width: `${line.coordinates.horizontal.width}px`,
              height: `${line.coordinates.horizontal.height}px`,
              backgroundColor: line.color,
              zIndex: line.zIndex
            }}
          />

          {/* 接続点（親側） */}
          <div
            className="absolute rounded-full shadow-sm border border-white dark:border-gray-800"
            style={{
              left: `${line.coordinates.vertical.left - Math.round(3 * dimensions.zoomRatio)}px`,
              top: `${line.coordinates.vertical.top + line.coordinates.vertical.height / 2 - Math.round(3 * dimensions.zoomRatio)}px`,
              width: `${Math.max(6, Math.round(6 * dimensions.zoomRatio))}px`,
              height: `${Math.max(6, Math.round(6 * dimensions.zoomRatio))}px`,
              backgroundColor: line.color,
              zIndex: line.zIndex + 1
            }}
          />

          {/* 接続点（子側） */}
          <div
            className="absolute rounded-full shadow-sm border border-white dark:border-gray-800"
            style={{
              left: `${line.coordinates.horizontal.left + line.coordinates.horizontal.width - Math.round(3 * dimensions.zoomRatio)}px`,
              top: `${line.coordinates.horizontal.top - Math.round(3 * dimensions.zoomRatio)}px`,
              width: `${Math.max(6, Math.round(6 * dimensions.zoomRatio))}px`,
              height: `${Math.max(6, Math.round(6 * dimensions.zoomRatio))}px`,
              backgroundColor: line.color,
              zIndex: line.zIndex + 1
            }}
          />

          {/* 階層レベル表示（デバッグ用・高ズーム時のみ） */}
          {state.zoomLevel > 100 && (
            <div
              className={`absolute text-xs font-bold pointer-events-none ${
                state.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
              style={{
                left: `${line.coordinates.vertical.left + Math.round(8 * dimensions.zoomRatio)}px`,
                top: `${line.coordinates.vertical.top + Math.round(4 * dimensions.zoomRatio)}px`,
                fontSize: `${Math.max(8, Math.round(10 * dimensions.zoomRatio))}px`,
                zIndex: line.zIndex + 2
              }}
            >
              L{line.childTask.level}
            </div>
          )}
        </div>
      ))}

      {/* 階層深度インジケーター（超高ズーム時のみ） */}
      {state.zoomLevel > 150 && (
        <div className="absolute top-2 left-2 pointer-events-none">
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            state.theme === 'dark' 
              ? 'bg-gray-800 text-gray-300 border border-gray-600'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}>
            階層表示: {visibilityControls.maxVisibleLevel}レベルまで
          </div>
        </div>
      )}

      {/* パフォーマンス情報（開発時のみ・超高ズーム時） */}
      {process.env.NODE_ENV === 'development' && state.zoomLevel > 180 && (
        <div className="absolute top-12 left-2 pointer-events-none">
          <div className={`px-2 py-1 rounded text-xs ${
            state.theme === 'dark' 
              ? 'bg-blue-900 text-blue-300 border border-blue-700'
              : 'bg-blue-50 text-blue-700 border border-blue-300'
          }`}>
            接続線: {connectionLines.length}本 | ストライプ: {hierarchyStripes.length}個
          </div>
        </div>
      )}
    </div>
  )
}