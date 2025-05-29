import { ProjectColor, KeyboardShortcut } from '../types'
import { FRONTEND_CONFIG } from '../config/app' // 設定統合

// プロジェクトカラー（既存）
export const PROJECT_COLORS: ProjectColor[] = [
  { name: "オレンジ", value: "#f97316" },
  { name: "紫", value: "#8b5cf6" },
  { name: "緑", value: "#10b981" },
  { name: "赤", value: "#ef4444" },
  { name: "青", value: "#3b82f6" },
  { name: "琥珀", value: "#f59e0b" },
  { name: "ピンク", value: "#ec4899" },
  { name: "ティール", value: "#14b8a6" },
]

// キーボードショートカット（既存）
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
  { key: "Escape", description: "複数選択モードを解除" },
]

// テーマストレージキー（既存）
export const THEME_STORAGE_KEY = FRONTEND_CONFIG.STORAGE_KEYS.THEME

// 新規追加：DRY原則適用
export const APP_CONSTANTS = {
  // アプリケーション情報
  APP_NAME: FRONTEND_CONFIG.NAME,
  APP_VERSION: FRONTEND_CONFIG.VERSION,
  
  // デフォルト値
  DEFAULT_PROJECT_COLOR: FRONTEND_CONFIG.DEFAULTS.PROJECT_COLOR,
  DEFAULT_ASSIGNEE: FRONTEND_CONFIG.DEFAULTS.ASSIGNEE,
  DEFAULT_TASK_LEVEL: FRONTEND_CONFIG.DEFAULTS.TASK_LEVEL,
  
  // UI設定
  SCROLL_BEHAVIOR: FRONTEND_CONFIG.UI.SCROLL.BEHAVIOR,
  SCROLL_BLOCK: FRONTEND_CONFIG.UI.SCROLL.BLOCK,
  ANIMATION_DURATION: FRONTEND_CONFIG.UI.ANIMATION.DURATION,
  
  // API設定
  API_TIMEOUT: FRONTEND_CONFIG.API.TIMEOUT,
  
  // ストレージキー
  STORAGE_KEYS: FRONTEND_CONFIG.STORAGE_KEYS
} as const

// エラーメッセージ（統一化）
export const ERROR_MESSAGES = {
  TASK_NOT_FOUND: 'タスクが見つかりません',
  PROJECT_NOT_FOUND: 'プロジェクトが見つかりません',
  INVALID_INPUT: '入力内容が正しくありません',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  UNEXPECTED_ERROR: '予期しないエラーが発生しました',
  VALIDATION_ERROR: 'バリデーションエラーが発生しました'
} as const

// 成功メッセージ（統一化）
export const SUCCESS_MESSAGES = {
  TASK_CREATED: 'タスクを作成しました',
  TASK_UPDATED: 'タスクを更新しました',
  TASK_DELETED: 'タスクを削除しました',
  PROJECT_CREATED: 'プロジェクトを作成しました',
  PROJECT_UPDATED: 'プロジェクトを更新しました',
  PROJECT_DELETED: 'プロジェクトを削除しました'
} as const