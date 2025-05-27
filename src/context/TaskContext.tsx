import React, { createContext, useContext, useReducer } from 'react'
import type { Task, TaskState, TaskAction } from '@/types/task'
import { generateId } from '@/utils/taskUtils'

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
}

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload }
    case 'ADD_TASK':
      const newTask: Task = {
        id: generateId('t'),
        name: action.payload.name,
        projectId: action.payload.projectId,
        parentId: action.payload.parentId,
        completed: false,
        startDate: action.payload.startDate || new Date(),
        dueDate: action.payload.dueDate || new Date(),
        endDate: action.payload.endDate || action.payload.dueDate || new Date(),
        completionDate: null,
        notes: '',
        assignee: '自分',
        level: action.payload.level || 0,
        collapsed: false,
        expanded: false,
        milestone: false,
        status: 'not-started',
      }
      return {
        ...state,
        tasks: [...state.tasks, newTask],
        selectedTaskId: newTask.id,
        selectedTaskIds: [newTask.id],
      }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates }
            : task
        ),
      }
    case 'DELETE_TASKS':
      return {
        ...state,
        tasks: state.tasks.filter(task => !action.payload.includes(task.id)),
        selectedTaskId: action.payload.includes(state.selectedTaskId!) ? null : state.selectedTaskId,
        selectedTaskIds: state.selectedTaskIds.filter(id => !action.payload.includes(id)),
      }
    case 'SET_SELECTED_TASK':
      return {
        ...state,
        selectedTaskId: action.payload,
        selectedTaskIds: action.payload ? [action.payload] : [],
        isMultiSelectMode: false,
      }
    case 'SET_SELECTED_TASKS':
      return {
        ...state,
        selectedTaskIds: action.payload,
        selectedTaskId: action.payload[0] || null,
      }
    case 'CLEAR_TASK_SELECTION':
      return {
        ...state,
        selectedTaskId: null,
        selectedTaskIds: [],
        isMultiSelectMode: false,
      }
    case 'TOGGLE_MULTI_SELECT_MODE':
      return {
        ...state,
        isMultiSelectMode: !state.isMultiSelectMode,
      }
    case 'SET_MULTI_SELECT_MODE':
      return {
        ...state,
        isMultiSelectMode: action.payload,
      }
    case 'SET_COPIED_TASKS':
      return { ...state, copiedTasks: action.payload }
    case 'START_ADD_TASK':
      return {
        ...state,
        isAddingTask: true,
        newTaskName: '',
        newTaskParentId: action.payload.parentId,
        newTaskLevel: action.payload.level,
      }
    case 'SET_NEW_TASK_NAME':
      return { ...state, newTaskName: action.payload }
    case 'CANCEL_ADD_TASK':
      return {
        ...state,
        isAddingTask: false,
        newTaskName: '',
        newTaskParentId: null,
        newTaskLevel: 0,
      }
    default:
      return state
  }
}

interface TaskContextType {
  state: TaskState
  dispatch: React.Dispatch<TaskAction>
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState)

  return (
    <TaskContext.Provider value={{ state, dispatch }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTaskContext() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider')
  }
  return context
}