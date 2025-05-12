import { useContext } from "react"
import { TaskContext } from "../contexts/TaskContext"
import { UIContext } from "../contexts/UIContext"
import { useFilterAndSort } from "./useFilterAndSort"

export function useTaskSelection() {
  const { tasks } = useContext(TaskContext)
  const { selectedTaskId, setSelectedTaskId, taskRefs } = useContext(UIContext)
  const { getVisibleTasks } = useFilterAndSort()

  // 選択されたタスクへフォーカスを移動
  const focusSelectedTask = () => {
    if (selectedTaskId && taskRefs.current[selectedTaskId]) {
      taskRefs.current[selectedTaskId]?.focus()
      
      // 視覚的なフィードバック（フラッシュエフェクト）
      const element = taskRefs.current[selectedTaskId]
      if (element) {
        element.classList.add('bg-blue-200')
        setTimeout(() => {
          element.classList.remove('bg-blue-200')
        }, 300)
      }
    }
  }

  // 上下の隣接するタスクに移動
  const navigateToAdjacentTask = (taskId: number, direction: "up" | "down") => {
    const visibleTasks = getVisibleTasks()
    const currentIndex = visibleTasks.findIndex((t) => t.id === taskId)

    if (currentIndex === -1) return

    const targetIndex =
      direction === "up" ? Math.max(0, currentIndex - 1) : Math.min(visibleTasks.length - 1, currentIndex + 1)

    if (targetIndex !== currentIndex) {
      setSelectedTaskId(visibleTasks[targetIndex].id)
    }
  }

  // 親タスクへ移動
  const navigateToParentTask = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.level === 0) return

    // 現在のタスクより前にあって、レベルが1つ小さいタスクを探す
    const taskIndex = tasks.findIndex((t) => t.id === taskId)
    for (let i = taskIndex - 1; i >= 0; i--) {
      if (tasks[i].level === task.level - 1) {
        setSelectedTaskId(tasks[i].id)
        return
      }
    }
  }

  // 子タスクへ移動
  const navigateToChildTask = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    // このタスクの直後に、レベルが1つ大きいタスクを探す
    const taskIndex = tasks.findIndex((t) => t.id === taskId)
    if (taskIndex < tasks.length - 1 && tasks[taskIndex + 1].level === task.level + 1) {
      setSelectedTaskId(tasks[taskIndex + 1].id)
    }
  }

  // このタスクに子タスクがあるかチェック
  const hasChildTasks = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return false

    const taskIndex = tasks.findIndex((t) => t.id === taskId)
    return taskIndex < tasks.length - 1 && tasks[taskIndex + 1].level > task.level
  }

  return {
    focusSelectedTask,
    navigateToAdjacentTask,
    navigateToParentTask,
    navigateToChildTask,
    hasChildTasks
  }
}