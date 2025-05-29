import { useEffect, useRef } from 'react'
import { Task, Project, TaskRelationMap, AreaType } from '../types'

interface UseKeyboardShortcutsProps {
  tasks: Task[]
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
  
  // 詳細パネル内のフォーカス管理用ref
  const taskNameInputRef = useRef<HTMLInputElement>(null)
  const startDateButtonRef = useRef<HTMLButtonElement>(null)
  const dueDateButtonRef = useRef<HTMLButtonElement>(null)
  const taskNotesRef = useRef<HTMLTextAreaElement>(null)

  // 詳細パネル内のTab navigation
  const handleDetailTabNavigation = (e: KeyboardEvent) => {
    if (!selectedTaskId) return

    const isShiftTab = e.shiftKey
    const activeElement = document.activeElement

    if (activeElement === taskNameInputRef.current) {
      if (!isShiftTab) {
        e.preventDefault()
        startDateButtonRef.current?.focus()
      }
    } else if (activeElement === startDateButtonRef.current) {
      if (isShiftTab) {
        e.preventDefault()
        taskNameInputRef.current?.focus()
      } else {
        e.preventDefault()
        dueDateButtonRef.current?.focus()
      }
    } else if (activeElement === dueDateButtonRef.current) {
      if (isShiftTab) {
        e.preventDefault()
        startDateButtonRef.current?.focus()
      } else {
        e.preventDefault()
        taskNotesRef.current?.focus()
      }
    } else if (activeElement === taskNotesRef.current) {
      if (isShiftTab) {
        e.preventDefault()
        dueDateButtonRef.current?.focus()
      }
    }
  }
  
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

      // 詳細パネル内でのTabキー処理
      if (activeArea === "details" && e.key === "Tab") {
        handleDetailTabNavigation(e)
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
              // 詳細パネルの最初の要素にフォーカス
              setTimeout(() => {
                taskNameInputRef.current?.focus()
              }, 0)
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

  // 詳細パネル用のrefを返す
  return {
    taskNameInputRef,
    startDateButtonRef,
    dueDateButtonRef,
    taskNotesRef
  }
}