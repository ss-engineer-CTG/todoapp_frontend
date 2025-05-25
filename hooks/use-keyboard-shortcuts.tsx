"use client"

import { useEffect } from "react"
import { useTodoContext } from "./use-todo-context"

export const useKeyboardShortcuts = () => {
  const {
    selectedTaskIds,
    isAddingProject,
    isAddingTask,
    isEditingProject,
    isMultiSelectMode,
    copiedTasks,
    filteredTasks,
    selectedProjectId,
    activeArea,
    addTask,
    deleteTask,
    copyTask,
    pasteTask,
    toggleTaskCompletion,
    selectTask,
    clearSelection,
    toggleMultiSelectMode
  } = useTodoContext()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 入力フィールドの場合はスキップ
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // 編集中はスキップ
      if (isAddingProject || isAddingTask || isEditingProject) {
        return
      }

      const selectedTaskId = selectedTaskIds[0]

      switch (e.key) {
        case "Enter":
          // 新規タスク追加
          if (selectedTaskId && selectedProjectId) {
            const task = filteredTasks.find(t => t.id === selectedTaskId)
            if (task) {
              e.preventDefault()
              addTask({
                name: "新しいタスク",
                projectId: selectedProjectId,
                parentId: task.parentId,
                completed: false,
                startDate: new Date(),
                dueDate: new Date(Date.now() + 86400000 * 7),
                completionDate: null,
                notes: "",
                assignee: "自分",
                level: task.level,
                collapsed: false
              })
            }
          }
          break

        case "Tab":
          // サブタスク追加
          if (activeArea === "tasks" && selectedTaskId && selectedProjectId) {
            e.preventDefault()
            const task = filteredTasks.find(t => t.id === selectedTaskId)
            if (task) {
              addTask({
                name: "新しいサブタスク",
                projectId: selectedProjectId,
                parentId: selectedTaskId,
                completed: false,
                startDate: task.startDate,
                dueDate: task.dueDate,
                completionDate: null,
                notes: "",
                assignee: task.assignee,
                level: task.level + 1,
                collapsed: false
              })
            }
          }
          break

        case "Delete":
        case "Backspace":
          // タスク削除
          if (selectedTaskIds.length > 0) {
            e.preventDefault()
            selectedTaskIds.forEach(taskId => deleteTask(taskId))
          }
          break

        case "c":
          // タスクコピー
          if (e.ctrlKey && selectedTaskIds.length > 0) {
            e.preventDefault()
            copyTask(selectedTaskIds[0])
          }
          break

        case "v":
          // タスク貼り付け
          if (e.ctrlKey && copiedTasks.length > 0) {
            e.preventDefault()
            pasteTask()
          }
          break

        case " ":
          // タスク完了状態の切り替え
          if (selectedTaskId) {
            e.preventDefault()
            toggleTaskCompletion(selectedTaskId)
          }
          break

        case "ArrowUp":
          // 上のタスクに移動
          if (activeArea === "tasks" && filteredTasks.length > 0) {
            e.preventDefault()
            const currentIndex = filteredTasks.findIndex(t => t.id === selectedTaskId)
            if (currentIndex > 0) {
              const prevTaskId = filteredTasks[currentIndex - 1].id
              selectTask(prevTaskId, e)
            }
          }
          break

        case "ArrowDown":
          // 下のタスクに移動
          if (activeArea === "tasks" && filteredTasks.length > 0) {
            e.preventDefault()
            const currentIndex = filteredTasks.findIndex(t => t.id === selectedTaskId)
            if (currentIndex < filteredTasks.length - 1) {
              const nextTaskId = filteredTasks[currentIndex + 1].id
              selectTask(nextTaskId, e)
            }
          }
          break

        case "Escape":
          // 複数選択モードを解除
          if (isMultiSelectMode) {
            e.preventDefault()
            clearSelection()
          }
          break

        case "a":
          // 全選択
          if (e.ctrlKey && activeArea === "tasks" && filteredTasks.length > 0) {
            e.preventDefault()
            toggleMultiSelectMode()
          }
          break

        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [
    selectedTaskIds,
    isAddingProject,
    isAddingTask,
    isEditingProject,
    isMultiSelectMode,
    copiedTasks,
    filteredTasks,
    selectedProjectId,
    activeArea,
    addTask,
    deleteTask,
    copyTask,
    pasteTask,
    toggleTaskCompletion,
    selectTask,
    clearSelection,
    toggleMultiSelectMode
  ])
}