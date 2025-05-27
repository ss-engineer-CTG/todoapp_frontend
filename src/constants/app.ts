export const APP_CONFIG = {
    NAME: '統合プロジェクト管理',
    VERSION: '1.0.0',
    DESCRIPTION: 'プロジェクトとタスクを効率的に管理するアプリケーション',
    AUTHOR: 'Development Team',
    HOMEPAGE: 'https://example.com',
  } as const
  
  export const DEFAULT_SETTINGS = {
    THEME: 'system' as const,
    LANGUAGE: 'ja' as const,
    VIEW_MODE: 'list' as const,
    AUTO_SAVE: true,
    AUTO_SAVE_INTERVAL: 30000, // 30秒
    SIDEBAR_WIDTH: 256,
    DETAIL_PANEL_WIDTH: 320,
    SHOW_COMPLETED_TASKS: true,
    ANIMATIONS_ENABLED: true,
    KEYBOARD_SHORTCUTS_ENABLED: true,
  } as const
  
  export const LAYOUT_CONFIG = {
    HEADER_HEIGHT: 56,
    SIDEBAR_MIN_WIDTH: 200,
    SIDEBAR_MAX_WIDTH: 400,
    DETAIL_PANEL_MIN_WIDTH: 280,
    DETAIL_PANEL_MAX_WIDTH: 500,
    TIMELINE_HEADER_HEIGHT: 80,
    PROJECT_ROW_HEIGHT: 40,
    TASK_ROW_HEIGHT: 48,
    SUBTASK_ROW_HEIGHT: 36,
  } as const
  
  export const NOTIFICATION_CONFIG = {
    DEFAULT_DURATION: 5000, // 5秒
    SUCCESS_DURATION: 3000, // 3秒
    ERROR_DURATION: 8000, // 8秒
    MAX_NOTIFICATIONS: 5,
    POSITION: 'top-right' as const,
  } as const
  
  export const DRAG_DROP_CONFIG = {
    DRAG_THRESHOLD: 5, // px
    DROP_ZONE_HIGHLIGHT_COLOR: '#3b82f6',
    DRAG_OPACITY: 0.7,
    GHOST_OFFSET: { x: 10, y: 10 },
  } as const
  
  export const SEARCH_CONFIG = {
    MIN_SEARCH_LENGTH: 2,
    DEBOUNCE_MS: 300,
    MAX_RESULTS: 50,
    HIGHLIGHT_CLASS: 'search-highlight',
  } as const
  
  export const EXPORT_CONFIG = {
    SUPPORTED_FORMATS: ['json', 'csv', 'xlsx'] as const,
    CSV_DELIMITER: ',',
    DATE_FORMAT: 'YYYY-MM-DD',
    INCLUDE_SUBTASKS: true,
    INCLUDE_COMPLETED: true,
  } as const
  
  export const VALIDATION_CONFIG = {
    PROJECT_NAME: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 100,
      REQUIRED: true,
    },
    TASK_NAME: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 200,
      REQUIRED: true,
    },
    NOTES: {
      MAX_LENGTH: 2000,
      REQUIRED: false,
    },
    ASSIGNEE: {
      MAX_LENGTH: 50,
      REQUIRED: false,
    },
  } as const
  
  export const ERROR_MESSAGES = {
    GENERIC: '予期しないエラーが発生しました。',
    NETWORK: 'ネットワークエラーが発生しました。',
    VALIDATION: '入力値が正しくありません。',
    NOT_FOUND: '指定されたデータが見つかりません。',
    PERMISSION_DENIED: 'この操作を実行する権限がありません。',
    SAVE_FAILED: 'データの保存に失敗しました。',
    LOAD_FAILED: 'データの読み込みに失敗しました。',
    DELETE_FAILED: 'データの削除に失敗しました。',
  } as const
  
  export const SUCCESS_MESSAGES = {
    SAVE_SUCCESS: 'データを保存しました。',
    DELETE_SUCCESS: 'データを削除しました。',
    COPY_SUCCESS: 'データをコピーしました。',
    EXPORT_SUCCESS: 'データをエクスポートしました。',
    IMPORT_SUCCESS: 'データをインポートしました。',
  } as const