import { useEffect, useRef, useCallback } from 'react'
import { Task, Project, TaskRelationMap, AreaType } from '../types'
import { logger } from '../utils/logger'

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
  taskRelationMap,
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
  
  const taskNameInputRef = useRef<HTMLInputElement>(null)
  const startDateButtonRef = useRef<HTMLButtonElement>(null)
  const dueDateButtonRef = useRef<HTMLButtonElement>(null)
  const taskNotesRef = useRef<HTMLTextAreaElement>(null)
  const saveButtonRef = useRef<HTMLButtonElement>(null)

  // システムプロンプト準拠：KISS原則 - シンプルな判定関数
  const isNewTaskInputActive = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Element)) return false
    
    return !!(
      target.closest('[data-new-task-input]') ||
      (target instanceof HTMLInputElement && target.placeholder === '新しいタスク')
    )
  }, [])

  const isCalendarActive = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Element)) return false
    
    return !!(
      target.closest('[role="dialog"]') ||
      target.closest('[data-state="open"]') ||
      target.closest('.calendar') ||
      target.closest('[role="gridcell"]')
    )
  }, [])

  const isGeneralInputActive = useCallback((target: EventTarget | null): boolean => {
    if (!target) return false
    
    const isInput = target instanceof HTMLInputElement ||
                   target instanceof HTMLTextAreaElement ||
                   target instanceof HTMLSelectElement
    
    const isProjectEditing = isAddingProject || isEditingProject
    const isNewTaskInput = isNewTaskInputActive(target)
    
    return (isInput && !isNewTaskInput) || isProjectEditing
  }, [isAddingProject, isEditingProject, isNewTaskInputActive])

  // システムプロンプト準拠：詳細パネル内のTab navigation
  const handleDetailTabNavigation = useCallback((e: KeyboardEvent) => {
    if (!selectedTaskId || activeArea !== "details") return

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
      } else {
        e.preventDefault()
        saveButtonRef.current?.focus()
      }
    } else if (activeElement === saveButtonRef.current) {
      if (isShiftTab) {
        e.preventDefault()
        taskNotesRef.current?.focus()
      }
    }
  }, [selectedTaskId, activeArea])

  // システムプロンプト準拠：統一されたキーボードショートカット処理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      try {
        const target = e.target
        const isNewTaskInput = isNewTaskInputActive(target)
        const isCalendar = isCalendarActive(target)
        const isGeneralInput = isGeneralInputActive(target)

        // 新規タスク名入力中はショートカット無効
        if (isNewTaskInput) {
          return
        }

        // 一般入力フィールド中はスキップ（カレンダー以外）
        if (isGeneralInput && !isCalendar) {
          return
        }

        // カレンダー内部ではナビゲーション系のみ許可
        if (isCalendar) {
          const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape']
          if (!navigationKeys.includes(e.key) && !e.ctrlKey) {
            return
          }
        }

        // 詳細パネル内でのTabキー処理
        if (activeArea === "details" && e.key === "Tab") {
          handleDetailTabNavigation(e)
          return
        }

        // システムプロンプト準拠：DRY原則 - activeAreaベースの統一判定
        switch (e.key) {
          case "Enter":
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
                onHandleKeyboardRangeSelect('up')
              } else {
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
                onHandleKeyboardRangeSelect('down')
              } else {
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
              const hasChildren = taskRelationMap.childrenMap[selectedTaskId]?.length > 0
              if (hasChildren) {
                e.preventDefault()
                onToggleTaskCollapse(selectedTaskId)
              }
            } else {
              e.preventDefault()
              if (activeArea === "projects") {
                setActiveArea("tasks")
                if (filteredTasks.length > 0 && !selectedTaskId) {
                  setSelectedTaskId(filteredTasks[0].id)
                  setSelectedTaskIds([filteredTasks[0].id])
                }
              } else if (activeArea === "tasks" && isDetailPanelVisible && selectedTaskId) {
                setActiveArea("details")
                setTimeout(() => {
                  taskNameInputRef.current?.focus()
                }, 0)
              }
            }
            break

          case "ArrowLeft":
            e.preventDefault()
            if (activeArea === "tasks" && selectedTaskId) {
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
      } catch (error) {
        logger.error('Error in keyboard shortcut handler', { 
          key: e.key,
          error: error instanceof Error ? error.message : String(error)
        })
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
    taskRelationMap,
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
    setIsMultiSelectMode,
    handleDetailTabNavigation,
    isNewTaskInputActive,
    isCalendarActive,
    isGeneralInputActive
  ])

  return {
    taskNameInputRef,
    startDateButtonRef,
    dueDateButtonRef,
    taskNotesRef,
    saveButtonRef
  }
}