"use client"

import React from "react"
import { ChevronDown, ChevronRight, Factory } from "lucide-react"
import TaskBar from "./task-bar"
import { cn } from "@/lib/utils"
import type { Project, Task } from "@/types/todo"
import type { DateRange, DynamicSizes } from "@/types/timeline"

interface ProjectRowProps {
  project: Project
  tasks: Task[]
  scrollLeft: number
  getProjectNamePosition: (scrollLeft: number) => number
  onToggleProject: () => void
  onToggleTask: (taskId: string) => void
  viewUnit: 'day' | 'week'
  dateRange: DateRange
  dynamicSizes: DynamicSizes
  getDatePosition: (date: Date) => number
}

export default function ProjectRow({
  project,
  tasks,
  scrollLeft,
  getProjectNamePosition,
  onToggleProject,
  onToggleTask,
  viewUnit,
  dateRange,
  dynamicSizes,
  getDatePosition
}: ProjectRowProps) {
  // タスクを階層構造でフィルタリング
  const visibleTasks = tasks.filter(task => {
    if (!project.expanded) return false
    
    // 親タスクが折りたたまれている場合は非表示
    if (task.parentId) {
      const parentTask = tasks.find(t => t.id === task.parentId)
      return parentTask && parentTask.expanded
    }
    
    return true
  })

  // 子タスクの数を取得
  const getChildCount = (taskId: string) => {
    return tasks.filter(task => task.parentId === taskId).length
  }

  return (
    <div className="relative border-b-2 border-border">
      {/* プロジェクトヘッダー行 */}
      <div
        className="flex items-center relative cursor-pointer transition-colors duration-200 hover:opacity-90"
        onClick={onToggleProject}
        style={{
          height: dynamicSizes.rowHeight.project,
          backgroundColor: `${project.color}40`,
          borderLeft: `${Math.max(4, Math.round(6 * dynamicSizes.zoomRatio))}px solid ${project.color}`
        }}
      >
        {/* 動的に移動するプロジェクト名 */}
        <div
          className="absolute z-10 bg-background/95 backdrop-blur rounded-lg shadow-lg border transition-all duration-200"
          style={{
            left: getProjectNamePosition(scrollLeft),
            top: '50%',
            transform: 'translateY(-50%)',
            maxWidth: Math.max(200, Math.round(320 * dynamicSizes.zoomRatio)),
            maxHeight: Math.round(dynamicSizes.rowHeight.project * 0.8),
            padding: `${Math.max(4, Math.round(8 * dynamicSizes.zoomRatio))}px ${Math.max(8, Math.round(16 * dynamicSizes.zoomRatio))}px`
          }}
        >
          <div
            className="flex items-center h-full"
            style={{
              color: project.color,
              gap: Math.max(4, Math.round(8 * dynamicSizes.zoomRatio))
            }}
          >
            <div className="bg-muted rounded-md p-1">
              {project.expanded ? (
                <ChevronDown size={Math.max(12, Math.round(16 * dynamicSizes.zoomRatio))} />
              ) : (
                <ChevronRight size={Math.max(12, Math.round(16 * dynamicSizes.zoomRatio))} />
              )}
            </div>
            <Factory size={Math.max(12, Math.round(16 * dynamicSizes.zoomRatio))} />
            <div
              className="font-bold truncate"
              style={{
                fontSize: Math.min(dynamicSizes.fontSize.base, Math.round(dynamicSizes.rowHeight.project * 0.4))
              }}
            >
              {project.name}
            </div>
          </div>
        </div>
      </div>

      {/* タスク行 */}
      {project.expanded && visibleTasks.map(task => (
        <div key={task.id}>
          {/* 親タスク行 */}
          <div
            className="relative cursor-pointer border-b border-border/50 hover:bg-accent/20 transition-colors duration-150"
            style={{ height: dynamicSizes.rowHeight.task }}
          >
            {/* タスクバー */}
            <TaskBar
              task={task}
              projectColor={project.color}
              left={getDatePosition(task.startDate)}
              width={getDatePosition(task.dueDate) - getDatePosition(task.startDate) + dateRange.cellWidth}
              height={Math.round(dynamicSizes.taskBarHeight * 0.8)}
              dynamicSizes={dynamicSizes}
              isSubtask={task.level > 0}
            />

            {/* 展開/折りたたみバッジ（子タスクがある場合） */}
            {getChildCount(task.id) > 0 && dynamicSizes.zoomRatio > 0.3 && (
              <div
                className={cn(
                  "absolute z-10 rounded-full cursor-pointer transition-all duration-200 hover:scale-110",
                  "bg-background/90 backdrop-blur border shadow-md",
                  task.expanded ? "ring-2 ring-primary/30" : ""
                )}
                style={{
                  right: Math.max(8, Math.round(16 * dynamicSizes.zoomRatio)),
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: Math.max(20, Math.round(28 * dynamicSizes.zoomRatio)),
                  height: Math.max(20, Math.round(28 * dynamicSizes.zoomRatio)),
                  padding: Math.max(2, Math.round(4 * dynamicSizes.zoomRatio))
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleTask(task.id)
                }}
                title={`${task.expanded ? 'サブタスクを非表示' : 'サブタスクを表示'} (${getChildCount(task.id)}件)`}
              >
                <div className="flex items-center justify-center h-full">
                  {task.expanded ? (
                    <ChevronDown size={Math.max(8, Math.round(12 * dynamicSizes.zoomRatio))} />
                  ) : (
                    <ChevronRight size={Math.max(8, Math.round(12 * dynamicSizes.zoomRatio))} />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* サブタスク行 */}
          {task.expanded && tasks
            .filter(subtask => subtask.parentId === task.id)
            .map((subtask, subtaskIndex) => (
              <div
                key={subtask.id}
                className="relative cursor-pointer border-b border-border/30 hover:bg-accent/10 transition-colors duration-150"
                style={{ height: dynamicSizes.rowHeight.subtask }}
              >
                {/* 接続線（ズームレベルが十分な場合のみ） */}
                {dynamicSizes.zoomRatio > 0.3 && (
                  <>
                    {/* 垂直線（最初のサブタスクのみ） */}
                    {subtaskIndex === 0 && (
                      <div
                        className="absolute bg-muted-foreground/50 rounded-full"
                        style={{
                          left: getDatePosition(task.startDate) + Math.round(20 * dynamicSizes.zoomRatio),
                          top: -Math.round(12 * dynamicSizes.zoomRatio),
                          width: Math.max(1, Math.round(2 * dynamicSizes.zoomRatio)),
                          height: (tasks.filter(t => t.parentId === task.id).length * dynamicSizes.rowHeight.subtask) + Math.round(12 * dynamicSizes.zoomRatio),
                          zIndex: 1
                        }}
                      />
                    )}

                    {/* 水平線 */}
                    <div
                      className="absolute bg-muted-foreground/50 rounded-full"
                      style={{
                        left: Math.min(
                          getDatePosition(task.startDate) + Math.round(20 * dynamicSizes.zoomRatio),
                          getDatePosition(subtask.startDate) + Math.round(32 * dynamicSizes.zoomRatio)
                        ),
                        width: Math.abs(
                          getDatePosition(subtask.startDate) + Math.round(32 * dynamicSizes.zoomRatio) -
                          (getDatePosition(task.startDate) + Math.round(20 * dynamicSizes.zoomRatio))
                        ),
                        height: Math.max(1, Math.round(2 * dynamicSizes.zoomRatio)),
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 1
                      }}
                    />

                    {/* 接続点 */}
                    <div
                      className="absolute bg-primary rounded-full border-2 border-background"
                      style={{
                        left: getDatePosition(subtask.startDate) + Math.round(32 * dynamicSizes.zoomRatio) - Math.round(5 * dynamicSizes.zoomRatio),
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: Math.max(6, Math.round(10 * dynamicSizes.zoomRatio)),
                        height: Math.max(6, Math.round(10 * dynamicSizes.zoomRatio)),
                        zIndex: 2
                      }}
                    />
                  </>
                )}

                {/* サブタスクバー */}
                <TaskBar
                  task={subtask}
                  projectColor={project.color}
                  left={getDatePosition(subtask.startDate) + Math.round(32 * dynamicSizes.zoomRatio)}
                  width={getDatePosition(subtask.dueDate) - getDatePosition(subtask.startDate) + dateRange.cellWidth - Math.round(32 * dynamicSizes.zoomRatio)}
                  height={Math.round(dynamicSizes.taskBarHeight * 0.7)}
                  dynamicSizes={dynamicSizes}
                  isSubtask={true}
                />

                {/* サブタスク名ラベル（バーの右端） */}
                {dynamicSizes.zoomRatio > 0.3 && (
                  <div
                    className="absolute flex items-center pointer-events-none z-10"
                    style={{
                      left: getDatePosition(subtask.dueDate) + dateRange.cellWidth + 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <div
                      className="px-2 py-1 bg-background/90 backdrop-blur text-foreground rounded shadow-sm border text-xs font-medium"
                      style={{
                        fontSize: Math.max(8, dynamicSizes.fontSize.small)
                      }}
                    >
                      {subtask.name.length > 15 ? subtask.name.substring(0, 12) + '…' : subtask.name}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}