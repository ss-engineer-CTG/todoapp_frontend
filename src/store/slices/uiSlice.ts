import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// インライン編集データ型定義
interface InlineEditTask {
  projectId: string;
  taskId: string;
  subtaskId?: string | null;
  name: string;
}

// タスク編集モーダル状態の型定義
interface TaskEditModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  projectId?: string | null;
  taskId?: string | null;
  subtaskId?: string | null;
}

// 削除確認ダイアログの型定義
interface DeleteConfirmationState {
  isOpen: boolean;
  projectId?: string | null;
  taskId?: string | null;
  subtaskId?: string | null;
  batchMode?: boolean;
}

// フィードバックメッセージの型定義
interface FeedbackState {
  message: string | null;
  type: 'success' | 'error' | 'warning' | 'info';
}

// UIステートの型定義
interface UIState {
  viewMode: 'all' | 'today' | 'overdue';
  displayCompletedTasks: boolean;
  selectedTasks: string[];
  focusedTaskKey: string | null;
  showBatchPanel: boolean;
  taskEditModal: TaskEditModalState;
  deleteConfirmation: DeleteConfirmationState;
  projectFormActive: boolean;
  inlineEditTask: InlineEditTask | null;
  feedback: FeedbackState;
}

// 初期ステート
const initialState: UIState = {
  viewMode: 'all',
  displayCompletedTasks: true,
  selectedTasks: [],
  focusedTaskKey: null,
  showBatchPanel: false,
  taskEditModal: {
    isOpen: false,
    mode: 'create',
    projectId: null,
    taskId: null,
    subtaskId: null
  },
  deleteConfirmation: {
    isOpen: false,
    projectId: null,
    taskId: null,
    subtaskId: null,
    batchMode: false
  },
  projectFormActive: false,
  inlineEditTask: null,
  feedback: {
    message: null,
    type: 'info'
  }
};

// UIスライス
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // 表示モードの設定
    setViewMode: (state, action: PayloadAction<'all' | 'today' | 'overdue'>) => {
      state.viewMode = action.payload;
    },
    
    // 完了タスクの表示/非表示トグル
    toggleCompletedTasks: (state) => {
      state.displayCompletedTasks = !state.displayCompletedTasks;
    },
    
    // タスク選択トグル
    toggleTaskSelection: (state, action: PayloadAction<{
      taskKey: string;
      ctrlKey: boolean;
      shiftKey: boolean;
    }>) => {
      const { taskKey, ctrlKey, shiftKey } = action.payload;
      
      if (ctrlKey) {
        // Ctrlキーでの複数選択
        if (state.selectedTasks.includes(taskKey)) {
          state.selectedTasks = state.selectedTasks.filter(key => key !== taskKey);
        } else {
          state.selectedTasks.push(taskKey);
        }
      } else if (shiftKey && state.focusedTaskKey) {
        // Shiftキーでの範囲選択（実際の処理は外部ロジックで行う）
        if (!state.selectedTasks.includes(taskKey)) {
          state.selectedTasks.push(taskKey);
        }
      } else {
        // 通常クリックで単一選択
        if (state.selectedTasks.length === 1 && state.selectedTasks[0] === taskKey) {
          state.selectedTasks = [];
        } else {
          state.selectedTasks = [taskKey];
        }
      }
      
      // 選択があれば一括操作パネルを表示
      state.showBatchPanel = state.selectedTasks.length > 0;
    },
    
    // フォーカスタスクの移動
    moveTaskFocus: (state, action: PayloadAction<string>) => {
      state.focusedTaskKey = action.payload;
    },
    
    // 選択タスクのクリア
    clearSelectedTasks: (state) => {
      state.selectedTasks = [];
      state.showBatchPanel = false;
    },
    
    // 一括操作パネル表示/非表示
    setShowBatchPanel: (state, action: PayloadAction<boolean>) => {
      state.showBatchPanel = action.payload;
    },
    
    // タスク編集モーダルを開く
    openTaskEditModal: (state, action: PayloadAction<{
      mode: 'create' | 'edit';
      projectId?: string;
      taskId?: string;
      subtaskId?: string;
    }>) => {
      const { mode, projectId, taskId, subtaskId } = action.payload;
      state.taskEditModal = {
        isOpen: true,
        mode,
        projectId: projectId || null,
        taskId: taskId || null,
        subtaskId: subtaskId || null
      };
    },
    
    // タスク編集モーダルを閉じる
    closeTaskEditModal: (state) => {
      state.taskEditModal.isOpen = false;
    },
    
    // 削除確認ダイアログを開く
    openDeleteConfirmation: (state, action: PayloadAction<{
      projectId?: string;
      taskId?: string;
      subtaskId?: string;
      batchMode?: boolean;
    }>) => {
      const { projectId, taskId, subtaskId, batchMode } = action.payload;
      state.deleteConfirmation = {
        isOpen: true,
        projectId: projectId || null,
        taskId: taskId || null,
        subtaskId: subtaskId || null,
        batchMode: batchMode || false
      };
    },
    
    // 削除確認ダイアログを閉じる
    closeDeleteConfirmation: (state) => {
      state.deleteConfirmation.isOpen = false;
    },
    
    // プロジェクト追加フォームの表示/非表示
    setProjectFormActive: (state, action: PayloadAction<boolean>) => {
      state.projectFormActive = action.payload;
    },
    
    // インライン編集タスクの設定
    setInlineEditTask: (state, action: PayloadAction<InlineEditTask | null>) => {
      state.inlineEditTask = action.payload;
    },
    
    // フィードバックメッセージの表示
    showFeedbackMessage: (state, action: PayloadAction<{
      message: string;
      type?: 'success' | 'error' | 'warning' | 'info';
    }>) => {
      const { message, type = 'info' } = action.payload;
      state.feedback = {
        message,
        type
      };
      
      // 3秒後に自動的に消えるロジックはミドルウェアで実装
    },
    
    // フィードバックメッセージをクリア
    clearFeedbackMessage: (state) => {
      state.feedback.message = null;
    }
  },
});

// アクションエクスポート
export const { 
  setViewMode, 
  toggleCompletedTasks, 
  toggleTaskSelection, 
  moveTaskFocus,
  clearSelectedTasks, 
  setShowBatchPanel, 
  openTaskEditModal, 
  closeTaskEditModal,
  openDeleteConfirmation, 
  closeDeleteConfirmation, 
  setProjectFormActive,
  setInlineEditTask,
  showFeedbackMessage,
  clearFeedbackMessage
} = uiSlice.actions;

export default uiSlice.reducer;