// システムプロンプト準拠：Timeline階層タスク行表示コンポーネント（エラー修正版）
// 🔧 修正内容：インポート修正、バッジ計算修正、TaskRelationMap渡し方修正

import React, { useCallback, useMemo } from 'react'
import { 
  Check, AlertTriangle, Star, ChevronDown, ChevronRight
} from 'lucide-react'
import { TimelineTaskRowProps } from '../types'
import { 
  getDatePosition, 
  getDisplayText,
  calculateHierarchyIndent,
  calculateHierarchyTaskBarHeight,
  calculateHierarchyFontSize,
  getHierarchyColor,
  getHierarchyVisibilityControls,
  calculateHierarchyTaskBarWidth
} from '../utils/timeline'
import { calculateHierarchyBadgeCount } from '../utils/hierarchy' // 修正：正しいインポート
import { logger } from '@core/utils/core'

export const TimelineTaskRow: React.FC<TimelineTaskRowProps> = ({
  task,
  project,
  hierarchyInfo,
  dimensions,
  timeRange,
  state,
  onToggleTask,
  taskRelationMap // 🔧 修正：TaskRelationMapを受け取り
}) => {
  
  const visibilityControls = useMemo(() => 
    getHierarchyVisibilityControls(state.zoomLevel),
    [state.zoomLevel]
  )

  // 🔧 修正：正しいTaskRelationMapを使用
  const badgeInfo = useMemo(() => 
    calculateHierarchyBadgeCount(task.id, taskRelationMap),
    [task.id, taskRelationMap]
  )

  const getStatusStyle = useCallback((
    status: string, 
    projectColor: string, 
    isMilestone = false, 
    taskLevel = 0
  ) => {
    const baseColor = (() => {
      switch (status) {
        case 'completed':
          return isMilestone ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.65)'
        case 'in-progress':
          return projectColor
        case 'overdue':
          return isMilestone ? 'rgba(239, 68, 68, 0.8)' : 'rgba(239, 68, 68, 0.65)'
        default:
          return isMilestone ? 'rgba(156, 163, 175, 0.8)' : 'rgba(156, 163, 175, 0.65)'
      }
    })()

    const hierarchyAdjustedColor = getHierarchyColor(taskLevel, baseColor, state.theme)
    
    return {
      backgroundColor: hierarchyAdjustedColor,
      borderColor: hierarchyAdjustedColor,
      textColor: taskLevel > 1 ? 'text-gray-700 dark:text-gray-300' : 'text-white'
    }
  }, [state.theme])

  const displayStyles = useMemo(() => {
    const status = task.status || 'not-started'
    const statusStyle = getStatusStyle(status, project.color, task.milestone, task.level)
    
    const indentLeft = calculateHierarchyIndent(task.level, dimensions.zoomRatio)
    const taskBarHeight = calculateHierarchyTaskBarHeight(task.level, dimensions.taskBarHeight, dimensions.zoomRatio)
    const fontSize = calculateHierarchyFontSize(task.level, dimensions.fontSize.small)
    
    const startPos = getDatePosition(task.startDate, timeRange.startDate, dimensions.cellWidth, state.viewUnit)
    const taskBarWidth = calculateHierarchyTaskBarWidth(
      task.startDate,
      task.dueDate,
      timeRange.startDate,
      dimensions.cellWidth,
      state.viewUnit,
      task.level,
      dimensions.zoomRatio
    )
    
    return {
      statusStyle,
      indentLeft,
      taskBarHeight,
      fontSize,
      startPos,
      taskBarWidth
    }
  }, [
    task, project.color, dimensions, timeRange, state.viewUnit, getStatusStyle
  ])

  const handleTaskClick = useCallback(() => {
    if (hierarchyInfo.hasChildren) {
      logger.info('Toggling task hierarchy', { 
        taskId: task.id, 
        currentCollapsed: task.collapsed,
        level: task.level 
      })
      onToggleTask(task.id)
    }
  }, [task.id, task.collapsed, task.level, hierarchyInfo.hasChildren, onToggleTask])

  if (task.level > visibilityControls.maxVisibleLevel) {
    return null
  }

  if (!hierarchyInfo.isVisible) {
    return null
  }

  const rowClasses = `
    relative cursor-pointer border-b transition-colors duration-150
    ${state.theme === 'dark' ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'}
    ${task.level > 0 ? 'bg-gray-50/30 dark:bg-gray-900/30' : ''}
  `

  return (
    <div 
      className={rowClasses}
      style={{ 
        height: `${dimensions.rowHeight.task}px`,
        paddingLeft: `${displayStyles.indentLeft}px`
      }}
      onClick={handleTaskClick}
    >
      {/* 階層接続線 */}
      {visibilityControls.showConnectionLines && task.level > 0 && hierarchyInfo.connectionInfo && (
        <>
          <div 
            className="absolute opacity-70 rounded-full"
            style={{
              left: `${hierarchyInfo.connectionInfo.parentLeft + 16}px`,
              top: `-${Math.round(dimensions.rowHeight.task * 0.3)}px`,
              width: `${Math.max(1, Math.round(2 * dimensions.zoomRatio))}px`,
              height: `${Math.round(dimensions.rowHeight.task * 0.8)}px`,
              backgroundColor: hierarchyInfo.connectionInfo.lineColor,
              zIndex: 1
            }}
          />
          
          <div 
            className="absolute opacity-70 rounded-full"
            style={{
              left: `${hierarchyInfo.connectionInfo.parentLeft + 16}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              width: `${Math.abs(displayStyles.indentLeft - hierarchyInfo.connectionInfo.parentLeft - 16)}px`,
              height: `${Math.max(1, Math.round(2 * dimensions.zoomRatio))}px`,
              backgroundColor: hierarchyInfo.connectionInfo.lineColor,
              zIndex: 1
            }}
          />
          
          <div 
            className="absolute rounded-full shadow-sm border border-white dark:border-gray-800"
            style={{
              left: `${displayStyles.indentLeft - 8}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              width: `${Math.max(6, Math.round(8 * dimensions.zoomRatio))}px`,
              height: `${Math.max(6, Math.round(8 * dimensions.zoomRatio))}px`,
              backgroundColor: hierarchyInfo.connectionInfo.lineColor,
              zIndex: 2
            }}
          />
        </>
      )}

      {/* タスクバー */}
      <div
        className="absolute rounded-lg shadow-lg flex items-center transition-all duration-200 hover:shadow-xl hover:scale-105 group"
        style={{ 
          left: `${displayStyles.startPos}px`,
          width: `${displayStyles.taskBarWidth}px`,
          height: `${displayStyles.taskBarHeight}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: displayStyles.statusStyle.backgroundColor,
          color: displayStyles.statusStyle.textColor,
          borderWidth: task.milestone ? '2px' : '1px',
          borderStyle: task.level > 1 ? 'dashed' : 'solid',
          borderColor: displayStyles.statusStyle.borderColor,
          zIndex: task.milestone ? 3 : 2,
          overflow: 'visible'
        }}
      >
        <div 
          className="px-3 font-semibold truncate flex-1 flex items-center min-w-0 group-hover:pr-2 transition-all duration-200"
          style={{ fontSize: `${displayStyles.fontSize}px` }}
        >
          {task.status === 'completed' && (
            <Check size={Math.max(10, Math.round(14 * dimensions.zoomRatio))} className="mr-2 flex-shrink-0" />
          )}
          {task.status === 'overdue' && (
            <AlertTriangle size={Math.max(10, Math.round(14 * dimensions.zoomRatio))} className="mr-2 flex-shrink-0" />
          )}
          {task.milestone && (
            <Star size={Math.max(10, Math.round(14 * dimensions.zoomRatio))} className="mr-2 flex-shrink-0 text-yellow-200" />
          )}
          
          <span className="truncate">
            {getDisplayText(
              task.name, 
              state.zoomLevel, 
              state.viewUnit === 'week' ? Math.max(15, 25 - task.level * 3) : Math.max(10, 20 - task.level * 2)
            )}
          </span>
        </div>
        
        {/* 展開/折り畳みバッジ */}
        {hierarchyInfo.hasChildren && visibilityControls.showHierarchyBadges && (
          <div 
            className={`flex-shrink-0 mr-3 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 shadow-md border group-hover:shadow-lg ${
              !task.collapsed 
                ? 'bg-white/40 border-white/50 ring-2 ring-white/30' 
                : 'bg-white/25 border-white/30 hover:bg-white/35 group-hover:bg-white/40'
            }`}
            style={{
              backdropFilter: 'blur(8px)',
              minWidth: `${Math.round(displayStyles.taskBarHeight * 1.8)}px`,
              height: `${Math.round(displayStyles.taskBarHeight * 0.9)}px`,
              padding: `${Math.max(2, Math.round(4 * dimensions.zoomRatio))}px ${Math.max(4, Math.round(8 * dimensions.zoomRatio))}px`
            }}
            onClick={(e) => {
              e.stopPropagation()
              onToggleTask(task.id)
            }}
            title={`${!task.collapsed ? 'サブタスクを非表示' : 'サブタスクを表示'} (${badgeInfo.directChildren}件)`}
          >
            <div className="flex items-center justify-center space-x-1.5 h-full">
              <div 
                className="flex items-center justify-center"
                style={{
                  width: `${Math.max(8, Math.round(12 * dimensions.zoomRatio))}px`,
                  height: `${Math.max(8, Math.round(12 * dimensions.zoomRatio))}px`
                }}
              >
                {!task.collapsed ? (
                  <ChevronDown size={Math.max(8, Math.round(10 * dimensions.zoomRatio))} className="text-white drop-shadow-lg font-bold" />
                ) : (
                  <ChevronRight size={Math.max(8, Math.round(10 * dimensions.zoomRatio))} className="text-white drop-shadow-lg font-bold" />
                )}
              </div>
              <div 
                className="flex items-center justify-center bg-white/30 rounded-full"
                style={{
                  width: `${Math.max(12, Math.round(16 * dimensions.zoomRatio))}px`,
                  height: `${Math.max(12, Math.round(16 * dimensions.zoomRatio))}px`
                }}
              >
                <span 
                  className="font-bold text-white drop-shadow-lg"
                  style={{
                    fontSize: `${Math.max(6, Math.round(9 * dimensions.zoomRatio))}px`
                  }}
                >
                  {badgeInfo.directChildren}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* サブタスクラベル */}
      {task.level > 1 && visibilityControls.showSubtaskLabels && (
        <div
          className="absolute flex items-center pointer-events-none z-10"
          style={{
            left: `${displayStyles.startPos + displayStyles.taskBarWidth + 8}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            whiteSpace: 'nowrap',
            height: `${displayStyles.taskBarHeight}px`
          }}
        >
          <div 
            className={`px-2 py-0.5 rounded font-medium shadow-sm border opacity-90 ${
              state.theme === 'dark' 
                ? 'bg-gray-800 text-gray-200 border-gray-600' 
                : 'bg-white text-gray-700 border-gray-300'
            }`}
            style={{
              backdropFilter: 'blur(4px)',
              backgroundColor: state.theme === 'dark' ? 'rgba(31, 41, 55, 0.85)' : 'rgba(255, 255, 255, 0.85)',
              fontSize: `${Math.max(8, displayStyles.fontSize)}px`
            }}
          >
            {getDisplayText(task.name, state.zoomLevel, 15)}
          </div>
        </div>
      )}
    </div>
  )
}