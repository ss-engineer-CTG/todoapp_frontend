"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useTodoContext } from "@/hooks/use-todo-context"
import { useTimelineZoom } from "@/hooks/use-timeline-zoom"
import { useDateRange } from "@/hooks/use-date-range"
import TimelineHeader from "./timeline-header"
import TimelineGrid from "./timeline-grid"
import ZoomControls from "./zoom-controls"
import ProjectRow from "./project-row"
import { getDatePosition, getWeekBackground, isHoliday, getDateType } from "./date-utils"
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2,
  Filter,
  Factory
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function GanttTimeline() {
  const {
    projects,
    tasks,
    toggleProjectCollapse,
    toggleTaskCollapse
  } = useTodoContext()

  const [scrollLeft, setScrollLeft] = useState(0)
  const [viewUnit, setViewUnit] = useState<'day' | 'week'>('week')
  const [timelineRef, setTimelineRef] = useState<HTMLDivElement | null>(null)

  const { 
    zoomLevel, 
    dynamicSizes, 
    zoomIn, 
    zoomOut, 
    resetZoom, 
    fitToScreen,
    handleZoom
  } = useTimelineZoom(timelineRef, viewUnit)

  const { 
    dateRange, 
    visibleDates, 
    handleTodayButton 
  } = useDateRange(viewUnit, dynamicSizes.cellWidth, timelineRef)

  // 一括展開・折りたたみ
  const expandAll = () => {
    projects.forEach(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id)
      projectTasks.forEach(task => {
        if (task.level === 0) { // 親タスクのみ
          toggleTaskCollapse(task.id, true) // 強制展開
        }
      })
    })
  }

  const collapseAll = () => {
    projects.forEach(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id)
      projectTasks.forEach(task => {
        if (task.level === 0) { // 親タスクのみ
          toggleTaskCollapse(task.id, false) // 強制折りたたみ
        }
      })
    })
  }

  // スクロール処理
  const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollLeft = e.currentTarget.scrollLeft
    setScrollLeft(newScrollLeft)
    
    // ヘッダーも同期してスクロール
    const headerElement = document.querySelector('.timeline-header-scroll')
    if (headerElement) {
      headerElement.scrollLeft = newScrollLeft
    }
  }

  // プロジェクト名の動的位置計算
  const getProjectNamePosition = (scrollLeft: number, timelineWidth = 1200) => {
    const visibleAreaWidth = Math.min(timelineWidth, 800)
    const nameWidth = 200
    return Math.max(8, Math.min(scrollLeft + 8, scrollLeft + visibleAreaWidth - nameWidth - 8))
  }

  // 今日の位置計算
  const todayPosition = useMemo(() => {
    return getDatePosition(new Date(), dateRange, viewUnit)
  }, [dateRange, viewUnit])

  return (
    <div className="h-full flex flex-col bg-background">
      {/* ヘッダーコントロール */}
      <div className="border-b bg-background/95 backdrop-blur px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Factory className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">タイムライン表示</h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* 一括展開・折りたたみ */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAll}
              title="全て展開"
              className="h-8 w-8 p-0"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAll}
              title="全て折りたたみ"
              className="h-8 w-8 p-0"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* ズームコントロール */}
          <ZoomControls
            zoomLevel={zoomLevel}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onReset={resetZoom}
            onFitToScreen={() => fitToScreen(visibleDates)}
            onZoomChange={handleZoom}
          />

          <Button variant="ghost" size="sm" title="フィルター">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 表示単位・ナビゲーション */}
      <div className="border-b bg-background px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* 表示単位選択 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">表示:</span>
            {[
              { key: 'day' as const, label: '日表示' },
              { key: 'week' as const, label: '週表示' }
            ].map((unit) => (
              <Button
                key={unit.key}
                variant={viewUnit === unit.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewUnit(unit.key)}
                className="text-xs"
              >
                {unit.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* 表示情報 */}
          <div className="text-xs text-muted-foreground">
            {viewUnit === 'week' ? '週表示' : '日表示'} | ズーム: {zoomLevel}%
          </div>

          {/* 期間ナビゲーション */}
          <div className="flex items-center border rounded-md overflow-hidden">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTodayButton(timelineRef)}
              className="h-8 px-3 text-xs border-l border-r"
            >
              今日
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* タイムラインヘッダー */}
      <TimelineHeader
        visibleDates={visibleDates}
        viewUnit={viewUnit}
        dateRange={dateRange}
        dynamicSizes={dynamicSizes}
        scrollLeft={scrollLeft}
        onScroll={(scrollLeft) => {
          if (timelineRef) {
            timelineRef.scrollLeft = scrollLeft
          }
        }}
      />

      {/* タイムライングリッド */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={setTimelineRef}
          className="w-full h-full overflow-auto timeline-scroll-container"
          onScroll={handleTimelineScroll}
        >
          <TimelineGrid
            visibleDates={visibleDates}
            viewUnit={viewUnit}
            dateRange={dateRange}
            dynamicSizes={dynamicSizes}
            todayPosition={todayPosition}
          >
            {projects.map(project => (
              <ProjectRow
                key={project.id}
                project={project}
                tasks={tasks.filter(task => task.projectId === project.id)}
                scrollLeft={scrollLeft}
                getProjectNamePosition={getProjectNamePosition}
                onToggleProject={() => toggleProjectCollapse(project.id)}
                onToggleTask={(taskId) => toggleTaskCollapse(taskId)}
                viewUnit={viewUnit}
                dateRange={dateRange}
                dynamicSizes={dynamicSizes}
                getDatePosition={(date) => getDatePosition(date, dateRange, viewUnit)}
              />
            ))}
          </TimelineGrid>
        </div>
      </div>
    </div>
  )
}