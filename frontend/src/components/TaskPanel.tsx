import React, { useState, useRef } from 'react'
import { Task, TaskRelationMap, TaskApiActions } from '../types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  Plus,
  MoreHorizontal,
  Trash,
  Copy,
  PanelRight,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ShortcutGuideDialog } from './ShortcutGuideDialog'
import { useTheme } from './ThemeProvider'
import { cn } from '@/lib/utils'
import { handleError } from '../utils/errorHandler'

interface TaskPanelProps {
  tasks: Task[]
  onTasksUpdate: (tasks: Task[]) => void
  selectedProjectId: string
  selectedTaskId: string | null
  selectedTaskIds: string[]
  onTaskSelect: (taskId: string, event?: React.MouseEvent) => void
  activeArea: string
  setActiveArea: (area: "projects" | "tasks" | "details") => void
  isDetailPanelVisible: boolean
  setIsDetailPanelVisible: (visible: boolean) => void
  isMultiSelectMode: boolean
  setIsMultiSelectMode: (mode: boolean) => void
  showCompleted: boolean
  setShowCompleted: (show: boolean) => void
  taskRelationMap: TaskRelationMap
  allTasks: Task[]
  onDeleteTask: (taskId: string) => void
  onCopyTask: (taskId: string) => void
  onToggleTaskCompletion: (taskId: string) => void
  onToggleTaskCollapse: (taskId: string) => void
  onClearSelection: () => void
  setTaskRef: (taskId: string, element: HTMLDivElement | null) => void
  isAddingTask: boolean
  setIsAddingTask: (adding: boolean) => void
  lastSelectedIndex: number
  apiActions: TaskApiActions
}

