// システムプロンプト準拠：Timeline型定義統一（リサイズ機能対応版）
// 🔧 修正内容：DragMode型の追加、既存型は完全保持

import { Task, Project, AppViewMode } from '@core/types'

// タイムライン表示単位
export type TimelineViewUnit = 'day' | 'week'

// 🆕 追加：ドラッグモード識別用型（最小限）
export type DragMode = 'move' | 'resize-start' | 'resize-end'

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

// 🔧 修正：既存のドラッグ状態にモード情報追加
export interface DragState {
  isDragging: boolean
  dragMode: DragMode  // 🆕 追加：この1行のみ
  dragStartX: number
  dragCurrentX: number
  originalTask: Task | null
  previewStartDate: Date | null
  previewDueDate: Date | null
}

// ドラッグイベントハンドラーの型定義
export interface DragHandlers {
  handleDragStart: (event: React.MouseEvent, task: Task, mode: DragMode) => void
  handleDragMove: (event: MouseEvent) => void
  handleDragEnd: () => void
  handleDragCancel: () => void
}

// 🆕 追加：リサイズ検証結果
export interface ResizeValidationResult {
  isValid: boolean
  errorMessage?: string
  warningMessage?: string
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
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>
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
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>
}

// 🔧 修正：ドラッグ可能なタスクバーのプロパティにモード対応追加
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
  onDragStart: (event: React.MouseEvent, task: Task, mode: DragMode) => void // 🔧 修正：mode追加
  isDragging: boolean
  isPreview?: boolean
  previewStartDate?: Date | null
  previewDueDate?: Date | null
}

// 🆕 追加：リサイズ操作用のユーティリティ関数の型
export interface ResizeCalculationUtils {
  calculateStartDateResize: (
    originalTask: Task,
    deltaX: number,
    cellWidth: number,
    viewUnit: TimelineViewUnit
  ) => { startDate: Date; dueDate: Date }
  
  calculateEndDateResize: (
    originalTask: Task,
    deltaX: number,
    cellWidth: number,
    viewUnit: TimelineViewUnit
  ) => { startDate: Date; dueDate: Date }
  
  validateResize: (
    originalStartDate: Date,
    originalDueDate: Date,
    newStartDate: Date,
    newDueDate: Date
  ) => ResizeValidationResult
}

// useTaskDragフックの戻り値型
export interface UseTaskDragReturn {
  dragState: DragState
  handleDragStart: (event: React.MouseEvent, task: Task, mode: DragMode) => void
  handleDragMove: (event: MouseEvent) => void
  handleDragEnd: () => void
  handleDragCancel: () => void
  isDragging: boolean
}

// useTaskDragフックのプロパティ型
export interface UseTaskDragProps {
  cellWidth: number
  viewUnit: TimelineViewUnit
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>
}