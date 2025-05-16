import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { addDays, subDays, differenceInDays } from 'date-fns';
import { TimelineViewMode, TimelineViewSettings } from '../models/timeline';

interface TimelineState {
  viewMode: TimelineViewMode;
  zoomLevel: number;
  startDate: string; // ISO文字列形式
  endDate: string; // ISO文字列形式
  showCompletedTasks: boolean;
  showDependencies: boolean;
  highlightToday: boolean;
  highlightWeekends: boolean;
}

// 表示モードに基づいて表示日数を計算
const getVisibleDays = (viewMode: TimelineViewMode): number => {
  switch (viewMode) {
    case 'day':
      return 7;
    case 'week':
      return 14;
    case 'month':
      return 31;
    default:
      return 14;
  }
};

// 初期表示範囲を計算
const calculateInitialDateRange = (viewMode: TimelineViewMode) => {
  const today = new Date();
  const visibleDays = getVisibleDays(viewMode);
  const start = subDays(today, Math.floor(visibleDays / 2));
  const end = addDays(start, visibleDays - 1);
  return { start, end };
};

const initialDateRange = calculateInitialDateRange('week');

const initialState: TimelineState = {
  viewMode: 'week',
  zoomLevel: 100,
  startDate: initialDateRange.start.toISOString(),
  endDate: initialDateRange.end.toISOString(),
  showCompletedTasks: true,
  showDependencies: false,
  highlightToday: true,
  highlightWeekends: true,
};

/**
 * タイムラインビュー設定を管理するReduxスライス
 * 注: 現在の実装ではContextAPIを使用しているため、
 * このスライスは実際には使用されていない
 */
const timelineSlice = createSlice({
  name: 'timeline',
  initialState,
  reducers: {
    setViewMode: (state, action: PayloadAction<TimelineViewMode>) => {
      const newMode = action.payload;
      const currentStartDate = new Date(state.startDate);
      const currentEndDate = new Date(state.endDate);
      const currentCenterDate = addDays(
        currentStartDate,
        Math.floor(differenceInDays(currentEndDate, currentStartDate) / 2)
      );
      
      const visibleDays = getVisibleDays(newMode);
      const newStartDate = subDays(currentCenterDate, Math.floor(visibleDays / 2));
      const newEndDate = addDays(newStartDate, visibleDays - 1);
      
      state.viewMode = newMode;
      state.startDate = newStartDate.toISOString();
      state.endDate = newEndDate.toISOString();
    },
    
    setZoomLevel: (state, action: PayloadAction<number>) => {
      // 最小50%、最大200%に制限
      state.zoomLevel = Math.min(200, Math.max(50, action.payload));
    },
    
    setDateRange: (state, action: PayloadAction<{ startDate: Date; endDate: Date }>) => {
      state.startDate = action.payload.startDate.toISOString();
      state.endDate = action.payload.endDate.toISOString();
    },
    
    setShowCompletedTasks: (state, action: PayloadAction<boolean>) => {
      state.showCompletedTasks = action.payload;
    },
    
    setShowDependencies: (state, action: PayloadAction<boolean>) => {
      state.showDependencies = action.payload;
    },
    
    navigate: (state, action: PayloadAction<'prev' | 'next' | 'today'>) => {
      const startDate = new Date(state.startDate);
      const endDate = new Date(state.endDate);
      const visibleDays = differenceInDays(endDate, startDate) + 1;
      
      if (action.payload === 'prev') {
        const moveUnits = state.viewMode === 'day' ? 7 : state.viewMode === 'week' ? 14 : 30;
        const newStartDate = subDays(startDate, moveUnits);
        const newEndDate = addDays(newStartDate, visibleDays - 1);
        state.startDate = newStartDate.toISOString();
        state.endDate = newEndDate.toISOString();
      } 
      else if (action.payload === 'next') {
        const moveUnits = state.viewMode === 'day' ? 7 : state.viewMode === 'week' ? 14 : 30;
        const newStartDate = addDays(startDate, moveUnits);
        const newEndDate = addDays(newStartDate, visibleDays - 1);
        state.startDate = newStartDate.toISOString();
        state.endDate = newEndDate.toISOString();
      } 
      else if (action.payload === 'today') {
        const today = new Date();
        const newStartDate = subDays(today, Math.floor(visibleDays / 2));
        const newEndDate = addDays(newStartDate, visibleDays - 1);
        state.startDate = newStartDate.toISOString();
        state.endDate = newEndDate.toISOString();
      }
    },
    
    setSettings: (state, action: PayloadAction<TimelineViewSettings>) => {
      state.viewMode = action.payload.viewMode;
      state.zoomLevel = action.payload.zoomLevel;
      state.showCompletedTasks = action.payload.showCompletedTasks;
      state.showDependencies = action.payload.showDependencies || false;
      state.highlightToday = action.payload.highlightToday || true;
      state.highlightWeekends = action.payload.highlightWeekends || true;
    },
  },
});

export const {
  setViewMode,
  setZoomLevel,
  setDateRange,
  setShowCompletedTasks,
  setShowDependencies,
  navigate,
  setSettings,
} = timelineSlice.actions;

export default timelineSlice.reducer;