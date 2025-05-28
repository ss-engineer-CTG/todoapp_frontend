import React from 'react'
import { useTimeline } from '@/hooks/useTimeline'
import { useProjects } from '@/hooks/useProjects'
import { useTasks } from '@/hooks/useTasks'
import TimelineHeader from '@/components/timeline/TimelineHeader'
import TimelineGrid from '@/components/timeline/TimelineGrid'
import TaskBar from '@/components/timeline/TaskBar'
import ZoomControls from '@/components/timeline/ZoomControls'
import ErrorMessage from '@/components/common/ErrorMessage'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { getDatePosition } from '@/utils/timelineUtils'
import { cn } from '@/lib/utils'

const GanttChart: React.FC = () => {
  const { projects } = useProjects()
  const { tasks, filteredTasks, error: taskError } = useTasks()
  const {
    viewUnit,
    zoomLevel,
    dynamicSizes,
    visibleDates,
    dateRange,
    scrollLeft,
    setScrollLeft,
    setTimelineRef,
    error: timelineError,
    clearError
  } = useTimeline()

  const [isLoading, setIsLoading] = React.useState(false)
  const [renderError, setRenderError] = React.useState<string | null>(null)
  const timelineContentRef = React.useRef<HTMLDivElement>(null)

  // スクロール処理（パフォーマンス最適化）
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    try {
      const currentScrollLeft = e.currentTarget.scrollLeft
      setScrollLeft(currentScrollLeft)
      
      // ヘッダーと同期（エラーハンドリング付き）
      const headerScroll = document.querySelector('.timeline-header') as HTMLElement
      if (headerScroll && headerScroll.scrollLeft !== currentScrollLeft) {
        headerScroll.scrollLeft = currentScrollLeft
      }
    } catch (error) {
      console.error('Error handling timeline scroll:', error)
    }
  }, [setScrollLeft])

  // 今日の位置を計算
  const todayPosition = React.useMemo(() => {
    try {
      const today = new Date()
      return getDatePosition(today, dateRange, viewUnit)
    } catch (error) {
      console.error('Error calculating today position:', error)
      return 0
    }
  }, [dateRange, viewUnit])

  // タイムラインの総幅を計算
  const totalWidth = React.useMemo(() => {
    try {
      if (!visibleDates.length || !dateRange.cellWidth) {
        return 1000 // フォールバック値
      }

      return viewUnit === 'week'
        ? visibleDates.length * dateRange.cellWidth * 7
        : visibleDates.length * dateRange.cellWidth
    } catch (error) {
      console.error('Error calculating total width:', error)
      return 1000 // フォールバック値
    }
  }, [viewUnit, visibleDates.length, dateRange.cellWidth])

  // プロジェクトごとのタスクをフィルタ
  const getProjectTasks = React.useCallback((projectId: string) => {
    try {
      return filteredTasks.filter(task => task?.projectId === projectId)
    } catch (error) {
      console.error('Error filtering project tasks:', error)
      return []
    }
  }, [filteredTasks])

  // エラーの統合
  const combinedError = renderError || timelineError || taskError

  // エラーをクリア
  const handleClearError = () => {
    setRenderError(null)
    clearError?.()
  }

  // 初期表示時のローディング
  React.useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  // エラー境界的な処理
  React.useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.filename?.includes('timeline') || event.message?.includes('timeline')) {
        console.error('Timeline error caught:', event.error)
        setRenderError('タイムラインの表示中にエラーが発生しました')
      }
    }

    window.addEventListener('error', handleGlobalError)
    return () => window.removeEventListener('error', handleGlobalError)
  }, [])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" message="タイムラインを読み込み中..." />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">プロジェクトがありません</p>
          <p className="text-muted-foreground">
            プロジェクトを作成してタスクを追加すると、タイムラインが表示されます
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* コントロールバー */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            {dateRange.label} | ズーム: {zoomLevel}%
          </span>
          {visibleDates.length > 0 && (
            <span className="text-xs text-muted-foreground">
              表示期間: {visibleDates.length}
              {viewUnit === 'week' ? '週間' : '日間'}
            </span>
          )}
        </div>
        <ZoomControls />
      </div>

      {/* エラー表示 */}
      {combinedError && (
        <div className="p-4 pb-0">
          <ErrorMessage
            type="error"
            message={combinedError}
            onClose={handleClearError}
            onRetry={() => {
              handleClearError()
              window.location.reload()
            }}
            retryable
          />
        </div>
      )}

      {/* タイムラインヘッダー */}
      <TimelineHeader />

      {/* タイムライン本体 */}
      <div
        className="flex-1 relative overflow-auto scrollbar-thin"
        onScroll={handleScroll}
        ref={(ref) => {
          timelineContentRef.current = ref
          setTimelineRef(ref)
        }}
        style={{
          scrollbarGutter: 'stable'
        }}
      >
        <div
          className="relative bg-background"
          style={{
            minWidth: `${Math.max(totalWidth, 800)}px`,
            minHeight: '100%'
          }}
        >
          {/* グリッド背景 */}
          <TimelineGrid />

          {/* 今日のインジケーター */}
          {todayPosition >= 0 && (
            <div
              className="absolute top-0 bg-red-500 z-30 shadow-xl timeline-today-indicator"
              style={{
                left: `${todayPosition}px`,
                width: `${Math.max(2, Math.round(3 * dynamicSizes.zoomRatio))}px`,
                height: '100%'
              }}
              title="今日"
            >
              {/* 今日のマーカー */}
              <div
                className="absolute top-2 bg-red-500 rounded-full shadow-lg flex items-center justify-center border-2 border-white dark:border-gray-900 z-40"
                style={{
                  left: `${-Math.round(12 * dynamicSizes.zoomRatio)}px`,
                  width: `${Math.max(16, Math.round(24 * dynamicSizes.zoomRatio))}px`,
                  height: `${Math.max(16, Math.round(24 * dynamicSizes.zoomRatio))}px`
                }}
              >
                <div
                  className="bg-white rounded-full"
                  style={{
                    width: `${Math.max(8, Math.round(12 * dynamicSizes.zoomRatio))}px`,
                    height: `${Math.max(8, Math.round(12 * dynamicSizes.zoomRatio))}px`
                  }}
                />
              </div>
            </div>
          )}

          {/* プロジェクトとタスクのレンダリング */}
          <div className="relative">
            {projects.map((project, projectIndex) => {
              if (!project?.id) return null
              
              const projectTasks = getProjectTasks(project.id)
              const projectY = projectIndex * (dynamicSizes.rowHeight.project + 4) // 4pxのマージン

              return (
                <div key={project.id}>
                  {/* プロジェクトヘッダー */}
                  <div
                    className="relative cursor-pointer transition-all duration-200 hover:opacity-90 border-b border-border/50"
                    style={{
                      height: `${dynamicSizes.rowHeight.project}px`,
                      top: `${projectY}px`,
                      backgroundColor: `${project.color}15`, // 透明度15%
                      borderLeft: `${Math.max(4, Math.round(6 * dynamicSizes.zoomRatio))}px solid ${project.color}`,
                      position: 'absolute',
                      width: '100%',
                      zIndex: 1
                    }}
                  >
                    {/* プロジェクト名（スクロールに追従） */}
                    <div
                      className="absolute z-20 bg-background/95 backdrop-blur rounded-lg shadow-md border border-border px-3 py-1 transition-all duration-200"
                      style={{
                        left: `${Math.max(8, Math.min(scrollLeft + 8, Math.max(totalWidth - 250, scrollLeft + 8)))}px`,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: project.color,
                        fontSize: `${Math.max(12, dynamicSizes.fontSize.base)}px`,
                        fontWeight: '600',
                        maxWidth: '240px'
                      }}
                      title={project.name}
                    >
                      <div className="truncate">
                        {project.name}
                      </div>
                      {projectTasks.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {projectTasks.length}件のタスク
                        </div>
                      )}
                    </div>
                  </div>

                  {/* プロジェクトのタスクバー */}
                  {project.expanded && projectTasks.map((task, taskIndex) => {
                    if (!task?.id) return null
                    
                    const taskY = projectY + dynamicSizes.rowHeight.project + (taskIndex * (dynamicSizes.rowHeight.task + 2))

                    return (
                      <div
                        key={task.id}
                        style={{
                          position: 'absolute',
                          top: `${taskY}px`,
                          width: '100%',
                          height: `${dynamicSizes.rowHeight.task}px`,
                          zIndex: 2
                        }}
                      >
                        <TaskBar
                          task={task}
                          project={project}
                        />
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* 最小高さを確保 */}
          <div 
            style={{ 
              height: `${projects.length * (dynamicSizes.rowHeight.project + dynamicSizes.rowHeight.task * 3) + 100}px`,
              minHeight: '400px'
            }} 
          />
        </div>
      </div>

      {/* フッター情報 */}
      <div className="border-t bg-background/95 backdrop-blur p-2">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div>
            {projects.length}個のプロジェクト、{filteredTasks.length}個のタスク
          </div>
          <div>
            表示倍率: {zoomLevel}%
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(GanttChart)