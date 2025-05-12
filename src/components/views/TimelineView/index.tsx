"use client"

import { useContext, useState } from "react"
import { TaskContext } from "../../../contexts/TaskContext"
import { UIContext } from "../../../contexts/UIContext"
import { useFilterAndSort } from "../../../hooks/useFilterAndSort"
import { useTasks } from "../../../hooks/useTasks"
import { useKeyboardShortcuts } from "../../../hooks/useKeyboardShortcuts"
import { useDragAndDrop } from "../../../hooks/useDragAndDrop"
import FilterToolbar from "../TableView/FilterToolbar"  // 共通のフィルタリングツールバーを再利用
import TimelineItem from "./TimelineItem"
import { Switch } from "@/components/ui/switch"

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
  const { handleDragStart, isDragging, dragTask, dragType } = useDragAndDrop()
  useKeyboardShortcuts()
  
  const [showCompletedInTimeline, setShowCompletedInTimeline] = useState(false)
  
  const visibleTasks = showCompletedInTimeline 
    ? getVisibleTasks() 
    : getVisibleTasks().filter(t => !t.completed)

  // タスクがある全ての月を取得
  const allDates = visibleTasks.flatMap((task) => [task.startDate, task.dueDate])
  const months = [...new Set(allDates.map((date) => date.substring(0, 7)))].sort().map((month) => {
    const [year, monthNum] = month.split("-")
    return {
      id: month,
      name: new Date(Number.parseInt(year), Number.parseInt(monthNum) - 1, 1).toLocaleString("ja-JP", {
        year: "numeric",
        month: "long",
      }),
      daysInMonth: new Date(Number.parseInt(year), Number.parseInt(monthNum), 0).getDate()
    }
  })

  // 現在の日付を取得
  const today = new Date().toISOString().split("T")[0]

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <FilterToolbar />
        
        <div className="flex items-center gap-2 ml-4">
          <Switch 
            checked={showCompletedInTimeline}
            onCheckedChange={setShowCompletedInTimeline}
          />
          <span className="text-sm">完了済みタスクを表示</span>
        </div>
      </div>
      
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-xl font-bold mb-4">タイムライン表示</h2>
        <p className="text-sm text-gray-500 mb-4">
          タスクバーをドラッグして日程を変更できます。左端をドラッグして開始日、右端をドラッグして終了日、中央をドラッグして全体を移動できます。
        </p>

        <div className="overflow-x-auto">
          {months.map((month) => (
            <div key={month.id} className="mb-8">
              <h3 className="font-medium mb-2">{month.name}</h3>

              <div className="flex">
                <div className="w-40 font-bold"></div>
                <div
                  className="flex-1 grid border-l border-gray-200"
                  style={{ gridTemplateColumns: `repeat(${month.daysInMonth}, minmax(25px, 1fr))` }}
                >
                  {Array.from({ length: month.daysInMonth }, (_, i) => {
                    const currentDate = `${month.id}-${String(i + 1).padStart(2, '0')}`
                    const isToday = currentDate === today
                    
                    return (
                      <div 
                        key={i} 
                        className={`h-8 text-center text-xs border-r ${isToday ? 'bg-blue-100 font-bold' : 'border-gray-200'}`}
                      >
                        {i + 1}
                      </div>
                    )
                  })}
                </div>
              </div>

              {visibleTasks
                .filter((task) => {
                  const taskStartMonth = task.startDate.substring(0, 7)
                  const taskEndMonth = task.dueDate.substring(0, 7)
                  return taskStartMonth <= month.id && taskEndMonth >= month.id && !task.isProject
                })
                .map((task) => (
                  <TimelineItem
                    key={`${month.id}-${task.id}`}
                    task={task}
                    month={month}
                    isSelected={selectedTaskId === task.id}
                    onSelect={() => setSelectedTaskId(task.id)}
                    onKeyDown={onKeyDown}
                    onToggleComplete={toggleTaskCompletion}
                    ref={(el) => (taskRefs.current[task.id] = el)}
                    onDragStart={handleDragStart}
                    isDragging={isDragging && dragTask?.id === task.id}
                    dragType={dragType}
                  />
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}