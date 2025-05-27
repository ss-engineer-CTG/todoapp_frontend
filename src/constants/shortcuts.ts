export interface KeyboardShortcut {
    key: string
    description: string
    category?: string
    viewMode?: 'list' | 'timeline' | 'both'
  }
  
  export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
    // タスク操作
    { key: 'Enter', description: '同じレベルで新規タスク追加', category: 'タスク操作', viewMode: 'both' },
    { key: 'Tab', description: '選択したタスクの子タスクを追加', category: 'タスク操作', viewMode: 'both' },
    { key: 'Delete / Backspace', description: '選択したタスクを削除', category: 'タスク操作', viewMode: 'both' },
    { key: 'Ctrl + C', description: '選択したタスクをコピー', category: 'タスク操作', viewMode: 'both' },
    { key: 'Ctrl + V', description: 'コピーしたタスクを貼り付け', category: 'タスク操作', viewMode: 'both' },
    { key: 'Space', description: 'タスク完了状態の切り替え', category: 'タスク操作', viewMode: 'both' },
  
    // ナビゲーション
    { key: '↑', description: '上のタスクに移動', category: 'ナビゲーション', viewMode: 'both' },
    { key: '↓', description: '下のタスクに移動', category: 'ナビゲーション', viewMode: 'both' },
    { key: '→', description: '右のエリアに移動', category: 'ナビゲーション', viewMode: 'both' },
    { key: '←', description: '左のエリアに移動', category: 'ナビゲーション', viewMode: 'both' },
    { key: 'Ctrl + →', description: 'タスクの折りたたみ切り替え', category: 'ナビゲーション', viewMode: 'both' },
  
    // 選択操作
    { key: 'Shift + ↑/↓', description: '複数タスクを選択', category: '選択操作', viewMode: 'both' },
    { key: 'Ctrl + クリック', description: 'タスクを個別に選択/選択解除', category: '選択操作', viewMode: 'both' },
    { key: 'Ctrl + A', description: '全てのタスクを選択', category: '選択操作', viewMode: 'both' },
    { key: 'Escape', description: '選択を解除', category: '選択操作', viewMode: 'both' },
  
    // 表示切替
    { key: 'Ctrl + 1', description: 'リスト表示に切り替え', category: '表示切替', viewMode: 'both' },
    { key: 'Ctrl + 2', description: 'タイムライン表示に切り替え', category: '表示切替', viewMode: 'both' },
    { key: 'Ctrl + T', description: 'テーマの切り替え', category: '表示切替', viewMode: 'both' },
    { key: 'F11', description: '詳細パネルの表示/非表示', category: '表示切替', viewMode: 'list' },
  
    // タイムライン専用
    { key: 'Ctrl + +', description: 'ズームイン', category: 'タイムライン', viewMode: 'timeline' },
    { key: 'Ctrl + -', description: 'ズームアウト', category: 'タイムライン', viewMode: 'timeline' },
    { key: 'Ctrl + 0', description: 'ズームリセット', category: 'タイムライン', viewMode: 'timeline' },
    { key: 'Ctrl + F', description: '画面にフィット', category: 'タイムライン', viewMode: 'timeline' },
    { key: 'Home', description: '今日に移動', category: 'タイムライン', viewMode: 'timeline' },
  
    // プロジェクト操作
    { key: 'Ctrl + N', description: '新規プロジェクト追加', category: 'プロジェクト', viewMode: 'both' },
    { key: 'F2', description: 'プロジェクト名編集', category: 'プロジェクト', viewMode: 'both' },
  
    // その他
    { key: 'Ctrl + S', description: '保存', category: 'その他', viewMode: 'both' },
    { key: 'Ctrl + Z', description: '元に戻す', category: 'その他', viewMode: 'both' },
    { key: 'Ctrl + Y', description: 'やり直し', category: 'その他', viewMode: 'both' },
    { key: 'F1', description: 'ヘルプを表示', category: 'その他', viewMode: 'both' },
  ]
  
  export const SHORTCUT_CATEGORIES = [
    'タスク操作',
    'ナビゲーション',
    '選択操作',
    '表示切替',
    'タイムライン',
    'プロジェクト',
    'その他',
  ] as const
  
  export const MODIFIER_KEYS = {
    CTRL: 'ctrl',
    ALT: 'alt',
    SHIFT: 'shift',
    META: 'meta', // macOSのCmd
  } as const
  
  export const SPECIAL_KEYS = {
    ENTER: 'Enter',
    ESCAPE: 'Escape',
    SPACE: ' ',
    TAB: 'Tab',
    BACKSPACE: 'Backspace',
    DELETE: 'Delete',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
    F1: 'F1',
    F2: 'F2',
    F11: 'F11',
  } as const