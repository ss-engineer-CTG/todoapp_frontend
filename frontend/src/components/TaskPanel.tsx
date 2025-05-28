import React, { useState, useRef } from 'react'
import { Task, TaskRelationMap } from '../types'
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
  Sun,
  HelpCircle
} from 'lucide-react'
import { useTheme } from '../components/ThemeProvider'

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
  setCopiedTasks: (tasks: Task[]) => void
  allTasks: Task[]
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
  setCopiedTasks,
  allTasks
}) => {
  const { theme, setTheme } = useTheme()
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskName, setNewTaskName] = useState("")
  const [newTaskParentId, setNewTaskParentId] = useState<string | null>(null)
  const [newTaskLevel, setNewTaskLevel] = useState(0)

  const newTaskInputRef = useRef<HTMLInputElement>(null)

  const generateId = (prefix: string) => {
    return `${prefix}${Date.now()}`
  }

  const handleAddTask = (parentId: string | null = null, level = 0) => {
    setIsAddingTask(true)
    setNewTaskParentId(parentId)
    setNewTaskLevel(level)
    setTimeout(() => {
      newTaskInputRef.current?.focus()
    }, 0)
  }

  const handleSaveNewTask = () => {
    if (newTaskName.trim() && selectedProjectId) {
      const parentTask = newTaskParentId ? allTasks.find((task) => task.id === newTaskParentId) : null

      const newTask: Task = {
        id: generateId("t"),
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

      onTasksUpdate([...allTasks, newTask])
      setNewTaskName("")
      setIsAddingTask(false)
      onTaskSelect(newTask.id)
    } else {
      setIsAddingTask(false)
    }
  }

  const handleToggleTaskCompletion = (taskId: string) => {
    const updatedTasks = [...allTasks]
    const taskIndex = updatedTasks.findIndex((task) => task.id === taskId)

    if (taskIndex !== -1) {
      const isCompleting = !updatedTasks[taskIndex].completed
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        completed: isCompleting,
        completionDate: isCompleting ? new Date() : null,
      }

      // 子タスクの処理
      const childTasks = getChildTasks(taskId, updatedTasks)
      childTasks.forEach((childTask) => {
        const childIndex = updatedTasks.findIndex((task) => task.id === childTask.id)
        if (childIndex !== -1) {
          updatedTasks[childIndex] = {
            ...updatedTasks[childIndex],
            completed: isCompleting,
            completionDate: isCompleting ? new Date() : null,
          }
        }
      })

      onTasksUpdate(updatedTasks)
    }
  }

  const getChildTasks = (parentId: string, taskList: Task[]): Task[] => {
    const childIds = taskRelationMap.childrenMap[parentId] || []
    const directChildren = childIds.map((id) => taskList.find((task) => task.id === id)).filter(Boolean) as Task[]

    let allChildren: Task[] = [...directChildren]
    directChildren.forEach((child) => {
      allChildren = [...allChildren, ...getChildTasks(child.id, taskList)]
    })

    return allChildren
  }

  const handleToggleTaskCollapse = (taskId: string) => {
    onTasksUpdate(allTasks.map((task) => (task.id === taskId ? { ...task, collapsed: !task.collapsed } : task)))
  }

  const handleDeleteTask = (taskId: string) => {
    const childTaskIds = getChildTasks(taskId, allTasks).map((task) => task.id)
    const allTaskIdsToDelete = [taskId, ...childTaskIds]
    const updatedTasks = allTasks.filter((task) => !allTaskIdsToDelete.includes(task.id))
    onTasksUpdate(updatedTasks)
  }

  const handleCopyTask = (taskId: string) => {
    const taskToCopy = allTasks.find((task) => task.id === taskId)
    if (taskToCopy) {
      const childTasks = getChildTasks(taskId, allTasks)
      setCopiedTasks([taskToCopy, ...childTasks])
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

  const clearSelection = () => {
    setIsMultiSelectMode(false)
  }

  return (
    <div
      className={`flex-1 flex flex-col h-full overflow-hidden ${
        activeArea === "tasks" ? "bg-accent/40" : ""
      }`}
      onClick={() => setActiveArea("tasks")}
    >
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
          <button
            className={`px-3 py-1 text-xs rounded ${
              isMultiSelectMode ? "bg-secondary" : "border"
            }`}
            onClick={toggleMultiSelectMode}
            title={isMultiSelectMode ? "複数選択モードを解除" : "複数選択モードを有効化"}
          >
            {isMultiSelectMode ? "選択モード解除" : "複数選択"}
          </button>

          {isMultiSelectMode && (
            <button
              className="px-3 py-1 text-xs border rounded"
              onClick={clearSelection}
              title="選択をすべて解除"
            >
              選択解除
            </button>
          )}

          <button
            className="p-2 hover:bg-accent rounded"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            className="p-2 hover:bg-accent rounded"
            title="ショートカットキーガイド"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="mr-2"
            />
            完了タスク表示
          </label>

          <button
            className="flex items-center gap-1 px-3 py-1 border rounded hover:bg-accent"
            onClick={() => handleAddTask(null, 0)}
            disabled={!selectedProjectId}
          >
            <Plus className="h-4 w-4" />
            タスク追加
          </button>

          <button
            className="p-2 hover:bg-accent rounded"
            onClick={toggleDetailPanel}
            title={isDetailPanelVisible ? "詳細パネルを非表示" : "詳細パネルを表示"}
          >
            {isDetailPanelVisible ? <X className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tasks.length === 0 && !isAddingTask ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>タスクがありません</p>
            {selectedProjectId && (
              <button
                className="mt-2 flex items-center gap-1 px-3 py-1 border rounded hover:bg-accent"
                onClick={() => handleAddTask(null, 0)}
              >
                <Plus className="h-4 w-4" />
                最初のタスクを追加
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-start p-2 rounded-md cursor-pointer group transition-colors ${
                  selectedTaskId === task.id ? "bg-accent" : "hover:bg-accent/50"
                } ${
                  selectedTaskIds.includes(task.id) ? "bg-accent/80 ring-1 ring-primary" : ""
                } ${task.completed ? "text-muted-foreground" : ""}`}
                style={{ marginLeft: `${task.level * 1.5}rem` }}
                onClick={(e) => onTaskSelect(task.id, e)}
              >
                <div className="w-4 flex justify-center">
                  {(taskRelationMap.childrenMap[task.id]?.length || 0) > 0 ? (
                    <button
                      className="text-muted-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleTaskCollapse(task.id)
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

                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleTaskCompletion(task.id)}
                  className="mr-2 mt-0.5"
                  onClick={(e) => e.stopPropagation()}
                />

                <div className="flex-grow">
                  <div className={`font-medium ${task.completed ? "line-through" : ""}`}>
                    {task.name}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span className="mr-2">
                      期限: {format(task.dueDate, "M月d日", { locale: ja })}
                    </span>
                    {task.notes && <span className="mr-2">📝</span>}
                  </div>
                </div>

                <div className="flex opacity-0 group-hover:opacity-100">
                  <button
                    className="p-1 hover:bg-accent rounded"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddTask(task.id, task.level + 1)
                    }}
                    title="サブタスク追加"
                  >
                    <Plus className="h-3 w-3" />
                  </button>

                  <button
                    className="p-1 hover:bg-accent rounded"
                    onClick={(e) => {
                      e.stopPropagation()
                      // 将来の拡張用プレースホルダー
                    }}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}

            {isAddingTask && (
              <div className="flex items-center p-2" style={{ marginLeft: `${newTaskLevel * 1.5}rem` }}>
                <div className="w-4 mr-2" />
                <input type="checkbox" className="mr-2 opacity-50" disabled />
                <input
                  ref={newTaskInputRef}
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  onBlur={handleSaveNewTask}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveNewTask()
                    if (e.key === "Escape") setIsAddingTask(false)
                  }}
                  placeholder="新しいタスク"
                  className="flex-grow border-none bg-transparent focus:outline-none"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {isMultiSelectMode && selectedTaskIds.length > 0 && (
        <div className="border-t p-2 bg-muted/50 flex items-center justify-between">
          <div className="text-sm font-medium">{selectedTaskIds.length}個のタスクを選択中</div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-accent"
              onClick={() => selectedTaskIds[0] && handleCopyTask(selectedTaskIds[0])}
              title="選択したタスクをコピー"
            >
              <Copy className="h-4 w-4" />
              コピー
            </button>
            <button
              className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-accent"
              onClick={() => selectedTaskIds[0] && handleToggleTaskCompletion(selectedTaskIds[0])}
              title="選択したタスクの完了状態を切り替え"
            >
              <Check className="h-4 w-4" />
              完了切替
            </button>
            <button
              className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-accent text-destructive"
              onClick={() => selectedTaskIds[0] && handleDeleteTask(selectedTaskIds[0])}
              title="選択したタスクを削除"
            >
              <Trash className="h-4 w-4" />
              削除
            </button>
            <button
              className="px-2 py-1 text-xs hover:bg-accent rounded"
              onClick={clearSelection}
              title="選択を解除"
            >
              選択解除
            </button>
          </div>
        </div>
      )}
    </div>
  )
}