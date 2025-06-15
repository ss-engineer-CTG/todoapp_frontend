// システムプロンプト準拠：Timeline型定義統一（折りたたみ機能対応版）
// 🔧 修正内容：折りたたみ関数4つの型定義追加

import { Task, Project, AppViewMode } from '@core/types'

// タイムライン表示単位
export type TimelineViewUnit = 'day' | 'week'

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

// 🔧 修正：TimelineViewProps - 折りたたみ関数4つを追加
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

// 🔧 修正：TimelineControlsProps - 折りたたみ関数4つを追加
export interface TimelineControlsProps {
  zoomLevel: number
  onZoomChange: (level: number) => void
  viewUnit: TimelineViewUnit
  onViewUnitChange: (unit: TimelineViewUnit) => void
  theme: 'light' | 'dark'
  onThemeToggle: () => void
  onTodayClick: () => void
  onFitToScreen: () => void
  onExpandAll: () => void
  onCollapseAll: () => void
  onViewModeChange?: (mode: AppViewMode) => void
}

// 🆕 新規追加：TimelineRendererProps - 折りたたみ関数2つを追加
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