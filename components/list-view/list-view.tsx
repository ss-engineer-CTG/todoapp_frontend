"use client"

import React from "react"
import { useTodoContext } from "@/hooks/use-todo-context"
import ProjectList from "./project-list"
import TaskList from "./task-list"
import TaskDetailPanel from "./task-detail-panel"
import { cn } from "@/lib/utils"

export default function ListView() {
  const { 
    selectedProjectId, 
    selectedTaskIds, 
    isDetailPanelVisible 
  } = useTodoContext()

  return (
    <div className="flex h-full">
      {/* プロジェクトリストパネル */}
      <div className="w-64 border-r bg-muted/30">
        <ProjectList />
      </div>

      {/* タスクリストエリア */}
      <div className={cn(
        "flex-1 flex flex-col",
        isDetailPanelVisible ? "max-w-[calc(100%-64rem)]" : ""
      )}>
        <TaskList />
      </div>

      {/* タスク詳細パネル */}
      {isDetailPanelVisible && (
        <div className="w-80 border-l bg-muted/30">
          <TaskDetailPanel />
        </div>
      )}
    </div>
  )
}