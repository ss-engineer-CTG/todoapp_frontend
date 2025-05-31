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
  
  // 詳細パネル内のフォーカス管理用ref（page.tsx準拠）
  const taskNameInputRef = useRef<HTMLInputElement>(null)
  const startDateButtonRef = useRef<HTMLButtonElement>(null)
  const dueDateButtonRef = useRef<HTMLButtonElement>(null)
  const taskNotesRef = useRef<HTMLTextAreaElement>(null)

  // システムプロンプト準拠：修正 - 詳細パネル内のTab navigation
  const handleDetailTabNavigation = useCallback((e: KeyboardEvent) => {
    if (!selectedTaskId || activeArea !== "details") return

    const isShiftTab = e.shiftKey
    const activeElement = document.activeElement

    // タスク名 → 開始日 → 期限日 → メモ の順序でTab移動
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
  }, [selectedTaskId, activeArea])

  // システムプロンプト準拠：修正 - イベントハンドリング改善
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      try {
        // 🔧 修正：入力フィールド中やモーダル処理中の条件を精密化
        if (e.target instanceof HTMLInputElement || 
            e.target instanceof HTMLTextAreaElement ||
            e.target instanceof HTMLSelectElement ||
            (e.target as Element)?.closest('[role="dialog"]') ||
            (e.target as Element)?.closest('[data-state="open"]') ||
            isAddingProject || 
            isAddingTask || 
            isEditingProject) {
          logger.trace('Keyboard shortcut skipped - input field or modal active', { 
            targetType: (e.target as HTMLElement)?.tagName,
            isAddingProject,
            isAddingTask,
            isEditingProject
          })
          return
        }

        // 詳細パネル内でのTabキー処理
        if (activeArea === "details" && e.key === "Tab") {
          handleDetailTabNavigation(e)
          return
        }

        // システムプロンプト準拠：適切なログレベルでショートカット実行をログ
        logger.debug('Processing keyboard shortcut', { 
          key: e.key, 
          ctrlKey: e.ctrlKey, 
          shiftKey: e.shiftKey,
          activeArea,
          selectedTaskId
        })

        switch (e.key) {
          case "Enter":
            // 同じレベルで新規タスク追加
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
            // 詳細エリアでは通常のTab動作を許可
            if (activeArea === "details") {
              return
            }
            
            // タスクエリアでのみ子タスク追加
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
                // Shift+矢印キーでの範囲選択
                logger.debug('Range select up via Shift+ArrowUp', { selectedTaskId })
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
                // Shift+矢印キーでの範囲選択
                logger.debug('Range select down via Shift+ArrowDown', { selectedTaskId })
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
              // 🔧 修正：子タスクの存在確認を追加
              const hasChildren = taskRelationMap.childrenMap[selectedTaskId]?.length > 0
              if (hasChildren) {
                e.preventDefault()
                logger.info('Toggling task collapse via Ctrl+ArrowRight', { taskId: selectedTaskId })
                onToggleTaskCollapse(selectedTaskId)
              } else {
                logger.debug('Cannot collapse task - no children', { taskId: selectedTaskId })
              }
            } else {
              // エリア間移動
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
                // 詳細パネルの最初の要素にフォーカス
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
              // 親タスクに移動するか、左のエリアに移動
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
            // その他のキーは処理しない
            break
        }
      } catch (error) {
        // システムプロンプト準拠：エラー詳細や例外スタックトレースを記録
        logger.error('Error in keyboard shortcut handler', { 
          key: e.key,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        })
      }
    }

    // システムプロンプト準拠：イベントリスナーの適切な管理
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
    handleDetailTabNavigation
  ])

  // 詳細パネル用のrefを返す
  return {
    taskNameInputRef,
    startDateButtonRef,
    dueDateButtonRef,
    taskNotesRef
  }
}