import { KeyCombination } from '../utils/keyboard';

/**
 * キーボードショートカットの定義
 */

/**
 * ショートカット操作の種類
 */
export enum ShortcutAction {
  // タスク操作
  ADD_TASK = 'addTask',
  ADD_CHILD_TASK = 'addChildTask',
  EDIT_TASK = 'editTask',
  DELETE_TASK = 'deleteTask',
  TOGGLE_COMPLETION = 'toggleCompletion',
  OPEN_NOTE = 'openNote',
  CUT_TASK = 'cutTask',
  COPY_TASK = 'copyTask',
  PASTE_TASK = 'pasteTask',
  
  // タスク選択
  SELECT_PREV_TASK = 'selectPrevTask',
  SELECT_NEXT_TASK = 'selectNextTask',
  SELECT_PARENT_TASK = 'selectParentTask',
  SELECT_CHILD_TASK = 'selectChildTask',
  
  // タイムライン操作
  NAVIGATE_PREV = 'navigatePrev',
  NAVIGATE_NEXT = 'navigateNext',
  NAVIGATE_TODAY = 'navigateToday',
  ZOOM_IN = 'zoomIn',
  ZOOM_OUT = 'zoomOut',
  RESET_ZOOM = 'resetZoom',
  
  // 表示切替
  TOGGLE_VIEW_MODE_DAY = 'toggleViewModeDay',
  TOGGLE_VIEW_MODE_WEEK = 'toggleViewModeWeek',
  TOGGLE_VIEW_MODE_MONTH = 'toggleViewModeMonth',
  TOGGLE_COMPLETED_TASKS = 'toggleCompletedTasks',
  
  // キャンセル
  CANCEL = 'cancel',
}

/**
 * デフォルトのショートカットキー設定
 */
export const DEFAULT_SHORTCUTS: Record<ShortcutAction, KeyCombination> = {
  // タスク操作
  [ShortcutAction.ADD_TASK]: 'Enter',
  [ShortcutAction.ADD_CHILD_TASK]: 'Tab',
  [ShortcutAction.EDIT_TASK]: 'E',
  [ShortcutAction.DELETE_TASK]: 'Delete',
  [ShortcutAction.TOGGLE_COMPLETION]: 'Space',
  [ShortcutAction.OPEN_NOTE]: 'Ctrl+N',
  [ShortcutAction.CUT_TASK]: 'Ctrl+X',
  [ShortcutAction.COPY_TASK]: 'Ctrl+C',
  [ShortcutAction.PASTE_TASK]: 'Ctrl+V',
  
  // タスク選択
  [ShortcutAction.SELECT_PREV_TASK]: 'ArrowUp',
  [ShortcutAction.SELECT_NEXT_TASK]: 'ArrowDown',
  [ShortcutAction.SELECT_PARENT_TASK]: 'ArrowLeft',
  [ShortcutAction.SELECT_CHILD_TASK]: 'ArrowRight',
  
  // タイムライン操作
  [ShortcutAction.NAVIGATE_PREV]: 'Shift+ArrowLeft',
  [ShortcutAction.NAVIGATE_NEXT]: 'Shift+ArrowRight',
  [ShortcutAction.NAVIGATE_TODAY]: 'Shift+T',
  [ShortcutAction.ZOOM_IN]: '+',
  [ShortcutAction.ZOOM_OUT]: '-',
  [ShortcutAction.RESET_ZOOM]: '0',
  
  // 表示切替
  [ShortcutAction.TOGGLE_VIEW_MODE_DAY]: 'Shift+1',
  [ShortcutAction.TOGGLE_VIEW_MODE_WEEK]: 'Shift+2',
  [ShortcutAction.TOGGLE_VIEW_MODE_MONTH]: 'Shift+3',
  [ShortcutAction.TOGGLE_COMPLETED_TASKS]: 'Shift+C',
  
  // キャンセル
  [ShortcutAction.CANCEL]: 'Escape',
};

/**
 * ショートカットの説明
 */
