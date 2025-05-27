import React from 'react'
import { Copy, Check, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTasks } from '@/hooks/useTasks'

const TaskActions: React.FC = () => {
  const {
    selectedTaskIds,
    copyTasks,
    toggleMultipleTasksCompleted,
    deleteTasks,
    clearTaskSelection
  } = useTasks()

  return (
    <div className="border-t p-2 bg-muted/50 flex items-center justify-between">
      <div className="text-sm font-medium">
        {selectedTaskIds.length}個のタスクを選択中
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyTasks(selectedTaskIds)}
          title="選択したタスクをコピー"
        >
          <Copy className="h-4 w-4 mr-1" />
          コピー
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleMultipleTasksCompleted(selectedTaskIds)}
          title="選択したタスクの完了状態を切り替え"
        >
          <Check className="h-4 w-4 mr-1" />
          完了切替
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => deleteTasks(selectedTaskIds)}
          title="選択したタスクを削除"
          className="text-destructive"
        >
          <Trash className="h-4 w-4 mr-1" />
          削除
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearTaskSelection}
          title="選択を解除"
        >
          選択解除
        </Button>
      </div>
    </div>
  )
}

export default TaskActions