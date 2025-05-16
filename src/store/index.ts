import { configureStore } from '@reduxjs/toolkit';
import taskReducer from './taskSlice';
import timelineReducer from './timelineSlice';

/**
 * Reduxストアの設定
 * 注: 現在の実装ではContextAPIを使用しているため、
 * このReduxストアは実際には使用されていない
 */
export const store = configureStore({
  reducer: {
    tasks: taskReducer,
    timeline: timelineReducer,
  },
});

// Reduxストアの型定義
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;