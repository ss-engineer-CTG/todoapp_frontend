// システムプロンプト準拠：キーボード処理簡素化（useKeyboardShortcuts + useTaskRelations統合）
// 修正内容：Homeキーによる今日スクロール機能追加

import { useEffect, useRef, useCallback } from 'react'
import { Task, Project, AreaType } from '@core/types'
import { buildTaskRelationMap, isDraftTask } from '@tasklist/utils/task'
import { logger } from '@core/utils/core'

interface UseKeyboardProps {
  tasks: Task[]
  projects: Project[]
  selectedProjectId: string
  setSelectedProjectId: (id: string) => void
  selectedTaskId: string | null
  setSelectedTaskId: (id: string | null) => void
  filteredTasks: Task[]
  activeArea: AreaType
  setActiveArea: (area: AreaType) => void
  isDetailPanelVisible: boolean
  isMultiSelectMode: boolean
  onCreateDraft: (parentId: string | null, level: number) => void
  onDeleteTask: (taskId: string) => void
  onCopyTask: (taskId: string) => void
  onPasteTask: () => void
  onToggleCompletion: (taskId: string) => void
  onToggleCollapse: (taskId: string) => void
  onSelectAll: () => void
  onRangeSelect: (direction: 'up' | 'down') => void
  onCancelDraft: (taskId: string) => void
  copiedTasksCount: number
  isInputActive: boolean
  // 🎯 新規追加：タイムライン用今日スクロール機能
  onScrollToToday?: () => void
}

