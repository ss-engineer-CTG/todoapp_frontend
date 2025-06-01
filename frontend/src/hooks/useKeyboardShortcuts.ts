import { useEffect, useRef, useCallback } from 'react'
import { Task, Project, TaskRelationMap, AreaType } from '../types'
import { isDraftTask } from '../utils/taskUtils'
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
  // 統合フラグアプローチ：草稿タスク作成への変更
  onAddDraftTask: (parentId: string | null, level: number) => void
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
  onAddDraftTask, // 統合フラグアプローチ：草稿タスク作成に変更
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

  // システムプロンプト準拠：KISS原則 - 実際のDOMフォーカス位置を直接確認
  const isDetailPanelInputFocused = useCallback((): boolean => {
    const activeElement = document.activeElement
    if (!activeElement) return false

    return !!(
      activeElement === taskNameInputRef.current ||
      activeElement === taskNotesRef.current ||
      activeElement === startDateButtonRef.current ||
      activeElement === dueDateButtonRef.current ||
      activeElement === saveButtonRef.current
    )
  }, [])

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
    if (!selectedTaskId || !isDetailPanelInputFocused()) return false

    const isShiftTab = e.shiftKey
    const activeElement = document.activeElement

    let handled = false

    if (activeElement === taskNameInputRef.current) {
      if (!isShiftTab) {
        e.preventDefault()
        startDateButtonRef.current?.focus()
        handled = true
      }
    } else if (activeElement === startDateButtonRef.current) {
      if (isShiftTab) {
        e.preventDefault()
        taskNameInputRef.current?.focus()
        handled = true
      } else {
        e.preventDefault()
        dueDateButtonRef.current?.focus()
        handled = true
      }
    } else if (activeElement === dueDateButtonRef.current) {
      if (isShiftTab) {
        e.preventDefault()
        startDateButtonRef.current?.focus()
        handled = true
      } else {
        e.preventDefault()
        taskNotesRef.current?.focus()
        handled = true
      }
    } else if (activeElement === taskNotesRef.current) {
      if (isShiftTab) {
        e.preventDefault()
        dueDateButtonRef.current?.focus()
        handled = true
      } else {
        e.preventDefault()
        saveButtonRef.current?.focus()
        handled = true
      }
    } else if (activeElement === saveButtonRef.current) {
      if (isShiftTab) {
        e.preventDefault()
        taskNotesRef.current?.focus()
        handled = true
      }
    }

    if (handled) {
      logger.debug('Detail panel tab navigation handled', { 
        from: activeElement?.tagName, 
        shift: isShiftTab 
      })
    }

    return handled
  }, [selectedTaskId, isDetailPanelInputFocused])

  // システムプロンプト準拠：統一されたキーボードショートカット処理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      try {
        const target = e.target
        const isNewTaskInput = isNewTaskInputActive(target)
        const isCalendar = isCalendarActive(target)
        const isGeneralInput = isGeneralInputActive(target)
        const isDetailInput = isDetailPanelInputFocused()

        // 新規タスク名入力中はショートカット無効
        if (isNewTaskInput) {
          logger.trace('Keyboard shortcut skipped: new task input active')
          return
        }

        // システムプロンプト準拠：Escapeキーを最優先で処理
        if (e.key === "Escape") {
          logger.debug('Escape key pressed', { 
            activeArea, 
            isDetailPanelVisible, 
            isDetailInput,
            isMultiSelectMode,
            activeElementType: document.activeElement?.tagName
          })

          if (activeArea === "details" && isDetailPanelVisible) {
            e.preventDefault()
            setActiveArea("tasks")
            logger.logAreaTransition('details', 'tasks', 'escape_key')
            return
          } else if (isMultiSelectMode) {
            e.preventDefault()
            setIsMultiSelectMode(false)
            if (selectedTaskId) {
              setSelectedTaskIds([selectedTaskId])
            } else {
              setSelectedTaskIds([])
            }
            logger.debug('Exited multi-select mode via escape')
            return
          }
        }

        // 一般入力フィールド中はスキップ（カレンダー以外）
        if (isGeneralInput && !isCalendar) {
          logger.trace('Keyboard shortcut skipped: general input active')
          return
        }

        // カレンダー内部ではナビゲーション系のみ許可
        if (isCalendar) {
          const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape']
          if (!navigationKeys.includes(e.key) && !e.ctrlKey) {
            logger.trace('Keyboard shortcut skipped: calendar active, non-navigation key')
            return
          }
        }

        // 詳細パネル内でのTab制限
        if (e.key === "Tab" && isDetailPanelInputFocused()) {
          const handled = handleDetailTabNavigation(e)
          if (handled) {
            return
          }
        }

        // システムプロンプト準拠：統合フラグアプローチによるキー処理
        switch (e.key) {
          case "Enter":
            if (activeArea === "tasks" || (selectedTaskId && !isDetailPanelInputFocused())) {
              e.preventDefault()
              if (selectedTaskId) {
                const task = tasks.find((t) => t.id === selectedTaskId)
                if (task) {
                  logger.debug('Creating draft task via Enter key', { 
                    parentId: task.parentId, 
                    level: task.level,
                    isDraft: isDraftTask(task)
                  })
                  onAddDraftTask(task.parentId, task.level)
                }
              } else {
                logger.debug('Creating root draft task via Enter key')
                onAddDraftTask(null, 0)
              }
            }
            break

          case "Tab":
            if ((activeArea === "tasks" || selectedTaskId) && !isDetailPanelInputFocused()) {
              e.preventDefault()
              if (selectedTaskId) {
                const task = tasks.find((t) => t.id === selectedTaskId)
                const level = task ? task.level + 1 : 1
                logger.debug('Creating child draft task via Tab key', { 
                  parentId: selectedTaskId, 
                  level,
                  parentIsDraft: task && isDraftTask(task)
                })
                onAddDraftTask(selectedTaskId, level)
              }
            }
            break

          case "Delete":
          case "Backspace":
            if ((activeArea === "tasks" || selectedTaskId) && selectedTaskId && !isDetailPanelInputFocused()) {
              e.preventDefault()
              const task = tasks.find(t => t.id === selectedTaskId)
              logger.info('Deleting task via keyboard', { 
                taskId: selectedTaskId,
                isDraft: task && isDraftTask(task)
              })
              onDeleteTask(selectedTaskId)
            }
            break

          case "c":
            if (e.ctrlKey && (activeArea === "tasks" || selectedTaskId) && selectedTaskId && !isDetailPanelInputFocused()) {
              const task = tasks.find(t => t.id === selectedTaskId)
              if (task && isDraftTask(task)) {
                logger.debug('Copy skipped for draft task', { taskId: selectedTaskId })
                break
              }
              e.preventDefault()
              logger.info('Copying task via keyboard', { taskId: selectedTaskId })
              onCopyTask(selectedTaskId)
            }
            break

          case "v":
            if (e.ctrlKey && (activeArea === "tasks" || selectedTaskId) && copiedTasks.length > 0 && !isDetailPanelInputFocused()) {
              e.preventDefault()
              logger.info('Pasting task via keyboard', { copiedTasksCount: copiedTasks.length })
              onPasteTask()
            }
            break

          case " ":
            if ((activeArea === "tasks" || selectedTaskId) && selectedTaskId && !isDetailPanelInputFocused()) {
              const task = tasks.find(t => t.id === selectedTaskId)
              if (task && isDraftTask(task)) {
                logger.debug('Completion toggle skipped for draft task', { taskId: selectedTaskId })
                break
              }
              e.preventDefault()
              logger.info('Toggling task completion via keyboard', { taskId: selectedTaskId })
              onToggleTaskCompletion(selectedTaskId)
            }
            break

          case "ArrowUp":
            e.preventDefault()
            if (activeArea === "tasks" && filteredTasks.length > 0) {
              if (e.shiftKey && selectedTaskId) {
                logger.debug('Range select up via keyboard')
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
                    logger.debug('Moved to previous task', { taskId: prevTaskId })
                  }
                } else if (filteredTasks.length > 0) {
                  setSelectedTaskId(filteredTasks[0].id)
                  setSelectedTaskIds([filteredTasks[0].id])
                  logger.debug('Selected first task', { taskId: filteredTasks[0].id })
                }
              }
            } else if (activeArea === "projects" && projects.length > 0) {
              const currentIndex = projects.findIndex((p) => p.id === selectedProjectId)
              if (currentIndex > 0) {
                const prevProjectId = projects[currentIndex - 1].id
                setSelectedProjectId(prevProjectId)
                logger.debug('Moved to previous project', { projectId: prevProjectId })
              }
            }
            break

          case "ArrowDown":
            e.preventDefault()
            if (activeArea === "tasks" && filteredTasks.length > 0) {
              if (e.shiftKey && selectedTaskId) {
                logger.debug('Range select down via keyboard')
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
                    logger.debug('Moved to next task', { taskId: nextTaskId })
                  }
                } else if (filteredTasks.length > 0) {
                  setSelectedTaskId(filteredTasks[0].id)
                  setSelectedTaskIds([filteredTasks[0].id])
                  logger.debug('Selected first task', { taskId: filteredTasks[0].id })
                }
              }
            } else if (activeArea === "projects" && projects.length > 0) {
              const currentIndex = projects.findIndex((p) => p.id === selectedProjectId)
              if (currentIndex < projects.length - 1) {
                const nextProjectId = projects[currentIndex + 1].id
                setSelectedProjectId(nextProjectId)
                logger.debug('Moved to next project', { projectId: nextProjectId })
              }
            }
            break

          case "ArrowRight":
            if (e.ctrlKey && activeArea === "tasks" && selectedTaskId) {
              const task = tasks.find(t => t.id === selectedTaskId)
              if (task && isDraftTask(task)) {
                logger.debug('Collapse toggle skipped for draft task', { taskId: selectedTaskId })
                break
              }
              const hasChildren = taskRelationMap.childrenMap[selectedTaskId]?.length > 0
              if (hasChildren) {
                e.preventDefault()
                logger.debug('Toggling task collapse via keyboard', { taskId: selectedTaskId })
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
                logger.logAreaTransition('projects', 'tasks', 'arrow_right')
              } else if (activeArea === "tasks" && isDetailPanelVisible && selectedTaskId && !isDetailPanelInputFocused()) {
                setActiveArea("details")
                setTimeout(() => {
                  taskNameInputRef.current?.focus()
                }, 0)
                logger.logAreaTransition('tasks', 'details', 'arrow_right')
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
                logger.debug('Moved to parent task', { taskId: task.parentId })
              } else {
                setActiveArea("projects")
                logger.logAreaTransition('tasks', 'projects', 'arrow_left')
              }
            } else if (activeArea === "details") {
              setActiveArea("tasks")
              logger.logAreaTransition('details', 'tasks', 'arrow_left')
            } else if (activeArea === "tasks") {
              setActiveArea("projects")
              logger.logAreaTransition('tasks', 'projects', 'arrow_left')
            }
            break

          case "a":
            if (e.ctrlKey && activeArea === "tasks" && filteredTasks.length > 0 && !isDetailPanelInputFocused()) {
              e.preventDefault()
              logger.debug('Selecting all tasks via keyboard')
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
    onAddDraftTask, // 統合フラグアプローチ：草稿タスク作成に変更
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
    isGeneralInputActive,
    isDetailPanelInputFocused
  ])

  return {
    taskNameInputRef,
    startDateButtonRef,
    dueDateButtonRef,
    taskNotesRef,
    saveButtonRef
  }
}