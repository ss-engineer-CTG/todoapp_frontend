import React from 'react'
import { Check, AlertTriangle, Star, ChevronDown, ChevronRight } from 'lucide-react'
import { getDatePosition } from '@/utils/timelineUtils'
import { getTaskStatusStyle, getDisplayText } from '@/utils/taskUtils'
import { useTimeline } from '@/hooks/useTimeline'
import { useProjects } from '@/hooks/useProjects'
import { useTasks } from '@/hooks/useTasks'
import type { Task, Project } from '@/types'

interface TaskBarProps {
  task: Task
  project: Project
}

const TaskBar: React.FC<TaskBarProps> = ({ task, project }) => {
  const { viewUnit, dateRange, dynamicSizes, zoomLevel } = useTimeline()
  const { toggleTask } = useProjects()
  const { tasks } = useTasks()

  const startPosition = getDatePosition(task.startDate, dateRange, viewUnit)
  const endPosition = getDatePosition(task.endDate, dateRange, viewUnit)
  const barWidth = Math.max(
    endPosition - startPosition + dateRange.cellWidth,
    viewUnit === 'week' ? 120 : 80
  )

  const statusStyle = getTaskStatusStyle(task.status, project.color, task.milestone, task.level > 0)
  const subtasks = tasks.filter(t => t.parentId === task.id)

  return (
    <div>
      {/* メインタスクバー */}
      <div
        className="relative cursor-pointer border-b hover:bg-accent/20 transition-colors duration-150"
        style={{
          height: `${task.level > 0 ? dynamicSizes.rowHeight.subtask : dynamicSizes.rowHeight.task}px`,
          overflow: viewUnit === 'week' ? 'visible' : 'hidden'
        }}
      >
        {/* タスクバー */}
        <div
          className="absolute rounded-lg shadow-lg flex items-center transition-all duration-200 hover:shadow-xl hover:scale-105 group cursor-pointer"
          style={{
            left: `${startPosition}px`,
            width: `${barWidth}px`,
            height: `${Math.round(dynamicSizes.taskBarHeight * 0.8)}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: statusStyle.backgroundColor,
            borderWidth: statusStyle.borderWidth,
            borderStyle: statusStyle.borderStyle,
            borderColor: statusStyle.borderColor,
            opacity: statusStyle.opacity,
            zIndex: task.milestone ? 3 : 2,
            overflow: 'visible'
          }}
        >
          {/* タスク情報 */}
          <div
            className="px-4 font-semibold truncate flex-1 flex items-center min-w-0 group-hover:pr-2 transition-all duration-200"
            style={{
              fontSize: `${dynamicSizes.fontSize.small}px`,
              color: statusStyle.textColor
            }}
          >
            {task.status === 'completed' && (
              <Check size={Math.max(10, Math.round(14 * dynamicSizes.zoomRatio))} className="mr-2 flex-shrink-0" />
            )}
            {task.status === 'overdue' && (
              <AlertTriangle size={Math.max(10, Math.round(14 * dynamicSizes.zoomRatio))} className="mr-2 flex-shrink-0" />
            )}
            {task.milestone && (
              <Star size={Math.max(10, Math.round(14 * dynamicSizes.zoomRatio))} className="mr-2 flex-shrink-0 text-yellow-400" />
            )}
            <span className="truncate">
              {getDisplayText(task.name, zoomLevel, viewUnit === 'week' ? 20 : 15)}
            </span>
          </div>

          {/* 展開/折り畳みボタン（サブタスクがある場合） */}
          {subtasks.length > 0 && zoomLevel > 30 && (
            <div
              className={`flex-shrink-0 mr-3 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 shadow-md border group-hover:shadow-lg ${
                task.expanded
                  ? 'bg-white/40 border-white/50 ring-2 ring-white/30'
                  : 'bg-white/25 border-white/30 hover:bg-white/35 group-hover:bg-white/40'
              }`}
              style={{
                backdropFilter: 'blur(8px)',
                minWidth: `${Math.round(dynamicSizes.taskBarHeight * 0.8 * 1.8)}px`,
                height: `${Math.round(dynamicSizes.taskBarHeight * 0.8 * 0.9)}px`,
                padding: `${Math.max(2, Math.round(4 * dynamicSizes.zoomRatio))}px ${Math.max(4, Math.round(8 * dynamicSizes.zoomRatio))}px`
              }}
              onClick={(e) => {
                e.stopPropagation()
                toggleTask(project.id, task.id)
              }}
              title={`${task.expanded ? 'サブタスクを非表示' : 'サブタスクを表示'} (${subtasks.length}件)`}
            >
              <div className="flex items-center justify-center space-x-1.5 h-full">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: `${Math.max(8, Math.round(12 * dynamicSizes.zoomRatio))}px`,
                    height: `${Math.max(8, Math.round(12 * dynamicSizes.zoomRatio))}px`
                  }}
                >
                  {task.expanded ? (
                    <ChevronDown size={Math.max(8, Math.round(10 * dynamicSizes.zoomRatio))} className="text-white drop-shadow-lg font-bold" />
                  ) : (
                    <ChevronRight size={Math.max(8, Math.round(10 * dynamicSizes.zoomRatio))} className="text-white drop-shadow-lg font-bold" />
                  )}
                </div>
                <div
                  className="flex items-center justify-center bg-white/30 rounded-full"
                  style={{
                    width: `${Math.max(12, Math.round(16 * dynamicSizes.zoomRatio))}px`,
                    height: `${Math.max(12, Math.round(16 * dynamicSizes.zoomRatio))}px`
                  }}
                >
                  <span
                    className="font-bold text-white drop-shadow-lg"
                    style={{
                      fontSize: `${Math.max(6, Math.round(9 * dynamicSizes.zoomRatio))}px`
                    }}
                  >
                    {subtasks.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* サブタスク */}
      {task.expanded &&
        subtasks.map((subtask, subtaskIndex) => (
          <TaskBar key={subtask.id} task={subtask} project={project} />
        ))}
    </div>
  )
}

export default TaskBar