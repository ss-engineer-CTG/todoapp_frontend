// システムプロンプト準拠：タイムライン専用設定の一元管理
// KISS原則：シンプルな設定構造、DRY原則：設定値の一元化

// タイムライン基本設定
export const TIMELINE_CONFIG = {
  // レイアウト設定
  LAYOUT: {
    HEADER_HEIGHT: 120,                    // ヘッダー固定高さ（px）
    SIDEBAR_WIDTH: 300,                    // サイドバー幅（px）
    MIN_CELL_WIDTH: 20,                    // 最小セル幅（px）
    MAX_CELL_WIDTH: 100,                   // 最大セル幅（px）
    ROW_HEIGHT: {
      PROJECT: 48,                         // プロジェクト行高さ（px）
      TASK: 40,                           // タスク行高さ（px）
      SUBTASK: 32                         // サブタスク行高さ（px）
    }
  },

  // ズーム設定
  ZOOM: {
    MIN: 10,                              // 最小ズーム（%）
    MAX: 200,                             // 最大ズーム（%）
    DEFAULT: 100,                         // デフォルトズーム（%）
    STEP: 10                              // ズームステップ（%）
  },

  // スクロール設定
  SCROLL: {
    SYNC_THRESHOLD: 1,                    // 同期判定閾値（px）
    DEBOUNCE_MS: 16,                      // デバウンス時間（ms）
    SMOOTH_BEHAVIOR: 'smooth' as const    // スクロール動作
  },

  // 表示設定
  DISPLAY: {
    DATE_RANGE_DAYS: 365,                 // 表示日数
    TIME_UNITS: ['day', 'week'] as const, // 時間単位
    DEFAULT_UNIT: 'week' as const,        // デフォルト時間単位
    DISPLAY_LEVELS: {
      MINIMAL: 30,                        // 最小表示レベル（%）
      COMPACT: 50,                        // コンパクト表示レベル（%）
      REDUCED: 80                         // 縮小表示レベル（%）
    }
  },

  // CSS クラス名（パス管理）
  CSS_CLASSES: {
    CONTAINER: 'timeline-container',
    HEADER: 'timeline-header',
    GRID: 'timeline-grid',
    CELL: 'timeline-cell',
    SCROLLABLE: 'timeline-scrollable'
  },

  // DOM要素ID（パス管理）
  ELEMENT_IDS: {
    MAIN_CONTAINER: 'timeline-main-container',
    HEADER_CONTAINER: 'timeline-header-container',
    GRID_CONTAINER: 'timeline-grid-container',
    DATE_HEADER: 'timeline-date-header',
    CONTENT_AREA: 'timeline-content-area'
  }
} as const

// タイムライン表示レベル型
export type TimelineDisplayLevel = 'minimal' | 'compact' | 'reduced' | 'full'

// タイムライン時間単位型
export type TimelineUnit = typeof TIMELINE_CONFIG.DISPLAY.TIME_UNITS[number]

// ズーム関連ユーティリティ
export const getDisplayLevel = (zoomLevel: number): TimelineDisplayLevel => {
  const levels = TIMELINE_CONFIG.DISPLAY.DISPLAY_LEVELS
  if (zoomLevel <= levels.MINIMAL) return 'minimal'
  if (zoomLevel <= levels.COMPACT) return 'compact'
  if (zoomLevel <= levels.REDUCED) return 'reduced'
  return 'full'
}

// セル幅計算ユーティリティ
export const calculateCellWidth = (zoomLevel: number, baseWidth: number): number => {
  const ratio = zoomLevel / 100
  const calculated = baseWidth * ratio
  return Math.max(
    TIMELINE_CONFIG.LAYOUT.MIN_CELL_WIDTH,
    Math.min(TIMELINE_CONFIG.LAYOUT.MAX_CELL_WIDTH, calculated)
  )
}

// レスポンシブブレークポイント
export const RESPONSIVE_BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200
} as const
