/**
 * タイムライン関連の設定定数
 */

/**
 * 表示モードごとの1日あたりの幅（ピクセル）
 */
export const DAY_WIDTH = {
    day: 50,   // 日モード（詳細表示）
    week: 30,  // 週モード（標準表示）
    month: 20, // 月モード（概要表示）
  };
  
  /**
   * 表示モードごとの表示日数
   */
  export const VISIBLE_DAYS = {
    day: 7,    // 日モード（1週間分）
    week: 14,  // 週モード（2週間分）
    month: 31, // 月モード（約1ヶ月分）
  };
  
  /**
   * タイムラインの行の高さ（ピクセル）
   */
  export const ROW_HEIGHT = 40;
  
  /**
   * タスクバーの高さ（ピクセル）
   */
  export const TASK_BAR_HEIGHT = 36;
  
  /**
   * タスク名表示エリアの幅（ピクセル）
   */
  export const LABEL_WIDTH = 200;
  
  /**
   * ズームレベルの範囲
   */
  export const ZOOM_LEVEL = {
    min: 50,   // 最小ズーム（50%）
    max: 200,  // 最大ズーム（200%）
    default: 100, // デフォルトズーム（100%）
    step: 10,   // ズーム変更のステップ幅
  };
  
  /**
   * モードごとのスナップ設定
   */
  export const SNAP_SETTINGS = {
    // 日モード
    day: {
      enabled: true,
      interval: 1, // 1日単位でスナップ
    },
    // 週モード
    week: {
      enabled: true,
      interval: 1, // 1日単位でスナップ
    },
    // 月モード
    month: {
      enabled: true,
      interval: 1, // 1日単位でスナップ
    },
  };
  
  /**
   * タイムラインの表示範囲の制約
   */
  export const TIMELINE_CONSTRAINTS = {
    minVisibleDays: 3,  // 最小表示日数
    maxVisibleDays: 90, // 最大表示日数
  };
  
  /**
   * タイムライン上の特殊表示設定
   */
  export const TIMELINE_DISPLAY = {
    todayIndicator: {
      enabled: true,
      color: '#EF4444', // 赤色
      width: 1, // 線の太さ（ピクセル）
    },
    weekendHighlight: {
      enabled: true,
      color: '#F3F4F6', // 薄いグレー
    },
    headerSticky: {
      enabled: true,
      zIndex: 10,
    },
  };
  
  /**
   * タスクバーのドラッグ設定
   */
  export const DRAG_SETTINGS = {
    minTaskDuration: 1, // 最小タスク期間（日）
    dragThreshold: 5,   // ドラッグ開始の閾値（ピクセル）
    opacity: 0.7,       // ドラッグ中の透明度
  };
  
  /**
   * デフォルトのタイムライン設定
   */
  export const DEFAULT_TIMELINE_SETTINGS = {
    viewMode: 'week' as const,
    zoomLevel: ZOOM_LEVEL.default,
    showCompletedTasks: true,
    showDependencies: false,
    groupBy: null as null,
    highlightToday: true,
    highlightWeekends: true,
  };
  
  /**
   * タイムラインのスクロール設定
   */
  export const SCROLL_SETTINGS = {
    smooth: true,        // スムーススクロール
    behavior: 'smooth' as const, // スクロール動作
    scrollMargin: 50,    // スクロールのマージン（ピクセル）
  };
  
  /**
   * タイムラインの見た目設定
   */
  export const APPEARANCE = {
    gridLines: {
      color: '#E2E8F0', // 薄いグレー
      width: 1,         // 線の太さ（ピクセル）
    },
    headerHeight: {
      month: 32,        // 月ヘッダーの高さ（ピクセル）
      day: 40,          // 日ヘッダーの高さ（ピクセル）
    },
    taskBar: {
      borderRadius: 4,   // 角丸の半径（ピクセル）
      shadowOpacity: 0.1, // 影の透明度
    },
  };