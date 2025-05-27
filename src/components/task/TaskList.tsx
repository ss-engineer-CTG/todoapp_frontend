import React from 'react'
import { ChevronDown, ChevronRight, Plus, MoreHorizontal, Copy, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useProjects } from '@/hooks/useProjects'
import { useTasks } from '@/hooks/useTasks'
import { useApp } from '@/hooks/useApp'
import TaskForm from '@/components/task/TaskForm'
import TaskActions from '@/components/task/TaskActions'

const TaskList: React.FC = () => {
  const { selectedProjectId, projects } = useProjects()
  const {
    tasks,
    filteredTasks,
    selectedTaskIds,
    isMultiSelectMode,
    isAddingTask,
    newTaskName,
    setNewTaskName,
    selectTask,
    toggleTaskCompleted,
    toggleTaskCollapsed,
    addTask,
    saveNewTask,
    cancelAddTask,
    copyTasks,
    deleteTasks,
  } = useTasks()
  const { activeArea, setActiveArea, showCompleted } = useApp()

  const selectedProject = projects.find(p => p.id === selectedProjectId)
  const newTaskInputRef = React.useRef<HTMLInputElement>(null)
  const taskRefs = React.useRef<{ [key: string]: HTMLDivElement }>({})

  React.useEffect(() => {
    if (isAddingTask) {
      newTaskInputRef.current?.focus()
    }
  }, [isAddingTask])

  const handleTaskSelect = (taskId: string, event?: React.MouseEvent) => {
    selectTask(taskId, event)
    setActiveArea('tasks')
  }

  const handleAddTask = (parentId: string | null = null, level = 0) => {
    addTask(parentId, level)
  }

  return (
    <div
      className={cn(
        "flex-1 flex flex-col h-full overflow-hidden",
        activeArea === 'tasks' ? "bg-accent/40" : ""
      )}
      onClick={() => setActiveArea('tasks')}
    >
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold">
            {selectedProject ? (
              <>
                <span
                  className="inline-block w-4 h-4 mr-2 rounded-full"
                  style={{ backgroundColor: selectedProject.color }}
                />
                {selectedProject.name}
              </>
            ) : (
              'プロジェクトを選択してください'
            )}
          </h1>

          {isMultiSelectMode && (
            <div className="ml-4 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
              {selectedTaskIds.length}個のタスクを選択中
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddTask(null, 0)}
            disabled={!selectedProjectId}
          >
            <Plus className="h-4 w-4 mr-1" />
            タスク追加
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredTasks.length === 0 && !isAddingTask ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>タスクがありません</p>
            {selectedProjectId && (
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => handleAddTask(null, 0)}
              >
                <Plus className="h-4 w-4 mr-1" />
                最初のタスクを追加
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                ref={(el) => {
                  if (el) taskRefs.current[task.id] = el
                }}
                className={cn(
                  "flex items-start p-2 rounded-md cursor-pointer group transition-colors",
                  selectedTaskIds.includes(task.id) ? "bg-accent/80 ring-1 ring-primary" : "hover:bg-accent/50",
                  task.completed ? "text-muted-foreground" : ""
                )}
                style={{ marginLeft: `${task.level * 1.5}rem` }}
                onClick={(e) => handleTaskSelect(task.id, e)}
              >
                <div className="w-4 flex justify-center">
                  {task.subtasks && task.subtasks.length > 0 ? (
                    <button
                      className="text-muted-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleTaskCollapsed(task.id)
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
                  onCheckedChange={() => toggleTaskCompleted(task.id)}
                  className="mr-2 mt-0.5"
                  onClick={(e) => e.stopPropagation()}
                />

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

                <div className="flex opacity-0 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
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
                          copyTasks([task.id])
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        コピー
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTasks([task.id])
                        }}
                        className="text-destructive"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        削除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {isAddingTask && <TaskForm />}
          </div>
        )}
      </div>

      {isMultiSelectMode && selectedTaskIds.length > 0 && <TaskActions />}
    </div>
  )
}

export default TaskList