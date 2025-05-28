import React from 'react'
import { Check, AlertTriangle, Star, ChevronDown, ChevronRight, Calendar, User } from 'lucide-react'
import { getDatePosition, calculateTaskBarWidth } from '@/utils/timelineUtils'
import { getTaskStatusStyle, getDisplayText, isTaskOverdue } from '@/utils/taskUtils'
import { useTimeline } from '@/hooks/useTimeline'
import { useProjects } from '@/hooks/useProjects'
import { useTasks } from '@/hooks/useTasks'
import { getChildTasks } from '@/utils/taskUtils'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/task'
import type { Project } from '@/types/project'

interface TaskBarProps {
  task: Task
  project: Project
}

const TaskBar: React.FC<TaskBarProps> = ({ task, project }) => {
  const { viewUnit, dateRange, dynamicSizes, zoomLevel } = useTimeline()
  const { toggleTask } = useProjects()
  const { tasks, selectTask, updateTask } = useTasks()
  const [renderError, setRenderError] = React.useState<string | null>(null)

  // タスクバーの位置とサイズを計算
  const taskBarMetrics = React.useMemo(() => {
    try {
      if (!task || !dateRange) {
        throw new Error('タスクまたは日付範囲が無効です')
      }

      const startPosition = getDatePosition(task.startDate, dateRange, viewUnit)
      const barWidth = calculateTaskBarWidth(
        task.startDate,
        task.endDate,
        dateRange,
        viewUnit,
        viewUnit === 'week' ? 100 : 60
      )

      return {
        startPosition: Math.max(0, startPosition),
        barWidth: Math.max(20, barWidth),
        isValid: true
      }
    } catch (error) {
      console.error('Error calculating task bar metrics:', error)
      setRenderError('タスクバーの位置計算中にエラーが発生しました')
      return {
        startPosition: 0,
        barWidth: 100,
        isValid: false
      }
    }
  }, [task, dateRange, viewUnit])

  // サブタスクの取得
  const subtasks = React.useMemo(() => {
    try {
      return getChildTasks(task.id, tasks)
    } catch (error) {
      console.error('Error getting subtasks:', error)
      return []
    }
  }, [task.id, tasks])

  // タスクのスタイルを取得
  const statusStyle = React.useMemo(() => {
    try {
      return getTaskStatusStyle(task.status, project.color, task.milestone, task.level > 0)
    } catch (error) {
      console.error('Error getting task status style:', error)
      return {
        backgroundColor: 'rgba(243, 244, 246, 0.7)',
        borderColor: 'rgba(156, 163, 175, 0.6)',
        textColor: 'text-gray-600 dark:text-gray-400',
        opacity: 1,
        borderWidth: '1px',
        borderStyle: 'solid'
      }
    }
  }, [task.status, project.color, task.milestone, task.level])

  // タスクバーのクリックハンドラー
  const handleTaskBarClick = React.useCallback((event: React.MouseEvent) => {
    try {
      event.stopPropagation()
      const result = selectTask(task.id, event)
      if (!result.success) {
        console.warn('Failed to select task:', result.message)
      }
    } catch (error) {
      console.error('Error handling task bar click:', error)
    }
  }, [task.id, selectTask])

  // 展開/折りたたみのハンドラー
  const handleToggleExpansion = React.useCallback((event: React.MouseEvent) => {
    try {
      event.stopPropagation()
      
      const result = updateTask(task.id, { expanded: !task.expanded })
      if (!result.success) {
        console.warn('Failed to toggle task expansion:', result.message)
      }
    } catch (error) {
      console.error('Error toggling task expansion:', error)
    }
  }, [task.id, task.expanded, updateTask])

  // 追加情報の取得
  const taskInfo = React.useMemo(() => {
    const overdue = isTaskOverdue(task)
    const displayText = getDisplayText(task.name, zoomLevel, viewUnit === 'week' ? 20 : 15)
    
    return {
      isOverdue: overdue,
      displayText,
      hasNotes: Boolean(task.notes && task.notes.trim()),
      hasAssignee: Boolean(task.assignee && task.assignee !== '自分'),
      progress: task.progress || 0
    }
  }, [task, zoomLevel, viewUnit])

  // エラー時は何も表示しない
  if (renderError || !taskBarMetrics.isValid) {
    return null
  }

  return (
    <div className="relative">
      {/* メインタスクバー */}
      <div
        className="relative cursor-pointer border-b border-border/30 hover:bg-accent/10 transition-all duration-150"
        style={{
          height: `${task.level > 0 ? dynamicSizes.rowHeight.subtask : dynamicSizes.rowHeight.task}px`,
          overflow: 'visible'
        }}
      >
        {/* タスクバー本体 */}
        <div
          className={cn(
            "absolute rounded-lg shadow-lg flex items-center transition-all duration-200 hover:shadow-xl group cursor-pointer task-bar",
            task.completed && "opacity-75",
            taskInfo.isOverdue && !task.completed && "ring-1 ring-destructive/50"
          )}
          style={{
            left: `${taskBarMetrics.startPosition}px`,
            width: `${taskBarMetrics.barWidth}px`,
            height: `${Math.max(24, Math.round(dynamicSizes.taskBarHeight * 0.85))}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: statusStyle.backgroundColor,
            borderWidth: statusStyle.borderWidth,
            borderStyle: statusStyle.borderStyle,
            borderColor: statusStyle.borderColor,
            opacity: statusStyle.opacity,
            zIndex: task.milestone ? 15 : task.level > 0 ? 10 : 12,
            minWidth: task.milestone ? '40px' : '60px'
          }}
          onClick={handleTaskBarClick}
          title={`${task.name}${taskInfo.isOverdue ? ' (期限切れ)' : ''}${task.milestone ? ' (マイルストーン)' : ''}${task.completed ? ' (完了)' : ''}`}
        >
          {/* プログレスバー（進行中タスクの場合） */}
          {task.status === 'in-progress' && taskInfo.progress > 0 && (
            <div
              className="absolute left-0 top-0 h-full bg-white/20 rounded-l-lg"
              style={{
                width: `${Math.min(100, taskInfo.progress)}%`,
                zIndex: 1
              }}
            />
          )}

          {/* タスク情報表示エリア */}
          <div
            className="px-3 font-medium truncate flex-1 flex items-center min-w-0 group-hover:pr-2 transition-all duration-200 relative z-10"
            style={{
              fontSize: `${Math.max(10, dynamicSizes.fontSize.small)}px`,
              color: statusStyle.textColor
            }}
          >
            {/* ステータスアイコン */}
            <div className="flex items-center space-x-1 mr-2 flex-shrink-0">
              {task.status === 'completed' && (
                <Check size={Math.max(12, Math.round(16 * dynamicSizes.zoomRatio))} className="text-green-600 dark:text-green-400" />
              )}
              {taskInfo.isOverdue && !task.completed && (
                <AlertTriangle size={Math.max(12, Math.round(16 * dynamicSizes.zoomRatio))} className="text-destructive" />
              )}
              {task.milestone && (
                <Star size={Math.max(12, Math.round(16 * dynamicSizes.zoomRatio))} className="text-yellow-500 fill-current" />
              )}
            </div>

            {/* タスク名 */}
            <span className={cn(
              "truncate",
              task.completed && "line-through"
            )}>
              {taskInfo.displayText}
            </span>

            {/* 追加情報アイコン */}
            {zoomLevel > 60 && (
              <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                {taskInfo.hasNotes && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" title="メモあり" />
                )}
                {taskInfo.hasAssignee && (
                  <User size={10} className="text-muted-foreground" title={`担当: ${task.assignee}`} />
                )}
                {task.priority === 'high' && (
                  <div className="w-2 h-2 bg-red-500 rounded-full" title="高優先度" />
                )}
              </div>
            )}
          </div>

          {/* 展開/折り畳みボタン（サブタスクがある場合） */}
          {subtasks.length > 0 && zoomLevel > 40 && (
            <div
              className={cn(
                "flex-shrink-0 mr-2 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm border flex items-center justify-center",
                task.expanded
                  ? 'bg-white/50 border-white/60 ring-1 ring-white/40'
                  : 'bg-white/30 border-white/40 hover:bg-white/40'
              )}
              style={{
                backdropFilter: 'blur(4px)',
                width: `${Math.max(20, Math.round(dynamicSizes.taskBarHeight * 0.7))}px`,
                height: `${Math.max(20, Math.round(dynamicSizes.taskBarHeight * 0.7))}px`,
              }}
              onClick={handleToggleExpansion}
              title={`${task.expanded ? 'サブタスクを非表示' : 'サブタスクを表示'} (${subtasks.length}件)`}
            >
              <div className="flex items-center justify-center">
                {task.expanded ? (
                  <ChevronDown size={Math.max(12, Math.round(14 * dynamicSizes.zoomRatio))} className="text-white drop-shadow-sm" />
                ) : (
                  <ChevronRight size={Math.max(12, Math.round(14 * dynamicSizes.zoomRatio))} className="text-white drop-shadow-sm" />
                )}
              </div>
              
              {/* サブタスク数インジケーター */}
              {zoomLevel > 80 && (
                <div
                  className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
                  style={{
                    width: `${Math.max(14, Math.round(18 * dynamicSizes.zoomRatio))}px`,
                    height: `${Math.max(14, Math.round(18 * dynamicSizes.zoomRatio))}px`,
                    fontSize: `${Math.max(8, Math.round(10 * dynamicSizes.zoomRatio))}px`
                  }}
                >
                  {subtasks.length}
                </div>
              )}
            </div>
          )}

          {/* ホバー時の詳細情報 */}
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 min-w-64">
            <div className="text-sm font-medium mb-1">{task.name}</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {task.startDate.toLocaleDateString()} - {task.dueDate.toLocaleDateString()}
              </div>
              {task.assignee && task.assignee !== '自分' && (
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  {task.assignee}
                </div>
              )}
              {subtasks.length > 0 && (
                <div>サブタスク: {subtasks.length}件</div>
              )}
              {task.notes && (
                <div className="mt-2 p-2 bg-muted rounded text-xs">
                  {task.notes.length > 100 ? `${task.notes.substring(0, 100)}...` : task.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* サブタスク（展開時のみ） */}
      {task.expanded &&
        subtasks.map((subtask) => (
          <div
            key={subtask.id}
            style={{
              marginTop: `${Math.round(dynamicSizes.rowHeight.subtask * 0.1)}px`
            }}
          >
            <TaskBar task={subtask} project={project} />
          </div>
        ))}
    </div>
  )
}

export default React.memo(TaskBar)