export const SHORTCUT_DESCRIPTIONS: Record<ShortcutAction, string> = {
  // タスク操作
  [ShortcutAction.ADD_TASK]: 'タスクを追加',
  [ShortcutAction.ADD_CHILD_TASK]: '子タスクを追加',
  [ShortcutAction.EDIT_TASK]: 'タスクを編集',
  [ShortcutAction.DELETE_TASK]: 'タスクを削除',
  [ShortcutAction.TOGGLE_COMPLETION]: 'タスク完了状態の切り替え',
  [ShortcutAction.OPEN_NOTE]: 'タスクノートを開く',
  [ShortcutAction.CUT_TASK]: 'タスクを切り取り',
  [ShortcutAction.COPY_TASK]: 'タスクをコピー',
  [ShortcutAction.PASTE_TASK]: 'タスクを貼り付け',
  
  // タスク選択
  [ShortcutAction.SELECT_PREV_TASK]: '前のタスクを選択',
  [ShortcutAction.SELECT_NEXT_TASK]: '次のタスクを選択',
  [ShortcutAction.SELECT_PARENT_TASK]: '親タスクを選択',
  [ShortcutAction.SELECT_CHILD_TASK]: '子タスクを選択',
  
  // タイムライン操作
  [ShortcutAction.NAVIGATE_PREV]: '前の期間に移動',
  [ShortcutAction.NAVIGATE_NEXT]: '次の期間に移動',
  [ShortcutAction.NAVIGATE_TODAY]: '今日に移動',
  [ShortcutAction.ZOOM_IN]: 'ズームイン',
  [ShortcutAction.ZOOM_OUT]: 'ズームアウト',
  [ShortcutAction.RESET_ZOOM]: 'ズームをリセット',
  
  // 表示切替
  [ShortcutAction.TOGGLE_VIEW_MODE_DAY]: '日表示に切り替え',
  [ShortcutAction.TOGGLE_VIEW_MODE_WEEK]: '週表示に切り替え',
  [ShortcutAction.TOGGLE_VIEW_MODE_MONTH]: '月表示に切り替え',
  [ShortcutAction.TOGGLE_COMPLETED_TASKS]: '完了タスクの表示/非表示を切り替え',
  
  // キャンセル
  [ShortcutAction.CANCEL]: '操作をキャンセル',
};

/**
 * ショートカットキーをカテゴリごとにグループ化
 */
export const SHORTCUT_CATEGORIES = {
  'タスク操作': [
    ShortcutAction.ADD_TASK,
    ShortcutAction.ADD_CHILD_TASK,
    ShortcutAction.EDIT_TASK,
    ShortcutAction.DELETE_TASK,
    ShortcutAction.TOGGLE_COMPLETION,
    ShortcutAction.OPEN_NOTE,
    ShortcutAction.CUT_TASK,
    ShortcutAction.COPY_TASK,
    ShortcutAction.PASTE_TASK,
  ],
  'タスク選択': [
    ShortcutAction.SELECT_PREV_TASK,
    ShortcutAction.SELECT_NEXT_TASK,
    ShortcutAction.SELECT_PARENT_TASK,
    ShortcutAction.SELECT_CHILD_TASK,
  ],
  'タイムライン操作': [
    ShortcutAction.NAVIGATE_PREV,
    ShortcutAction.NAVIGATE_NEXT,
    ShortcutAction.NAVIGATE_TODAY,
    ShortcutAction.ZOOM_IN,
    ShortcutAction.ZOOM_OUT,
    ShortcutAction.RESET_ZOOM,
  ],
  '表示切替': [
    ShortcutAction.TOGGLE_VIEW_MODE_DAY,
    ShortcutAction.TOGGLE_VIEW_MODE_WEEK,
    ShortcutAction.TOGGLE_VIEW_MODE_MONTH,
    ShortcutAction.TOGGLE_COMPLETED_TASKS,
  ],
  'その他': [
    ShortcutAction.CANCEL,
  ],
};

/**
 * アクションからショートカットキーを取得
 */
export const getShortcutForAction = (action: ShortcutAction): KeyCombination => {
  return DEFAULT_SHORTCUTS[action];
};

/**
 * アクションの説明を取得
 */
export const getDescriptionForAction = (action: ShortcutAction): string => {
  return SHORTCUT_DESCRIPTIONS[action];
};