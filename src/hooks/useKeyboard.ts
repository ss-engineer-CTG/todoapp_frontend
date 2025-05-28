import { useEffect, useCallback } from 'react'
import { useProjects } from '@/hooks/useProjects'
import { useTasks } from '@/hooks/useTasks'
import { useApp } from '@/hooks/useApp'

export function useKeyboard() {
  const { projects, selectedProjectId, setSelectedProjectId } = useProjects()
  const {
    filteredTasks,
    selectedTaskId,
    selectedTaskIds,
    isMultiSelectMode,
    addTask,
    selectTask,
    toggleTaskCompleted,
    toggleTaskCollapsed,
    copyTasks,
    pasteTasks,
    deleteTasks,
    clearTaskSelection,
  } = useTasks()
  const { activeArea, setActiveArea } = useApp()

  const isInputFocused = useCallback((): boolean => {
    try {
      const activeElement = document.activeElement
      return Boolean(
        activeElement && (
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          activeElement instanceof HTMLSelectElement ||
          activeElement.getAttribute('contenteditable') === 'true'
        )
      )
    } catch (error) {
      console.error('Error checking input focus:', error)
      return false
    }
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    try {
      // 入力フィールドの場合はスキップ
      if (isInputFocused()) {
        return
      }

      switch (e.key) {
        case 'Enter':
          // 同じレベルで新規タスク追加
          try {
            if (selectedTaskId) {
              const task = filteredTasks.find(t => t?.id === selectedTaskId)
              if (task) {
                e.preventDefault()
                const result = addTask(task.parentId, task.level)
                if (!result.success) {
                  console.warn('Failed to add task:', result.message)
                }
              }
            } else {
              e.preventDefault()
              const result = addTask(null, 0)
              if (!result.success) {
                console.warn('Failed to add task:', result.message)
              }
            }
          } catch (error) {
            console.error('Error handling Enter key:', error)
          }
          break

        case 'Tab':
          // 子タスク追加
          try {
            if (activeArea === 'tasks' && selectedTaskId) {
              e.preventDefault()
              const task = filteredTasks.find(t => t?.id === selectedTaskId)
              if (task) {
                const result = addTask(selectedTaskId, task.level + 1)
                if (!result.success) {
                  console.warn('Failed to add child task:', result.message)
                }
              }
            }
          } catch (error) {
            console.error('Error handling Tab key:', error)
          }
          break

        case 'Delete':
        case 'Backspace':
          // タスク削除
          try {
            if (selectedTaskIds.length > 0) {
              e.preventDefault()
              const result = deleteTasks(selectedTaskIds)
              if (!result.success) {
                console.warn('Failed to delete tasks:', result.message)
              }
            }
          } catch (error) {
            console.error('Error handling Delete key:', error)
          }
          break

        case 'c':
          // タスクコピー
          try {
            if (e.ctrlKey && selectedTaskIds.length > 0) {
              e.preventDefault()
              const result = copyTasks(selectedTaskIds)
              if (!result.success) {
                console.warn('Failed to copy tasks:', result.message)
              }
            }
          } catch (error) {
            console.error('Error handling Ctrl+C:', error)
          }
          break

        case 'v':
          // タスク貼り付け
          try {
            if (e.ctrlKey) {
              e.preventDefault()
              const result = pasteTasks()
              if (!result.success) {
                console.warn('Failed to paste tasks:', result.message)
              }
            }
          } catch (error) {
            console.error('Error handling Ctrl+V:', error)
          }
          break

        case ' ':
          // タスク完了状態の切り替え
          try {
            if (selectedTaskId) {
              e.preventDefault()
              const result = toggleTaskCompleted(selectedTaskId)
              if (!result.success) {
                console.warn('Failed to toggle task completion:', result.message)
              }
            }
          } catch (error) {
            console.error('Error handling Space key:', error)
          }
          break

        case 'ArrowUp':
          try {
            e.preventDefault()
            if (activeArea === 'tasks' && filteredTasks.length > 0) {
              if (selectedTaskId) {
                const currentIndex = filteredTasks.findIndex(t => t?.id === selectedTaskId)
                const prevTask = currentIndex > 0 ? filteredTasks[currentIndex - 1] : null
                if (prevTask?.id) {
                  const result = selectTask(prevTask.id, e.shiftKey ? { shiftKey: true } as React.MouseEvent : undefined)
                  if (!result.success) {
                    console.warn('Failed to select previous task:', result.message)
                  }
                }
              } else {
                const firstTask = filteredTasks[0]
                if (firstTask?.id) {
                  const result = selectTask(firstTask.id)
                  if (!result.success) {
                    console.warn('Failed to select first task:', result.message)
                  }
                }
              }
            } else if (activeArea === 'projects' && projects.length > 0) {
              const currentIndex = projects.findIndex(p => p?.id === selectedProjectId)
              const prevProject = currentIndex > 0 ? projects[currentIndex - 1] : null
              if (prevProject?.id) {
                const result = setSelectedProjectId(prevProject.id)
                if (!result.success) {
                  console.warn('Failed to select previous project:', result.message)
                }
              }
            }
          } catch (error) {
            console.error('Error handling ArrowUp key:', error)
          }
          break

        case 'ArrowDown':
          try {
            e.preventDefault()
            if (activeArea === 'tasks' && filteredTasks.length > 0) {
              if (selectedTaskId) {
                const currentIndex = filteredTasks.findIndex(t => t?.id === selectedTaskId)
                const nextTask = currentIndex < filteredTasks.length - 1 ? filteredTasks[currentIndex + 1] : null
                if (nextTask?.id) {
                  const result = selectTask(nextTask.id, e.shiftKey ? { shiftKey: true } as React.MouseEvent : undefined)
                  if (!result.success) {
                    console.warn('Failed to select next task:', result.message)
                  }
                }
              } else {
                const firstTask = filteredTasks[0]
                if (firstTask?.id) {
                  const result = selectTask(firstTask.id)
                  if (!result.success) {
                    console.warn('Failed to select first task:', result.message)
                  }
                }
              }
            } else if (activeArea === 'projects' && projects.length > 0) {
              const currentIndex = projects.findIndex(p => p?.id === selectedProjectId)
              const nextProject = currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null
              if (nextProject?.id) {
                const result = setSelectedProjectId(nextProject.id)
                if (!result.success) {
                  console.warn('Failed to select next project:', result.message)
                }
              }
            }
          } catch (error) {
            console.error('Error handling ArrowDown key:', error)
          }
          break

        case 'ArrowRight':
          try {
            if (e.ctrlKey && selectedTaskId) {
              // 折りたたみ切り替え
              e.preventDefault()
              const result = toggleTaskCollapsed(selectedTaskId)
              if (!result.success) {
                console.warn('Failed to toggle task collapsed:', result.message)
              }
            } else {
              // エリア間の移動
              e.preventDefault()
              if (activeArea === 'projects') {
                setActiveArea('tasks')
              } else if (activeArea === 'tasks') {
                setActiveArea('details')
              }
            }
          } catch (error) {
            console.error('Error handling ArrowRight key:', error)
          }
          break

        case 'ArrowLeft':
          try {
            e.preventDefault()
            if (activeArea === 'details') {
              setActiveArea('tasks')
            } else if (activeArea === 'tasks') {
              setActiveArea('projects')
            }
          } catch (error) {
            console.error('Error handling ArrowLeft key:', error)
          }
          break

        case 'Escape':
          try {
            // 複数選択モードを解除
            if (isMultiSelectMode) {
              e.preventDefault()
              const result = clearTaskSelection()
              if (!result.success) {
                console.warn('Failed to clear task selection:', result.message)
              }
            }
          } catch (error) {
            console.error('Error handling Escape key:', error)
          }
          break

        case 'a':
          try {
            // Ctrl+A で全選択
            if (e.ctrlKey && activeArea === 'tasks' && filteredTasks.length > 0) {
              e.preventDefault()
              // TODO: 全選択機能の実装
              console.log('Select all tasks - not implemented yet')
            }
          } catch (error) {
            console.error('Error handling Ctrl+A:', error)
          }
          break

        default:
          // その他のキーは処理しない
          break
      }
    } catch (error) {
      console.error('Error in keyboard shortcut handler:', error)
    }
  }, [
    isInputFocused,
    activeArea,
    projects,
    selectedProjectId,
    filteredTasks,
    selectedTaskId,
    selectedTaskIds,
    isMultiSelectMode,
    setActiveArea,
    setSelectedProjectId,
    addTask,
    selectTask,
    toggleTaskCompleted,
    toggleTaskCollapsed,
    copyTasks,
    pasteTasks,
    deleteTasks,
    clearTaskSelection,
  ])

  useEffect(() => {
    try {
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    } catch (error) {
      console.error('Error setting up keyboard event listeners:', error)
      // エラーが発生してもクリーンアップ関数は返す
      return () => {}
    }
  }, [handleKeyDown])

  // デバッグ用：キーボードショートカットの状態をログ出力
  useEffect(() => {
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_MODE === 'true') {
      console.log('Keyboard shortcuts active:', {
        activeArea,
        selectedProjectId,
        selectedTaskId,
        selectedTaskIds: selectedTaskIds.length,
        isMultiSelectMode,
        tasksCount: filteredTasks.length
      })
    }
  }, [activeArea, selectedProjectId, selectedTaskId, selectedTaskIds, isMultiSelectMode, filteredTasks.length])
}