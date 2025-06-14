// システムプロンプト準拠：統一設定管理（軽量化版）
// 🔧 修正内容：全設定の一元化、不要設定削除

// 基本型定義
export interface ProjectColor {
  name: string
  value: string
}

export interface KeyboardShortcut {
  key: string
  description: string
}

// パス管理統一
export const APP_PATHS = {
  API: {
    BASE: '/api',
    PROJECTS: '/api/projects',
    TASKS: '/api/tasks',
    BATCH: '/api/tasks/batch',
    HEALTH: '/api/health'
  }
} as const

// パス結合専用関数
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
  },
  TIMELINE: {
    ZOOM: {
      MIN: 50,
      MAX: 150,
      DEFAULT: 100,
      STEP: 10
    },
    VIEW_UNITS: ['day', 'week'] as const,
    DEFAULT_VIEW_UNIT: 'week' as const,
    SCROLL: {
      SYNC_THRESHOLD: 5,
      DEBOUNCE_MS: 16
    }
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

// キーボードショートカット
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
  { key: "Ctrl + T", description: "タイムラインビューに切り替え" },
  { key: "Ctrl + L", description: "リストビューに切り替え" },
  { key: "Home", description: "今日の位置にスクロール（タイムラインビュー）" },
] as const

// 一括操作タイプ
export const BATCH_OPERATIONS = {
  COMPLETE: 'complete',
  INCOMPLETE: 'incomplete',
  DELETE: 'delete',
  COPY: 'copy'
} as const

// デフォルト値
export const DEFAULTS = {
  ASSIGNEE: '自分',
  TASK_NAME: '新しいタスク',
  COPY_SUFFIX: ' (コピー)',
  MAX_TASK_LEVEL: 10
} as const

// ビューモード設定
export const VIEW_MODES = {
  TASKLIST: 'tasklist',
  TIMELINE: 'timeline'
} as const

// Timeline設定（統合）
export const TIMELINE_CONFIG = {
  ZOOM: APP_CONFIG.TIMELINE.ZOOM,
  SCROLL: APP_CONFIG.TIMELINE.SCROLL,
  BASE_SIZES: {
    cellWidth: { day: 30, week: 20 },
    rowHeight: { project: 48, task: 40, subtask: 32 },
    fontSize: { base: 14, small: 12, large: 16 }
  }
} as const