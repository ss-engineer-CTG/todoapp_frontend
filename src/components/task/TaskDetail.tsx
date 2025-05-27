import React from 'react'
import { CalendarIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useProjects } from '@/hooks/useProjects'
import { useTasks } from '@/hooks/useTasks'
import { useApp } from '@/hooks/useApp'

const TaskDetail: React.FC = () => {
  const { projects } = useProjects()
  const { selectedTask, updateTask } = useTasks()
  const { activeArea, setActiveArea, isDetailPanelVisible, setIsDetailPanelVisible } = useApp()

  const taskNameRef = React.useRef<HTMLInputElement>(null)
  const startDateButtonRef = React.useRef<HTMLButtonElement>(null)
  const dueDateButtonRef = React.useRef<HTMLButtonElement>(null)
  const notesRef = React.useRef<HTMLTextAreaElement>(null)

  if (!isDetailPanelVisible) return null

  const handleClose = () => {
    setIsDetailPanelVisible(false)
    if (activeArea === 'details') {
      setActiveArea('tasks')
    }
  }

  return (
    <div
      className={cn(
        "w-80 border-l h-full",
        activeArea === 'details' ? "bg-accent/40" : ""
      )}
      onClick={() => setActiveArea('details')}
    >
      {selectedTask ? (
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">タスク詳細</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              title="詳細パネルを非表示"
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4 flex-grow overflow-y-auto">
            <div>
              <label className="text-sm font-medium mb-1 block">タスク名</label>
              <Input
                ref={taskNameRef}
                value={selectedTask.name}
                onChange={(e) => updateTask(selectedTask.id, { name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium mb-1 block">開始日</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      ref={startDateButtonRef}
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedTask.startDate, "yyyy年M月d日", { locale: ja })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedTask.startDate}
                      onSelect={(date) =>
                        updateTask(selectedTask.id, { startDate: date || new Date() })
                      }
                      initialFocus
                      locale={ja}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">期限日</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      ref={dueDateButtonRef}
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedTask.dueDate, "yyyy年M月d日", { locale: ja })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedTask.dueDate}
                      onSelect={(date) =>
                        updateTask(selectedTask.id, { dueDate: date || new Date() })
                      }
                      initialFocus
                      locale={ja}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {selectedTask.completionDate && (
              <div>
                <label className="text-sm font-medium mb-1 block">完了日</label>
                <div className="text-sm p-2 border rounded-md">
                  {format(selectedTask.completionDate, "yyyy年M月d日", { locale: ja })}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1 block">プロジェクト</label>
              <div className="text-sm p-2 border rounded-md flex items-center">
                <span
                  className="inline-block w-3 h-3 mr-2 rounded-full"
                  style={{
                    backgroundColor: projects.find(p => p.id === selectedTask.projectId)?.color || '#ccc'
                  }}
                />
                {projects.find(p => p.id === selectedTask.projectId)?.name || '不明'}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">担当者</label>
              <div className="text-sm p-2 border rounded-md">{selectedTask.assignee}</div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">メモ</label>
              <Textarea
                ref={notesRef}
                value={selectedTask.notes}
                onChange={(e) => updateTask(selectedTask.id, { notes: e.target.value })}
                className="min-h-[100px]"
                placeholder="メモを追加..."
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>タスクを選択して詳細を表示</p>
        </div>
      )}
    </div>
  )
}

export default TaskDetail