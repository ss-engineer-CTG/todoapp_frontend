// システムプロンプト準拠: 軽量化された定数定義
import { ProjectColor, KeyboardShortcut } from '../types'

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

// キーボードショートカット（システムプロンプト準拠：ESC追加）
export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: "Enter", description: "同じレベルで新規タスク追加" },
  { key: "Tab", description: "選択したタスクの子タスクを追加" },
  { key: "Delete / Backspace", description: "選択したタスクを削除" },
  { key: "Ctrl + C", description: "選択したタスクをコピー" },
  { key: "Ctrl + V", description: "コピーしたタスクを貼り付け" },
  { key: "Space", description: "タスク完了状態の切り替え" },
  { key: "↑", description: "上のタスクに移動" },
  { key: "↓", description: "下のタスクに移動" },
  { key: "→", description: "右のエリアに移動" },
  { key: "←", description: "左のエリアに移動" },
  { key: "Ctrl + →", description: "タスクの折りたたみ切り替え" },
  { key: "Shift + ↑/↓", description: "複数タスクを選択" },
  { key: "Ctrl + クリック", description: "タスクを個別に選択/選択解除" },
  { key: "Ctrl + A", description: "すべてのタスクを選択" },
  { key: "Escape", description: "詳細パネルからタスクパネルに戻る / 複数選択モードを解除" },
  { key: "Tab (詳細パネル)", description: "フィールド間の移動" },
] as const

// APIエンドポイント
export const PROJECT_API_ENDPOINTS = {
  LIST: '/api/projects',
  CREATE: '/api/projects',
  UPDATE: (id: string) => `/api/projects/${id}`,
  DELETE: (id: string) => `/api/projects/${id}`,
} as const

export const TASK_API_ENDPOINTS = {
  LIST: '/api/tasks',
  CREATE: '/api/tasks',
  UPDATE: (id: string) => `/api/tasks/${id}`,
  DELETE: (id: string) => `/api/tasks/${id}`,
  BATCH: '/api/tasks/batch',
} as const

// エラーメッセージ
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  VALIDATION_ERROR: '入力値に誤りがあります',
  SERVER_ERROR: 'サーバーエラーが発生しました',
  UNKNOWN_ERROR: '予期しないエラーが発生しました',
  PROJECT_NOT_FOUND: 'プロジェクトが見つかりません',
  TASK_NOT_FOUND: 'タスクが見つかりません',
  SHORTCUT_ERROR: 'ショートカット操作でエラーが発生しました',
  TASK_OPERATION_ERROR: 'タスク操作でエラーが発生しました',
  COPY_PASTE_ERROR: 'コピー・ペースト操作でエラーが発生しました',
  // システムプロンプト準拠：一時的タスク関連エラーメッセージ追加
  TEMPORARY_TASK_ERROR: '一時的タスクの操作でエラーが発生しました',
  TEMPORARY_TASK_SAVE_ERROR: '一時的タスクの保存に失敗しました',
  TEMPORARY_TASK_NAME_REQUIRED: 'タスク名を入力してから保存してください',
} as const

// UI設定定数
export const UI_CONSTANTS = {
  THEME_STORAGE_KEY: 'vite-ui-theme',
  DEFAULT_ASSIGNEE: '自分',
  PANEL_WIDTHS: {
    PROJECT: 'w-64',
    TASK: 'flex-1',
    DETAIL: 'w-80'
  }
} as const

// アプリケーション設定
export const APP_CONFIG = {
  PORTS: {
    FRONTEND: 3000,
    BACKEND: 8000,
  },
  ENDPOINTS: {
    API_BASE: '/api',
    HEALTH: '/api/health'
  }
} as const

// 一括操作タイプ
export const BATCH_OPERATIONS = {
  COMPLETE: 'complete',
  INCOMPLETE: 'incomplete',
  DELETE: 'delete',
  COPY: 'copy'
} as const

// タスク操作関連定数
export const TASK_OPERATION_CONSTANTS = {
  DEFAULT_TASK_NAME: '新しいタスク',
  COPY_SUFFIX: ' (コピー)',
  MAX_TASK_LEVEL: 10,
  AUTO_SAVE_DELAY: 500,
  // システムプロンプト準拠：一時的タスク関連定数追加
  TEMPORARY_TASK_PREFIX: 'temp_',
  TEMPORARY_TASK_PLACEHOLDER: 'タスク名を入力してください',
  TEMPORARY_TASK_DEFAULT_NAME: '',
} as const

// システムプロンプト準拠：一時的タスク操作タイプ
export const TEMPORARY_TASK_OPERATIONS = {
  CREATE: 'create_temporary',
  SAVE: 'save_temporary',
  CANCEL: 'cancel_temporary',
  REMOVE: 'remove_temporary'
} as const