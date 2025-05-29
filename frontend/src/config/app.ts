// アプリケーション設定集約（DRY原則適用）
import { APP_CONFIG } from '../../../shared/constants/app'

export const FRONTEND_CONFIG = {
  ...APP_CONFIG,
  
  // フロントエンド固有設定
  UI: {
    THEME: {
      DEFAULT: 'system' as const,
      STORAGE_KEY: 'vite-ui-theme'
    },
    
    SCROLL: {
      BEHAVIOR: 'smooth' as ScrollBehavior,
      BLOCK: 'nearest' as ScrollLogicalPosition
    },
    
    ANIMATION: {
      DURATION: 200,
      EASING: 'ease-in-out'
    }
  },
  
  // API設定
  API: {
    BASE_URL: `http://localhost:${APP_CONFIG.PORTS.BACKEND}`,
    ENDPOINTS: {
      PROJECTS: '/api/projects',
      TASKS: '/api/tasks',
      HEALTH: '/api/health'
    },
    TIMEOUT: APP_CONFIG.TIMEOUTS.API_REQUEST
  },
  
  // ストレージキー
  STORAGE_KEYS: {
    THEME: 'vite-ui-theme',
    SETTINGS: 'todo-app-settings',
    LOGS: 'app_logs'
  }
} as const

export type FrontendConfig = typeof FRONTEND_CONFIG