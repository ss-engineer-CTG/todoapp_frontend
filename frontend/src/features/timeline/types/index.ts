// システムプロンプト準拠：Timeline型定義統一（Task準拠・軽量化版）
// 修正内容：ネスト構造削除、Tasklist準拠の平坦構造 + TaskRelationMap方式に統一
// DRY原則：Task/Project基本構造の再利用、重複削除

import { Task, Project, TaskStatus } from '@core/types'
import { TaskRelationMap } from '@tasklist/types'

// ビューモード型（既存維持）
export type AppViewMode = 'tasklist' | 'timeline'

// タイムライン表示単位（既存維持）
export type TimelineViewUnit = 'day' | 'week'

// タイムライン表示レベル（既存維持）
export type TimelineDisplayLevel = 'minimal' | 'compact' | 'reduced' | 'full'

// 動的サイズ設定（既存維持）
export interface DynamicSizes {
  cellWidth: number
  rowHeight: { project: number; task: number; subtask: number }
  fontSize: { base: number; small: number; large: number; week: number }
  taskBarHeight: number
  zoomRatio: number
}

// 時間範囲設定（既存維持）
export interface TimeRange {
  startDate: Date
  endDate: Date
  rawStartDate: Date
  rawEndDate: Date
  unit: TimelineViewUnit
  label: string
}

// タイムライン状態（既存維持）
export interface TimelineState {
  zoomLevel: number
  viewUnit: TimelineViewUnit
  scrollLeft: number
  theme: 'light' | 'dark'
}

// 🔧 修正：Timeline拡張タスク（ネスト構造削除、Task準拠）
export interface TimelineTask extends Task {
  // ❌ 削除：subtasks?: TimelineTask[] - ネスト構造廃止
  // ❌ 削除：expanded?: boolean - TaskRelationMapで管理
  
  // ✅ 既存のTask構造をそのまま継承
  // parentId, level, collapsed等はTaskから継承
  
  // Timeline表示用の最小限プロパティのみ追加
  status?: TaskStatus    // 表示用詳細ステータス
  milestone?: boolean    // マイルストーン表示フラグ
  process?: string      // プロセス名（任意）
  line?: string         // ライン名（任意）
}

// 🔧 修正：Timeline拡張プロジェクト（シンプル化）
export interface TimelineProject extends Project {
  // ❌ 削除：tasks: TimelineTask[] - ネスト構造廃止
  
  // ✅ 既存のProject構造をそのまま継承
  // collapsed等はProjectから継承
  
  // Timeline表示用の最小限プロパティのみ追加  
  process: string       // プロセス名（表示用）
  line: string         // ライン名（表示用）
}

// 🆕 新規：Timeline統合データ構造（Tasklist準拠）
export interface TimelineData {
  projects: TimelineProject[]        // プロジェクト配列
  allTasks: TimelineTask[]          // 全タスクの平坦配列
  taskRelationMap: TaskRelationMap  // 階層管理（Tasklist統一）
  filteredTasks: TimelineTask[]     // 表示用フィルタ済みタスク
}

// 🆕 新規：階層表示制御情報
export interface HierarchyDisplayInfo {
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

// コンポーネントProps型（修正）

// TimelineViewProps（onScrollToToday追加済み、データ構造修正）
export interface TimelineViewProps {
  // 🔧 修正：平坦構造データを受け取り
  projects: TimelineProject[]
  allTasks: TimelineTask[]
  onProjectsUpdate: (projects: TimelineProject[]) => void
  onTasksUpdate: (tasks: TimelineTask[]) => void
  
  // 既存機能
  onViewModeChange?: (mode: AppViewMode) => void
  onScrollToToday?: (scrollFunction: () => void) => void
}

// TimelineControlsProps（既存維持）
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

// 🆕 新規：階層表示コンポーネント用Props
export interface TimelineTaskRowProps {
  task: TimelineTask
  project: TimelineProject
  hierarchyInfo: HierarchyDisplayInfo
  dimensions: DynamicSizes
  timeRange: TimeRange
  state: TimelineState
  onToggleTask: (taskId: string) => void
  taskRelationMap: TaskRelationMap // 追加
}

export interface TimelineHierarchyProps {
  tasks: TimelineTask[]
  taskRelationMap: TaskRelationMap
  dimensions: DynamicSizes
  timeRange: TimeRange
  state: TimelineState
}

export interface TimelineTaskRendererProps {
  project: TimelineProject
  tasks: TimelineTask[]
  taskRelationMap: TaskRelationMap
  dimensions: DynamicSizes
  timeRange: TimeRange
  state: TimelineState
  onToggleTask: (taskId: string) => void
}