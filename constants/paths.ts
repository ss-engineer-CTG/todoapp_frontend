// アプリケーション内のパス定数

// ベースパス
export const BASE_PATHS = {
    ROOT: '/',
    API: '/api',
    ASSETS: '/assets',
    IMAGES: '/images',
    ICONS: '/icons'
  } as const
  
  // ページパス
  export const PAGE_PATHS = {
    HOME: '/',
    PROJECTS: '/projects',
    TASKS: '/tasks',
    TIMELINE: '/timeline',
    SETTINGS: '/settings',
    HELP: '/help'
  } as const
  
  // APIエンドポイント
  export const API_PATHS = {
    PROJECTS: '/api/projects',
    TASKS: '/api/tasks',
    EXPORT: '/api/export',
    IMPORT: '/api/import',
    BACKUP: '/api/backup'
  } as const
  
  // ファイルパス
  export const FILE_PATHS = {
    UPLOADS: '/uploads',
    DOWNLOADS: '/downloads',
    BACKUPS: '/backups',
    EXPORTS: '/exports'
  } as const
  
  // 設定ファイルパス
  export const CONFIG_PATHS = {
    APP_CONFIG: '/config/app.json',
    USER_PREFERENCES: '/config/user.json',
    THEME_CONFIG: '/config/theme.json'
  } as const
  
  // 静的リソースパス
  export const STATIC_PATHS = {
    FAVICON: '/favicon.ico',
    LOGO: '/images/logo.png',
    DEFAULT_AVATAR: '/images/default-avatar.png',
    ERROR_IMAGE: '/images/error.png'
  } as const
  
  // ストレージキー（LocalStorage用）
  export const STORAGE_KEYS = {
    TODO_DATA: 'todo-app-data',
    USER_PREFERENCES: 'todo-app-preferences',
    THEME: 'todo-app-theme',
    VIEW_STATE: 'todo-app-view-state',
    BACKUP_PREFIX: 'todo-app-backup-',
    SETTINGS: 'todo-app-settings',
    LAST_SYNC: 'todo-app-last-sync'
  } as const
  
  // URLパラメータキー
  export const URL_PARAMS = {
    PROJECT_ID: 'projectId',
    TASK_ID: 'taskId',
    VIEW: 'view',
    FILTER: 'filter',
    SORT: 'sort',
    SEARCH: 'q'
  } as const
  
  // エクスポート/インポートファイル名
  export const FILE_NAMES = {
    EXPORT_JSON: 'todo-export.json',
    EXPORT_CSV: 'todo-export.csv',
    EXPORT_MARKDOWN: 'todo-export.md',
    BACKUP: 'todo-backup.json',
    SETTINGS_EXPORT: 'todo-settings.json'
  } as const
  
  // 外部リンク
  export const EXTERNAL_LINKS = {
    DOCUMENTATION: 'https://docs.todo-app.com',
    SUPPORT: 'https://support.todo-app.com',
    GITHUB: 'https://github.com/todo-app',
    LICENSE: 'https://opensource.org/licenses/MIT'
  } as const
  
  // パスユーティリティ関数
  export const pathUtils = {
    // パスを結合
    join: (...paths: string[]): string => {
      return paths
        .map(path => path.replace(/^\/+|\/+$/g, ''))
        .filter(Boolean)
        .join('/')
    },
  
    // クエリパラメータを追加
    addQuery: (path: string, params: Record<string, string>): string => {
      const url = new URL(path, window.location.origin)
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
      return url.pathname + url.search
    },
  
    // プロジェクト詳細ページのパス生成
    projectDetail: (projectId: string): string => {
      return pathUtils.join(PAGE_PATHS.PROJECTS, projectId)
    },
  
    // タスク詳細ページのパス生成
    taskDetail: (taskId: string): string => {
      return pathUtils.join(PAGE_PATHS.TASKS, taskId)
    },
  
    // APIエンドポイントのパス生成
    apiEndpoint: (endpoint: string, id?: string): string => {
      return id ? pathUtils.join(endpoint, id) : endpoint
    }
  }