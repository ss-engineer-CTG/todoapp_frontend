// パス定数一元管理（システムプロンプト準拠：ハードコードパス禁止）
export const PATHS = {
    // ルートパス
    ROOT: '/',
    
    // フロントエンドパス
    FRONTEND: {
      SRC: '/src',
      COMPONENTS: '/src/components',
      HOOKS: '/src/hooks',
      UTILS: '/src/utils',
      CONFIG: '/src/config',
      TYPES: '/src/types',
      STYLES: '/src/styles'
    },
    
    // バックエンドパス
    BACKEND: {
      ROOT: '/backend',
      CORE: '/backend/core',
      UTILS: '/backend/utils',
      SERVICES: '/backend/services',
      LOGS: '/backend/logs'
    },
    
    // Electronパス
    ELECTRON: {
      ROOT: '/electron',
      SRC: '/electron/src',
      ASSETS: '/electron/assets'
    },
    
    // 設定ファイルパス
    CONFIG: {
      ROOT: '/config',
      APP: '/config/app.json',
      LOGGER: '/config/logger.json',
      PATHS: '/config/paths.json'
    },
    
    // データベース
    DATABASE: {
      FILE: '/backend/todo.db',
      SCHEMA: '/backend/schema.sql'
    },
    
    // ログファイル
    LOGS: {
      FRONTEND: '/logs/frontend.log',
      BACKEND: '/logs/backend.log',
      ELECTRON: '/logs/electron.log'
    }
  } as const
  
  export type PathKeys = keyof typeof PATHS