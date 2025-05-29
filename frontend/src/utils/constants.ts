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
]

// キーボードショートカット
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

// テーマストレージキー
export const THEME_STORAGE_KEY = 'vite-ui-theme'