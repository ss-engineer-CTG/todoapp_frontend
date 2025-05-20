import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DragInfo {
  projectId: string;
  taskId: string;
  subtaskId?: string | null;
  type: 'move' | 'resize-start' | 'resize-end';
  initialX: number;
  startX: number;
  currentX?: number;
  taskStart: Date | null;
  taskEnd: Date | null;
  daysDelta: number;
}

interface HoverInfo {
  projectId: string;
  taskId: string;
  subtaskId?: string | null;
  task: any;
  projectColor: string;
  position: {
    x: number;
    y: number;
  };
}

interface TimelineState {
  timelineStart: Date;
  timelineEnd: Date;
  visibleStart: Date;
  visibleEnd: Date;
  today: Date;
  zoomLevel: number;
  dragInfo: DragInfo | null;
  hoverInfo: HoverInfo | null;
}

// 今日の日付を取得
const today = new Date();
// 初期表示範囲（今日を中心に前後30日）
const oneYearAgo = new Date(today);
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
const oneYearLater = new Date(today);
oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

// 初期ステート
const initialState: TimelineState = {
  timelineStart: oneYearAgo,
  timelineEnd: oneYearLater,
  visibleStart: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), // 30日前
  visibleEnd: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),   // 30日後
  today,
  zoomLevel: 100,
  dragInfo: null,
  hoverInfo: null
};

// タイムラインスライス
const timelineSlice = createSlice({
  name: 'timeline',
  initialState,
  reducers: {
    // タイムラインの初期化
    initializeTimeline: (state) => {
      // 初期化ロジック（既に値がある場合は変更しない）
      const today = new Date();
      if (!state.today) {
        state.today = today;
      }
      
      if (!state.timelineStart || !state.timelineEnd) {
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const oneYearLater = new Date(today);
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        
        state.timelineStart = oneYearAgo;
        state.timelineEnd = oneYearLater;
      }
      
      if (!state.visibleStart || !state.visibleEnd) {
        state.visibleStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        state.visibleEnd = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      }
    },
    
    // ズームイン
    zoomIn: (state) => {
      state.zoomLevel = Math.min(state.zoomLevel + 25, 200);
    },
    
    // ズームアウト
    zoomOut: (state) => {
      state.zoomLevel = Math.max(state.zoomLevel - 25, 50);
    },
    
    // タイムライン範囲の更新
    updateTimelineRange: (state, action: PayloadAction<{ start: Date; end: Date }>) => {
      state.timelineStart = action.payload.start;
      state.timelineEnd = action.payload.end;
    },
    
    // 可視範囲の更新
    updateVisibleDateRange: (state, action: PayloadAction<{ start: Date; end: Date }>) => {
      state.visibleStart = action.payload.start;
      state.visibleEnd = action.payload.end;
    },
    
    // タイムラインナビゲーション
    navigateTimeline: (state, action: PayloadAction<'prev' | 'next' | 'today'>) => {
      const direction = action.payload;
      const visibleRange = state.visibleEnd.getTime() - state.visibleStart.getTime();
      const movement = visibleRange * 0.8; // 80%の範囲を移動 (重複あり)
      
      if (direction === 'prev') {
        const newStart = new Date(state.visibleStart.getTime() - movement);
        const newEnd = new Date(state.visibleEnd.getTime() - movement);
        state.visibleStart = newStart;
        state.visibleEnd = newEnd;
      } else if (direction === 'next') {
        const newStart = new Date(state.visibleStart.getTime() + movement);
        const newEnd = new Date(state.visibleEnd.getTime() + movement);
        state.visibleStart = newStart;
        state.visibleEnd = newEnd;
      } else if (direction === 'today') {
        // 今日を中心にした表示範囲を計算
        const range = visibleRange;
        const halfRange = range / 2;
        const newStart = new Date(state.today.getTime() - halfRange);
        const newEnd = new Date(state.today.getTime() + halfRange);
        state.visibleStart = newStart;
        state.visibleEnd = newEnd;
      }
    },
    
    // ドラッグ開始
    startDrag: (state, action: PayloadAction<{
      projectId: string;
      taskId: string;
      subtaskId?: string | null;
      type: 'move' | 'resize-start' | 'resize-end';
      initialX: number;
      startX: number;
      daysDelta: number;
    }>) => {
      // 警告削除のため変数宣言を削除
      
      // タスクデータの取得 (実際のアプリではReduxのセレクタでタスクデータを取得する)
      let taskStart: Date | null = null;
      let taskEnd: Date | null = null;
      
      try {
        // 実際のアプリでは適切なロジックでタスクデータを取得する
        // この例では簡略化のためダミー日付を設定
        taskStart = new Date();
        taskEnd = new Date(taskStart);
        taskEnd.setDate(taskEnd.getDate() + 1);
      } catch (error) {
        console.error('Error finding task for drag:', error);
      }
      
      // dragInfoを設定
      state.dragInfo = {
        ...action.payload,
        taskStart,
        taskEnd,
        currentX: action.payload.initialX
      };
    },
    
    // ドラッグ更新
    updateDrag: (state, action: PayloadAction<{
      currentX: number;
      daysDelta: number;
    }>) => {
      if (state.dragInfo) {
        state.dragInfo = {
          ...state.dragInfo,
          ...action.payload
        };
      }
    },
    
    // ドラッグ終了
    endDrag: (state) => {
      state.dragInfo = null;
    },
    
    // ホバー情報設定
    setHoverInfo: (state, action: PayloadAction<HoverInfo | null>) => {
      state.hoverInfo = action.payload;
    },
    
    // ホバー情報リセット
    resetHoverInfo: (state) => {
      state.hoverInfo = null;
    }
  },
});

// アクションエクスポート
export const { 
  initializeTimeline,
  zoomIn, 
  zoomOut,
  updateTimelineRange,
  updateVisibleDateRange,
  navigateTimeline,
  startDrag, 
  updateDrag, 
  endDrag,
  setHoverInfo, 
  resetHoverInfo
} = timelineSlice.actions;

export default timelineSlice.reducer;