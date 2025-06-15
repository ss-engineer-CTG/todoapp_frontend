// システムプロンプト準拠：Timeline型定義統一（TaskWithChildren型追加版）
// 🔧 修正内容：TaskWithChildren型の追加、型定義の明確化

import { Task, Project, AppViewMode } from '@core/types'

// タイムライン表示単位
export type TimelineViewUnit = 'day' | 'week'

// 🔧 新規追加：子タスク情報を含むタスク型
export interface TaskWithChildren {
  task: Task
  hasChildren: boolean
  childrenCount: number
}

// 🔧 新規追加：子タスクマップ型
export interface TaskChildrenMap {
  [taskId: string]: {
    hasChildren: boolean
    childrenCount: number
  }
}

// 動的サイズ設定
export interface DynamicSizes {
  cellWidth: number
  rowHeight: { project: number; task: number; subtask: number }
  fontSize: { base: number; small: number; large: number }
  taskBarHeight: number
  zoomRatio: number
}

// 時間範囲設定
export interface TimeRange {
  startDate: Date
  endDate: Date
  rawStartDate: Date
  rawEndDate: Date
  unit: TimelineViewUnit
  label: string
}

// タイムライン状態
export interface TimelineState {
  zoomLevel: number
  viewUnit: TimelineViewUnit
  scrollLeft: number
  theme: 'light' | 'dark'
}

// TimelineViewProps
export interface TimelineViewProps {
  projects: Project[]
  tasks: Task[]
  onViewModeChange?: (mode: AppViewMode) => void
  onScrollToToday?: (scrollFunction: () => void) => void
  onToggleProject?: (projectId: string) => void
  onToggleTask?: (taskId: string) => void
  onExpandAll?: () => void
  onCollapseAll?: () => void
}

// TimelineControlsProps
export interface TimelineControlsProps {
  zoomLevel: number
  onZoomChange: (level: number) => void
  viewUnit: TimelineViewUnit
  onViewUnitChange: (unit: TimelineViewUnit) => void
  onTodayClick: () => void
  onFitToScreen: () => void
  onExpandAll: () => void
  onCollapseAll: () => void
  onViewModeChange?: (mode: AppViewMode) => void
}

// TimelineRendererProps
export interface TimelineRendererProps {
  projects: Project[]
  tasks: Task[]
  taskRelationMap: any
  zoomLevel: number
  viewUnit: TimelineViewUnit
  theme: 'light' | 'dark'
  timeRange: TimeRange
  visibleDates: Date[]
  scrollLeft: number
  onToggleProject?: (projectId: string) => void
  onToggleTask?: (taskId: string) => void
}