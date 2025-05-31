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

  // 🔄 修正：詳細パネル内のEnterキーナビゲーション（カレンダー制御対応）
  const handleDetailEnterNavigation = useCallback((e: KeyboardEvent) => {
    if (!selectedTaskId || activeArea !== "details") return

    const activeElement = document.activeElement

    // 🆕 新規追加：カレンダーが開いている場合は通常のEnter処理をスキップ
    const isCalendarOpen = document.querySelector('[role="dialog"]') || 
                          document.querySelector('[data-state="open"]')
    
    if (isCalendarOpen) {
      logger.trace('Calendar is open, skipping Enter navigation')
      return
    }

    // Enterキーでの順次移動：タスク名 → 開始日 → 期限日 → メモ → 保存ボタン
    if (activeElement === taskNameInputRef.current) {
      e.preventDefault()
      startDateButtonRef.current?.focus()
      logger.debug('Enter navigation: moved to start date button')
    } else if (activeElement === startDateButtonRef.current) {
      e.preventDefault()
      dueDateButtonRef.current?.focus()
      logger.debug('Enter navigation: moved to due date button')
    } else if (activeElement === dueDateButtonRef.current) {
      e.preventDefault()
      taskNotesRef.current?.focus()
      logger.debug('Enter navigation: moved to notes textarea')
    } else if (activeElement === taskNotesRef.current) {
      e.preventDefault()
      saveButtonRef.current?.focus()
      logger.debug('Enter navigation: moved to save button')
    } else if (activeElement === saveButtonRef.current) {
      logger.debug('Enter on save button - save action will be handled by DetailPanel')
    }
  }, [selectedTaskId, activeArea])

  // 🔄 修正：詳細パネル内のTab navigation（カレンダー制御対応）
  const handleDetailTabNavigation = useCallback((e: KeyboardEvent) => {
    if (!selectedTaskId || activeArea !== "details") return

    // 🆕 新規追加：カレンダーが開いている場合は通常のTab処理をスキップ
    const isCalendarOpen = document.querySelector('[role="dialog"]') || 
                          document.querySelector('[data-state="open"]')
    
    if (isCalendarOpen) {
      logger.trace('Calendar is open, skipping Tab navigation')
      return
    }

    const isShiftTab = e.shiftKey
    const activeElement = document.activeElement

    // タスク名 → 開始日 → 期限日 → メモ → 保存ボタン の順序でTab移動
    if (activeElement === taskNameInputRef.current) {
      if (!isShiftTab) {
        e.preventDefault()
        startDateButtonRef.current?.focus()
        logger.trace('Tab navigation: moved to start date button')
      }
    } else if (activeElement === startDateButtonRef.current) {
      if (isShiftTab) {
        e.preventDefault()
        taskNameInputRef.current?.focus()
        logger.trace('Shift+Tab navigation: moved to task name input')
      } else {
        e.preventDefault()
        dueDateButtonRef.current?.focus()
        logger.trace('Tab navigation: moved to due date button')
      }
    } else if (activeElement === dueDateButtonRef.current) {
      if (isShiftTab) {
        e.preventDefault()
        startDateButtonRef.current?.focus()
        logger.trace('Shift+Tab navigation: moved to start date button')
      } else {
        e.preventDefault()
        taskNotesRef.current?.focus()
        logger.trace('Tab navigation: moved to notes textarea')
      }
    } else if (activeElement === taskNotesRef.current) {
      if (isShiftTab) {
        e.preventDefault()
        dueDateButtonRef.current?.focus()
        logger.trace('Shift+Tab navigation: moved to due date button')
      } else {
        e.preventDefault()
        saveButtonRef.current?.focus()
        logger.trace('Tab navigation: moved to save button')
      }
    } else if (activeElement === saveButtonRef.current) {
      if (isShiftTab) {
        e.preventDefault()
        taskNotesRef.current?.focus()
        logger.trace('Shift+Tab navigation: moved to notes textarea')
      }
    }
  }, [selectedTaskId, activeArea])

  // 🔄 修正：イベントハンドリング改善（カレンダー考慮）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      try {
        // 🔄 修正：カレンダー表示中の条件を追加
        const isCalendarOpen = document.querySelector('[role="dialog"]') || 
                              document.querySelector('[data-state="open"]')

        if (e.target instanceof HTMLInputElement || 
            e.target instanceof HTMLTextAreaElement ||
            e.target instanceof HTMLSelectElement ||
            isCalendarOpen ||
            (e.target as Element)?.closest('[role="dialog"]') ||
            (e.target as Element)?.closest('[data-state="open"]') ||
            isAddingProject || 
            isAddingTask || 
            isEditingProject) {
          
          // 🆕 新規追加：カレンダー内でのEscapeキー処理
          if (isCalendarOpen && e.key === 'Escape') {
            logger.debug('Escape pressed in calendar, allowing normal close behavior')
            return
          }

          logger.trace('Keyboard shortcut skipped - input field, calendar, or modal active', { 
            targetType: (e.target as HTMLElement)?.tagName,
            isCalendarOpen,
            isAddingProject,
            isAddingTask,
            isEditingProject
          })
          return
        }

        // 詳細パネル内でのEnterキー処理
        if (activeArea === "details" && e.key === "Enter") {
          handleDetailEnterNavigation(e)
          return
        }

        // 詳細パネル内でのTabキー処理
        if (activeArea === "details" && e.key === "Tab") {
          handleDetailTabNavigation(e)
          return
        }

        logger.debug('Processing keyboard shortcut', { 
          key: e.key, 
          ctrlKey: e.ctrlKey, 
          shiftKey: e.shiftKey,
          activeArea,
          selectedTaskId
        })

        switch (e.key) {
          case "Enter":
            if (activeArea === "tasks") {
              e.preventDefault()
              if (selectedTaskId) {
                const task = tasks.find((t) => t.id === selectedTaskId)
                if (task) {
                  logger.info('Adding task at same level via Enter key', { 
                    parentId: task.parentId, 
                    level: task.level 
                  })
                  onAddTask(task.parentId, task.level)
                }
              } else {
                logger.info('Adding root task via Enter key')
                onAddTask(null, 0)
              }
            }
            break

          case "Tab":
            if (activeArea === "details") {
              return
            }
            
            if (activeArea === "tasks" && selectedTaskId) {
              e.preventDefault()
              const task = tasks.find((t) => t.id === selectedTaskId)
              const level = task ? task.level + 1 : 1
              logger.info('Adding child task via Tab key', { 
                parentId: selectedTaskId, 
                level 
              })
              onAddTask(selectedTaskId, level)
            }
            break

          case "Delete":
          case "Backspace":
            if (activeArea === "tasks" && selectedTaskId) {
              e.preventDefault()
              logger.info('Deleting task via keyboard shortcut', { 
                taskId: selectedTaskId,
                isMultiSelect: isMultiSelectMode 
              })
              onDeleteTask(selectedTaskId)
            }
            break

          case "c":
            if (e.ctrlKey && activeArea === "tasks" && selectedTaskId) {
              e.preventDefault()
              logger.info('Copying task via Ctrl+C', { 
                taskId: selectedTaskId,
                isMultiSelect: isMultiSelectMode 
              })
              onCopyTask(selectedTaskId)
            }
            break

          case "v":
            if (e.ctrlKey && activeArea === "tasks" && copiedTasks.length > 0) {
              e.preventDefault()
              logger.info('Pasting task via Ctrl+V', { 
                copiedTaskCount: copiedTasks.length 
              })
              onPasteTask()
            }
            break

          case " ":
            if (activeArea === "tasks" && selectedTaskId) {
              e.preventDefault()
              logger.info('Toggling task completion via Space key', { 
                taskId: selectedTaskId,
                isMultiSelect: isMultiSelectMode 
              })
              onToggleTaskCompletion(selectedTaskId)
            }
            break

          case "ArrowUp":
            e.preventDefault()
            if (activeArea === "tasks" && filteredTasks.length > 0) {
              if (e.shiftKey && selectedTaskId) {
                logger.debug('Range select up via Shift+ArrowUp', { selectedTaskId })
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
                    logger.trace('Moved to previous task', { prevTaskId })
                  }
                } else if (filteredTasks.length > 0) {
                  setSelectedTaskId(filteredTasks[0].id)
                  setSelectedTaskIds([filteredTasks[0].id])
                  logger.trace('Selected first task', { taskId: filteredTasks[0].id })
                }
              }
            } else if (activeArea === "projects" && projects.length > 0) {
              const currentIndex = projects.findIndex((p) => p.id === selectedProjectId)
              if (currentIndex > 0) {
                setSelectedProjectId(projects[currentIndex - 1].id)
                logger.trace('Moved to previous project', { projectId: projects[currentIndex - 1].id })
              }
            }
            break

          case "ArrowDown":
            e.preventDefault()
            if (activeArea === "tasks" && filteredTasks.length > 0) {
              if (e.shiftKey && selectedTaskId) {
                logger.debug('Range select down via Shift+ArrowDown', { selectedTaskId })
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
                    logger.trace('Moved to next task', { nextTaskId })
                  }
                } else if (filteredTasks.length > 0) {
                  setSelectedTaskId(filteredTasks[0].id)
                  setSelectedTaskIds([filteredTasks[0].id])
                  logger.trace('Selected first task', { taskId: filteredTasks[0].id })
                }
              }
            } else if (activeArea === "projects" && projects.length > 0) {
              const currentIndex = projects.findIndex((p) => p.id === selectedProjectId)
              if (currentIndex < projects.length - 1) {
                setSelectedProjectId(projects[currentIndex + 1].id)
                logger.trace('Moved to next project', { projectId: projects[currentIndex + 1].id })
              }
            }
            break

          case "ArrowRight":
            if (e.ctrlKey && activeArea === "tasks" && selectedTaskId) {
              const hasChildren = taskRelationMap.childrenMap[selectedTaskId]?.length > 0
              if (hasChildren) {
                e.preventDefault()
                logger.info('Toggling task collapse via Ctrl+ArrowRight', { taskId: selectedTaskId })
                onToggleTaskCollapse(selectedTaskId)
              } else {
                logger.debug('Cannot collapse task - no children', { taskId: selectedTaskId })
              }
            } else {
              e.preventDefault()
              if (activeArea === "projects") {
                setActiveArea("tasks")
                if (filteredTasks.length > 0 && !selectedTaskId) {
                  setSelectedTaskId(filteredTasks[0].id)
                  setSelectedTaskIds([filteredTasks[0].id])
                }
                logger.debug('Moved from projects to tasks area')
              } else if (activeArea === "tasks" && isDetailPanelVisible && selectedTaskId) {
                setActiveArea("details")
                setTimeout(() => {
                  taskNameInputRef.current?.focus()
                }, 0)
                logger.debug('Moved from tasks to details area')
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
                logger.debug('Moved to parent task', { parentId: task.parentId })
              } else {
                setActiveArea("projects")
                logger.debug('Moved from tasks to projects area')
              }
            } else if (activeArea === "details") {
              setActiveArea("tasks")
              logger.debug('Moved from details to tasks area')
            } else if (activeArea === "tasks") {
              setActiveArea("projects")
              logger.debug('Moved from tasks to projects area')
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
              logger.info('Multi-select mode disabled via Escape key')
            }
            break

          case "a":
            if (e.ctrlKey && activeArea === "tasks" && filteredTasks.length > 0) {
              e.preventDefault()
              logger.info('Selecting all tasks via Ctrl+A', { taskCount: filteredTasks.length })
              onSelectAll()
            }
            break

          default:
            break
        }
      } catch (error) {
        logger.error('Error in keyboard shortcut handler', { 
          key: e.key,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
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
    handleDetailEnterNavigation
  ])

  return {
    taskNameInputRef,
    startDateButtonRef,
    dueDateButtonRef,
    taskNotesRef,
    saveButtonRef
  }
}