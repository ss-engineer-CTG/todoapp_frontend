// システムプロンプト準拠：統一設定管理（KISS原則・DRY原則・パス管理一元化）

// 基本型定義
export interface ProjectColor {
    name: string
    value: string
  }
  
  export interface KeyboardShortcut {
    key: string
    description: string
  }
  
  // システムプロンプト準拠：パス管理統一
  export const APP_PATHS = {
    FRONTEND: {
      SRC: './src',
      COMPONENTS: './src/components',
      HOOKS: './src/hooks',
      UTILS: './src/utils',
      SERVICES: './src/services',
      CONFIG: './src/config',
      TYPES: './src/types',
      STYLES: './src/styles'
    },
    API: {
      BASE: '/api',
      PROJECTS: '/api/projects',
      TASKS: '/api/tasks',
      BATCH: '/api/tasks/batch',
      HEALTH: '/api/health'
    }
  } as const
  
  // パス結合専用関数（システムプロンプト必須）
  export const joinPath = (...segments: string[]): string => {
    return segments
      .map(segment => segment.replace(/^\/+|\/+$/g, ''))
      .filter(segment => segment.length > 0)
      .join('/')
  }
  
  // アプリケーション設定
  export const APP_CONFIG = {
    PORTS: {
      FRONTEND: 3000,
      BACKEND: 8000,
    },
    THEME: {
      STORAGE_KEY: 'vite-ui-theme',
      DEFAULT: 'system' as const
    }
  } as const
  
  // プロジェクトカラー
  export const PROJECT_COLORS: ProjectColor[] = [
    { name: "オレンジ", value: "#f97316" },
    { name: "紫", value: "#8b5cf6" },
    { name: "緑", value: "#10b981" },
    { name: "赤", value: "#ef4444" },
    { name: "青", value: "#3b82f6" },
    { name: "琥珀", value: "#f59e0b" },
    { name: "ピンク", value: "#ec4899" },
    { name: "ティール", value: "#14b8a6" },
  ] as const
  
  // キーボードショートカット（簡素化）
  export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
    { key: "Enter", description: "同じレベルで新規タスク追加" },
    { key: "Tab", description: "選択したタスクの子タスクを追加" },
    { key: "Delete / Backspace", description: "選択したタスクを削除" },
    { key: "Ctrl + C", description: "選択したタスクをコピー" },
    { key: "Ctrl + V", description: "コピーしたタスクを貼り付け" },
    { key: "Space", description: "タスク完了状態の切り替え" },
    { key: "↑ / ↓", description: "タスク間移動" },
    { key: "→ / ←", description: "エリア間移動" },
    { key: "Ctrl + →", description: "タスクの折りたたみ切り替え" },
    { key: "Shift + ↑/↓", description: "複数タスクを選択" },
    { key: "Ctrl + A", description: "すべてのタスクを選択" },
    { key: "Escape", description: "選択解除・詳細パネルから戻る" },
  ] as const
  
  // 一括操作タイプ
  export const BATCH_OPERATIONS = {
    COMPLETE: 'complete',
    INCOMPLETE: 'incomplete',
    DELETE: 'delete',
    COPY: 'copy'
  } as const
  
  // エラーメッセージ
  export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'ネットワークエラーが発生しました',
    VALIDATION_ERROR: '入力値に誤りがあります',
    SERVER_ERROR: 'サーバーエラーが発生しました',
    UNKNOWN_ERROR: '予期しないエラーが発生しました',
    TASK_OPERATION_ERROR: 'タスク操作でエラーが発生しました',
  } as const
  
  // デフォルト値
  export const DEFAULTS = {
    ASSIGNEE: '自分',
    TASK_NAME: '新しいタスク',
    COPY_SUFFIX: ' (コピー)',
    MAX_TASK_LEVEL: 10
  } as const