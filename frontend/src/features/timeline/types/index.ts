// システムプロンプト準拠：Timeline型定義統一（ドラッグ機能対応版）
// 🔧 修正内容：ドラッグ関連型の追加、onTaskUpdate型の追加

import { Task, Project, AppViewMode } from '@core/types'

// タイムライン表示単位
export type TimelineViewUnit = 'day' | 'week'

// 子タスク情報を含むタスク型
export interface TaskWithChildren {
  task: Task
  hasChildren: boolean
  childrenCount: number
}

// 子タスクマップ型
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
}

// 🆕 追加：ドラッグ状態の型定義
export interface DragState {
  isDragging: boolean
  dragStartX: number
  dragCurrentX: number
  originalTask: Task | null
  previewStartDate: Date | null
  previewDueDate: Date | null
}

// 🆕 追加：ドラッグイベントハンドラーの型定義
export interface DragHandlers {
  handleDragStart: (event: React.MouseEvent, task: Task) => void
  handleDragMove: (event: MouseEvent) => void
  handleDragEnd: () => void
  handleDragCancel: () => void
}

// 🆕 追加：ドラッグ操作の設定
export interface DragConfiguration {
  threshold: number // ドラッグ開始の閾値（ピクセル）
  snapToGrid: boolean // グリッドへのスナップ機能
  allowPastDates: boolean // 過去日への移動許可
  maxDateChange: number // 最大変更可能日数
}

// 🆕 追加：ドラッグ検証結果
export interface DragValidationResult {
  isValid: boolean
  errorMessage?: string
  warningMessage?: string
}

// TimelineViewProps（onTaskUpdate追加）
export interface TimelineViewProps {
  projects: Project[]
  tasks: Task[]
  onViewModeChange?: (mode: AppViewMode) => void
  onScrollToToday?: (scrollFunction: () => void) => void
  onToggleProject?: (projectId: string) => void
  onToggleTask?: (taskId: string) => void
  onExpandAll?: () => void
  onCollapseAll?: () => void
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void> // 🆕 追加
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

// TimelineRendererProps（onTaskUpdate追加）
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
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void> // 🆕 追加
}

// 🆕 追加：ドラッグ可能なタスクバーのプロパティ
export interface DraggableTaskBarProps {
  taskWithChildren: TaskWithChildren
  project: Project
  startPos: number
  barWidth: number
  barHeight: number
  statusStyle: {
    backgroundColor: string
    borderColor: string
    textColor: string
  }
  dimensions: DynamicSizes
  zoomLevel: number
  theme: 'light' | 'dark'
  onTaskClick?: (taskId: string) => void
  onDragStart: (event: React.MouseEvent, task: Task) => void
  isDragging: boolean
  isPreview?: boolean
  previewStartDate?: Date | null
  previewDueDate?: Date | null
}

// 🆕 追加：ドラッグ操作用のユーティリティ関数の型
export interface DragCalculationUtils {
  calculateDateFromPosition: (
    mouseX: number,
    timelineStartDate: Date,
    cellWidth: number,
    viewUnit: TimelineViewUnit,
    scrollLeft?: number
  ) => Date
  
  calculatePositionFromDate: (
    date: Date,
    timelineStartDate: Date,
    cellWidth: number,
    viewUnit: TimelineViewUnit
  ) => number
  
  snapDateToGrid: (
    date: Date,
    viewUnit: TimelineViewUnit
  ) => Date
  
  validateDateChange: (
    originalStartDate: Date,
    originalDueDate: Date,
    newStartDate: Date,
    newDueDate: Date
  ) => DragValidationResult
}

// 🆕 追加：useTaskDragフックの戻り値型
export interface UseTaskDragReturn {
  dragState: DragState
  handleDragStart: (event: React.MouseEvent, task: Task) => void
  handleDragMove: (event: MouseEvent) => void
  handleDragEnd: () => void
  handleDragCancel: () => void
  isDragging: boolean
}

// 🆕 追加：useTaskDragフックのプロパティ型
export interface UseTaskDragProps {
  timelineStartDate: Date
  cellWidth: number
  viewUnit: TimelineViewUnit
  scrollLeft: number
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>
  dragConfiguration?: Partial<DragConfiguration>
}