export const TaskPanel: React.FC<TaskPanelProps> = ({
  tasks,
  onTasksUpdate,
  selectedProjectId,
  selectedTaskId,
  selectedTaskIds,
  onTaskSelect,
  activeArea,
  setActiveArea,
  isDetailPanelVisible,
  setIsDetailPanelVisible,
  isMultiSelectMode,
  setIsMultiSelectMode,
  showCompleted,
  setShowCompleted,
  taskRelationMap,
  allTasks,
  onDeleteTask,
  onCopyTask,
  onToggleTaskCompletion,
  onToggleTaskCollapse,
  onClearSelection,
  setTaskRef,
  isAddingTask,
  setIsAddingTask,
  lastSelectedIndex,
  apiActions
}) => {
  const { theme, setTheme } = useTheme()
  const [newTaskName, setNewTaskName] = useState("")
  const [newTaskParentId, setNewTaskParentId] = useState<string | null>(null)
  const [newTaskLevel, setNewTaskLevel] = useState(0)

  const newTaskInputRef = useRef<HTMLInputElement>(null)

  const handleAddTaskClick = (parentId: string | null = null, level = 0) => {
    setIsAddingTask(true)
    setNewTaskParentId(parentId)
    setNewTaskLevel(level)
    setTimeout(() => {
      newTaskInputRef.current?.focus()
    }, 0)
  }

  const handleSaveNewTask = async () => {
    if (newTaskName.trim() && selectedProjectId) {
      try {
        const parentTask = newTaskParentId ? allTasks.find((task) => task.id === newTaskParentId) : null

        const newTask = {
          name: newTaskName,
          projectId: selectedProjectId,
          parentId: newTaskParentId,
          completed: false,
          startDate: parentTask?.startDate || new Date(),
          dueDate: parentTask?.dueDate || new Date(),
          completionDate: null,
          notes: "",
          assignee: "自分",
          level: newTaskLevel,
          collapsed: false,
        }

        const createdTask = await apiActions.createTask(newTask)
        onTasksUpdate([...allTasks, createdTask])
        setNewTaskName("")
        setIsAddingTask(false)
        onTaskSelect(createdTask.id)
        
        // タスク一覧を再読み込み
        await apiActions.loadTasks()
      } catch (error) {
        handleError(error, 'タスクの作成に失敗しました')
        setIsAddingTask(false)
      }
    } else {
      setIsAddingTask(false)
    }
  }

  const toggleDetailPanel = () => {
    setIsDetailPanelVisible(!isDetailPanelVisible)
    if (!isDetailPanelVisible && activeArea === "details") {
      setActiveArea("tasks")
    }
  }

  const toggleMultiSelectMode = () => {
    if (isMultiSelectMode) {
      setIsMultiSelectMode(false)
      if (selectedTaskIds.length > 0) {
        onTaskSelect(selectedTaskIds[0])
      }
    } else {
      setIsMultiSelectMode(true)
    }
  }

  return (
    <div
      className={cn(
        "flex-1 flex flex-col h-full overflow-hidden",
        activeArea === "tasks" ? "bg-accent/40" : ""
      )}
      onClick={() => setActiveArea("tasks")}
    >
      {/* ヘッダー */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold">タスク一覧</h1>

          {isMultiSelectMode && (
            <div className="ml-4 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
              {selectedTaskIds.length}個のタスクを選択中
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 複数選択モード切り替え */}
          <Button
            variant={isMultiSelectMode ? "secondary" : "outline"}
            size="sm"
            onClick={toggleMultiSelectMode}
            title={isMultiSelectMode ? "複数選択モードを解除" : "複数選択モードを有効化"}
            className="text-xs"
          >
            {isMultiSelectMode ? "選択モード解除" : "複数選択"}
          </Button>

          {/* 選択解除ボタン */}
          {isMultiSelectMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              title="選択をすべて解除"
              className="text-xs"
            >
              選択解除
            </Button>
          )}

          {/* テーマ切り替え */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* ショートカットガイド */}
          <ShortcutGuideDialog />

          {/* 完了タスク表示切り替え */}
          <div className="flex items-center">
            <Checkbox
              id="show-completed"
              checked={showCompleted}
              onCheckedChange={(checked) => setShowCompleted(!!checked)}
            />
            <label htmlFor="show-completed" className="ml-2 text-sm">
              完了タスク表示
            </label>
          </div>

          {/* タスク追加ボタン */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddTaskClick(null, 0)}
            disabled={!selectedProjectId}
          >
            <Plus className="h-4 w-4 mr-1" />
            タスク追加
          </Button>

          {/* 詳細パネル切り替え */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDetailPanel}
            title={isDetailPanelVisible ? "詳細パネルを非表示" : "詳細パネルを表示"}
          >
            {isDetailPanelVisible ? <X className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* タスクリスト */}
      <div className="flex-1 overflow-y-auto p-4">
        {tasks.length === 0 && !isAddingTask ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>タスクがありません</p>
            {selectedProjectId && (
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => handleAddTaskClick(null, 0)}
              >
                <Plus className="h-4 w-4 mr-1" />
                最初のタスクを追加
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                ref={(el) => setTaskRef(task.id, el)}
                className={cn(
                  "flex items-start p-2 rounded-md cursor-pointer group transition-colors",
                  selectedTaskId === task.id ? "bg-accent" : "hover:bg-accent/50",
                  selectedTaskIds.includes(task.id) ? "bg-accent/80 ring-1 ring-primary" : "",
                  task.completed ? "text-muted-foreground" : ""
                )}
                style={{ marginLeft: `${task.level * 1.5}rem` }}
                onClick={(e) => onTaskSelect(task.id, e)}
              >
                {/* 折りたたみボタン */}
                <div className="w-4 flex justify-center">
                  {(taskRelationMap.childrenMap[task.id]?.length || 0) > 0 ? (
                    <button
                      className="text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleTaskCollapse(task.id)
                      }}
                    >
                      {task.collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    <div className="w-4" />
                  )}
                </div>

                {/* チェックボックス */}
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => onToggleTaskCompletion(task.id)}
                  className="mr-2 mt-0.5"
                  onClick={(e) => e.stopPropagation()}
                />

                {/* タスク内容 */}
                <div className="flex-grow">
                  <div className={cn("font-medium", task.completed ? "line-through" : "")}>
                    {task.name}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span className="mr-2">
                      期限: {format(task.dueDate, "M月d日", { locale: ja })}
                    </span>
                    {task.notes && <span className="mr-2">📝</span>}
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="flex opacity-0 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddTaskClick(task.id, task.level + 1)
                    }}
                    title="サブタスク追加"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onCopyTask(task.id)
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {isMultiSelectMode && selectedTaskIds.includes(task.id)
                          ? `${selectedTaskIds.length}個のタスクをコピー`
                          : "コピー"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteTask(task.id)
                        }}
                        className="text-destructive"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        {isMultiSelectMode && selectedTaskIds.includes(task.id)
                          ? `${selectedTaskIds.length}個のタスクを削除`
                          : "削除"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {/* 新規タスク追加フォーム */}
            {isAddingTask && (
              <div className="flex items-center p-2" style={{ marginLeft: `${newTaskLevel * 1.5}rem` }}>
                <div className="w-4 mr-2" />
                <Checkbox className="mr-2 opacity-50" disabled />
                <Input
                  ref={newTaskInputRef}
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  onBlur={handleSaveNewTask}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveNewTask()
                    if (e.key === "Escape") setIsAddingTask(false)
                  }}
                  placeholder="新しいタスク"
                  className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 複数選択時のアクションバー */}
      {isMultiSelectMode && selectedTaskIds.length > 0 && (
        <div className="border-t p-2 bg-muted/50 flex items-center justify-between">
          <div className="text-sm font-medium">{selectedTaskIds.length}個のタスクを選択中</div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedTaskIds[0] && onCopyTask(selectedTaskIds[0])}
              title="選択したタスクをコピー"
            >
              <Copy className="h-4 w-4 mr-1" />
              コピー
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedTaskIds[0] && onToggleTaskCompletion(selectedTaskIds[0])}
              title="選択したタスクの完了状態を切り替え"
            >
              <Check className="h-4 w-4 mr-1" />
              完了切替
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedTaskIds[0] && onDeleteTask(selectedTaskIds[0])}
              title="選択したタスクを削除"
              className="text-destructive"
            >
              <Trash className="h-4 w-4 mr-1" />
              削除
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              title="選択を解除"
            >
              選択解除
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}