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
  timelineScale: 'day' | 'week' | 'month';
  zoomLevel: number;
  timelineStart: Date;
  timelineEnd: Date;
  today: Date;
  dragInfo: DragInfo | null;
  hoverInfo: HoverInfo | null;
}

// 初期ステート
const initialState: TimelineState = {
  timelineScale: 'day',
  zoomLevel: 100,
  timelineStart: new Date('2025-05-10'),
  timelineEnd: new Date('2025-06-15'),
  today: new Date('2025-05-17'),
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
    },
    
    // タイムラインスケールの設定
    setTimelineScale: (state, action: PayloadAction<'day' | 'week' | 'month'>) => {
      state.timelineScale = action.payload;
    },
    
    // ズームイン
    zoomIn: (state) => {
      state.zoomLevel = Math.min(state.zoomLevel + 25, 200);
    },
    
    // ズームアウト
    zoomOut: (state) => {
      state.zoomLevel = Math.max(state.zoomLevel - 25, 50);
    },
    
    // タイムライン開始日の設定
    setTimelineStart: (state, action: PayloadAction<Date>) => {
      state.timelineStart = action.payload;
    },
    
    // タイムライン終了日の設定
    setTimelineEnd: (state, action: PayloadAction<Date>) => {
      state.timelineEnd = action.payload;
    },
    
    // タイムラインナビゲーション
    navigateTimeline: (state, action: PayloadAction<'prev' | 'next' | 'today'>) => {
      const direction = action.payload;
      const dateRange = state.timelineEnd.getTime() - state.timelineStart.getTime();
      const movement = Math.ceil(dateRange / 2); // 表示範囲の半分の日数分移動
      
      if (direction === 'prev') {
        const newStart = new Date(state.timelineStart.getTime() - movement);
        const newEnd = new Date(state.timelineEnd.getTime() - movement);
        state.timelineStart = newStart;
        state.timelineEnd = newEnd;
      } else if (direction === 'next') {
        const newStart = new Date(state.timelineStart.getTime() + movement);
        const newEnd = new Date(state.timelineEnd.getTime() + movement);
        state.timelineStart = newStart;
        state.timelineEnd = newEnd;
      } else if (direction === 'today') {
        // 今日を中心にした表示範囲を計算
        const range = dateRange;
        const halfRange = range / 2;
        const newStart = new Date(state.today.getTime() - halfRange);
        const newEnd = new Date(state.today.getTime() + halfRange);
        state.timelineStart = newStart;
        state.timelineEnd = newEnd;
      }
    },
    
    // ドラッグ開始
    startDrag: (state, action: PayloadAction<DragInfo>) => {
      state.dragInfo = action.payload;
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
  setTimelineScale, 
  zoomIn, 
  zoomOut,
  setTimelineStart, 
  setTimelineEnd, 
  navigateTimeline,
  startDrag, 
  updateDrag, 
  endDrag,
  setHoverInfo, 
  resetHoverInfo
} = timelineSlice.actions;

export default timelineSlice.reducer;