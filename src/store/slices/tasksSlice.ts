import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task, SubTask } from '../../types/task';
import { generateId } from '../../utils/taskUtils';

// インターフェースと型定義
interface TasksState {
  // 実際のタスクはprojectsSliceで管理するため、こちらは空
}

// 初期ステート
const initialState: TasksState = {};

// タスクスライス
const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    // タスクの作成
    createTask: (state, action: PayloadAction<{
      projectId: string;
      parentTaskId?: string | null;
      task: Omit<Task, 'id' | 'expanded' | 'subtasks'>;
    }>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // タスクの更新
    updateTask: (state, action: PayloadAction<{
      projectId: string;
      taskId: string;
      subtaskId?: string | null;
      task: Partial<Task | SubTask>;
    }>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // タスクの削除
    deleteTask: (state, action: PayloadAction<{
      projectId: string;
      taskId: string;
      subtaskId?: string | null;
    }>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // 複数タスクの削除
    deleteMultipleTasks: (state, action: PayloadAction<string[]>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // タスクの展開/折りたたみ
    toggleTask: (state, action: PayloadAction<{
      projectId: string;
      taskId: string;
    }>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // タスクのステータス更新
    updateTaskStatus: (state, action: PayloadAction<{
      projectId: string;
      taskId: string;
      subtaskId?: string | null;
      status: string;
    }>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // 複数タスクのステータス更新
    updateMultipleTaskStatus: (state, action: PayloadAction<{
      taskKeys: string[];
      status: string;
    }>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // タスクの日付更新
    updateTaskDates: (state, action: PayloadAction<{
      projectId: string;
      taskId: string;
      subtaskId?: string | null;
      type: 'move' | 'resize-start' | 'resize-end';
      daysDelta: number;
    }>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // タスク複製
    duplicateTask: (state, action: PayloadAction<{
      projectId: string;
      taskId: string;
      subtaskId?: string | null;
    }>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // インライン編集の保存
    saveInlineEditTask: (state, action: PayloadAction<{
      projectId: string;
      taskId: string;
      subtaskId?: string | null;
      name: string;
    }>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // インライン編集のキャンセル
    cancelInlineEditTask: (state) => {
      // UIスライスで処理
    }
  },
});

// アクションエクスポート
export const { 
  createTask, 
  updateTask, 
  deleteTask, 
  deleteMultipleTasks,
  toggleTask, 
  updateTaskStatus, 
  updateMultipleTaskStatus,
  updateTaskDates,
  duplicateTask,
  saveInlineEditTask,
  cancelInlineEditTask
} = tasksSlice.actions;

export default tasksSlice.reducer;