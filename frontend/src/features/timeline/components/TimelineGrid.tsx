// システムプロンプト準拠：グリッド分離コンポーネント
// KISS原則：グリッド表示の簡素化、DRY原則：描画ロジックの一元化

import React, { useMemo, useCallback, RefObject } from 'react'
import { 
  ChevronDown, ChevronRight, Check, AlertTriangle, Factory, Star 
} from 'lucide-react'
import { 
  TIMELINE_CONFIG, 
  TimelineDisplayLevel, 
  getDisplayLevel 
} from '@core/config/timeline'
import { 
  calculateTimelineDimensions, 
  calculateScrollPosition, 
  calculateTaskPosition,
  isElementInViewport,
  generateTimelineClasses 
} from '@core/utils/layout'
import { useHorizontalScrollSync } from '@core/hooks/useScrollSync'

// 型定義（既存の timeline/types から移植）
interface TimelineTask {
  id: string
  name: string
  startDate: Date
  dueDate: Date
  status?: 'completed' | 'in-progress' | 'not-started' | 'overdue'
  milestone?: boolean
  expanded?: boolean
  subtasks?: TimelineTask[]
}

interface TimelineProject {
  id: string
  name: string
  color: string
  expanded: boolean
  tasks: TimelineTask[]
}

// Props型定義
interface TimelineGridProps {
  // データ
  projects: TimelineProject[]
  
  // 表示設定
  zoomLevel: number
  viewUnit: 'day' | 'week'
  theme: 'light' | 'dark'
  
  // 時間範囲
  startDate: Date
  endDate: Date
  visibleDates: Date[]
  
  // スクロール制御
  scrollLeft: number
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void
  gridRef: RefObject<HTMLDivElement>
  
  // 操作ハンドラー
  onProjectToggle: (projectId: string) => void
  onTaskToggle: (projectId: string, taskId: string) => void
  
  // スタイル
  className?: string
  style?: React.CSSProperties
}

/**
 * タイムライングリッドコンポーネント
 * システムプロンプト準拠：表示ロジックの分離・簡素化
 */
