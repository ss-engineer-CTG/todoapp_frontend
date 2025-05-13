// src/components/views/TimelineView/index.tsx
"use client"

import { useContext, useState, useEffect, useRef } from "react"
import { TaskContext } from "../../../contexts/TaskContext"
import { UIContext } from "../../../contexts/UIContext"
import { useFilterAndSort } from "../../../hooks/useFilterAndSort"
import { useTasks } from "../../../hooks/useTasks"
import { useKeyboardShortcuts } from "../../../hooks/useKeyboardShortcuts"
import { useDragAndDrop } from "../../../hooks/useDragAndDrop"
import { useTaskStatus } from "../../../hooks/useTaskStatus"
import { useTimelineView } from "../../../hooks/useTimelineView"
import { useTimelineZoom } from "../../../hooks/useTimelineZoom"
import { Task } from "../../../types/Task"
import { formatDate } from "../../../utils/dateUtils"
import { getTaskDependencies } from "../../../utils/timelineUtils"

import TimelineHeader from "./TimelineHeader"
import TimelineDayHeader from "./TimelineDayHeader"
import TimelineItem from "./TimelineItem"
import DependencyLine from "./DependencyLine"
import AddTaskButton from "../../common/AddTaskButton"

export default function TimelineView() {
  const { tasks } = useContext(TaskContext)
  const { 
    selectedTaskId, 
    setSelectedTaskId, 
    onKeyDown,
    taskRefs,
  } = useContext(UIContext)
  
  const { toggleTaskCompletion } = useTasks()
  const { getVisibleTasks } = useFilterAndSort()
  
  // カスタムフックの利用
  const { getTaskStatusInfo } = useTaskStatus()
  const { 
    viewMode, setViewMode,
    today, periods,
    navigatePeriod, resetTimelineView
  } = useTimelineView(tasks)
  const {
    zoomLevel, dayWidth,
    setViewModeScale, changeZoomLevel,
    zoomIn, zoomOut, resetZoom,
    calculateDaysFromPixels
  } = useTimelineZoom()
  
  // ドラッグ＆ドロップ機能
  const { 
    handleDragStart, isDragging, 
    dragTask, dragType, dragPreview 
  } = useDragAndDrop()
  
  // キーボードショートカットを有効化
  useKeyboardShortcuts()
  
  // 完了タスク表示の切り替え
  const [showCompleted, setShowCompleted] = useState(false)
  
  // タイムラインのメインコンテナ参照
  const timelineContainerRef = useRef<HTMLDivElement>(null)
  
  // 表示モード変更時の処理
  useEffect(() => {
    setViewModeScale(viewMode)
  }, [viewMode, setViewModeScale])
  
  // フィルタリングされたタスクリスト
  const visibleTasks = showCompleted 
    ? getVisibleTasks().filter(t => !t.isProject) 
    : getVisibleTasks().filter(t => !t.isProject && !t.completed)
  
  // 依存関係の取得（親子関係から構築）
  const dependencies = getTaskDependencies(visibleTasks)
  
  // ドラッグ中のプレビューUIを表示
  const renderDragPreview = () => {
    if (!dragPreview || !dragTask) return null
    
    // ドラッグプレビューの情報から新しい日付を計算
    const task = tasks.find(t => t.id === dragPreview.taskId)
    if (!task) return null
    
    let previewStartDate = new Date(task.startDate)
    let previewEndDate = new Date(task.dueDate)
    
    if (dragPreview.type === "start" || dragPreview.type === "move") {
      previewStartDate.setDate(previewStartDate.getDate() + dragPreview.daysDelta)
    }
    
    if (dragPreview.type === "end" || dragPreview.type === "move") {
      previewEndDate.setDate(previewEndDate.getDate() + dragPreview.daysDelta)
    }
    
    const newStartDate = formatDate(previewStartDate)
    const newEndDate = formatDate(previewEndDate)
    
    // ステータス情報の取得
    const statusInfo = getTaskStatusInfo(
      { ...task, startDate: newStartDate, dueDate: newEndDate },
      today
    )
    
    // プレビュー用の日数計算
    const days = Math.round(
      (previewEndDate.getTime() - previewStartDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
    
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 border-l-4 text-sm"
          style={{ borderLeftColor: statusInfo.borderColor }}>
        <div className="font-medium mb-2">日程変更プレビュー</div>
        <div className="grid grid-cols-[100px_auto] gap-y-1">
          <div className="text-gray-500">タスク:</div>
          <div className="font-medium">{task.name}</div>
          <div className="text-gray-500">開始日:</div>
          <div className="font-medium">{newStartDate}</div>
          <div className="text-gray-500">終了日:</div>
          <div className="font-medium">{newEndDate}</div>
          <div className="text-gray-500">期間:</div>
          <div className="font-medium">{days}日</div>
          <div className="text-gray-500">ステータス:</div>
          <div 
            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium" 
            style={{
              backgroundColor: statusInfo.backgroundColor,
              color: statusInfo.color
            }}
          >
            {statusInfo.label}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">タイムライン表示</h2>
        <AddTaskButton className="ml-auto whitespace-nowrap" />
      </div>
      
      {/* タイムラインヘッダー */}
      <TimelineHeader 
        viewMode={viewMode}
        zoomLevel={zoomLevel}
        onViewModeChange={setViewMode}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onNavigate={navigatePeriod}
        onReset={resetTimelineView}
        showCompleted={showCompleted}
        onToggleCompleted={() => setShowCompleted(!showCompleted)}
      />
      
      {/* タイムラインコンテンツ */}
      <div 
        ref={timelineContainerRef}
        className="flex-grow overflow-auto border border-t-0 border-gray-200 bg-white rounded-b-md relative"
      >
        <div className="min-w-max">
          {periods.map(period => (
            <div key={period.id} className="mb-4">
              {/* 日付ヘッダー */}
              <TimelineDayHeader 
                startDate={period.startDate}
                daysCount={period.daysCount}
                today={today}
                dayWidth={dayWidth}
              />
              
              {/* タスクリスト */}
              <div className="relative">
                {/* 依存関係の線を描画 */}
                {dependencies.map((dep, index) => {
                  const fromTask = tasks.find(t => t.id === dep.from);
                  const toTask = tasks.find(t => t.id === dep.to);
                  
                  if (!fromTask || !toTask) return null;
                  
                  // 両方のタスクが現在のピリオド内にある場合のみ表示
                  const fromInRange = (
                    fromTask.startDate <= period.endDate && 
                    fromTask.dueDate >= period.startDate
                  );
                  const toInRange = (
                    toTask.startDate <= period.endDate && 
                    toTask.dueDate >= period.startDate
                  );
                  
                  if (!fromInRange || !toInRange) return null;
                  
                  return (
                    <DependencyLine 
                      key={`dep-${index}`}
                      fromTask={fromTask}
                      toTask={toTask}
                      startDate={period.startDate}
                      dayWidth={dayWidth}
                      rowHeight={56} // タイムラインアイテムの高さ
                      topOffset={60} // ヘッダー等の高さ
                      draggingTaskId={dragTask?.id}
                      dragPreview={dragPreview ? {
                        taskId: dragPreview.taskId,
                        startDate: dragTask ? 
                          (dragPreview.type === "start" || dragPreview.type === "move") ? 
                            formatDate(new Date(new Date(dragTask.startDate).setDate(
                              new Date(dragTask.startDate).getDate() + dragPreview.daysDelta
                            ))) : 
                            dragTask.startDate : 
                          "",
                        dueDate: dragTask ? 
                          (dragPreview.type === "end" || dragPreview.type === "move") ? 
                            formatDate(new Date(new Date(dragTask.dueDate).setDate(
                              new Date(dragTask.dueDate).getDate() + dragPreview.daysDelta
                            ))) : 
                            dragTask.dueDate : 
                          ""
                      } : undefined}
                    />
                  );
                })}
                
                {/* タスクバー */}
                {visibleTasks
                  .filter(task => {
                    // このピリオド内に収まるタスクをフィルタリング
                    return task.startDate <= period.endDate && task.dueDate >= period.startDate;
                  })
                  .map(task => {
                    // タスクステータス情報
                    const statusInfo = getTaskStatusInfo(task, today);
                    
                    return (
                      <TimelineItem
                        key={`${period.id}-${task.id}`}
                        task={task}
                        startDate={period.startDate}
                        dayWidth={dayWidth}
                        isSelected={selectedTaskId === task.id}
                        statusInfo={statusInfo}
                        onSelect={() => setSelectedTaskId(task.id)}
                        onKeyDown={onKeyDown}
                        onToggleComplete={toggleTaskCompletion}
                        ref={(el) => {
                          if (el) taskRefs.current[task.id] = el;
                        }}
                        onDragStart={(e, task, type) => {
                          // ドラッグ操作の単位を日数からピクセルに変換するスケールを計算
                          const daysPerPixel = 1 / dayWidth;
                          handleDragStart(e, task, type, daysPerPixel);
                        }}
                        isDragging={isDragging && dragTask?.id === task.id}
                        dragType={dragType}
                      />
                    );
                  })
                }
                
                {/* 背景グリッド - 縦線 */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                  {Array.from({ length: period.daysCount }).map((_, index) => {
                    const dateObj = new Date(period.startDate);
                    dateObj.setDate(dateObj.getDate() + index);
                    const dateStr = formatDate(dateObj);
                    const isWeekend = [0, 6].includes(dateObj.getDay());
                    const isCurrentDay = dateStr === today;
                    
                    return (
                      <div 
                        key={`grid-${dateStr}`}
                        className={`absolute top-0 h-full border-r 
                          ${isCurrentDay ? 'border-red-300' : 'border-gray-100'}
                          ${isWeekend ? 'bg-gray-50' : ''}`}
                        style={{
                          left: `${index * dayWidth}px`,
                          width: `${dayWidth}px`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* ドラッグプレビュー表示 */}
      {dragPreview && renderDragPreview()}
    </div>
  );
}