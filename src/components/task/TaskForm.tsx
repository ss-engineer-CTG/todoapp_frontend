import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useTasks } from '@/hooks/useTasks'

const TaskForm: React.FC = () => {
  const {
    newTaskName,
    newTaskLevel,
    setNewTaskName,
    saveNewTask,
    cancelAddTask
  } = useTasks()
  
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveNewTask()
    } else if (e.key === 'Escape') {
      cancelAddTask()
    }
  }

  return (
    <div className="flex items-center p-2" style={{ marginLeft: `${newTaskLevel * 1.5}rem` }}>
      <div className="w-4 mr-2" />
      <Checkbox className="mr-2 opacity-50" disabled />
      <Input
        ref={inputRef}
        value={newTaskName}
        onChange={(e) => setNewTaskName(e.target.value)}
        onBlur={saveNewTask}
        onKeyDown={handleKeyDown}
        placeholder="新しいタスク"
        className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
      />
    </div>
  )
}

export default TaskForm