import { statusConstants } from '../constants/statusConstants';
import { colorConstants } from '../constants/colorConstants';
import { appConstants } from '../constants/appConstants';

/**
 * アプリケーションのデフォルト設定
 */
export const defaultSettings = {
  // タイムライン設定
  timeline: {
    scale: 'day' as 'day' | 'week' | 'month',
    zoomLevel: 100,
    showWeekends: true,
    showToday: true,
    showCompletedTasks: true,
    taskBarHeight: 32,
    projectGrouping: true,
    autoScroll: true
  },
  
  // タスク表示設定
  taskDisplay: {
    density: statusConstants.DENSITY.STANDARD,
    showTaskDuration: true,
    showSubtaskCount: true,
    showPriority: true,
    showStatus: true,
    dateFormat: 'M/D'
  },
  
  // テーマ設定
  theme: {
    mode: 'system' as 'light' | 'dark' | 'system',
    primaryColor: colorConstants.THEME_COLORS_LIGHT.primary,
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    roundedCorners: 'medium' as 'none' | 'small' | 'medium' | 'large'
  },
  
  // キーボードショートカット設定（デフォルト値）
  keyboardShortcuts: {
    enabled: true,
    customShortcuts: {} // カスタムショートカットのオーバーライド
  },
  
  // 表示設定
  display: {
    sidebarWidth: 250,
    compactMode: false,
    showCompletedTasksInTimeline: true,
    tooltips: true,
    animations: true,
    animationSpeed: 'normal' as 'fast' | 'normal' | 'slow'
  },
  
  // 通知設定
  notifications: {
    enabled: true,
    taskDueReminders: true,
    reminderTiming: 24, // 時間単位（タスク期限の何時間前に通知するか）
    soundEnabled: false
  },
  
  // エクスポート設定
  export: {
    defaultFormat: 'CSV' as 'JSON' | 'CSV' | 'MARKDOWN' | 'HTML',
    includeCompletedTasks: true,
    includeNotes: true
  },
  
  // 自動保存設定
  autoSave: {
    enabled: true,
    interval: 60 // 秒単位
  },
  
  // ドラッグ＆ドロップ設定
  dragAndDrop: {
    enabled: true,
    snapToGrid: true,
    showGuidelines: true
  },
  
  // 日付設定
  date: {
    firstDayOfWeek: 0, // 0: 日曜日, 1: 月曜日
    highlightWeekends: true,
    highlightHolidays: true,
    workDays: [1, 2, 3, 4, 5], // 1: 月曜日～5: 金曜日
    workHours: {
      start: 9,
      end: 18
    }
  },
  
  // 機能オプション
  features: {
    subtasks: true,
    taskTemplates: true,
    taskNotes: true,
    projectTemplates: true,
    taskAttachments: false, // 初期状態では無効
    multipleAssignees: false, // 初期状態では無効
    taskPriorities: true,
    repeatingTasks: true
  },
  
  // 表示フィルター（初期状態）
  defaultFilter: {
    viewMode: appConstants.FILTER_MODES.ALL,
    showCompletedTasks: true,
    activeProjects: [], // 空配列は全プロジェクトを表示
    activeStatuses: Object.values(statusConstants.TASK_STATUS)
  }
};

// 設定を取得するユーティリティ関数
export const getSetting = <T>(
  path: string, 
  userSettings: Record<string, any> = {}
): T => {
  // dot notationパスを使って設定を取得
  const parts = path.split('.');
  let value: any = userSettings;
  let defaultValue: any = defaultSettings;
  
  for (const part of parts) {
    // カスタム設定を探す
    value = value && value[part] !== undefined ? value[part] : undefined;
    
    // デフォルト値を探す
    defaultValue = defaultValue && defaultValue[part] !== undefined ? defaultValue[part] : undefined;
  }
  
  // カスタム設定があればそれを、なければデフォルト値を返す
  return value !== undefined ? value : defaultValue;
};