import { useEffect } from 'react'
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 入力フィールドの場合はスキップ
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case 'Enter':
          // 同じレベルで新規タスク追加
          if (selectedTaskId) {
            const task = filteredTasks.find(t => t.id === selectedTaskId)
            if (task) {
              e.preventDefault()
              addTask(task.parentId, task.level)
            }
          } else {
            e.preventDefault()
            addTask(null, 0)
          }
          break

        case 'Tab':
          // 子タスク追加
          if (activeArea === 'tasks' && selectedTaskId) {
            e.preventDefault()
            const task = filteredTasks.find(t => t.id === selectedTaskId)
            if (task) {
              addTask(selectedTaskId, task.level + 1)
            }
          }
          break

        case 'Delete':
        case 'Backspace':
          // タスク削除
          if (selectedTaskIds.length > 0) {
            e.preventDefault()
            deleteTasks(selectedTaskIds)
          }
          break

        case 'c':
          // タスクコピー
          if (e.ctrlKey && selectedTaskIds.length > 0) {
            e.preventDefault()
            copyTasks(selectedTaskIds)
          }
          break

        case 'v':
          // タスク貼り付け
          if (e.ctrlKey) {
            e.preventDefault()
            pasteTasks()
          }
          break

        case ' ':
          // タスク完了状態の切り替え
          if (selectedTaskId) {
            e.preventDefault()
            toggleTaskCompleted(selectedTaskId)
          }
          break

        case 'ArrowUp':
          e.preventDefault()
          if (activeArea === 'tasks' && filteredTasks.length > 0) {
            if (selectedTaskId) {
              const currentIndex = filteredTasks.findIndex(t => t.id === selectedTaskId)
              if (currentIndex > 0) {
                const prevTaskId = filteredTasks[currentIndex - 1].id
                selectTask(prevTaskId, e.shiftKey ? { shiftKey: true } as React.MouseEvent : undefined)
              }
            } else {
              selectTask(filteredTasks[0].id)
            }
          } else if (activeArea === 'projects' && projects.length > 0) {
            const currentIndex = projects.findIndex(p => p.id === selectedProjectId)
            if (currentIndex > 0) {
              setSelectedProjectId(projects[currentIndex - 1].id)
            }
          }
          break

        case 'ArrowDown':
          e.preventDefault()
          if (activeArea === 'tasks' && filteredTasks.length > 0) {
            if (selectedTaskId) {
              const currentIndex = filteredTasks.findIndex(t => t.id === selectedTaskId)
              if (currentIndex < filteredTasks.length - 1) {
                const nextTaskId = filteredTasks[currentIndex + 1].id
                selectTask(nextTaskId, e.shiftKey ? { shiftKey: true } as React.MouseEvent : undefined)
              }
            } else {
              selectTask(filteredTasks[0].id)
            }
          } else if (activeArea === 'projects' && projects.length > 0) {
            const currentIndex = projects.findIndex(p => p.id === selectedProjectId)
            if (currentIndex < projects.length - 1) {
              setSelectedProjectId(projects[currentIndex + 1].id)
            }
          }
          break

        case 'ArrowRight':
          if (e.ctrlKey && selectedTaskId) {
            // 折りたたみ切り替え
            e.preventDefault()
            toggleTaskCollapsed(selectedTaskId)
          } else {
            // エリア間の移動
            e.preventDefault()
            if (activeArea === 'projects') {
              setActiveArea('tasks')
            } else if (activeArea === 'tasks') {
              setActiveArea('details')
            }
          }
          break

        case 'ArrowLeft':
          e.preventDefault()
          if (activeArea === 'details') {
            setActiveArea('tasks')
          } else if (activeArea === 'tasks') {
            setActiveArea('projects')
          }
          break

        case 'Escape':
          // 複数選択モードを解除
          if (isMultiSelectMode) {
            e.preventDefault()
            clearTaskSelection()
          }
          break

        case 'a':
          // Ctrl+A で全選択
          if (e.ctrlKey && activeArea === 'tasks' && filteredTasks.length > 0) {
            e.preventDefault()
            // TODO: 全選択機能の実装
          }
          break

        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
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
}