export const TimelineGrid: React.FC<TimelineGridProps> = ({
  projects,
  zoomLevel,
  viewUnit,
  theme,
  startDate,
  endDate,
  visibleDates,
  scrollLeft,
  onScroll,
  gridRef,
  onProjectToggle,
  onTaskToggle,
  className,
  style
}) => {

  // 動的寸法計算
  const dimensions = useMemo(() => 
    calculateTimelineDimensions(zoomLevel, viewUnit),
    [zoomLevel, viewUnit]
  )

  // 表示レベル取得
  const displayLevel = useMemo(() => 
    getDisplayLevel(zoomLevel),
    [zoomLevel]
  )

  // 今日の日付
  const today = useMemo(() => new Date(), [])

  // テーマクラス取得
  const getThemeClasses = useCallback(() => {
    return theme === 'dark' 
      ? {
          grid: "bg-gray-950 text-gray-50",
          projectRow: "border-gray-600",
          taskRow: "border-gray-700 hover:bg-gray-800/50",
          subtaskRow: "border-gray-800 hover:bg-gray-800/30",
          backgroundGrid: "border-gray-600",
          holidayOverlay: "bg-gray-800/30"
        }
      : {
          grid: "bg-gray-50 text-gray-900",
          projectRow: "border-gray-300",
          taskRow: "border-gray-200 hover:bg-gray-50",
          subtaskRow: "border-gray-100 hover:bg-gray-25",
          backgroundGrid: "border-gray-300",
          holidayOverlay: "bg-gray-300/50"
        }
  }, [theme])

  const themeClasses = getThemeClasses()

  // グリッド幅計算
  const gridWidth = useMemo(() => {
    return visibleDates.length * dimensions.cellWidth * (viewUnit === 'week' ? 7 : 1)
  }, [visibleDates.length, dimensions.cellWidth, viewUnit])

  // 日付セルクラス取得
  const getDateCellClass = useCallback((date: Date): string => {
    const isToday = date.toDateString() === today.toDateString()
    if (isToday) {
      return theme === 'dark' ? 'bg-yellow-900/40 border-yellow-400' : 'bg-yellow-100 border-yellow-400'
    }
    
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) { // 土日
      return theme === 'dark' ? 'bg-gray-800/40' : 'bg-gray-200/60'
    }
    return ''
  }, [today, theme])

  // タスクバーの位置・スタイル計算
  const calculateTaskBarStyle = useCallback((
    task: TimelineTask,
    project: TimelineProject,
    isSubtask = false
  ) => {
    const position = calculateTaskPosition(
      task.startDate,
      task.dueDate,
      startDate,
      dimensions.cellWidth,
      0, // rowIndexは親で管理
      dimensions.rowHeight.task,
      viewUnit
    )

    const status = task.status || 'not-started'
    const baseOpacity = isSubtask ? 0.7 : 1.0
    
    let backgroundColor: string
    let borderColor: string
    let textColor: string

    switch (status) {
      case 'completed':
        backgroundColor = isSubtask ? 'rgba(16, 185, 129, 0.5)' : 'rgba(16, 185, 129, 0.8)'
        borderColor = 'rgba(5, 150, 105, 0.8)'
        textColor = 'white'
        break
      case 'in-progress':
        const projectColor = project.color
        backgroundColor = isSubtask 
          ? `${projectColor}80` // 50% opacity
          : `${projectColor}CC` // 80% opacity
        borderColor = projectColor
        textColor = 'white'
        break
      case 'overdue':
        backgroundColor = isSubtask ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.8)'
        borderColor = 'rgba(220, 38, 38, 0.8)'
        textColor = 'white'
        break
      default:
        backgroundColor = isSubtask ? 'rgba(243, 244, 246, 0.5)' : 'rgba(243, 244, 246, 0.8)'
        borderColor = 'rgba(156, 163, 175, 0.6)'
        textColor = theme === 'dark' ? '#e5e7eb' : '#374151'
    }

    return {
      position: 'absolute' as const,
      left: `${position.left}px`,
      width: `${Math.max(dimensions.cellWidth, position.width)}px`,
      height: `${Math.round(dimensions.rowHeight.task * 0.8)}px`,
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor,
      borderColor,
      borderWidth: task.milestone ? '2px' : '1px',
      borderStyle: isSubtask ? 'dashed' : 'solid',
      color: textColor,
      opacity: baseOpacity,
      borderRadius: '6px',
      zIndex: task.milestone ? 3 : (isSubtask ? 1 : 2)
    }
  }, [startDate, dimensions, viewUnit, theme])

  // 表示テキスト取得
  const getDisplayText = useCallback((text: string, maxLength?: number): string => {
    if (displayLevel === 'minimal') return ''
    if (displayLevel === 'compact') {
      return text.length > 5 ? text.substring(0, 3) + '…' : text
    }
    if (displayLevel === 'reduced') {
      const shortLength = maxLength || Math.floor(text.length * 0.7)
      return text.length > shortLength ? text.substring(0, shortLength - 1) + '…' : text
    }
    return text
  }, [displayLevel])

  // プロジェクト名の動的位置計算
  const getProjectNamePosition = useCallback((scrollLeft: number): number => {
    const visibleAreaWidth = Math.min(gridWidth, 800)
    const nameWidth = 200
    return Math.max(8, Math.min(scrollLeft + 8, scrollLeft + visibleAreaWidth - nameWidth - 8))
  }, [gridWidth])

  // グリッドクラス名生成
  const gridClassName = generateTimelineClasses(
    TIMELINE_CONFIG.CSS_CLASSES.GRID,
    [className || ''].filter(Boolean)
  )

  return (
    <div 
      className={`${gridClassName} ${themeClasses.grid} relative overflow-auto`}
      style={{
        gridArea: 'content',
        ...style
      }}
      onScroll={onScroll}
      ref={gridRef}
    >
      <div 
        className="relative" 
        style={{ 
          minWidth: `${gridWidth}px`,
          width: 'max-content'
        }}
      >
        {/* 背景グリッド */}
        <div className="absolute inset-0 pointer-events-none">
          {viewUnit === 'week' ? (
            // 週表示のグリッド
            visibleDates.map((weekStart, index) => (
              <div
                key={`grid-week-${weekStart.getTime()}`}
                className={`absolute inset-y-0 ${index % 2 === 0 ? 
                  (theme === 'dark' ? 'bg-gray-900/60' : 'bg-gray-50/60') : 
                  (theme === 'dark' ? 'bg-gray-800/60' : 'bg-white/60')
                }`}
                style={{
                  left: `${index * dimensions.cellWidth * 7}px`,
                  width: `${dimensions.cellWidth * 7}px`,
                  borderRight: `1px solid ${theme === 'dark' ? '#6b7280' : '#d1d5db'}`,
                  opacity: 0.4
                }}
              />
            ))
          ) : (
            // 日表示のグリッド
            visibleDates.map((date, index) => (
              <div
                key={`grid-${date.getTime()}`}
                className={`absolute inset-y-0 ${getDateCellClass(date)}`}
                style={{
                  left: `${calculateScrollPosition(date, startDate, dimensions.cellWidth, viewUnit)}px`,
                  width: `${dimensions.cellWidth}px`,
                  borderRight: `1px solid ${theme === 'dark' ? '#6b7280' : '#d1d5db'}`,
                  opacity: 0.4
                }}
              />
            ))
          )}
        </div>

        {/* 土日祝日オーバーレイ */}
        <div className="absolute inset-0 pointer-events-none">
          {visibleDates.map((date) => {
            const dayOfWeek = date.getDay()
            if (dayOfWeek !== 0 && dayOfWeek !== 6) return null // 平日はスキップ
            
            return (
              <div
                key={`holiday-${date.getTime()}`}
                className={`absolute inset-y-0 ${themeClasses.holidayOverlay}`}
                style={{
                  left: `${calculateScrollPosition(date, startDate, dimensions.cellWidth, viewUnit)}px`,
                  width: `${dimensions.cellWidth}px`,
                  zIndex: 1
                }}
              />
            )
          })}
        </div>

        {/* プロジェクト・タスク表示 */}
        {projects.map(project => (
          <div key={project.id} className={`relative border-b-2 ${themeClasses.projectRow}`}>
            {/* プロジェクトヘッダー行 */}
            <div 
              className="flex items-center relative cursor-pointer transition-colors duration-200 hover:opacity-90"
              onClick={() => onProjectToggle(project.id)}
              style={{ 
                height: `${dimensions.rowHeight.project}px`,
                backgroundColor: `${project.color}${theme === 'dark' ? '60' : '50'}`,
                borderLeft: `${Math.max(4, Math.round(6 * dimensions.zoomRatio))}px solid ${project.color}`
              }}
            >
              {/* プロジェクト名（動的配置） */}
              <div 
                className={`absolute z-10 ${theme === 'dark' ? 'bg-gray-800 border-gray-500' : 'bg-white border-gray-300'} rounded-lg shadow-lg border-2 transition-all duration-200`}
                style={{
                  left: `${getProjectNamePosition(scrollLeft)}px`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  maxWidth: `${Math.max(200, Math.round(320 * dimensions.zoomRatio))}px`,
                  padding: `${Math.max(2, Math.round(4 * dimensions.zoomRatio))}px ${Math.max(6, Math.round(12 * dimensions.zoomRatio))}px`,
                  overflow: 'hidden'
                }}
              >
                <div 
                  className="flex items-center h-full"
                  style={{ 
                    color: project.color,
                    gap: `${Math.max(4, Math.round(8 * dimensions.zoomRatio))}px`
                  }}
                >
                  <div className="rounded-md bg-gray-100 dark:bg-gray-700 flex-shrink-0 p-1">
                    {project.expanded ? 
                      <ChevronDown size={Math.max(8, Math.round(14 * dimensions.zoomRatio))} /> :
                      <ChevronRight size={Math.max(8, Math.round(14 * dimensions.zoomRatio))} />
                    }
                  </div>
                  <Factory size={Math.max(10, Math.round(14 * dimensions.zoomRatio))} />
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div 
                      className="font-bold truncate"
                      style={{ 
                        fontSize: `${Math.min(dimensions.fontSize.base, Math.round(dimensions.rowHeight.project * 0.4))}px`
                      }}
                    >
                      {getDisplayText(project.name, Math.max(10, Math.round(20 * dimensions.zoomRatio)))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* プロジェクト内のタスク */}
            {project.expanded && project.tasks.map(task => (
              <div key={task.id}>
                {/* 親タスク行 */}
                <div 
                  className={`relative cursor-pointer border-b ${themeClasses.taskRow} transition-colors duration-150`} 
                  style={{ height: `${dimensions.rowHeight.task}px` }}
                >
                  {/* 親タスクバー */}
                  <div
                    className="absolute rounded-lg shadow-lg flex items-center transition-all duration-200 hover:shadow-xl hover:scale-105 group cursor-pointer"
                    style={calculateTaskBarStyle(task, project, false)}
                  >
                    {/* タスク情報 */}
                    <div 
                      className="px-3 font-semibold flex items-center flex-1 min-w-0"
                      style={{ fontSize: `${dimensions.fontSize.small}px` }}
                    >
                      {task.status === 'completed' && <Check size={Math.max(10, Math.round(14 * dimensions.zoomRatio))} className="mr-2 flex-shrink-0" />}
                      {task.status === 'overdue' && <AlertTriangle size={Math.max(10, Math.round(14 * dimensions.zoomRatio))} className="mr-2 flex-shrink-0" />}
                      {task.milestone && <Star size={Math.max(10, Math.round(14 * dimensions.zoomRatio))} className="mr-2 flex-shrink-0 text-yellow-400" />}
                      <span className="truncate">
                        {getDisplayText(task.name, viewUnit === 'week' ? 20 : 15)}
                      </span>
                    </div>
                    
                    {/* 展開/折り畳みボタン */}
                    {task.subtasks && task.subtasks.length > 0 && displayLevel !== 'minimal' && (
                      <div 
                        className="flex-shrink-0 mr-2 px-2 py-1 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 bg-white/30 border border-white/50"
                        onClick={(e) => {
                          e.stopPropagation()
                          onTaskToggle(project.id, task.id)
                        }}
                        title={`${task.expanded ? 'サブタスクを非表示' : 'サブタスクを表示'} (${task.subtasks?.length || 0}件)`}
                      >
                        <div className="flex items-center space-x-1">
                          {task.expanded ? 
                            <ChevronDown size={Math.max(8, Math.round(10 * dimensions.zoomRatio))} className="text-white" /> :
                            <ChevronRight size={Math.max(8, Math.round(10 * dimensions.zoomRatio))} className="text-white" />
                          }
                          <span 
                            className="text-white font-bold"
                            style={{ fontSize: `${Math.max(6, Math.round(9 * dimensions.zoomRatio))}px` }}
                          >
                            {task.subtasks?.length || 0}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* サブタスク行 */}
                {task.expanded && task.subtasks?.map((subtask, subtaskIndex) => (
                  <div 
                    key={subtask.id} 
                    className={`relative border-b ${themeClasses.subtaskRow} transition-colors duration-150`} 
                    style={{ height: `${dimensions.rowHeight.subtask}px` }}
                  >
                    {/* サブタスクバー */}
                    <div
                      className="absolute rounded-md shadow-md flex items-center transition-all duration-200 hover:shadow-lg"
                      style={{
                        ...calculateTaskBarStyle(subtask, project, true),
                        left: `${calculateScrollPosition(subtask.startDate, startDate, dimensions.cellWidth, viewUnit) + Math.round(32 * dimensions.zoomRatio)}px`
                      }}
                    >
                      <div className="px-3 flex items-center">
                        {subtask.status === 'completed' && <Check size={Math.max(8, Math.round(12 * dimensions.zoomRatio))} />}
                        {subtask.status === 'overdue' && <AlertTriangle size={Math.max(8, Math.round(12 * dimensions.zoomRatio))} />}
                        {subtask.milestone && <Star size={Math.max(8, Math.round(12 * dimensions.zoomRatio))} className="text-yellow-300" />}
                      </div>
                    </div>
                    
                    {/* サブタスク名ラベル */}
                    {displayLevel !== 'minimal' && (
                      <div
                        className="absolute flex items-center pointer-events-none z-10"
                        style={{
                          left: `${calculateScrollPosition(subtask.dueDate, startDate, dimensions.cellWidth, viewUnit) + dimensions.cellWidth + 8}px`,
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <div 
                          className={`px-2 py-0.5 rounded font-medium shadow-sm border ${
                            theme === 'dark' 
                              ? 'bg-gray-800/85 text-gray-200 border-gray-600' 
                              : 'bg-white/85 text-gray-700 border-gray-300'
                          }`}
                          style={{ fontSize: `${Math.max(8, dimensions.fontSize.small)}px` }}
                        >
                          {getDisplayText(subtask.name, 15)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
        
        {/* 今日のインジケーター */}
        <div 
          className="absolute top-0 bg-red-500 z-30 shadow-xl"
          style={{ 
            left: `${calculateScrollPosition(today, startDate, dimensions.cellWidth, viewUnit)}px`,
            width: `${Math.max(2, Math.round(3 * dimensions.zoomRatio))}px`,
            height: '100%'
          }}
        >
          <div 
            className="absolute top-0 bg-red-500 rounded-full shadow-lg flex items-center justify-center border-2 border-white dark:border-gray-900"
            style={{
              left: `${-Math.round(10 * dimensions.zoomRatio)}px`,
              width: `${Math.max(16, Math.round(20 * dimensions.zoomRatio))}px`,
              height: `${Math.max(16, Math.round(20 * dimensions.zoomRatio))}px`
            }}
          >
            <div 
              className="bg-white rounded-full"
              style={{
                width: `${Math.max(6, Math.round(8 * dimensions.zoomRatio))}px`,
                height: `${Math.max(6, Math.round(8 * dimensions.zoomRatio))}px`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimelineGrid
