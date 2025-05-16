import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskInput } from '../models/task';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
};

/**
 * タスク状態を管理するReduxスライス
 * 注: 現在の実装ではContextAPIを使用しているため、
 * このスライスは実際には使用されていない
 */
const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
    },
    
    addTask: (state, action: PayloadAction<TaskInput>) => {
      const newTask: Task = {
        id: uuidv4(),
        title: action.payload.title,
        startDate: action.payload.startDate,
        endDate: action.payload.endDate,
        completed: action.payload.completed || false,
        parentId: action.payload.parentId || null,
        noteContent: action.payload.noteContent || '',
        assignee: action.payload.assignee,
        projectId: action.payload.projectId,
      };
      
      state.tasks.push(newTask);
    },
    
    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(task => task.id !== action.payload);
      
      // 子タスクも削除
      const childTaskIds = state.tasks
        .filter(task => task.parentId === action.payload)
        .map(task => task.id);
      
      childTaskIds.forEach(childId => {
        state.tasks = state.tasks.filter(task => task.id !== childId);
      });
    },
    
    toggleTaskCompletion: (state, action: PayloadAction<string>) => {
      const index = state.tasks.findIndex(task => task.id === action.payload);
      if (index !== -1) {
        const task = state.tasks[index];
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date() : undefined;
      }
    },
    
    updateTaskNote: (state, action: PayloadAction<{ id: string; noteContent: string }>) => {
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index].noteContent = action.payload.noteContent;
      }
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setTasks,
  addTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
  updateTaskNote,
  setLoading,
  setError,
} = taskSlice.actions;

export default taskSlice.reducer;