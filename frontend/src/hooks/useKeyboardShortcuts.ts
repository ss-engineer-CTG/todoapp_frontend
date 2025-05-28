import { useEffect } from 'react'
import { Task, Project, TaskRelationMap } from '../types'

interface UseKeyboardShortcutsProps {
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  projects: Project[]
  selectedProjectId: string
  setSelectedProjectId: (id: string) => void
  selectedTaskId: string | null
  setSelectedTaskId: (id: string | null) => void
  selectedTaskIds: string[]
  setSelectedTaskIds: (ids: string[]) => void
  filteredTasks: Task[]
  activeArea: string
  setActiveArea: (area: "projects" | "tasks" | "details") => void
  isDetailPanelVisible: boolean
  isMultiSelectMode: boolean
  setIsMultiSelectMode: (mode: boolean) => void
  taskRelationMap: TaskRelationMap
  copiedTasks: Task[]
  setCopiedTasks: (tasks: Task[]) => void
}

export const useKeyboardShortcuts = ({
  tasks,
  setTasks,
  projects,
  selectedProjectId,
  setSelectedProjectId,
  selectedTaskId,
  setSelectedTaskId,
  selectedTaskIds,
  setSelectedTaskIds,
  filteredTasks,
  activeArea,
  setActiveArea,
  isDetailPanelVisible,
  isMultiSelectMode,
  setIsMultiSelectMode,
  copiedTasks,
  setCopiedTasks
}: UseKeyboardShortcutsProps) => {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 入力フィールドの場合はスキップ
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case "Enter":
          // 同じレベルで新規タスク追加
          if (selectedTaskId) {
            const task = tasks.find((t) => t.id === selectedTaskId)
            if (task) {
              e.preventDefault()
              // 将来の実装: handleAddTask(task.parentId, task.level)
            }
          }
          break

        case "Tab":
          if (activeArea === "tasks" && selectedTaskId) {
            e.preventDefault()
            // 将来の実装: handleAddTask(selectedTaskId, (tasks.find((t) => t.id === selectedTaskId)?.level || 0) + 1)
          }
          break

        case "Delete":
        case "Backspace":
          if (selectedTaskId) {
            e.preventDefault()
            // 将来の実装: handleDeleteTask(selectedTaskId)
          }
          break

        case "c":
          if (e.ctrlKey && selectedTaskId) {
            e.preventDefault()
            const taskToCopy = tasks.find((task) => task.id === selectedTaskId)
            if (taskToCopy) {
              setCopiedTasks([taskToCopy])
            }
          }
          break

        case "v":
          if (e.ctrlKey && copiedTasks.length > 0) {
            e.preventDefault()
            // 将来の実装: handlePasteTask()
          }
          break

        case " ":
          if (selectedTaskId) {
            e.preventDefault()
            const updatedTasks = tasks.map((task) =>
              task.id === selectedTaskId
                ? { ...task, completed: !task.completed, completionDate: !task.completed ? new Date() : null }
                : task
            )
            setTasks(updatedTasks)
          }
          break

        case "ArrowUp":
          e.preventDefault()
          if (activeArea === "tasks" && filteredTasks.length > 0) {
            if (selectedTaskId) {
              const currentIndex = filteredTasks.findIndex((t) => t.id === selectedTaskId)
              if (currentIndex > 0) {
                const prevTaskId = filteredTasks[currentIndex - 1].id
                setSelectedTaskId(prevTaskId)
                if (!isMultiSelectMode) {
                  setSelectedTaskIds([prevTaskId])
                }
              }
            }
          } else if (activeArea === "projects" && projects.length > 0) {
            const currentIndex = projects.findIndex((p) => p.id === selectedProjectId)
            if (currentIndex > 0) {
              setSelectedProjectId(projects[currentIndex - 1].id)
            }
          }
          break

        case "ArrowDown":
          e.preventDefault()
          if (activeArea === "tasks" && filteredTasks.length > 0) {
            if (selectedTaskId) {
              const currentIndex = filteredTasks.findIndex((t) => t.id === selectedTaskId)
              if (currentIndex < filteredTasks.length - 1) {
                const nextTaskId = filteredTasks[currentIndex + 1].id
                setSelectedTaskId(nextTaskId)
                if (!isMultiSelectMode) {
                  setSelectedTaskIds([nextTaskId])
                }
              }
            }
          } else if (activeArea === "projects" && projects.length > 0) {
            const currentIndex = projects.findIndex((p) => p.id === selectedProjectId)
            if (currentIndex < projects.length - 1) {
              setSelectedProjectId(projects[currentIndex + 1].id)
            }
          }
          break

        case "ArrowRight":
          if (activeArea === "projects" || (activeArea === "tasks" && isDetailPanelVisible)) {
            e.preventDefault()
            if (activeArea === "projects") {
              setActiveArea("tasks")
            } else if (activeArea === "tasks") {
              setActiveArea("details")
            }
          }
          break

        case "ArrowLeft":
          e.preventDefault()
          if (activeArea === "details") {
            setActiveArea("tasks")
          } else if (activeArea === "tasks") {
            setActiveArea("projects")
          }
          break

        case "Escape":
          if (isMultiSelectMode) {
            e.preventDefault()
            setIsMultiSelectMode(false)
            if (selectedTaskId) {
              setSelectedTaskIds([selectedTaskId])
            } else {
              setSelectedTaskIds([])
            }
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
    selectedTaskId,
    selectedTaskIds,
    tasks,
    copiedTasks,
    filteredTasks,
    selectedProjectId,
    activeArea,
    projects,
    isDetailPanelVisible,
    isMultiSelectMode,
    setTasks,
    setCopiedTasks,
    setSelectedTaskId,
    setSelectedTaskIds,
    setSelectedProjectId,
    setActiveArea,
    setIsMultiSelectMode
  ])
}