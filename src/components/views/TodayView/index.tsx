"use client"

import { useState, useContext } from "react"
import { Clock, CheckCircle2, Calendar } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TaskContext } from "../../../contexts/TaskContext"
import { UIContext } from "../../../contexts/UIContext"
import { useFilterAndSort } from "../../../hooks/useFilterAndSort"
import { useTasks } from "../../../hooks/useTasks"
import { useKeyboardShortcuts } from "../../../hooks/useKeyboardShortcuts"
import TaskCard from "./TaskCard"

export default function TodayView() {
  const { tasks } = useContext(TaskContext)
  const { 
    selectedTaskId, 
    setSelectedTaskId, 
    onKeyDown,
    taskRefs,
  } = useContext(UIContext)
  
  const { toggleTaskCompletion, openNotes, editTask } = useTasks()
  const { getVisibleTasks } = useFilterAndSort()
  useKeyboardShortcuts()
  
  const visibleTasks = getVisibleTasks()
  
  // 今日の日付をYYYY-MM-DD形式で取得
  const today = new Date().toISOString().split("T")[0]

  // 今日アクティブなタスクをフィルタリング（開始日 <= 今日 <= 期限日）
  const todayTasks = visibleTasks.filter((task) => !task.isProject && task.startDate <= today && task.dueDate >= today)
  
  // 期限切れのタスク（期限日 < 今日 && !completed）
  const overdueTasks = visibleTasks.filter((task) => !task.isProject && !task.completed && task.dueDate < today)
  
  // 今後のタスク（開始日 > 今日 && 開始日 <= 今日+7日）
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextWeekStr = nextWeek.toISOString().split("T")[0]
  const upcomingTasks = visibleTasks.filter((task) => 
    !task.isProject && task.startDate > today && task.startDate <= nextWeekStr
  )

  // タスクをプロジェクトごとにグループ化
  const groupTasksByProject = (taskList: Task[]) => {
    return taskList.reduce(
      (acc, task) => {
        if (!acc[task.projectId]) {
          acc[task.projectId] = []
        }
        acc[task.projectId].push(task)
        return acc
      },
      {} as Record<number, Task[]>,
    )
  }
  
  const todayTasksByProject = groupTasksByProject(todayTasks)

  // 優先度でタスクをソート
  const sortByPriority = (taskList: Task[]) => {
    const priorityOrder = { high: 3, medium: 2, low: 1, undefined: 0 }
    return [...taskList].sort((a, b) => {
      const aPriority = a.priority ? priorityOrder[a.priority] : 0
      const bPriority = b.priority ? priorityOrder[b.priority] : 0
      return bPriority - aPriority
    })
  }

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-xl font-bold mb-4">今日のタスク</h2>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="today">今日 ({todayTasks.length})</TabsTrigger>
          <TabsTrigger value="overdue" className={overdueTasks.length > 0 ? "text-red-500 font-bold" : ""}>
            期限切れ ({overdueTasks.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">今後7日間 ({upcomingTasks.length})</TabsTrigger>
          <TabsTrigger value="byProject">プロジェクト別</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-2">
          {todayTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock size={48} className="mx-auto mb-2 opacity-50" />
              <p>今日予定されているタスクはありません。</p>
            </div>
          ) : (
            sortByPriority(todayTasks).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isSelected={selectedTaskId === task.id}
                onSelect={() => setSelectedTaskId(task.id)}
                onKeyDown={onKeyDown}
                onToggleComplete={toggleTaskCompletion}
                onOpenNotes={openNotes}
                onEdit={editTask}
                ref={(el) => (taskRefs.current[task.id] = el)}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="overdue" className="space-y-2">
          {overdueTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle2 size={48} className="mx-auto mb-2 opacity-50" />
              <p>期限切れのタスクはありません。すばらしい！</p>
            </div>
          ) : (
            sortByPriority(overdueTasks).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isSelected={selectedTaskId === task.id}
                onSelect={() => setSelectedTaskId(task.id)}
                onKeyDown={onKeyDown}
                onToggleComplete={toggleTaskCompletion}
                onOpenNotes={openNotes}
                onEdit={editTask}
                ref={(el) => (taskRefs.current[task.id] = el)}
                variant="overdue"
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="upcoming" className="space-y-2">
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar size={48} className="mx-auto mb-2 opacity-50" />
              <p>近日中に予定されているタスクはありません。</p>
            </div>
          ) : (
            sortByPriority(upcomingTasks).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isSelected={selectedTaskId === task.id}
                onSelect={() => setSelectedTaskId(task.id)}
                onKeyDown={onKeyDown}
                onToggleComplete={toggleTaskCompletion}
                onOpenNotes={openNotes}
                onEdit={editTask}
                ref={(el) => (taskRefs.current[task.id] = el)}
                variant="upcoming"
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="byProject">
          {Object.entries(todayTasksByProject).map(([projectId, projectTasks]) => {
            const projectName = projectTasks[0]?.projectName || "不明なプロジェクト"
            const project = tasks.find(t => t.isProject && t.projectId === Number(projectId))
            
            return (
              <div key={projectId} className="mb-6">
                <div className="flex items-center gap-2 mb-2 border-b pb-1">
                  {project && project.color && (
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: project.color }}
                    ></div>
                  )}
                  <h3 className="font-medium text-lg">{projectName}</h3>
                </div>
                <div className="space-y-2 pl-2">
                  {projectTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isSelected={selectedTaskId === task.id}
                      onSelect={() => setSelectedTaskId(task.id)}
                      onKeyDown={onKeyDown}
                      onToggleComplete={toggleTaskCompletion}
                      onOpenNotes={openNotes}
                      onEdit={editTask}
                      ref={(el) => (taskRefs.current[task.id] = el)}
                      variant="compact"
                    />
                  ))}
                </div>
              </div>
            )
          })}
          
          {Object.keys(todayTasksByProject).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock size={48} className="mx-auto mb-2 opacity-50" />
              <p>今日予定されているタスクはありません。</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}