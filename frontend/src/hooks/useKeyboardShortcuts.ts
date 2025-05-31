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

  // システムプロンプト準拠：KISS原則 - シンプルな判定関数に分割
  const isNewTaskInputActive = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Element)) return false
    
    // 新規タスク名入力フィールドのみ特定
    const isNewTaskInput = target.closest('[data-new-task-input]') ||
                          (target instanceof HTMLInputElement && 
                           target.placeholder === '新しいタスク')
    
    return !!isNewTaskInput
  }, [])

  // システムプロンプト準拠：カレンダー操作判定の改善
  const isCalendarInteraction = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Element)) return false
    
    return !!(
      target.closest('[role="dialog"]') ||
      target.closest('[data-state="open"]') ||
      target.closest('.calendar') ||
      target.closest('[role="gridcell"]') ||
      target.closest('[role="button"][aria-label*="日"]')
    )
  }, [])

  // システムプロンプト準拠：入力状態判定の改善（DRY原則）
  const isGeneralInputActive = useCallback((target: EventTarget | null): boolean => {
    if (!target) return false
    
    // 一般的な入力フィールド（新規タスク以外）
    const isGeneralInput = target instanceof HTMLInputElement ||
                          target instanceof HTMLTextAreaElement ||
                          target instanceof HTMLSelectElement
    
    // プロジェクト編集状態
    const isProjectEditing = isAddingProject || isEditingProject
    
    return isGeneralInput && !isNewTaskInputActive(target) || isProjectEditing
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
        logger.debug('Detail panel: Tab navigation to start date')
      }
    } else if (activeElement === startDateButtonRef.current) {
      if (isShiftTab) {
        e.preventDefault()
        taskNameInputRef.current?.focus()
        logger.debug('Detail panel: Shift+Tab navigation to task name')
      } else {
        e.preventDefault()
        dueDateButtonRef.current?.focus()
        logger.debug('Detail panel: Tab navigation to due date')
      }
    } else if (activeElement === dueDateButtonRef.current) {
      if (isShiftTab) {
        e.preventDefault()
        startDateButtonRef.current?.focus()
        logger.debug('Detail panel: Shift+Tab navigation to start date')
      } else {
        e.preventDefault()
        taskNotesRef.current?.focus()
        logger.debug('Detail panel: Tab navigation to notes')
      }
    } else if (activeElement === taskNotesRef.current) {
      if (isShiftTab) {
        e.preventDefault()
        dueDateButtonRef.current?.focus()
        logger.debug('Detail panel: Shift+Tab navigation to due date')
      } else {
        e.preventDefault()
        saveButtonRef.current?.focus()
        logger.debug('Detail panel: Tab navigation to save button')
      }
    } else if (activeElement === saveButtonRef.current) {
      if (isShiftTab) {
        e.preventDefault()
        taskNotesRef.current?.focus()
        logger.debug('Detail panel: Shift+Tab navigation to notes')
      }
    }
  }, [selectedTaskId, activeArea])

  // システムプロンプト準拠：ショートカット処理の統一（YAGNI原則）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      try {
        const target = e.target
        const isNewTaskInput = isNewTaskInputActive(target)
        const isCalendarActive = isCalendarInteraction(target)
        const isGeneralInput = isGeneralInputActive(target)

        // 新規タスク名入力中の特別処理
        if (isNewTaskInput) {
          logger.debug('New task input active - limited shortcuts only', { key: e.key })
          return // 新規タスク名入力中はショートカット無効
        }

        // 一般入力フィールド中はスキップ（カレンダー以外）
        if (isGeneralInput && !isCalendarActive) {
          logger.trace('General input active - shortcuts disabled', { 
            key: e.key,
            targetType: (target as HTMLElement)?.tagName
          })
          return
        }

        // カレンダー内部ではナビゲーション系のみ許可
        if (isCalendarActive) {
          const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape']
          if (!navigationKeys.includes(e.key) && !e.ctrlKey) {
            logger.trace('Non-navigation key blocked in calendar', { key: e.key })
            return
          }
        }

        // 詳細パネル内でのTabキー処理（優先度最高）
        if (activeArea === "details" && e.key === "Tab") {
          handleDetailTabNavigation(e)
          return
        }

        logger.debug('Processing keyboard shortcut', { 
          key: e.key, 
          ctrlKey: e.ctrlKey, 
          shiftKey: e.shiftKey,
          activeArea,
          selectedTaskId,
          isAddingTask
        })

        // システムプロンプト準拠：メインショートカット処理
        switch (e.key) {
          case "Enter":
            if (activeArea === "tasks") {
              e.preventDefault()
              if (selectedTaskId) {
                const task = tasks.find((t) => t.id === selectedTaskId)
                if (task) {
                  logger.info('Shortcut: Adding same-level task', { 
                    parentId: task.parentId, 
                    level: task.level 
                  })
                  onAddTask(task.parentId, task.level)
                }
              } else {
                logger.info('Shortcut: Adding root task')
                onAddTask(null, 0)
              }
            }
            break

          case "Tab":
            // 詳細パネル以外でのTabキー処理
            if (activeArea === "tasks" && selectedTaskId) {
              e.preventDefault()
              const task = tasks.find((t) => t.id === selectedTaskId)
              const level = task ? task.level + 1 : 1
              logger.info('Shortcut: Adding child task', { 
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
              logger.info('Shortcut: Deleting task', { 
                taskId: selectedTaskId,
                isMultiSelect: isMultiSelectMode 
              })
              onDeleteTask(selectedTaskId)
            }
            break

          case "c":
            if (e.ctrlKey && activeArea === "tasks" && selectedTaskId) {
              e.preventDefault()
              logger.info('Shortcut: Copying task', { 
                taskId: selectedTaskId,
                isMultiSelect: isMultiSelectMode 
              })
              onCopyTask(selectedTaskId)
            }
            break

          case "v":
            if (e.ctrlKey && activeArea === "tasks" && copiedTasks.length > 0) {
              e.preventDefault()
              logger.info('Shortcut: Pasting task', { 
                copiedTaskCount: copiedTasks.length 
              })
              onPasteTask()
            }
            break

          case " ":
            if (activeArea === "tasks" && selectedTaskId) {
              e.preventDefault()
              logger.info('Shortcut: Toggling task completion', { 
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
                logger.debug('Shortcut: Range select up')
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
                    logger.trace('Shortcut: Moved to previous task', { prevTaskId })
                  }
                } else if (filteredTasks.length > 0) {
                  setSelectedTaskId(filteredTasks[0].id)
                  setSelectedTaskIds([filteredTasks[0].id])
                  logger.trace('Shortcut: Selected first task')
                }
              }
            } else if (activeArea === "projects" && projects.length > 0) {
              const currentIndex = projects.findIndex((p) => p.id === selectedProjectId)
              if (currentIndex > 0) {
                setSelectedProjectId(projects[currentIndex - 1].id)
                logger.trace('Shortcut: Moved to previous project')
              }
            }
            break

          case "ArrowDown":
            e.preventDefault()
            if (activeArea === "tasks" && filteredTasks.length > 0) {
              if (e.shiftKey && selectedTaskId) {
                logger.debug('Shortcut: Range select down')
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
                    logger.trace('Shortcut: Moved to next task', { nextTaskId })
                  }
                } else if (filteredTasks.length > 0) {
                  setSelectedTaskId(filteredTasks[0].id)
                  setSelectedTaskIds([filteredTasks[0].id])
                  logger.trace('Shortcut: Selected first task')
                }
              }
            } else if (activeArea === "projects" && projects.length > 0) {
              const currentIndex = projects.findIndex((p) => p.id === selectedProjectId)
              if (currentIndex < projects.length - 1) {
                setSelectedProjectId(projects[currentIndex + 1].id)
                logger.trace('Shortcut: Moved to next project')
              }
            }
            break

          case "ArrowRight":
            if (e.ctrlKey && activeArea === "tasks" && selectedTaskId) {
              const hasChildren = taskRelationMap.childrenMap[selectedTaskId]?.length > 0
              if (hasChildren) {
                e.preventDefault()
                logger.info('Shortcut: Toggling task collapse', { taskId: selectedTaskId })
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
                logger.debug('Shortcut: Area navigation projects -> tasks')
              } else if (activeArea === "tasks" && isDetailPanelVisible && selectedTaskId) {
                setActiveArea("details")
                setTimeout(() => {
                  taskNameInputRef.current?.focus()
                }, 0)
                logger.debug('Shortcut: Area navigation tasks -> details')
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
                logger.debug('Shortcut: Moved to parent task', { parentId: task.parentId })
              } else {
                setActiveArea("projects")
                logger.debug('Shortcut: Area navigation tasks -> projects')
              }
            } else if (activeArea === "details") {
              setActiveArea("tasks")
              logger.debug('Shortcut: Area navigation details -> tasks')
            } else if (activeArea === "tasks") {
              setActiveArea("projects")
              logger.debug('Shortcut: Area navigation tasks -> projects')
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
              logger.info('Shortcut: Multi-select mode disabled')
            }
            break

          case "a":
            if (e.ctrlKey && activeArea === "tasks" && filteredTasks.length > 0) {
              e.preventDefault()
              logger.info('Shortcut: Select all tasks', { taskCount: filteredTasks.length })
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
    isNewTaskInputActive,
    isCalendarInteraction,
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