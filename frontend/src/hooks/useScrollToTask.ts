import { useEffect, useRef } from 'react'

interface UseScrollToTaskProps {
  selectedTaskId: string | null
  taskList: Array<{ id: string }>
}

export const useScrollToTask = ({ selectedTaskId, taskList }: UseScrollToTaskProps) => {
  const taskRefs = useRef<{ [key: string]: HTMLDivElement }>({})

  // 選択されたタスクを表示範囲内にスクロール
  useEffect(() => {
    if (selectedTaskId && taskRefs.current[selectedTaskId]) {
      taskRefs.current[selectedTaskId].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      })
    }
  }, [selectedTaskId])

  // タスクRefを設定する関数
  const setTaskRef = (taskId: string, element: HTMLDivElement | null) => {
    if (element) {
      taskRefs.current[taskId] = element
    } else {
      delete taskRefs.current[taskId]
    }
  }

  return {
    taskRefs: taskRefs.current,
    setTaskRef
  }
}