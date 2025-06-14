// システムプロンプト準拠: 共通型定義（Timeline対応調整版）
// 🔧 修正内容：Timeline関連型定義を追加、既存型は保持

// UI関連型（既存維持 + Timeline追加）
export type AreaType = "projects" | "tasks" | "details" | "timeline"
export type BatchOperation = 'complete' | 'incomplete' | 'delete' | 'copy'
export type AppViewMode = 'tasklist' | 'timeline'

// 🆕 Timeline専用型
export type TimelineViewUnit = 'day' | 'week'
export type TimelineDisplayLevel = 'minimal' | 'compact' | 'reduced' | 'full'

// タスクステータス型（Timeline対応拡張）
export type TaskStatus = 'completed' | 'in-progress' | 'not-started' | 'overdue'

// 基本エンティティ型（既存維持）
export interface Project {
  id: string
  name: string
  color: string
  collapsed: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface Task {
  id: string
  name: string
  projectId: string
  parentId: string | null
  completed: boolean
  startDate: Date
  dueDate: Date
  completionDate: Date | null
  notes: string
  assignee: string
  level: number
  collapsed: boolean
  createdAt?: Date
  updatedAt?: Date
  _isDraft?: boolean
}

// 設定・定数型（既存維持）
export interface ProjectColor {
  name: string
  value: string
}

export interface KeyboardShortcut {
  key: string
  description: string
}

// フォーカス管理型（既存維持）
export interface FocusManagement {
  activeArea: AreaType
  lastFocusedTaskId: string | null
  shouldMaintainTaskFocus: boolean
  detailPanelAutoShow: boolean
  preventNextFocusChange: boolean
}

// タスク編集状態管理型（既存維持）
export interface TaskEditingState {
  name: string
  startDate: Date | null
  dueDate: Date | null
  assignee: string
  notes: string
  hasChanges: boolean
  isStartDateCalendarOpen: boolean
  isDueDateCalendarOpen: boolean
  focusTransitionMode: 'navigation' | 'calendar-selection'
  canSave: boolean
}

// 選択状態管理型（既存維持）
export interface SelectionState {
  selectedId: string | null
  selectedIds: string[]
  isMultiSelectMode: boolean
}

// 🆕 Timeline関連型定義（新規追加）

/**
 * Timeline動的サイズ計算結果
 */
export interface TimelineDynamicSizes {
  cellWidth: number
  rowHeight: { project: number; task: number; subtask: number }
  fontSize: { base: number; small: number; large: number; week: number }
  taskBarHeight: number
  zoomRatio: number
}

/**
 * Timeline時間範囲設定
 */
export interface TimelineRange {
  startDate: Date
  endDate: Date
  rawStartDate: Date
  rawEndDate: Date
  unit: TimelineViewUnit
  label: string
}

/**
 * Timeline状態管理
 */
export interface TimelineState {
  zoomLevel: number
  viewUnit: TimelineViewUnit
  scrollLeft: number
  theme: 'light' | 'dark'
}

/**
 * Timeline階層表示情報
 */
export interface TimelineHierarchyInfo {
  taskId: string
  level: number
  hasChildren: boolean
  isVisible: boolean
  indentLeft: number
  connectionInfo?: {
    showVerticalLine: boolean
    showHorizontalLine: boolean
    parentLeft: number
    lineColor: string
  }
}

/**
 * Timeline表示密度制御
 */
export interface TimelineVisibilityControls {
  showConnectionLines: boolean
  showHierarchyBadges: boolean
  showSubtaskLabels: boolean
  maxVisibleLevel: number
  compactMode: boolean
}

/**
 * Timeline最適化分析結果
 */
export interface TimelineOptimizationAnalysis {
  shouldUseVirtualization: boolean
  recommendedZoomLevel: number
  maxSafeHierarchyLevel: number
  performanceWarnings: string[]
}

/**
 * Timeline階層統計情報
 */
export interface TimelineHierarchyStats {
  totalTasks: number
  maxLevel: number
  levelCounts: { [level: number]: number }
  hasComplexHierarchy: boolean
}

// 🆕 Timeline日付関連型
export type TimelineDateType = 'weekday' | 'saturday' | 'sunday' | 'holiday'

export interface TimelineHoliday {
  date: Date
  name: string
  type: 'national' | 'substitute'
}

/**
 * Timeline接続線座標
 */
export interface TimelineConnectionCoordinates {
  vertical: {
    left: number
    top: number
    width: number
    height: number
  }
  horizontal: {
    left: number
    top: number
    width: number
    height: number
  }
}

/**
 * Timeline階層バッジ情報
 */
export interface TimelineHierarchyBadge {
  directChildren: number
  totalDescendants: number
}

// 🆕 Timeline拡張プロパティ（Task/Project拡張用）
export interface TimelineTaskExtension {
  status?: TaskStatus
  milestone?: boolean
  process?: string
  line?: string
}

export interface TimelineProjectExtension {
  process: string
  line: string
}

// 🆕 イベントハンドラー型
export type TimelineTaskToggleHandler = (taskId: string) => void
export type TimelineProjectToggleHandler = (projectId: string) => void
export type TimelineZoomChangeHandler = (zoomLevel: number) => void
export type TimelineViewUnitChangeHandler = (unit: TimelineViewUnit) => void
export type TimelineScrollHandler = () => void

// 🆕 Timeline設定型
export interface TimelineConfig {
  zoom: {
    min: number
    max: number
    default: number
    step: number
  }
  viewUnits: readonly TimelineViewUnit[]
  defaultViewUnit: TimelineViewUnit
  layout: {
    headerHeight: number
    sidebarWidth: number
    rowHeight: {
      project: number
      task: number
      subtask: number
    }
  }
  performance: {
    virtualizationThreshold: number
    maxHierarchyLevel: number
    warningTaskCount: number
  }
}

// 🆕 Timeline描画情報
export interface TimelineRenderInfo {
  visibleDates: Date[]
  totalWidth: number
  totalHeight: number
  scrollPosition: number
  visibleTaskCount: number
  renderStartIndex: number
  renderEndIndex: number
}

/**
 * Timeline色彩管理
 */
export interface TimelineColorScheme {
  theme: 'light' | 'dark'
  project: {
    background: string
    border: string
    text: string
  }
  task: {
    completed: string
    inProgress: string
    notStarted: string
    overdue: string
  }
  hierarchy: {
    connectionLine: string[]
    background: string[]
  }
  grid: {
    background: string
    border: string
    holiday: string
    today: string
  }
}