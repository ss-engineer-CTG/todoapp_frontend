import React from 'react'
import { useTimeline } from '@/hooks/useTimeline'
import { useProjects } from '@/hooks/useProjects'
import { useTasks } from '@/hooks/useTasks'
import TimelineHeader from '@/components/timeline/TimelineHeader'
import TimelineGrid from '@/components/timeline/TimelineGrid'
import TaskBar from '@/components/timeline/TaskBar'
import ZoomControls from '@/components/timeline/ZoomControls'
import { getDatePosition } from '@/utils/timelineUtils'

const GanttChart: React.FC = () => {
  const { projects } = useProjects()
  const { tasks } = useTasks()
  const {
    viewUnit,
    zoomLevel,
    dynamicSizes,
    visibleDates,
    dateRange,
    scrollLeft,
    setScrollLeft,
    timelineRef,
    setTimelineRef
  } = useTimeline()

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft)
    
    // ヘッダーと同期
    const headerScroll = document.querySelector('.timeline-header')
    if (headerScroll) {
      headerScroll.scrollLeft = e.currentTarget.scrollLeft
    }
  }

  const today = new Date()
  const todayPosition = getDatePosition(today, dateRange, viewUnit)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            {dateRange.label} | ズーム: {zoomLevel}%
          </span>
        </div>
        <ZoomControls />
      </div>

      <TimelineHeader />

      <div
        className="flex-1 relative overflow-auto"
        onScroll={handleScroll}
        ref={setTimelineRef}
      >
        <div
          className="relative"
          style={{
            minWidth: `${
              viewUnit === 'week'
                ? visibleDates.length * dateRange.cellWidth * 7
                : visibleDates.length * dateRange.cellWidth
            }px`
          }}
        >
          <TimelineGrid />

          {/* 今日のインジケーター */}
          <div
            className="absolute top-0 bg-red-500 z-30 shadow-xl"
            style={{
              left: `${todayPosition}px`,
              width: `${Math.max(1, Math.round(2 * dynamicSizes.zoomRatio))}px`,
              height: '100%'
            }}
          >
            <div
              className="absolute top-0 bg-red-500 rounded-full shadow-lg flex items-center justify-center border-2 border-white dark:border-gray-900"
              style={{
                left: `${-Math.round(10 * dynamicSizes.zoomRatio)}px`,
                width: `${Math.max(12, Math.round(20 * dynamicSizes.zoomRatio))}px`,
                height: `${Math.max(12, Math.round(20 * dynamicSizes.zoomRatio))}px`
              }}
            >
              <div
                className="bg-white rounded-full"
                style={{
                  width: `${Math.max(6, Math.round(8 * dynamicSizes.zoomRatio))}px`,
                  height: `${Math.max(6, Math.round(8 * dynamicSizes.zoomRatio))}px`
                }}
              />
            </div>
          </div>

          {/* プロジェクトとタスクのバー */}
          {projects.map((project) => (
            <div key={project.id}>
              {/* プロジェクトヘッダー */}
              <div
                className="relative cursor-pointer transition-colors duration-200 hover:opacity-90"
                style={{
                  height: `${dynamicSizes.rowHeight.project}px`,
                  backgroundColor: `${project.color}${project.color.length === 7 ? '60' : ''}`,
                  borderLeft: `${Math.max(4, Math.round(6 * dynamicSizes.zoomRatio))}px solid ${project.color}`
                }}
              >
                {/* プロジェクト名（固定位置） */}
                <div
                  className="absolute z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 transition-all duration-200"
                  style={{
                    left: `${Math.max(8, Math.min(scrollLeft + 8, scrollLeft + 800 - 200 - 8))}px`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: `${Math.max(4, Math.round(8 * dynamicSizes.zoomRatio))}px`,
                    color: project.color,
                    fontSize: `${dynamicSizes.fontSize.base}px`
                  }}
                >
                  {project.name}
                </div>
              </div>

              {/* タスクバー */}
              {project.expanded &&
                tasks
                  .filter(task => task.projectId === project.id)
                  .map(task => (
                    <TaskBar
                      key={task.id}
                      task={task}
                      project={project}
                    />
                  ))
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GanttChart