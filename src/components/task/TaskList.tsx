import React from 'react'
import { ChevronDown, ChevronRight, Plus, MoreHorizontal, Copy, Trash, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useProjects } from '@/hooks/useProjects'
import { useTasks } from '@/hooks/useTasks'
import { useApp } from '@/hooks/useApp'
import TaskForm from '@/components/task/TaskForm'
import TaskActions from '@/components/task/TaskActions'
import ErrorMessage from '@/components/common/ErrorMessage'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { getChildTasks, isTaskOverdue } from '@/utils/taskUtils'

const TaskList: React.FC = () => {
  const { selectedProjectId, projects } = useProjects()
  const {
    tasks,
    filteredTasks,
    selectedTaskIds,
    isMultiSelectMode,
    isAddingTask,
    error: taskError,
    isLoading,
    selectTask,
    toggleTaskCompleted,
    toggleTaskCollapsed,
    addTask,
    copyTasks,
    deleteTasks,
  } = useTasks()
  const { activeArea, setActiveArea } = useApp()

  const selectedProject = projects.find(p => p?.id === selectedProjectId)
  const taskRefs = React.useRef<{ [key: string]: HTMLDivElement }>({})
  const [operationError, setOperationError] = React.useState<string | null>(null)

  // 選択されたタスクを画面内にスクロール
  const scrollToTask = React.useCallback((taskId: string) => {
    try {
      const taskElement = taskRefs.current[taskId]
      if (taskElement) {
        taskElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      }
    } catch (error) {
      console.error('Error scrolling to task:', error)
    }
  }, [])

  // タスク選択の処理
  const handleTaskSelect = async (taskId: string, event?: React.MouseEvent) => {
    try {
      setOperationError(null)
      
      if (!taskId) {
        setOperationError('タスクIDが無効です')
        return
      }

      const result = selectTask(taskId, event)
      if (result.success) {
        setActiveArea('tasks')
        scrollToTask(taskId)
      } else {
        setOperationError(result.message)
      }
    } catch (error) {
      console.error('Error selecting task:', error)
      setOperationError('タスクの選択中にエラーが発生しました')
    }
  }

  // タスク追加の処理
  const handleAddTask = async (parentId: string | null = null, level = 0) => {
    try {
      setOperationError(null)
      
      const result = addTask(parentId, level)
      if (!result.success) {
        setOperationError(result.message)
      }
    } catch (error) {
      console.error('Error adding task:', error)
      setOperationError('タスクの追加中にエラーが発生しました')
    }
  }

  // タスク完了切り替えの処理
  const handleToggleCompleted = async (taskId: string, event: React.MouseEvent) => {
    try {
      event.stopPropagation()
      setOperationError(null)
      
      if (!taskId) {
        setOperationError('タスクIDが無効です')
        return
      }

      const result = toggleTaskCompleted(taskId)
      if (!result.success) {
        setOperationError(result.message)
      }
    } catch (error) {
      console.error('Error toggling task completion:', error)
      setOperationError('タスクの完了状態切り替え中にエラーが発生しました')
    }
  }

  // タスク折りたたみ切り替えの処理
  const handleToggleCollapsed = async (taskId: string, event: React.MouseEvent) => {
    try {
      event.stopPropagation()
      setOperationError(null)
      
      if (!taskId) {
        setOperationError('タスクIDが無効です')
        return
      }

      const result = toggleTaskCollapsed(taskId)
      if (!result.success) {
        setOperationError(result.message)
      }
    } catch (error) {
      console.error('Error toggling task collapsed:', error)
      setOperationError('タスクの折りたたみ切り替え中にエラーが発生しました')
    }
  }

  // タスクコピーの処理
  const handleCopyTask = async (taskId: string, event: React.MouseEvent) => {
    try {
      event.stopPropagation()
      setOperationError(null)
      
      if (!taskId) {
        setOperationError('タスクIDが無効です')
        return
      }

      const result = copyTasks([taskId])
      if (!result.success) {
        setOperationError(result.message)
      }
    } catch (error) {
      console.error('Error copying task:', error)
      setOperationError('タスクのコピー中にエラーが発生しました')
    }
  }

  // タスク削除の処理
  const handleDeleteTask = async (taskId: string, event: React.MouseEvent) => {
    try {
      event.stopPropagation()
      setOperationError(null)
      
      if (!taskId) {
        setOperationError('タスクIDが無効です')
        return
      }

      // 子タスクの数を確認
      const childTasks = getChildTasks(taskId, tasks)
      const hasSubtasks = childTasks.length > 0

      // 削除確認
      const confirmMessage = hasSubtasks
        ? `このタスクと${childTasks.length}個のサブタスクを削除しますか？`
        : 'このタスクを削除しますか？'
      
      const confirmDelete = window.confirm(confirmMessage)
      if (!confirmDelete) {
        return
      }

      const result = deleteTasks([taskId])
      if (!result.success) {
        setOperationError(result.message)
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      setOperationError('タスクの削除中にエラーが発生しました')
    }
  }

  const clearError = () => {
    setOperationError(null)
  }

  // プロジェクトが選択されていない場合
  if (!selectedProjectId) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-background">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">プロジェクトを選択してください</p>
          <p className="text-muted-foreground">
            左側のプロジェクト一覧からプロジェクトを選択してタスクを表示します
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex-1 flex flex-col h-full overflow-hidden transition-colors",
        activeArea === 'tasks' ? "bg-accent/40" : "bg-background"
      )}
      onClick={() => setActiveArea('tasks')}
    >
      {/* ヘッダー */}
      <div className="border-b p-4 flex items-center justify-between bg-background/95 backdrop-blur">
        <div className="flex items-center min-w-0 flex-1">
          <h1 className="text-xl font-semibold truncate">
            {selectedProject ? (
              <>
                <span
                  className="inline-block w-4 h-4 mr-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedProject.color }}
                />
                {selectedProject.name}
              </>
            ) : (
              'プロジェクトを選択してください'
            )}
          </h1>

          {isMultiSelectMode && selectedTaskIds.length > 0 && (
            <div className="ml-4 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {selectedTaskIds.length}個選択中
            </div>
          )}

          {isLoading && (
            <div className="ml-4">
              <LoadingSpinner size="sm" showMessage={false} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddTask(null, 0)}
            disabled={!selectedProjectId || isLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            タスク追加
          </Button>
        </div>
      </div>

      {/* エラー表示 */}
      {(operationError || taskError) && (
        <div className="p-4 pb-0">
          <ErrorMessage
            type="error"
            message={operationError || taskError || ''}
            onClose={clearError}
          />
        </div>
      )}

      {/* タスクリスト */}
      <div className="flex-1 overflow-y-auto">
        {filteredTasks.length === 0 && !isAddingTask ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <p className="text-lg font-medium mb-2">タスクがありません</p>
            <p className="text-muted-foreground mb-4">
              このプロジェクトにはまだタスクが作成されていません
            </p>
            {selectedProjectId && (
              <Button
                variant="outline"
                onClick={() => handleAddTask(null, 0)}
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-1" />
                最初のタスクを追加
              </Button>
            )}
          </div>
        ) : (
          <div className="p-4">
            <div className="space-y-1">
              {filteredTasks.map((task) => {
                if (!task) return null
                
                const childTasks = getChildTasks(task.id, tasks)
                const isOverdue = isTaskOverdue(task)
                const isSelected = selectedTaskIds.includes(task.id)
                
                return (
                  <div
                    key={task.id}
                    ref={(el) => {
                      if (el) taskRefs.current[task.id] = el
                    }}
                    className={cn(
                      "flex items-start p-3 rounded-lg cursor-pointer group transition-all duration-200",
                      isSelected 
                        ? "bg-accent/80 ring-2 ring-primary shadow-sm" 
                        : "hover:bg-accent/50",
                      task.completed ? "opacity-75" : "",
                      isOverdue && !task.completed ? "bg-destructive/5 border-l-4 border-destructive" : ""
                    )}
                    style={{ marginLeft: `${task.level * 1.5}rem` }}
                    onClick={(e) => handleTaskSelect(task.id, e)}
                  >
                    {/* 展開/折りたたみボタン */}
                    <div className="w-6 flex justify-center items-center flex-shrink-0">
                      {childTasks.length > 0 ? (
                        <button
                          className="text-muted-foreground hover:text-foreground p-1 -m-1 rounded transition-colors"
                          onClick={(e) => handleToggleCollapsed(task.id, e)}
                          title={task.collapsed ? 'サブタスクを表示' : 'サブタスクを非表示'}
                        >
                          {task.collapsed ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                    </div>

                    {/* 完了チェックボックス */}
                    <div className="flex items-center mr-3 flex-shrink-0">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => handleToggleCompleted(task.id, { stopPropagation: () => {} } as React.MouseEvent)}
                        onClick={(e) => handleToggleCompleted(task.id, e)}
                        className="mt-0.5"
                      />
                    </div>

                    {/* タスク内容 */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn(
                          "font-medium truncate",
                          task.completed ? "line-through text-muted-foreground" : "",
                          task.milestone ? "font-semibold" : ""
                        )}>
                          {task.milestone && <span className="mr-1">💎</span>}
                          {task.name}
                        </div>
                        
                        {isOverdue && !task.completed && (
                          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="flex items-center text-xs text-muted-foreground gap-3">
                        <span>
                          期限: {format(task.dueDate, "M月d日", { locale: ja })}
                          {isOverdue && !task.completed && (
                            <span className="text-destructive ml-1">(期限切れ)</span>
                          )}
                        </span>
                        
                        {task.notes && (
                          <span className="flex items-center">
                            📝 <span className="ml-1">メモあり</span>
                          </span>
                        )}
                        
                        {task.assignee && task.assignee !== '自分' && (
                          <span>担当: {task.assignee}</span>
                        )}

                        {childTasks.length > 0 && (
                          <span>サブタスク: {childTasks.length}件</span>
                        )}
                      </div>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddTask(task.id, task.level + 1)
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
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={(e) => handleCopyTask(task.id, e)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            コピー
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteTask(task.id, e)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            削除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}

              {/* 新規タスク追加フォーム */}
              {isAddingTask && <TaskForm />}
            </div>
          </div>
        )}
      </div>

      {/* 複数選択時のアクションバー */}
      {isMultiSelectMode && selectedTaskIds.length > 0 && <TaskActions />}
    </div>
  )
}

export default TaskList