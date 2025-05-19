import { combineReducers } from '@reduxjs/toolkit';
import projectsReducer from './slices/projectsSlice';
import tasksReducer from './slices/tasksSlice';
import uiReducer from './slices/uiSlice';
import timelineReducer from './slices/timelineSlice';
import templatesReducer from './slices/templatesSlice';

// ルートリデューサー
export const rootReducer = combineReducers({
  projects: projectsReducer,
  tasks: tasksReducer,
  ui: uiReducer,
  timeline: timelineReducer,
  templates: templatesReducer,
});

// ルートステートの型
export type RootState = ReturnType<typeof rootReducer>;