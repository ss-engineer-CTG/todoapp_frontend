export const TIMELINE_CONFIG = {
    ZOOM: {
      MIN: 10,
      MAX: 200,
      DEFAULT: 100,
      STEP: 10,
    },
    CELL_WIDTH: {
      DAY: 30,
      WEEK: 20,
      MONTH: 15,
    },
    ROW_HEIGHT: {
      PROJECT: 32,
      TASK: 48,
      SUBTASK: 40,
      MILESTONE: 24,
    },
    TASK_BAR_HEIGHT: 32,
    MIN_TASK_WIDTH: 20,
    SCROLL_SENSITIVITY: 1.2,
    ANIMATION_DURATION: 200,
  } as const
  
  export const TIME_UNITS = [
    { key: 'day', label: '日表示', description: '1年間 詳細表示' },
    { key: 'week', label: '週表示', description: '1年間 中期計画' },
    { key: 'month', label: '月表示', description: '3年間 長期計画' },
  ] as const
  
  export const DATE_RANGE_RATIOS = {
    DAY: { before: 0.3, after: 0.7, totalDays: 365 },
    WEEK: { before: 0.3, after: 0.7, totalDays: 365 },
    MONTH: { before: 0.2, after: 0.8, totalDays: 1095 }, // 3年
  } as const
  
  export const TIMELINE_DISPLAY_LEVELS = {
    MINIMAL: 30, // アイコンのみ
    COMPACT: 50, // 略称表示
    REDUCED: 80, // 短縮名
    FULL: 100,   // フル表示
  } as const
  
  export const GRID_STYLES = {
    MAJOR_GRID_COLOR: '#3b82f6', // 月境界
    MINOR_GRID_COLOR: '#9ca3af', // 週境界
    GRID_OPACITY: 0.4,
    WEEKEND_COLOR: '#f3f4f6',
    HOLIDAY_COLOR: '#fee2e2',
    TODAY_COLOR: '#ef4444',
  } as const
  
  export const TASK_BAR_STYLES = {
    BORDER_RADIUS: 6,
    SHADOW: '0 2px 4px rgba(0, 0, 0, 0.1)',
    HOVER_SHADOW: '0 4px 8px rgba(0, 0, 0, 0.15)',
    MILESTONE_DIAMOND_SIZE: 12,
    CONNECTION_LINE_WIDTH: 2,
    CONNECTION_LINE_COLOR: '#9ca3af',
  } as const
  
  export const TIMELINE_HOLIDAYS_2025 = [
    { date: '2025-01-01', name: '元日' },
    { date: '2025-01-13', name: '成人の日' },
    { date: '2025-02-11', name: '建国記念の日' },
    { date: '2025-02-23', name: '天皇誕生日' },
    { date: '2025-03-20', name: '春分の日' },
    { date: '2025-04-29', name: '昭和の日' },
    { date: '2025-05-03', name: '憲法記念日' },
    { date: '2025-05-04', name: 'みどりの日' },
    { date: '2025-05-05', name: 'こどもの日' },
    { date: '2025-07-21', name: '海の日' },
    { date: '2025-08-11', name: '山の日' },
    { date: '2025-09-15', name: '敬老の日' },
    { date: '2025-09-23', name: '秋分の日' },
    { date: '2025-10-13', name: 'スポーツの日' },
    { date: '2025-11-03', name: '文化の日' },
    { date: '2025-11-23', name: '勤労感謝の日' },
  ] as const
  
  export const PERFORMANCE_CONFIG = {
    VIRTUAL_SCROLLING_THRESHOLD: 100, // 100行以上で仮想スクロール有効
    DEBOUNCE_SCROLL_MS: 16, // 60FPS相当
    THROTTLE_RESIZE_MS: 100,
    MAX_VISIBLE_TASKS: 1000,
    CACHE_SIZE: 50,
  } as const