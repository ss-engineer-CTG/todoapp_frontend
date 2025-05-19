import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task } from '../../types/task';
import { updateTaskDatesByDays } from '../../utils/taskUtils';

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
      // projectsReducerでこのアクションをリッスンし、実際のタスク更新を行う
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

// タスクに関するプロジェクトリデューサーでの操作を定義するヘルパー関数
// プロジェクトリデューサーで使用される更新ロジック
export const updateTasksInProject = (state: any, action: PayloadAction<UpdateTaskDatesPayload>) => {
  const { projectId, taskId, subtaskId, type, daysDelta } = action.payload;
  
  const projectIndex = state.projects.findIndex((p: any) => p.id === projectId);
  if (projectIndex === -1) return;
  
  const taskIndex = state.projects[projectIndex].tasks.findIndex((t: any) => t.id === taskId);
  if (taskIndex === -1) return;
  
  if (subtaskId) {
    // サブタスクの更新
    const subtaskIndex = state.projects[projectIndex].tasks[taskIndex].subtasks.findIndex(
      (st: any) => st.id === subtaskId
    );
    
    if (subtaskIndex === -1) return;
    
    const subtask = state.projects[projectIndex].tasks[taskIndex].subtasks[subtaskIndex];
    const updatedSubtask = updateTaskDatesByDays(subtask, type, daysDelta);
    
    state.projects[projectIndex].tasks[taskIndex].subtasks[subtaskIndex] = updatedSubtask;
  } else {
    // 親タスクの更新
    const task = state.projects[projectIndex].tasks[taskIndex];
    const updatedTask = updateTaskDatesByDays(task, type, daysDelta);
    
    state.projects[projectIndex].tasks[taskIndex] = updatedTask;
    
    // タスク移動時は全てのサブタスクも一緒に移動
    if (type === 'move' && task.subtasks && task.subtasks.length > 0) {
      state.projects[projectIndex].tasks[taskIndex].subtasks = task.subtasks.map((subtask: any) => 
        updateTaskDatesByDays(subtask, type, daysDelta)
      );
    }
  }
};

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