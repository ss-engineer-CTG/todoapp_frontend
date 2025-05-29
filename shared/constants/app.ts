// アプリケーション定数（DRY原則適用）
export const APP_CONFIG = {
    NAME: '階層型ToDoリストアプリケーション',
    VERSION: '1.0.0',
    DESCRIPTION: 'プロジェクトベースの階層的なタスク管理アプリケーション',
    
    // ポート設定
    PORTS: {
      FRONTEND: 3000,
      BACKEND: 8000
    },
    
    // タイムアウト設定
    TIMEOUTS: {
      API_REQUEST: 10000,
      DATABASE_CONNECTION: 5000
    },
    
    // デフォルト値
    DEFAULTS: {
      PROJECT_COLOR: '#f97316',
      ASSIGNEE: '自分',
      TASK_LEVEL: 0
    }
  } as const