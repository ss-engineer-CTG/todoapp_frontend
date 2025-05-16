import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskInput } from '../models/task';
import { useLocalStorage } from '../hooks/useLocalStorage';

// コンテキストの状態型
interface TaskState {
  tasks: Task[];
}

// アクション型
type TaskAction =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'TOGGLE_TASK_COMPLETION'; payload: string }
  | { type: 'UPDATE_TASK_NOTE'; payload: { id: string; noteContent: string } };

// コンテキストの型
interface TaskContextType extends TaskState {
  addTask: (taskInput: TaskInput) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  updateTaskNote: (id: string, noteContent: string) => void;
  getChildTasks: (parentId: string) => Task[];
  getTaskHierarchy: () => Task[];
}

// コンテキストの作成
const TaskContext = createContext<TaskContextType | undefined>(undefined);

// リデューサー
const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload
      };
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload]
      };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        )
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      };
    case 'TOGGLE_TASK_COMPLETION':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? {
                ...task,
                completed: !task.completed,
                completedAt: !task.completed ? new Date() : undefined
              }
            : task
        )
      };
    case 'UPDATE_TASK_NOTE':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, noteContent: action.payload.noteContent }
            : task
        )
      };
    default:
      return state;
  }
};

// プロバイダーコンポーネント
interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  // ローカルストレージからタスクを取得
  const [storedTasks, setStoredTasks] = useLocalStorage<Task[]>('tasks', []);
  
  // 初期状態
  const initialState: TaskState = {
    tasks: []
  };
  
  // リデューサー
  const [state, dispatch] = useReducer(taskReducer, initialState);
  
  // ローカルストレージから初期化
  useEffect(() => {
    dispatch({ type: 'SET_TASKS', payload: storedTasks });
  }, []);
  
  // タスクが変更されたらローカルストレージに保存
  useEffect(() => {
    if (state.tasks.length > 0) {
      setStoredTasks(state.tasks);
    }
  }, [state.tasks, setStoredTasks]);
  
  // タスク追加
  const addTask = (taskInput: TaskInput) => {
    const newTask: Task = {
      id: uuidv4(),
      title: taskInput.title,
      startDate: taskInput.startDate,
      endDate: taskInput.endDate,
      completed: taskInput.completed || false,
      parentId: taskInput.parentId || null,
      noteContent: taskInput.noteContent || '',
      assignee: taskInput.assignee,
      projectId: taskInput.projectId
    };
    
    dispatch({ type: 'ADD_TASK', payload: newTask });
  };
  
  // タスク更新
  const updateTask = (task: Task) => {
    dispatch({ type: 'UPDATE_TASK', payload: task });
  };
  
  // タスク削除
  const deleteTask = (id: string) => {
    // このタスクの子タスクも再帰的に削除
    const childTasks = getChildTasks(id);
    childTasks.forEach(child => deleteTask(child.id));
    
    dispatch({ type: 'DELETE_TASK', payload: id });
  };
  
  // タスク完了状態の切り替え
  const toggleTaskCompletion = (id: string) => {
    dispatch({ type: 'TOGGLE_TASK_COMPLETION', payload: id });
  };
  
  // タスクノート更新
  const updateTaskNote = (id: string, noteContent: string) => {
    dispatch({
      type: 'UPDATE_TASK_NOTE',
      payload: { id, noteContent }
    });
  };
  
  // 指定した親タスクの子タスクを取得
  const getChildTasks = (parentId: string): Task[] => {
    return state.tasks.filter(task => task.parentId === parentId);
  };
  
  // タスク階層構造を取得
  const getTaskHierarchy = (): Task[] => {
    // 親子関係に基づいて並び替え
    const result: Task[] = [];
    
    // ルートタスク（親を持たないタスク）を追加
    const rootTasks = state.tasks.filter(task => !task.parentId);
    
    // 再帰的に子タスクを追加する関数
    const addTasksRecursively = (tasks: Task[]) => {
      tasks.forEach(task => {
        result.push(task);
        const childTasks = getChildTasks(task.id);
        addTasksRecursively(childTasks);
      });
    };
    
    addTasksRecursively(rootTasks);
    
    return result;
  };
  
  // コンテキスト値
  const value: TaskContextType = {
    tasks: state.tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    updateTaskNote,
    getChildTasks,
    getTaskHierarchy
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

// カスタムフック
export const useTaskContext = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};