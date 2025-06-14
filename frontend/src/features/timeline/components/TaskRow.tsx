// システムプロンプト準拠：再帰タスク行コンポーネント（単一責任原則）
// 新規作成：タスク行表示のみに特化、再帰呼び出しで任意階層に対応

import React, { useMemo } from 'react'
import { 
  Check, AlertTriangle, Star, ChevronDown, ChevronRight 
} from 'lucide-react'
import { TimelineTask, TimelineProject, DynamicSizes } from '../types'
import { HierarchyConnection } from './HierarchyConnection'
import { 
  calculateHierarchyIndent,
  calculateHierarchyTaskBarSize,
  getHierarchyColorOpacity,
  getHierarchyBorderStyle,
  getHierarchyZIndex,
  getDatePosition,
  getDisplayText
} from '../utils'

interface TaskRowProps {
  task: TimelineTask
  project: TimelineProject
  level: number
  dimensions: DynamicSizes
  timeRange: {
    startDate: Date
    endDate: Date
  }
  viewUnit: 'day' | 'week'
  theme: 'light' | 'dark'
  onToggleTask: (projectId: string, taskId: string) => void
  parentPosition?: {
    x: number
    y: number
    width: number
    height: number
  }
  rowIndex: number
  getTaskPosition: (task: TimelineTask, level: number) => {
    x: number
    y: number
    width: number
    height: number
  }
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  project,
  level,
  dimensions,
  timeRange,
  viewUnit,
  theme,
  onToggleTask,
  parentPosition,
  rowIndex,
  getTaskPosition
}) => {

  // ===== 計算されたスタイル値 =====
  
  const hierarchyIndent = useMemo(() => 
    calculateHierarchyIndent(level, 32, dimensions.zoomRatio),
    [level, dimensions.zoomRatio]
  )

  const taskBarSize = useMemo(() => 
    calculateHierarchyTaskBarSize(level, dimensions.taskBarHeight, dimensions.zoomRatio),
    [level, dimensions.taskBarHeight, dimensions.zoomRatio]
  )

  const colorOpacity = useMemo(() => 
    getHierarchyColorOpacity(level),
    [level]
  )

  const borderStyle = useMemo(() => 
    getHierarchyBorderStyle(level),
    [level]
  )

  const taskPosition = useMemo(() => 
    getTaskPosition(task, level),
    [task, level, getTaskPosition]
  )

  // ===== ステータススタイル計算 =====
  
  const getStatusStyle = useMemo(() => {
    const adjustColorForLevel = (color: string, isBackground = true) => {
      if (color.startsWith('#')) {
        const r = parseInt(color.substr(1, 2), 16)
        const g = parseInt(color.substr(3, 2), 16)
        const b = parseInt(color.substr(5, 2), 16)
        
        if (isBackground) {
          return `rgba(${r}, ${g}, ${b}, ${colorOpacity})`
        } else {
          return `rgba(${r}, ${g}, ${b}, ${Math.min(1, colorOpacity + 0.3)})`
        }
      }
      return color
    }
    
    switch (task.status) {
      case 'completed':
        return {
          backgroundColor: adjustColorForLevel('#10b981'), // green-500
          borderColor: adjustColorForLevel('#059669', false), // green-600
          textColor: level >= 2 ? 'text-gray-700 dark:text-gray-300' : 'text-white'
        }
      case 'in-progress':
        return {
          backgroundColor: adjustColorForLevel(project.color),
          borderColor: adjustColorForLevel(project.color, false),
          textColor: level >= 2 ? 'text-gray-700 dark:text-gray-300' : 'text-white'
        }
      case 'overdue':
        return {
          backgroundColor: adjustColorForLevel('#ef4444'), // red-500
          borderColor: adjustColorForLevel('#dc2626', false), // red-600
          textColor: level >= 2 ? 'text-gray-700 dark:text-gray-300' : 'text-white'
        }
      default:
        return {
          backgroundColor: adjustColorForLevel('#f3f4f6'), // gray-100
          borderColor: adjustColorForLevel('#9ca3af', false), // gray-400
          textColor: 'text-gray-600 dark:text-gray-400'
        }
    }
  }, [task.status, project.color, level, colorOpacity])

  // ===== 表示制御 =====
  
  const hasSubtasks = task.subtasks && task.subtasks.length > 0
  const showExpansionControl = hasSubtasks && dimensions.zoomRatio > 0.3
  const showConnectionLines = level > 0 && parentPosition && dimensions.zoomRatio > 0.3

  // テーマに基づくCSS classes
  const getRowClasses = () => {
    return {
      row: `relative cursor-pointer border-b transition-colors duration-150 ${
        theme === 'dark' 
          ? 'border-gray-700 hover:bg-gray-800/50' 
          : 'border-gray-200 hover:bg-gray-50'
      }`,
      taskBar: `absolute rounded-lg shadow-lg flex items-center transition-all duration-200 hover:shadow-xl group cursor-pointer ${
        task.milestone ? 'hover:scale-105' : 'hover:scale-102'
      }`
    }
  }

  const classes = getRowClasses()

  // ===== タスクバー位置計算 =====
  
  const getTaskBarStyle = () => {
    const startX = getDatePosition(task.startDate, timeRange.startDate, dimensions.cellWidth, viewUnit)
    const endX = getDatePosition(task.dueDate, timeRange.startDate, dimensions.cellWidth, viewUnit)
    const barWidth = Math.max(
      endX - startX + dimensions.cellWidth,
      hasSubtasks ? 120 : 80
    )

    return {
      left: `${startX + hierarchyIndent}px`,
      width: `${barWidth}px`,
      height: `${taskBarSize.height}px`,
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor: getStatusStyle.backgroundColor,
      color: getStatusStyle.textColor,
      borderWidth: `${borderStyle.width}px`,
      borderStyle: borderStyle.style,
      borderColor: getStatusStyle.borderColor,
      opacity: taskBarSize.opacity,
      zIndex: getHierarchyZIndex(level, false),
      overflow: 'visible'
    }
  }

  // ===== 展開制御ボタン =====
  
  const renderExpansionControl = () => {
    if (!showExpansionControl) return null

    return (
      <div 
        className={`flex-shrink-0 mr-3 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 shadow-md border group-hover:shadow-lg ${
          task.expanded 
            ? 'bg-white/40 border-white/50 ring-2 ring-white/30' 
            : 'bg-white/25 border-white/30 hover:bg-white/35 group-hover:bg-white/40'
        }`}
        style={{
          backdropFilter: 'blur(8px)',
          minWidth: `${Math.round(taskBarSize.height * 1.8)}px`,
          height: `${Math.round(taskBarSize.height * 0.9)}px`,
          padding: `${Math.max(2, Math.round(4 * dimensions.zoomRatio))}px ${Math.max(4, Math.round(8 * dimensions.zoomRatio))}px`
        }}
        onClick={(e) => {
          e.stopPropagation()
          onToggleTask(project.id, task.id)
        }}
        title={`${task.expanded ? 'サブタスクを非表示' : 'サブタスクを表示'} (${task.subtasks?.length || 0}件)`}
      >
        <div className="flex items-center justify-center space-x-1.5 h-full">
          <div 
            className="flex items-center justify-center"
            style={{
              width: `${Math.max(8, Math.round(12 * dimensions.zoomRatio))}px`,
              height: `${Math.max(8, Math.round(12 * dimensions.zoomRatio))}px`
            }}
          >
            {task.expanded ? (
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
              {task.subtasks?.length || 0}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ===== ステータスアイコン =====
  
  const renderStatusIcon = () => {
    const iconSize = Math.max(10, Math.round(14 * dimensions.zoomRatio))
    
    if (task.status === 'completed') {
      return <Check size={iconSize} className="mr-2 flex-shrink-0" />
    }
    if (task.status === 'overdue') {
      return <AlertTriangle size={iconSize} className="mr-2 flex-shrink-0" />
    }
    if (task.milestone) {
      return <Star size={iconSize} className="mr-2 flex-shrink-0 text-yellow-200" />
    }
    return null
  }

  // ===== レンダリング =====
  
  return (
    <>
      {/* 階層接続線 */}
      {showConnectionLines && (
        <HierarchyConnection
          parentTask={{ id: 'parent', name: '', level: level - 1 } as TimelineTask}
          childTask={task}
          parentPosition={parentPosition!}
          childPosition={taskPosition}
          level={level}
          zoomRatio={dimensions.zoomRatio}
          theme={theme}
        />
      )}

      {/* タスク行 */}
      <div 
        className={classes.row}
        style={{ 
          height: `${Math.max(dimensions.rowHeight.subtask, taskBarSize.height + 16)}px`,
          overflow: viewUnit === 'week' ? 'visible' : 'hidden' 
        }}
      >
        {/* タスクバー */}
        <div
          className={classes.taskBar}
          style={getTaskBarStyle()}
        >
          {/* ステータスアイコン */}
          <div className="px-3 flex items-center flex-shrink-0">
            {renderStatusIcon()}
          </div>

          {/* タスク名 */}
          <div 
            className="px-2 font-semibold truncate flex-1 flex items-center min-w-0 group-hover:pr-2 transition-all duration-200"
            style={{ fontSize: `${Math.max(dimensions.fontSize.small - level, 8)}px` }}
          >
            <span className="truncate">
              {getDisplayText(
                task.name, 
                Math.round(dimensions.zoomRatio * 100), 
                viewUnit === 'week' ? Math.max(15 - level * 3, 8) : Math.max(12 - level * 2, 6)
              )}
            </span>
          </div>
          
          {/* 展開制御 */}
          {renderExpansionControl()}
        </div>

        {/* レベル表示（デバッグ用、高ズーム時のみ） */}
        {level > 0 && dimensions.zoomRatio > 1.5 && (
          <div
            className="absolute text-xs font-bold opacity-50 pointer-events-none"
            style={{
              left: `${hierarchyIndent - 20}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme === 'dark' ? '#9ca3af' : '#6b7280'
            }}
          >
            L{level}
          </div>
        )}
      </div>

      {/* 子タスクの再帰レンダリング */}
      {task.expanded && hasSubtasks && task.subtasks!.map((subtask, index) => (
        <TaskRow
          key={subtask.id}
          task={subtask}
          project={project}
          level={level + 1}
          dimensions={dimensions}
          timeRange={timeRange}
          viewUnit={viewUnit}
          theme={theme}
          onToggleTask={onToggleTask}
          parentPosition={taskPosition}
          rowIndex={rowIndex + index + 1}
          getTaskPosition={getTaskPosition}
        />
      ))}
    </>
  )
}