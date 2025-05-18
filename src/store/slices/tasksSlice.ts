import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task } from '../../types/task';

// インターフェースと型定義
interface TasksState {
  // 実際のタスクはprojectsSliceで管理するため、こちらは空
}

// 初期ステート
const initialState: TasksState = {};

// タスク作成ペイロード型の定義
export interface CreateTaskPayload {
  projectId: string;
  parentTaskId?: string | null;
  task: Omit<Task, 'id' | 'expanded' | 'subtasks'>;
}

// タスク更新ペイロード型の定義
export interface UpdateTaskPayload {
  projectId: string;
  taskId: string;
  subtaskId?: string | null;
  task: Partial<Task>;
}

// タスク削除ペイロード型の定義
export interface DeleteTaskPayload {
  projectId: string;
  taskId: string;
  subtaskId?: string | null;
}

// ステータス更新ペイロード型の定義
export interface UpdateTaskStatusPayload {
  projectId: string;
  taskId: string;
  subtaskId?: string | null;
  status: string;
}

// 日付更新ペイロード型の定義
export interface UpdateTaskDatesPayload {
  projectId: string;
  taskId: string;
  subtaskId?: string | null;
  type: 'move' | 'resize-start' | 'resize-end';
  daysDelta: number;
}

// 複数タスクステータス更新ペイロード型の定義
export interface UpdateMultipleTaskStatusPayload {
  taskKeys: string[];
  status: string;
}

// タスクスライス
const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    // タスクの作成
    createTask: (_state, _action: PayloadAction<CreateTaskPayload>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // タスクの更新
    updateTask: (_state, _action: PayloadAction<UpdateTaskPayload>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // タスクの削除
    deleteTask: (_state, _action: PayloadAction<DeleteTaskPayload>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // 複数タスクの削除
    deleteMultipleTasks: (_state, _action: PayloadAction<string[]>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // タスクの展開/折りたたみ
    toggleTask: (_state, _action: PayloadAction<{
      projectId: string;
      taskId: string;
    }>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // タスクのステータス更新
    updateTaskStatus: (_state, _action: PayloadAction<UpdateTaskStatusPayload>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // 複数タスクのステータス更新
    updateMultipleTaskStatus: (_state, _action: PayloadAction<UpdateMultipleTaskStatusPayload>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // タスクの日付更新
    updateTaskDates: (_state, _action: PayloadAction<UpdateTaskDatesPayload>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // タスク複製
    duplicateTask: (_state, _action: PayloadAction<DeleteTaskPayload>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // インライン編集の保存
    saveInlineEditTask: (_state, _action: PayloadAction<{
      projectId: string;
      taskId: string;
      subtaskId?: string | null;
      name: string;
    }>) => {
      // 実際の更新はprojectsSliceでリスナー経由で行う
    },
    
    // インライン編集のキャンセル
    cancelInlineEditTask: (_state) => {
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