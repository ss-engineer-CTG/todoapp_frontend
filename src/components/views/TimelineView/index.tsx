// src/components/views/TimelineView/index.tsx
"use client"

import { useContext, useState, useEffect } from "react"
import { TaskContext } from "../../../contexts/TaskContext"
import { UIContext } from "../../../contexts/UIContext"
import { useFilterAndSort } from "../../../hooks/useFilterAndSort"
import { useTasks } from "../../../hooks/useTasks"
import { useKeyboardShortcuts } from "../../../hooks/useKeyboardShortcuts"
import { useDragAndDrop } from "../../../hooks/useDragAndDrop"
import FilterToolbar from "../TableView/FilterToolbar"
import TimelineItem from "./TimelineItem"
import AddTaskButton from "../../common/AddTaskButton"
import { Switch } from "@/components/ui/switch"
import { Task } from "../../../types/Task"
import { logInfo } from "../../../utils/logUtils"

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
  const { handleDragStart, isDragging, dragTask, dragType, dragPreview } = useDragAndDrop()
  
  // キーボードショートカットを有効化
  useKeyboardShortcuts()
  
  const [showCompletedInTimeline, setShowCompletedInTimeline] = useState(false)
  
  const visibleTasks = showCompletedInTimeline 
    ? getVisibleTasks().filter(t => !t.isProject) 
    : getVisibleTasks().filter(t => !t.isProject && !t.completed);

  // 表示期間を決定（少なくとも現在月から3ヶ月分）
  const determineMonthsToShow = () => {
    const today = new Date();
    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endMonth = new Date(today.getFullYear(), today.getMonth() + 2, 1);
    
    // タスクの日付範囲も考慮
    const allDates = visibleTasks.flatMap((task) => [task.startDate, task.dueDate]);
    
    if (allDates.length > 0) {
      const earliestDate = new Date(Math.min(...allDates.map(d => new Date(d).getTime())));
      const latestDate = new Date(Math.max(...allDates.map(d => new Date(d).getTime())));
      
      // 開始月を早い方に設定
      if (earliestDate < startMonth) {
        startMonth.setMonth(earliestDate.getMonth());
        startMonth.setFullYear(earliestDate.getFullYear());
      }
      
      // 終了月を遅い方に設定
      if (latestDate > endMonth) {
        endMonth.setMonth(latestDate.getMonth());
        endMonth.setFullYear(latestDate.getFullYear());
      }
    }
    
    return generateMonthRange(startMonth, endMonth);
  };
  
  // 月範囲を生成
  const generateMonthRange = (startMonth: Date, endMonth: Date) => {
    const months = [];
    const current = new Date(startMonth);
    
    while (current <= endMonth) {
      const year = current.getFullYear();
      const month = current.getMonth() + 1;
      const monthId = `${year}-${String(month).padStart(2, '0')}`;
      
      months.push({
        id: monthId,
        name: current.toLocaleString("ja-JP", {
          year: "numeric",
          month: "long",
        }),
        daysInMonth: new Date(year, month, 0).getDate()
      });
      
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  };

  // 月の配列を計算
  const months = determineMonthsToShow();

  // 現在の日付を取得
  const today = new Date().toISOString().split("T")[0];

  // コンポーネントマウント時のログ
  useEffect(() => {
    logInfo("TimelineView がレンダリングされました");
  }, []);

  // ドラッグプレビューを表示
  const renderDragPreview = () => {
    if (!dragPreview || !dragTask) return null;
    
    const task = tasks.find(t => t.id === dragPreview.taskId);
    if (!task) return null;
    
    let previewStartDate = new Date(task.startDate);
    let previewEndDate = new Date(task.dueDate);
    
    if (dragPreview.type === "start" || dragPreview.type === "move") {
      previewStartDate.setDate(previewStartDate.getDate() + dragPreview.daysDelta);
    }
    
    if (dragPreview.type === "end" || dragPreview.type === "move") {
      previewEndDate.setDate(previewEndDate.getDate() + dragPreview.daysDelta);
    }
    
    return (
      <div className="fixed bottom-4 right-4 bg-white shadow-lg p-3 rounded-lg z-50 border border-blue-300">
        <div className="text-sm font-medium mb-1">ドラッグプレビュー</div>
        <div className="text-xs">
          <div>開始日: {previewStartDate.toISOString().substring(0, 10)}</div>
          <div>終了日: {previewEndDate.toISOString().substring(0, 10)}</div>
          <div>期間: {Math.round((previewEndDate.getTime() - previewStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1}日</div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center flex-1">
          <FilterToolbar />
          
          <div className="flex items-center gap-2 ml-4">
            <Switch 
              checked={showCompletedInTimeline}
              onCheckedChange={setShowCompletedInTimeline}
              id="show-completed"
            />
            <label htmlFor="show-completed" className="text-sm cursor-pointer">完了済みタスクを表示</label>
          </div>
        </div>
        
        {/* タスク追加ボタン - 共通コンポーネントを使用 */}
        <AddTaskButton className="ml-4 whitespace-nowrap" />
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
                        className={`h-8 text-center text-xs border-r ${
                          isToday ? 'bg-blue-100 font-bold' : (
                            (i + 1) % 7 === 0 || (i + 1) % 7 === 1 ? 'bg-gray-50' : 'border-gray-200'
                          )
                        }`}
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
                  return taskStartMonth <= month.id && taskEndMonth >= month.id
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
                    ref={(el) => {
                      if (el) taskRefs.current[task.id] = el;
                    }}
                    onDragStart={handleDragStart}
                    isDragging={isDragging && dragTask?.id === task.id}
                    dragType={dragType}
                  />
                ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* ドラッグプレビュー表示 */}
      {dragPreview && renderDragPreview()}
    </div>
  )
}