// 全ての定数をエクスポート
export * from './colors'
export * from './shortcuts'
export * from './timeline'
export * from './app'

// 共通定数
export const APP_NAME = '統合プロジェクト管理'
export const APP_VERSION = '1.0.0'

export const STORAGE_KEYS = {
  THEME: 'app-theme',
  PROJECTS: 'app-projects',
  TASKS: 'app-tasks',
  PREFERENCES: 'app-preferences',
  VIEW_MODE: 'app-view-mode',
  SIDEBAR_WIDTH: 'app-sidebar-width',
  DETAIL_PANEL_WIDTH: 'app-detail-panel-width',
} as const

export const API_ENDPOINTS = {
  PROJECTS: '/api/projects',
  TASKS: '/api/tasks',
  AUTH: '/api/auth',
} as const

export const DATE_FORMATS = {
  SHORT: 'M月d日',
  LONG: 'yyyy年M月d日',
  TIME: 'HH:mm',
  DATETIME: 'yyyy年M月d日 HH:mm',
} as const

export const VALIDATION_RULES = {
  PROJECT_NAME_MAX_LENGTH: 100,
  TASK_NAME_MAX_LENGTH: 200,
  NOTES_MAX_LENGTH: 1000,
  MIN_PASSWORD_LENGTH: 8,
} as const