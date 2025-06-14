// システムプロンプト準拠：タイムライン機能専用型定義（軽量化版）

import { Task, Project, TaskStatus } from '@core/types'

// タイムライン表示単位
export type TimelineViewUnit = 'day' | 'week'

// タイムライン表示レベル  
export type TimelineDisplayLevel = 'minimal' | 'compact' | 'reduced' | 'full'

// 動的サイズ設定
export interface DynamicSizes {
  cellWidth: number
  rowHeight: { project: number; task: number; subtask: number }
  fontSize: { base: number; small: number; large: number; week: number }
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

// タイムライン拡張タスク
export interface TimelineTask extends Task {
  subtasks?: TimelineTask[]
  expanded?: boolean
  milestone?: boolean
  process?: string
  line?: string
  status?: TaskStatus
}

// タイムライン拡張プロジェクト
export interface TimelineProject extends Project {
  expanded: boolean
  process: string
  line: string
  tasks: TimelineTask[]
}

// コンポーネントProps型
export interface TimelineViewProps {
  projects: TimelineProject[]
  onProjectsUpdate: (projects: TimelineProject[]) => void
}

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
}