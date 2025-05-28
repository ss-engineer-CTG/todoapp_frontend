import React, { createContext, useContext, useReducer } from 'react'
import type { Task, TaskState, TaskAction } from '@/types/task'
import { generateId } from '@/utils/taskUtils'
import { DEFAULT_TASK } from '@/types/task'

const initialState: TaskState = {
  tasks: [
    {
      id: 't1',
      name: 'プロジェクト提案書を完成させる',
      projectId: 'p1',
      parentId: null,
      completed: false,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 86400000 * 3),
      endDate: new Date(Date.now() + 86400000 * 3), // dueDate と同じ値
      completionDate: null,
      notes: '予算見積もりとスケジュールを含める',
      assignee: '自分',
      level: 0,
      collapsed: false,
      expanded: true, // タイムライン表示用
      milestone: false,
      status: 'in-progress',
    },
    {
      id: 't2',
      name: '競合他社の調査',
      projectId: 'p1',
      parentId: 't1',
      completed: false,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 86400000 * 2),
      endDate: new Date(Date.now() + 86400000 * 2),
      completionDate: null,
      notes: '価格と機能に焦点を当てる',
      assignee: '自分',
      level: 1,
      collapsed: false,
      expanded: false,
      milestone: false,
      status: 'in-progress',
    },
    {
      id: 't3',
      name: 'プレゼンテーションスライドの作成',
      projectId: 'p1',
      parentId: 't1',
      completed: false,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 86400000 * 3),
      endDate: new Date(Date.now() + 86400000 * 3),
      completionDate: null,
      notes: '会社のテンプレートを使用する',
      assignee: '自分',
      level: 1,
      collapsed: false,
      expanded: false,
      milestone: false,
      status: 'not-started',
    },
    {
      id: 't4',
      name: '食料品の買い物',
      projectId: 'p2',
      parentId: null,
      completed: false,
      startDate: new Date(),
      dueDate: new Date(),
      endDate: new Date(),
      completionDate: null,
      notes: '牛乳と卵を忘れないように',
      assignee: '自分',
      level: 0,
      collapsed: false,
      expanded: false,
      milestone: false,
      status: 'not-started',
    },
    {
      id: 't5',
      name: 'Reactを学ぶ',
      projectId: 'p3',
      parentId: null,
      completed: false,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 86400000 * 7),
      endDate: new Date(Date.now() + 86400000 * 7),
      completionDate: null,
      notes: 'オンラインコースを完了する',
      assignee: '自分',
      level: 0,
      collapsed: false,
      expanded: true,
      milestone: true,
      status: 'in-progress',
    },
    {
      id: 't6',
      name: '練習プロジェクトの構築',
      projectId: 'p3',
      parentId: 't5',
      completed: false,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 86400000 * 10),
      endDate: new Date(Date.now() + 86400000 * 10),
      completionDate: null,
      notes: 'ReactでTodoアプリを作る',
      assignee: '自分',
      level: 1,
      collapsed: false,
      expanded: false,
      milestone: false,
      status: 'not-started',
    },
  ],
  selectedTaskId: 't1',
  selectedTaskIds: ['t1'],
  isMultiSelectMode: false,
  lastSelectedTaskIndex: 0,
  copiedTasks: [],
  isAddingTask: false,
  newTaskName: '',
  newTaskParentId: null,
  newTaskLevel: 0,
  error: null,
  isLoading: false,
}

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  try {
    switch (action.type) {
      case 'SET_TASKS':
        if (!Array.isArray(action.payload)) {
          console.warn('SET_TASKS: payload is not an array:', action.payload)
          return { ...state, error: 'タスクデータが無効です' }
        }
        return { ...state, tasks: action.payload, error: null }

      case 'ADD_TASK':
        try {
          if (!action.payload?.name || !action.payload?.projectId) {
            console.warn('ADD_TASK: invalid payload:', action.payload)
            return { ...state, error: 'タスクの作成に必要な情報が不足しています' }
          }

          const newTask: Task = {
            ...DEFAULT_TASK,
            id: generateId('t'),
            name: action.payload.name.trim(),
            projectId: action.payload.projectId,
            parentId: action.payload.parentId || null,
            startDate: action.payload.startDate || new Date(),
            dueDate: action.payload.dueDate || new Date(),
            endDate: action.payload.endDate || action.payload.dueDate || new Date(),
            level: action.payload.level || 0,
            milestone: action.payload.milestone || false,
            priority: action.payload.priority || 'medium',
            assignee: action.payload.assignee || '自分',
            notes: action.payload.notes || '',
            tags: action.payload.tags || [],
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          return {
            ...state,
            tasks: [...state.tasks, newTask],
            selectedTaskId: newTask.id,
            selectedTaskIds: [newTask.id],
            error: null
          }
        } catch (error) {
          console.error('Error creating task:', error)
          return { ...state, error: 'タスクの作成中にエラーが発生しました' }
        }

      case 'UPDATE_TASK':
        if (!action.payload?.id) {
          console.warn('UPDATE_TASK: invalid payload:', action.payload)
          return { ...state, error: 'タスクの更新に必要な情報が不足しています' }
        }
        return {
          ...state,
          tasks: state.tasks.map(task =>
            task.id === action.payload.id
              ? { 
                  ...task, 
                  ...action.payload.updates,
                  updatedAt: new Date()
                }
              : task
          ),
          error: null
        }

      case 'DELETE_TASKS':
        if (!Array.isArray(action.payload)) {
          console.warn('DELETE_TASKS: payload is not an array:', action.payload)
          return { ...state, error: 'タスクの削除に失敗しました' }
        }
        
        const remainingTasks = state.tasks.filter(task => !action.payload.includes(task.id))
        const newSelectedTaskId = action.payload.includes(state.selectedTaskId || '')
          ? null
          : state.selectedTaskId
        const newSelectedTaskIds = state.selectedTaskIds.filter(id => !action.payload.includes(id))

        return {
          ...state,
          tasks: remainingTasks,
          selectedTaskId: newSelectedTaskId,
          selectedTaskIds: newSelectedTaskIds,
          error: null
        }

      case 'SET_SELECTED_TASK':
        const taskExists = action.payload ? state.tasks.some(t => t.id === action.payload) : true
        if (action.payload && !taskExists) {
          console.warn('SET_SELECTED_TASK: task does not exist:', action.payload)
          return state
        }
        return {
          ...state,
          selectedTaskId: action.payload,
          selectedTaskIds: action.payload ? [action.payload] : [],
          isMultiSelectMode: false,
          error: null
        }

      case 'SET_SELECTED_TASKS':
        if (!Array.isArray(action.payload)) {
          console.warn('SET_SELECTED_TASKS: payload is not an array:', action.payload)
          return state
        }
        // 存在するタスクのみをフィルタ
        const validTaskIds = action.payload.filter(id => 
          state.tasks.some(t => t.id === id)
        )
        return {
          ...state,
          selectedTaskIds: validTaskIds,
          selectedTaskId: validTaskIds[0] || null,
          error: null
        }

      case 'CLEAR_TASK_SELECTION':
        return {
          ...state,
          selectedTaskId: null,
          selectedTaskIds: [],
          isMultiSelectMode: false,
          error: null
        }

      case 'TOGGLE_MULTI_SELECT_MODE':
        return {
          ...state,
          isMultiSelectMode: !state.isMultiSelectMode,
        }

      case 'SET_MULTI_SELECT_MODE':
        return {
          ...state,
          isMultiSelectMode: Boolean(action.payload),
        }

      case 'SET_COPIED_TASKS':
        if (!Array.isArray(action.payload)) {
          console.warn('SET_COPIED_TASKS: payload is not an array:', action.payload)
          return state
        }
        return { ...state, copiedTasks: action.payload }

      case 'START_ADD_TASK':
        if (!action.payload) {
          console.warn('START_ADD_TASK: invalid payload:', action.payload)
          return state
        }
        return {
          ...state,
          isAddingTask: true,
          newTaskName: '',
          newTaskParentId: action.payload.parentId,
          newTaskLevel: action.payload.level || 0,
          error: null
        }

      case 'SET_NEW_TASK_NAME':
        if (typeof action.payload !== 'string') {
          console.warn('SET_NEW_TASK_NAME: payload is not a string:', action.payload)
          return state
        }
        return { ...state, newTaskName: action.payload }

      case 'CANCEL_ADD_TASK':
        return {
          ...state,
          isAddingTask: false,
          newTaskName: '',
          newTaskParentId: null,
          newTaskLevel: 0,
        }

      case 'SET_ERROR':
        return {
          ...state,
          error: action.payload
        }

      case 'SET_LOADING':
        return {
          ...state,
          isLoading: Boolean(action.payload)
        }

      case 'CLEAR_ERROR':
        return {
          ...state,
          error: null
        }

      default:
        console.warn('taskReducer: unknown action type:', (action as any).type)
        return state
    }
  } catch (error) {
    console.error('Error in taskReducer:', error)
    return {
      ...state,
      error: 'タスク操作中にエラーが発生しました'
    }
  }
}

interface TaskContextType {
  state: TaskState
  dispatch: React.Dispatch<TaskAction>
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState)

  // エラーハンドリング強化
  const enhancedDispatch = React.useCallback((action: TaskAction) => {
    try {
      dispatch(action)
    } catch (error) {
      console.error('Error dispatching task action:', error)
      dispatch({ type: 'SET_ERROR', payload: 'アクションの実行中にエラーが発生しました' })
    }
  }, [])

  const contextValue = React.useMemo(() => ({
    state,
    dispatch: enhancedDispatch,
  }), [state, enhancedDispatch])

  // エラーの自動クリア
  React.useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_ERROR' })
      }, 5000) // 5秒後にエラーをクリア
      
      return () => clearTimeout(timer)
    }
  }, [state.error])

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTaskContext() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    const errorMessage = 'useTaskContext must be used within a TaskProvider'
    console.error(errorMessage)
    throw new Error(errorMessage)
  }
  return context
}