import { useEffect } from 'react'
import { Task, Project, TaskRelationMap, AreaType } from '../types'

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
  activeArea: AreaType
  setActiveArea: (area: AreaType) => void
  isDetailPanelVisible: boolean
  isMultiSelectMode: boolean
  setIsMultiSelectMode: (mode: boolean) => void
  taskRelationMap: TaskRelationMap
  copiedTasks: Task[]
  setCopiedTasks: (tasks: Task[]) => void
  onAddTask: (parentId: string | null, level: number) => void
  onDeleteTask: (taskId: string) => void
  onCopyTask: (taskId: string) => void
  onPasteTask: () => void
  onToggleTaskCompletion: (taskId: string) => void
  onToggleTaskCollapse: (taskId: string) => void
  onSelectAll: () => void
  onHandleKeyboardRangeSelect: (direction: 'up' | 'down') => void
  isAddingProject: boolean
  isAddingTask: boolean
  isEditingProject: boolean
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
  setCopiedTasks,
  onAddTask,
  onDeleteTask,
  onCopyTask,
  onPasteTask,
  onToggleTaskCompletion,
  onToggleTaskCollapse,
  onSelectAll,
  onHandleKeyboardRangeSelect,
  isAddingProject,
  isAddingTask,
  isEditingProject
}: UseKeyboardShortcutsProps) => {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 入力フィールド中やモーダル処理中はスキップ
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          isAddingProject || 
          isAddingTask || 
          isEditingProject) {
        return
      }

      switch (e.key) {
        case "Enter":
          // 同じレベルで新規タスク追加
          if (activeArea === "tasks") {
            e.preventDefault()
            if (selectedTaskId) {
              const task = tasks.find((t) => t.id === selectedTaskId)
              if (task) {
                onAddTask(task.parentId, task.level)
              }
            } else {
              onAddTask(null, 0)
            }
          }
          break

        case "Tab":
          // 詳細エリアでは通常のTab動作を許可
          if (activeArea === "details") {
            return
          }
          
          // タスクエリアでのみ子タスク追加
          if (activeArea === "tasks" && selectedTaskId) {
            e.preventDefault()
            const task = tasks.find((t) => t.id === selectedTaskId)
            const level = task ? task.level + 1 : 1
            onAddTask(selectedTaskId, level)
          }
          break

        case "Delete":
        case "Backspace":
          if (activeArea === "tasks" && selectedTaskId) {
            e.preventDefault()
            onDeleteTask(selectedTaskId)
          }
          break

        case "c":
          if (e.ctrlKey && activeArea === "tasks" && selectedTaskId) {
            e.preventDefault()
            onCopyTask(selectedTaskId)
          }
          break

        case "v":
          if (e.ctrlKey && activeArea === "tasks" && copiedTasks.length > 0) {
            e.preventDefault()
            onPasteTask()
          }
          break

        case " ":
          if (activeArea === "tasks" && selectedTaskId) {
            e.preventDefault()
            onToggleTaskCompletion(selectedTaskId)
          }
          break

        case "ArrowUp":
          e.preventDefault()
          if (activeArea === "tasks" && filteredTasks.length > 0) {
            if (e.shiftKey && selectedTaskId) {
              // Shift+矢印キーでの範囲選択
              onHandleKeyboardRangeSelect('up')
            } else {
              // 通常の移動
              if (selectedTaskId) {
                const currentIndex = filteredTasks.findIndex((t) => t.id === selectedTaskId)
                if (currentIndex > 0) {
                  const prevTaskId = filteredTasks[currentIndex - 1].id
                  setSelectedTaskId(prevTaskId)
                  if (!isMultiSelectMode) {
                    setSelectedTaskIds([prevTaskId])
                  }
                }
              } else if (filteredTasks.length > 0) {
                setSelectedTaskId(filteredTasks[0].id)
                setSelectedTaskIds([filteredTasks[0].id])
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
            if (e.shiftKey && selectedTaskId) {
              // Shift+矢印キーでの範囲選択
              onHandleKeyboardRangeSelect('down')
            } else {
              // 通常の移動
              if (selectedTaskId) {
                const currentIndex = filteredTasks.findIndex((t) => t.id === selectedTaskId)
                if (currentIndex < filteredTasks.length - 1) {
                  const nextTaskId = filteredTasks[currentIndex + 1].id
                  setSelectedTaskId(nextTaskId)
                  if (!isMultiSelectMode) {
                    setSelectedTaskIds([nextTaskId])
                  }
                }
              } else if (filteredTasks.length > 0) {
                setSelectedTaskId(filteredTasks[0].id)
                setSelectedTaskIds([filteredTasks[0].id])
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
          if (e.ctrlKey && activeArea === "tasks" && selectedTaskId) {
            // 折りたたみ切り替え
            e.preventDefault()
            onToggleTaskCollapse(selectedTaskId)
          } else {
            // エリア間移動
            e.preventDefault()
            if (activeArea === "projects") {
              setActiveArea("tasks")
              if (filteredTasks.length > 0 && !selectedTaskId) {
                setSelectedTaskId(filteredTasks[0].id)
                setSelectedTaskIds([filteredTasks[0].id])
              }
            } else if (activeArea === "tasks" && isDetailPanelVisible && selectedTaskId) {
              setActiveArea("details")
            }
          }
          break

        case "ArrowLeft":
          e.preventDefault()
          if (activeArea === "tasks" && selectedTaskId) {
            // 親タスクに移動するか、左のエリアに移動
            const task = tasks.find((t) => t.id === selectedTaskId)
            if (task && task.parentId) {
              setSelectedTaskId(task.parentId)
              setSelectedTaskIds([task.parentId])
              setIsMultiSelectMode(false)
            } else {
              setActiveArea("projects")
            }
          } else if (activeArea === "details") {
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

        case "a":
          if (e.ctrlKey && activeArea === "tasks" && filteredTasks.length > 0) {
            e.preventDefault()
            onSelectAll()
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
    activeArea,
    selectedTaskId,
    selectedTaskIds,
    tasks,
    filteredTasks,
    projects,
    selectedProjectId,
    isDetailPanelVisible,
    isMultiSelectMode,
    copiedTasks,
    isAddingProject,
    isAddingTask,
    isEditingProject,
    onAddTask,
    onDeleteTask,
    onCopyTask,
    onPasteTask,
    onToggleTaskCompletion,
    onToggleTaskCollapse,
    onSelectAll,
    onHandleKeyboardRangeSelect,
    setSelectedTaskId,
    setSelectedTaskIds,
    setSelectedProjectId,
    setActiveArea,
    setIsMultiSelectMode
  ])
}