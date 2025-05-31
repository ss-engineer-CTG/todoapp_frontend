import React, { useState, useRef } from 'react'
import { Task, TaskRelationMap, TaskApiActions, BatchOperation } from '../types'
import { safeFormatDate } from '../utils/dateUtils'
import { logger } from '../utils/logger'
import { createTaskOperations } from '../utils/taskOperations'
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
import { BATCH_OPERATIONS } from '../config/constants'

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
  apiActions
}) => {
  const { theme, setTheme } = useTheme()
  const [newTaskName, setNewTaskName] = useState("")
  const [newTaskParentId, setNewTaskParentId] = useState<string | null>(null)
  const [newTaskLevel, setNewTaskLevel] = useState(0)

  const newTaskInputRef = useRef<HTMLInputElement>(null)

  // システムプロンプト準拠：DRY原則 - TaskOperationsを活用
  const taskOperations = createTaskOperations(apiActions, allTasks, selectedProjectId)

  const handleAddTaskClick = (parentId: string | null = null, level = 0) => {
    logger.info('Starting new task creation via UI', { parentId, level })
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
        logger.info('Creating new task via UI', { 
          taskName: newTaskName, 
          parentId: newTaskParentId, 
          level: newTaskLevel 
        })

        const createdTask = await taskOperations.addTask(newTaskParentId, newTaskLevel, newTaskName)
        
        if (createdTask) {
          setNewTaskName("")
          setIsAddingTask(false)
          onTaskSelect(createdTask.id)
          setActiveArea("tasks")
          
          logger.info('Task created successfully via UI', { 
            taskId: createdTask.id, 
            taskName: createdTask.name 
          })
        }
      } catch (error) {
        handleError(error, 'タスクの作成に失敗しました')
        setIsAddingTask(false)
      }
    } else {
      logger.debug('New task creation cancelled - empty name')
      setIsAddingTask(false)
      setNewTaskName("")
    }
  }

  const handleCancelNewTask = () => {
    logger.debug('New task creation cancelled')
    setIsAddingTask(false)
    setNewTaskName("")
    setNewTaskParentId(null)
    setNewTaskLevel(0)
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

  const handleBatchOperation = async (operation: BatchOperation) => {
    if (!isMultiSelectMode || selectedTaskIds.length === 0) return

    try {
      logger.info(`Starting batch operation: ${operation}`, { 
        taskCount: selectedTaskIds.length,
        taskIds: selectedTaskIds 
      })

      await apiActions.batchUpdateTasks(operation, selectedTaskIds)
      await apiActions.loadTasks()
      
      logger.info(`Batch operation completed: ${operation}`, { 
        taskCount: selectedTaskIds.length 
      })
      
      onClearSelection()
      
    } catch (error) {
      handleError(error, `一括${operation}操作に失敗しました`)
    }
  }

  const renderTask = (task: Task) => {
    try {
      if (!task.id) {
        logger.warn('Task missing required fields', { task })
        return null
      }

      const taskDisplayName = task.name.trim() || '（タスク名未設定）'
      const isEmptyName = !task.name.trim()
      const dueDateDisplay = safeFormatDate(task.dueDate, '期限未設定')

      return (
        <div
          key={task.id}
          ref={(el) => setTaskRef(task.id, el)}
          className={cn(
            "flex items-start p-2 rounded-md cursor-pointer group transition-colors",
            selectedTaskId === task.id ? "bg-accent" : "hover:bg-accent/50",
            selectedTaskIds.includes(task.id) ? "bg-accent/80 ring-1 ring-primary" : "",
            task.completed ? "text-muted-foreground" : "",
            isEmptyName ? "border border-orange-200 bg-orange-50" : ""
          )}
          style={{ marginLeft: `${task.level * 1.5}rem` }}
          onClick={(e) => onTaskSelect(task.id, e)}
        >
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

          <Checkbox
            checked={task.completed}
            onCheckedChange={() => onToggleTaskCompletion(task.id)}
            className="mr-2 mt-0.5"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="flex-grow">
            <div className={cn(
              "font-medium", 
              task.completed ? "line-through" : "",
              isEmptyName ? "text-orange-600 italic" : ""
            )}>
              {taskDisplayName}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span className="mr-2">
                期限: {dueDateDisplay}
              </span>
              {task.notes && <span className="mr-2">📝</span>}
              {isEmptyName && <span className="text-orange-500 ml-2">⚠ 名前未設定</span>}
            </div>
          </div>

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
      )
    } catch (error) {
      logger.error('Error rendering task', { taskId: task.id, error })
      return (
        <div key={task.id} className="p-2 text-red-500 text-sm">
          タスクの表示中にエラーが発生しました: {task.name || 'Unknown'}
        </div>
      )
    }
  }

  return (
    <div
      // システムプロンプト準拠：KISS原則 - 最小限のフォーカス管理
      tabIndex={0}
      onFocus={() => setActiveArea("tasks")}
      onClick={() => setActiveArea("tasks")}
      className={cn(
        "flex-1 flex flex-col h-full overflow-hidden outline-none",
        activeArea === "tasks" ? "bg-accent/40" : ""
      )}
      role="region"
      aria-label="タスク一覧"
      aria-description="キーボードでタスクを操作できます"
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
          <Button
            variant={isMultiSelectMode ? "secondary" : "outline"}
            size="sm"
            onClick={toggleMultiSelectMode}
            title={isMultiSelectMode ? "複数選択モードを解除" : "複数選択モードを有効化"}
            className="text-xs"
          >
            {isMultiSelectMode ? "選択モード解除" : "複数選択"}
          </Button>

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

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <ShortcutGuideDialog />

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

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddTaskClick(null, 0)}
            disabled={!selectedProjectId}
          >
            <Plus className="h-4 w-4 mr-1" />
            タスク追加
          </Button>

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
            {tasks.map(renderTask).filter(Boolean)}

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
                    if (e.key === "Enter") {
                      e.stopPropagation()
                      handleSaveNewTask()
                    }
                    if (e.key === "Escape") {
                      e.stopPropagation()
                      handleCancelNewTask()
                    }
                  }}
                  placeholder="新しいタスク"
                  className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                  data-new-task-input="true"
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchOperation(BATCH_OPERATIONS.COPY)}
              title="選択したタスクをコピー"
            >
              <Copy className="h-4 w-4 mr-1" />
              コピー
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchOperation(BATCH_OPERATIONS.COMPLETE)}
              title="選択したタスクの完了状態を切り替え"
            >
              <Check className="h-4 w-4 mr-1" />
              完了切替
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchOperation(BATCH_OPERATIONS.DELETE)}
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