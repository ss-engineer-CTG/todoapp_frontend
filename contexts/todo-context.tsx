"use client"

import React, { createContext, useReducer, useEffect, ReactNode } from "react"
import { todoReducer, initialState } from "@/services/todo-service"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import type { TodoState, TodoAction } from "@/types/todo"
import type { Project, Task } from "@/types/todo"

interface TodoContextType extends TodoState {
  // プロジェクト操作
  addProject: (project: Omit<Project, 'id'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  selectProject: (id: string) => void
  toggleProjectCollapse: (id: string) => void

  // タスク操作
  addTask: (task: Omit<Task, 'id'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  deleteTasks: (ids: string[]) => void
  selectTask: (id: string, event?: React.MouseEvent | KeyboardEvent) => void
  toggleTaskCompletion: (id: string) => void
  toggleTaskCollapse: (id: string, forceState?: boolean) => void
  copyTask: (id: string) => void
  copyTasks: (ids: string[]) => void
  pasteTask: () => void

  // 表示制御
  toggleShowCompleted: () => void
  toggleDetailPanel: () => void
  setActiveArea: (area: 'projects' | 'tasks' | 'details') => void

  // 選択制御
  clearSelection: () => void
  toggleMultiSelectMode: () => void

  // 派生データ
  filteredTasks: Task[]
  taskRelationMap: {
    childrenMap: { [parentId: string]: string[] }
    parentMap: { [childId: string]: string | null }
  }
}

export const TodoContext = createContext<TodoContextType | undefined>(undefined)

interface TodoProviderProps {
  children: ReactNode
}

export const TodoProvider: React.FC<TodoProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(todoReducer, initialState)
  const [storedData, setStoredData] = useLocalStorage('todo-app-data', initialState)

  // ローカルストレージからデータを復元
  useEffect(() => {
    if (storedData && storedData !== initialState) {
      dispatch({ type: 'LOAD_DATA', payload: storedData })
    }
  }, [storedData])

  // データの変更時にローカルストレージに保存
  useEffect(() => {
    if (state !== initialState) {
      setStoredData(state)
    }
  }, [state, setStoredData])

  // キーボードショートカットを有効化
  useKeyboardShortcuts()

  // プロジェクト操作
  const addProject = (project: Omit<Project, 'id'>) => {
    dispatch({ type: 'ADD_PROJECT', payload: project })
  }

  const updateProject = (id: string, updates: Partial<Project>) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: { id, updates } })
  }

  const deleteProject = (id: string) => {
    dispatch({ type: 'DELETE_PROJECT', payload: id })
  }

  const selectProject = (id: string) => {
    dispatch({ type: 'SELECT_PROJECT', payload: id })
  }

  const toggleProjectCollapse = (id: string) => {
    dispatch({ type: 'TOGGLE_PROJECT_COLLAPSE', payload: id })
  }

  // タスク操作
  const addTask = (task: Omit<Task, 'id'>) => {
    dispatch({ type: 'ADD_TASK', payload: task })
  }

  const updateTask = (id: string, updates: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, updates } })
  }

  const deleteTask = (id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id })
  }

  const deleteTasks = (ids: string[]) => {
    dispatch({ type: 'DELETE_TASKS', payload: ids })
  }

  const selectTask = (id: string, event?: React.MouseEvent | KeyboardEvent) => {
    dispatch({ type: 'SELECT_TASK', payload: { id, event } })
  }

  const toggleTaskCompletion = (id: string) => {
    dispatch({ type: 'TOGGLE_TASK_COMPLETION', payload: id })
  }

  const toggleTaskCollapse = (id: string, forceState?: boolean) => {
    dispatch({ type: 'TOGGLE_TASK_COLLAPSE', payload: { id, forceState } })
  }

  const copyTask = (id: string) => {
    dispatch({ type: 'COPY_TASK', payload: id })
  }

  const copyTasks = (ids: string[]) => {
    dispatch({ type: 'COPY_TASKS', payload: ids })
  }

  const pasteTask = () => {
    dispatch({ type: 'PASTE_TASK' })
  }

  // 表示制御
  const toggleShowCompleted = () => {
    dispatch({ type: 'TOGGLE_SHOW_COMPLETED' })
  }

  const toggleDetailPanel = () => {
    dispatch({ type: 'TOGGLE_DETAIL_PANEL' })
  }

  const setActiveArea = (area: 'projects' | 'tasks' | 'details') => {
    dispatch({ type: 'SET_ACTIVE_AREA', payload: area })
  }

  // 選択制御
  const clearSelection = () => {
    dispatch({ type: 'CLEAR_SELECTION' })
  }

  const toggleMultiSelectMode = () => {
    dispatch({ type: 'TOGGLE_MULTI_SELECT_MODE' })
  }

  // 派生データの計算
  const filteredTasks = state.tasks.filter(task => {
    if (task.projectId !== state.selectedProjectId) return false
    if (!state.showCompleted && task.completed) return false

    // 折りたたまれた親タスクの処理
    if (task.parentId) {
      let currentParentId: string | null = task.parentId
      while (currentParentId) {
        const currentParent = state.tasks.find(t => t.id === currentParentId)
        if (currentParent && currentParent.collapsed) return false
        
        // 修正：null許容型の適切な処理
        const nextParentId = state.taskRelationMap.parentMap[currentParentId]
        currentParentId = nextParentId || null
        
        // 無限ループ防止
        let loopCounter = 0
        if (loopCounter++ > 10) break
      }
    }

    return true
  })

  const contextValue: TodoContextType = {
    ...state,
    addProject,
    updateProject,
    deleteProject,
    selectProject,
    toggleProjectCollapse,
    addTask,
    updateTask,
    deleteTask,
    deleteTasks,
    selectTask,
    toggleTaskCompletion,
    toggleTaskCollapse,
    copyTask,
    copyTasks,
    pasteTask,
    toggleShowCompleted,
    toggleDetailPanel,
    setActiveArea,
    clearSelection,
    toggleMultiSelectMode,
    filteredTasks
  }

  return <TodoContext.Provider value={contextValue}>{children}</TodoContext.Provider>
}