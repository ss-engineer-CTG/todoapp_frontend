/**
 * タイムラインビュー表示モード
 * - day: 日単位表示（詳細）
 * - week: 週単位表示（標準）
 * - month: 月単位表示（概要）
 */
export type TimelineViewMode = 'day' | 'week' | 'month';

/**
 * タイムラインビュー設定データモデル
 */
export interface TimelineViewSettings {
  viewMode: TimelineViewMode;     // 表示モード
  zoomLevel: number;              // ズームレベル (50-200%)
  showCompletedTasks: boolean;    // 完了タスク表示フラグ
  showDependencies?: boolean;     // 依存関係線表示フラグ
  groupBy?: 'assignee' | 'priority' | 'tags' | null; // グループ化基準
  highlightToday?: boolean;       // 今日強調表示フラグ
  highlightWeekends?: boolean;    // 週末強調表示フラグ
}

/**
 * ドラッグ開始イベント引数
 */
export interface DragStartArgs {
  taskId: string;                 // ドラッグ対象タスクID
  type: 'start' | 'end' | 'move'; // ドラッグタイプ
  initialX: number;               // 初期X座標
  initialY: number;               // 初期Y座標
}

/**
 * ドラッグ終了イベント引数
 */
export interface DragEndArgs {
  taskId: string;                 // ドラッグ対象タスクID
  newStartDate?: Date;            // 新しい開始日
  newEndDate?: Date;              // 新しい終了日
}

/**
 * 月ラベル情報
 */
export interface MonthLabel {
  date: Date;                     // 月の開始日
  startIndex: number;             // 開始インデックス
  endIndex: number;               // 終了インデックス
  width: number;                  // 表示幅
}