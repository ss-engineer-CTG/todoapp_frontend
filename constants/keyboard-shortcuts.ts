import type { KeyboardShortcutSection } from "@/types/common"

// キーボードショートカット定義
export const KEYBOARD_SHORTCUTS: KeyboardShortcutSection[] = [
  {
    section: "基本操作",
    shortcuts: [
      { key: "Ctrl + S", description: "データを保存" },
      { key: "Ctrl + Z", description: "元に戻す" },
      { key: "Ctrl + Y", description: "やり直し" },
      { key: "Ctrl + F", description: "検索" },
      { key: "Escape", description: "キャンセル/選択解除" },
      { key: "F1", description: "ヘルプを表示" }
    ]
  },
  {
    section: "ナビゲーション",
    shortcuts: [
      { key: "↑ ↓", description: "項目間を移動" },
      { key: "← →", description: "エリア間を移動" },
      { key: "Tab", description: "次の要素にフォーカス" },
      { key: "Shift + Tab", description: "前の要素にフォーカス" },
      { key: "Home", description: "最初の項目に移動" },
      { key: "End", description: "最後の項目に移動" }
    ]
  },
  {
    section: "プロジェクト操作",
    shortcuts: [
      { key: "Ctrl + Shift + P", description: "新しいプロジェクトを作成" },
      { key: "Delete", description: "選択したプロジェクトを削除" },
      { key: "F2", description: "プロジェクト名を編集" },
      { key: "Ctrl + D", description: "プロジェクトを複製" }
    ]
  },
  {
    section: "タスク操作",
    shortcuts: [
      { key: "Enter", description: "同じレベルで新規タスク追加" },
      { key: "Shift + Enter", description: "タスクの上に新規タスク追加" },
      { key: "Tab", description: "選択したタスクの子タスクを追加" },
      { key: "Shift + Tab", description: "タスクのレベルを上げる" },
      { key: "Delete", description: "選択したタスクを削除" },
      { key: "Backspace", description: "選択したタスクを削除" },
      { key: "Space", description: "タスク完了状態の切り替え" },
      { key: "F2", description: "タスク名を編集" }
    ]
  },
  {
    section: "複数選択・編集",
    shortcuts: [
      { key: "Ctrl + クリック", description: "タスクを個別に選択/選択解除" },
      { key: "Shift + クリック", description: "範囲選択" },
      { key: "Ctrl + A", description: "全てのタスクを選択" },
      { key: "Ctrl + C", description: "選択したタスクをコピー" },
      { key: "Ctrl + V", description: "コピーしたタスクを貼り付け" },
      { key: "Ctrl + X", description: "選択したタスクを切り取り" }
    ]
  },
  {
    section: "表示制御",
    shortcuts: [
      { key: "Ctrl + 1", description: "リスト表示に切り替え" },
      { key: "Ctrl + 2", description: "タイムライン表示に切り替え" },
      { key: "Ctrl + H", description: "完了済みタスクの表示/非表示" },
      { key: "Ctrl + \\", description: "詳細パネルの表示/非表示" },
      { key: "Ctrl + M", description: "複数選択モードの切り替え" }
    ]
  },
  {
    section: "タイムライン操作",
    shortcuts: [
      { key: "Ctrl + +", description: "ズームイン" },
      { key: "Ctrl + -", description: "ズームアウト" },
      { key: "Ctrl + 0", description: "ズームリセット" },
      { key: "Ctrl + Shift + F", description: "画面にフィット" },
      { key: "T", description: "今日の位置にスクロール" },
      { key: "W", description: "週表示に切り替え" },
      { key: "D", description: "日表示に切り替え" }
    ]
  },
  {
    section: "フィルタ・ソート",
    shortcuts: [
      { key: "Ctrl + Shift + F", description: "フィルターを表示" },
      { key: "Ctrl + Shift + S", description: "ソート設定を表示" },
      { key: "Ctrl + Shift + C", description: "フィルターをクリア" },
      { key: "Alt + 1", description: "優先度順でソート" },
      { key: "Alt + 2", description: "期限順でソート" },
      { key: "Alt + 3", description: "名前順でソート" }
    ]
  },
  {
    section: "データ操作",
    shortcuts: [
      { key: "Ctrl + E", description: "データをエクスポート" },
      { key: "Ctrl + I", description: "データをインポート" },
      { key: "Ctrl + B", description: "バックアップを作成" },
      { key: "Ctrl + R", description: "データを更新" },
      { key: "Ctrl + Shift + R", description: "アプリを再読み込み" }
    ]
  },
  {
    section: "その他",
    shortcuts: [
      { key: "Ctrl + ,", description: "設定を開く" },
      { key: "Ctrl + Shift + T", description: "テーマを切り替え" },
      { key: "Ctrl + Shift + K", description: "ショートカット一覧を表示" },
      { key: "Ctrl + Shift + D", description: "開発者ツールを開く" },
      { key: "F11", description: "フルスクリーン切り替え" }
    ]
  }
]

// 特定のコンテキストでのショートカット
export const CONTEXT_SHORTCUTS = {
  modal: [
    { key: "Escape", description: "モーダルを閉じる" },
    { key: "Enter", description: "確定/保存" },
    { key: "Tab", description: "次のフィールドに移動" }
  ],
  form: [
    { key: "Ctrl + Enter", description: "フォームを送信" },
    { key: "Escape", description: "編集をキャンセル" },
    { key: "Tab", description: "次のフィールドに移動" }
  ],
  dropdown: [
    { key: "↑ ↓", description: "選択肢を移動" },
    { key: "Enter", description: "選択を確定" },
    { key: "Escape", description: "ドロップダウンを閉じる" }
  ]
} as const

// ショートカットのカテゴリ別グループ
export const SHORTCUT_CATEGORIES = {
  essential: ["Ctrl + S", "Ctrl + Z", "Ctrl + C", "Ctrl + V", "Enter", "Space", "Delete"],
  navigation: ["↑", "↓", "←", "→", "Tab", "Escape"],
  advanced: ["Ctrl + A", "Shift + Click", "Ctrl + Shift + F", "Ctrl + E"]
} as const

// プラットフォーム別ショートカット
export const getPlatformShortcuts = () => {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  
  return KEYBOARD_SHORTCUTS.map(section => ({
    ...section,
    shortcuts: section.shortcuts.map(shortcut => ({
      ...shortcut,
      key: isMac ? shortcut.key.replace(/Ctrl/g, 'Cmd') : shortcut.key
    }))
  }))
}

// ショートカットの検索
export const searchShortcuts = (query: string): KeyboardShortcutSection[] => {
  if (!query.trim()) return KEYBOARD_SHORTCUTS

  const filteredSections = KEYBOARD_SHORTCUTS.map(section => ({
    ...section,
    shortcuts: section.shortcuts.filter(shortcut =>
      shortcut.description.toLowerCase().includes(query.toLowerCase()) ||
      shortcut.key.toLowerCase().includes(query.toLowerCase())
    )
  })).filter(section => section.shortcuts.length > 0)

  return filteredSections
}