export const useKeyboard = (props: UseKeyboardProps) => {
  const taskNameInputRef = useRef<HTMLInputElement>(null)
  const startDateButtonRef = useRef<HTMLButtonElement>(null)
  const dueDateButtonRef = useRef<HTMLButtonElement>(null)
  const taskNotesRef = useRef<HTMLTextAreaElement>(null)
  const saveButtonRef = useRef<HTMLButtonElement>(null)

  const taskRelationMap = buildTaskRelationMap(props.tasks)

  const isDetailPanelInputFocused = useCallback((): boolean => {
    const activeElement = document.activeElement
    return !!(
      activeElement === taskNameInputRef.current ||
      activeElement === taskNotesRef.current ||
      activeElement === startDateButtonRef.current ||
      activeElement === dueDateButtonRef.current ||
      activeElement === saveButtonRef.current
    )
  }, [])

  const handleDetailTabNavigation = useCallback((e: KeyboardEvent) => {
    if (!props.selectedTaskId || !isDetailPanelInputFocused()) return false

    const activeElement = document.activeElement
    const isShiftTab = e.shiftKey
    let handled = false

    if (activeElement === taskNameInputRef.current && !isShiftTab) {
      e.preventDefault()
      startDateButtonRef.current?.focus()
      handled = true
    } else if (activeElement === startDateButtonRef.current) {
      e.preventDefault()
      if (isShiftTab) {
        taskNameInputRef.current?.focus()
      } else {
        dueDateButtonRef.current?.focus()
      }
      handled = true
    } else if (activeElement === dueDateButtonRef.current) {
      e.preventDefault()
      if (isShiftTab) {
        startDateButtonRef.current?.focus()
      } else {
        taskNotesRef.current?.focus()
      }
      handled = true
    } else if (activeElement === taskNotesRef.current) {
      e.preventDefault()
      if (isShiftTab) {
        dueDateButtonRef.current?.focus()
      } else {
        saveButtonRef.current?.focus()
      }
      handled = true
    } else if (activeElement === saveButtonRef.current && isShiftTab) {
      e.preventDefault()
      taskNotesRef.current?.focus()
      handled = true
    }

    return handled
  }, [props.selectedTaskId, isDetailPanelInputFocused])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      try {
        if (props.isInputActive && e.key !== "Escape") {
          return
        }

        if (e.key === "Escape") {
          // 優先度1：詳細パネルで草稿タスクを編集中の場合はキャンセル
          if (props.activeArea === "details" && props.isDetailPanelVisible && props.selectedTaskId) {
            const selectedTask = props.tasks.find(t => t.id === props.selectedTaskId)
            if (selectedTask && isDraftTask(selectedTask)) {
              e.preventDefault()
              logger.info('Cancelling draft task via Escape key', { taskId: props.selectedTaskId })
              props.onCancelDraft(props.selectedTaskId)
              props.setSelectedTaskId(null)
              props.setActiveArea("tasks")
              return
            }
          }
          
          // 優先度2：詳細パネルを閉じ、選択状態も解除
          if (props.activeArea === "details" && props.isDetailPanelVisible) {
            e.preventDefault()
            props.setSelectedTaskId(null)
            props.setActiveArea("tasks")
            return
          } 
          
          // 優先度3：複数選択モードを解除
          else if (props.isMultiSelectMode) {
            e.preventDefault()
            return
          }
        }

        // 詳細パネル内Tab制限
        if (e.key === "Tab" && isDetailPanelInputFocused()) {
          if (handleDetailTabNavigation(e)) return
        }

        // 🎯 新規追加：Homeキーで今日スクロール（タイムライン専用）
        if (e.key === "Home") {
          if (props.activeArea === "timeline" && props.onScrollToToday) {
            e.preventDefault()
            logger.info('Home key pressed - scrolling to today in timeline')
            props.onScrollToToday()
            return
          }
        }

        // メインキーボードショートカット
        switch (e.key) {
          case "Enter":
            if (props.activeArea === "tasks" && !isDetailPanelInputFocused()) {
              e.preventDefault()
              if (props.selectedTaskId) {
                const task = props.tasks.find(t => t.id === props.selectedTaskId)
                if (task) {
                  props.onCreateDraft(task.parentId, task.level)
                }
              } else {
                props.onCreateDraft(null, 0)
              }
            }
            break

          case "Tab":
            if (props.activeArea === "tasks" && !isDetailPanelInputFocused() && props.selectedTaskId) {
              e.preventDefault()
              const task = props.tasks.find(t => t.id === props.selectedTaskId)
              const level = task ? task.level + 1 : 1
              props.onCreateDraft(props.selectedTaskId, level)
            }
            break

          case "Delete":
          case "Backspace":
            if (props.activeArea === "tasks" && props.selectedTaskId && !isDetailPanelInputFocused()) {
              e.preventDefault()
              props.onDeleteTask(props.selectedTaskId)
            }
            break

          case "c":
            if (e.ctrlKey && props.activeArea === "tasks" && props.selectedTaskId && !isDetailPanelInputFocused()) {
              e.preventDefault()
              props.onCopyTask(props.selectedTaskId)
            }
            break

          case "v":
            if (e.ctrlKey && props.activeArea === "tasks" && props.copiedTasksCount > 0 && !isDetailPanelInputFocused()) {
              e.preventDefault()
              props.onPasteTask()
            }
            break

          case " ":
            if (props.activeArea === "tasks" && props.selectedTaskId && !isDetailPanelInputFocused()) {
              e.preventDefault()
              props.onToggleCompletion(props.selectedTaskId)
            }
            break

          case "ArrowUp":
            e.preventDefault()
            if (props.activeArea === "tasks" && props.filteredTasks.length > 0) {
              if (e.shiftKey && props.selectedTaskId) {
                props.onRangeSelect('up')
              } else {
                // 上のタスクに移動
                if (props.selectedTaskId) {
                  const currentIndex = props.filteredTasks.findIndex(t => t.id === props.selectedTaskId)
                  if (currentIndex > 0) {
                    props.setSelectedTaskId(props.filteredTasks[currentIndex - 1].id)
                  }
                } else if (props.filteredTasks.length > 0) {
                  props.setSelectedTaskId(props.filteredTasks[0].id)
                }
              }
            } else if (props.activeArea === "projects" && props.projects.length > 0) {
              const currentIndex = props.projects.findIndex(p => p.id === props.selectedProjectId)
              if (currentIndex > 0) {
                props.setSelectedProjectId(props.projects[currentIndex - 1].id)
              }
            }
            break

          case "ArrowDown":
            e.preventDefault()
            if (props.activeArea === "tasks" && props.filteredTasks.length > 0) {
              if (e.shiftKey && props.selectedTaskId) {
                props.onRangeSelect('down')
              } else {
                // 下のタスクに移動
                if (props.selectedTaskId) {
                  const currentIndex = props.filteredTasks.findIndex(t => t.id === props.selectedTaskId)
                  if (currentIndex < props.filteredTasks.length - 1) {
                    props.setSelectedTaskId(props.filteredTasks[currentIndex + 1].id)
                  }
                } else if (props.filteredTasks.length > 0) {
                  props.setSelectedTaskId(props.filteredTasks[0].id)
                }
              }
            } else if (props.activeArea === "projects" && props.projects.length > 0) {
              const currentIndex = props.projects.findIndex(p => p.id === props.selectedProjectId)
              if (currentIndex < props.projects.length - 1) {
                props.setSelectedProjectId(props.projects[currentIndex + 1].id)
              }
            }
            break

          case "ArrowRight":
            if (e.ctrlKey && props.activeArea === "tasks" && props.selectedTaskId) {
              const hasChildren = taskRelationMap.childrenMap[props.selectedTaskId]?.length > 0
              if (hasChildren) {
                e.preventDefault()
                props.onToggleCollapse(props.selectedTaskId)
              }
            } else {
              e.preventDefault()
              if (props.activeArea === "projects") {
                props.setActiveArea("tasks")
                if (props.filteredTasks.length > 0 && !props.selectedTaskId) {
                  props.setSelectedTaskId(props.filteredTasks[0].id)
                }
              } else if (props.activeArea === "tasks" && props.isDetailPanelVisible && props.selectedTaskId) {
                props.setActiveArea("details")
                setTimeout(() => taskNameInputRef.current?.focus(), 0)
              }
            }
            break

          case "ArrowLeft":
            e.preventDefault()
            if (props.activeArea === "details") {
              props.setActiveArea("tasks")
            } else if (props.activeArea === "tasks") {
              props.setActiveArea("projects")
            }
            break

          case "a":
            if (e.ctrlKey && props.activeArea === "tasks" && props.filteredTasks.length > 0 && !isDetailPanelInputFocused()) {
              e.preventDefault()
              props.onSelectAll()
            }
            break
        }
      } catch (error) {
        logger.error('Keyboard shortcut error', { key: e.key, error })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    props,
    taskRelationMap,
    handleDetailTabNavigation,
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