import type { AppConfig, UserPreferences } from "@/types/common"

// アプリケーション基本設定
export const APP_CONFIG: AppConfig = {
  name: "統合ToDo管理アプリ",
  version: "1.0.0",
  description: "階層型リスト表示とタイムライン表示を統合したプロジェクト・タスク管理アプリケーション"
} as const

// デフォルトユーザー設定
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'system',
  defaultView: 'list',
  autoSave: true,
  showKeyboardShortcuts: true
} as const

// 機能設定
export const FEATURE_FLAGS = {
  enableTimelineView: true,
  enableMultiSelect: true,
  enableKeyboardShortcuts: true,
  enableDataExport: true,
  enableDataImport: true,
  enableBackup: true,
  enableCollaboration: false, // 将来の機能
  enableNotifications: false, // 将来の機能
  enableCloudSync: false // 将来の機能
} as const

// パフォーマンス設定
export const PERFORMANCE_CONFIG = {
  maxTasksPerProject: 1000,
  maxProjectsPerUser: 50,
  autoSaveInterval: 30000, // 30秒
  debounceDelay: 300, // 300ms
  virtualScrollThreshold: 100,
  maxUndoHistory: 50
} as const

// UI設定
export const UI_CONFIG = {
  sidebarWidth: {
    min: 200,
    default: 280,
    max: 400
  },
  detailPanelWidth: {
    min: 300,
    default: 380,
    max: 500
  },
  taskItemHeight: {
    compact: 32,
    normal: 48,
    comfortable: 64
  },
  animationDuration: {
    fast: 150,
    normal: 250,
    slow: 350
  }
} as const

// データ制限
export const DATA_LIMITS = {
  projectName: {
    min: 1,
    max: 100
  },
  taskName: {
    min: 1,
    max: 200
  },
  taskNotes: {
    max: 1000
  },
  assigneeName: {
    max: 50
  },
  attachmentSize: {
    max: 10 * 1024 * 1024 // 10MB
  },
  totalStorageSize: {
    max: 100 * 1024 * 1024 // 100MB
  }
} as const

// エクスポート設定
export const EXPORT_CONFIG = {
  formats: ['json', 'csv', 'markdown'] as const,
  defaultFormat: 'json' as const,
  includedFields: {
    json: ['all'],
    csv: ['name', 'project', 'status', 'startDate', 'dueDate', 'assignee', 'notes'],
    markdown: ['name', 'project', 'status', 'dueDate', 'notes']
  },
  fileNamePattern: 'todo-export-{timestamp}'
} as const

// ファイル設定
export const FILE_CONFIG = {
  allowedImportTypes: ['.json', '.csv'],
  allowedExportTypes: ['.json', '.csv', '.md'],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  encoding: 'utf-8'
} as const

// キャッシュ設定
export const CACHE_CONFIG = {
  duration: {
    short: 5 * 60 * 1000, // 5分
    medium: 30 * 60 * 1000, // 30分
    long: 24 * 60 * 60 * 1000 // 24時間
  },
  keys: {
    userData: 'user-data',
    preferences: 'user-preferences',
    projectCache: 'project-cache',
    taskCache: 'task-cache'
  }
} as const

// エラー処理設定
export const ERROR_CONFIG = {
  retryAttempts: 3,
  retryDelay: 1000,
  showErrorToast: true,
  logErrors: true,
  errorReportingEnabled: false
} as const

// 開発設定
export const DEV_CONFIG = {
  enableLogging: process.env.NODE_ENV === 'development',
  enableDebugMode: process.env.NODE_ENV === 'development',
  enablePerformanceMonitoring: false,
  mockApiDelay: 500
} as const

// セキュリティ設定
export const SECURITY_CONFIG = {
  maxLoginAttempts: 5,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24時間
  enableDataEncryption: false,
  validateInputs: true
} as const

// 通知設定
export const NOTIFICATION_CONFIG = {
  enabled: false,
  types: {
    taskDue: true,
    taskOverdue: true,
    projectDeadline: true,
    systemUpdate: false
  },
  sounds: {
    enabled: true,
    volume: 0.5
  }
} as const

// アクセシビリティ設定
export const ACCESSIBILITY_CONFIG = {
  enableHighContrast: false,
  enableReducedMotion: false,
  fontSize: {
    min: 12,
    default: 14,
    max: 18
  },
  focusIndicatorWidth: 2,
  screenReaderSupport: true
} as const

// 多言語対応設定
export const I18N_CONFIG = {
  defaultLocale: 'ja',
  supportedLocales: ['ja', 'en'],
  fallbackLocale: 'ja',
  enableRTL: false
} as const

// アナリティクス設定
export const ANALYTICS_CONFIG = {
  enabled: false,
  trackPageViews: false,
  trackUserActions: false,
  trackPerformance: false,
  anonymizeData: true
} as const

// 環境別設定の取得
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development'
  
  const baseConfig = {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    cdnUrl: process.env.NEXT_PUBLIC_CDN_URL || '/static'
  }

  const envConfigs = {
    development: {
      ...baseConfig,
      debug: true,
      enableMockData: true,
      logLevel: 'debug'
    },
    production: {
      ...baseConfig,
      debug: false,
      enableMockData: false,
      logLevel: 'error'
    },
    test: {
      ...baseConfig,
      debug: false,
      enableMockData: true,
      logLevel: 'silent'
    }
  }

  return envConfigs[env as keyof typeof envConfigs] || envConfigs.development
}