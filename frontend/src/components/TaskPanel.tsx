// 修正内容：タスク要素のRef管理強化、フォーカス可能な要素として適切に設定

import React, { useRef } from 'react'
import { Task, TaskRelationMap, TaskApiActions, BatchOperation } from '../types'
import { formatDate, logger, handleError } from '../utils/core'
import { canCompleteTask, canCopyTask, filterValidTasksForBatch, isDraftTask } from '../utils/task'
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
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ShortcutGuideDialog } from './ShortcutGuideDialog'
import { useTheme } from './ThemeProvider'
import { cn } from '@/lib/utils'
import { BATCH_OPERATIONS } from '../config'

interface TaskPanelProps {
  tasks: Task[]
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
  onAddDraftTask: (parentId: string | null, level: number) => void
  apiActions: TaskApiActions
}

export const TaskPanel: React.FC<TaskPanelProps> = ({
  tasks,
  selectedProjectId,
  selectedTaskId,
  selectedTaskIds,
  onTaskSelect,
  activeArea,
  setActiveArea,
  isDetailPanelVisible,
  setIsDetailPanelVisible,
  isMultiSelectMode,
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
  onAddDraftTask,
  apiActions
}) => {
  const { theme, setTheme } = useTheme()
  const panelRef = useRef<HTMLDivElement>(null)

  const handleAddTaskClick = (parentId: string | null = null, level = 0) => {
    logger.info('Creating draft task via UI button', { parentId, level })
    onAddDraftTask(parentId, level)
  }

  const toggleDetailPanel = () => {
    setIsDetailPanelVisible(!isDetailPanelVisible)
    if (!isDetailPanelVisible && activeArea === "details") {
      setActiveArea("tasks")
    }
  }

  const handleBatchOperation = async (operation: BatchOperation) => {
    if (!isMultiSelectMode || selectedTaskIds.length === 0) return

    try {
      const validTaskIds = filterValidTasksForBatch(allTasks, selectedTaskIds)
      
      if (validTaskIds.length === 0) {
        logger.warn('No valid tasks for batch operation', { operation, selectedCount: selectedTaskIds.length })
        return
      }

      logger.info(`Starting batch operation: ${operation}`, { 
        taskCount: validTaskIds.length,
        taskIds: validTaskIds
      })

      await apiActions.batchUpdateTasks(operation, validTaskIds)
      await apiActions.loadTasks()
      
      logger.info(`Batch operation completed: ${operation}`, { 
        taskCount: validTaskIds.length 
      })
      
      onClearSelection()
      
    } catch (error) {
      handleError(error, `一括${operation}操作に失敗しました`)
    }
  }

  const handlePanelClick = () => {
    logger.info('Task panel clicked')
    setActiveArea("tasks")
    if (panelRef.current) {
      panelRef.current.focus()
    }
  }

  const handlePanelFocus = () => {
    logger.info('Task panel focused')
    setActiveArea("tasks")
  }

  const hasChildTasks = (taskId: string): boolean => {
    try {
      const childrenIds = taskRelationMap.childrenMap[taskId]
      return Array.isArray(childrenIds) && childrenIds.length > 0
    } catch (error) {
      logger.error('Error checking child tasks', { taskId, error })
      return false
    }
  }

  const renderTask = (task: Task) => {
    try {
      if (!task.id) {
        logger.warn('Task missing required fields', { task })
        return null
      }

      const isTaskDraft = isDraftTask(task)
      const taskDisplayName = task.name.trim() || '（タスク名未設定）'
      const dueDateDisplay = formatDate(task.dueDate)
      const hasChildren = hasChildTasks(task.id)

      return (
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
          // 修正：フォーカス可能な要素として適切に設定
          tabIndex={0}
          role="button"
          aria-label={`タスク: ${taskDisplayName}`}
          aria-selected={selectedTaskId === task.id}
          onKeyDown={(e) => {
            // エンターキーまたはスペースキーでタスク選択
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onTaskSelect(task.id)
            }
          }}
        >
          <div className="w-4 flex justify-center">
            {hasChildren && !isTaskDraft ? (
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleTaskCollapse(task.id)
                }}
                title={task.collapsed ? "子タスクを展開" : "子タスクを折りたたみ"}
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
            onCheckedChange={() => canCompleteTask(task) && onToggleTaskCompletion(task.id)}
            className={cn(
              "mr-2 mt-0.5",
              !canCompleteTask(task) ? "opacity-50 cursor-not-allowed" : ""
            )}
            onClick={(e) => e.stopPropagation()}
            disabled={!canCompleteTask(task)}
          />

          <div className="flex-grow">
            <div className={cn(
              "font-medium flex items-center", 
              task.completed ? "line-through" : "",
              !task.name.trim() ? "text-orange-600 italic" : ""
            )}>
              {taskDisplayName}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span className="mr-2">
                期限: {dueDateDisplay}
              </span>
              {task.notes && <span className="mr-2">📝</span>}
              {hasChildren && (
                <span className="mr-2 text-blue-500" title={`${taskRelationMap.childrenMap[task.id]?.length || 0}個の子タスク`}>
                  📂 {taskRelationMap.childrenMap[task.id]?.length || 0}
                </span>
              )}
              {!task.name.trim() && !isTaskDraft && <span className="text-orange-500 ml-2">⚠ 名前未設定</span>}
            </div>
          </div>

          <div className={cn(
            "flex",
            isTaskDraft ? "opacity-50" : "opacity-0 group-hover:opacity-100"
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                if (!isTaskDraft) {
                  handleAddTaskClick(task.id, task.level + 1)
                }
              }}
              title={isTaskDraft ? "作成中のタスクにはサブタスクを追加できません" : "サブタスク追加"}
              disabled={isTaskDraft}
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
                  disabled={isTaskDraft}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canCopyTask(task) && (
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
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteTask(task.id)
                  }}
                  className="text-destructive"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  {isTaskDraft ? "キャンセル" :
                    isMultiSelectMode && selectedTaskIds.includes(task.id)
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
      ref={panelRef}
      tabIndex={0}
      onFocus={handlePanelFocus}
      onClick={handlePanelClick}
      className={cn(
        "flex-1 flex flex-col h-full overflow-hidden outline-none",
        activeArea === "tasks" ? "bg-accent/40 ring-1 ring-primary/20" : ""
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
            onClick={() => handleAddTaskClick(null, 0)
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
        {tasks.length === 0 ? (
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
          </div>
        )}
      </div>

      {isMultiSelectMode && selectedTaskIds.length > 0 && (
        <div className="border-t p-2 bg-muted/50 flex items-center justify-between">
          <div className="text-sm font-medium">
            {selectedTaskIds.length}個のタスクを選択中
          </div>
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