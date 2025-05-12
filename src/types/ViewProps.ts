import { Task } from "./Task"

export interface TaskViewProps {
  tasks: Task[]
  selectedTaskId: number | null
  onSelect: (id: number) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>, taskId: number) => void
}