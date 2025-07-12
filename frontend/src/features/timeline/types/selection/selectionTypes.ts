// システムプロンプト準拠：選択機能型定義統合（リファクタリング：型責任分離）
// リファクタリング対象：useRowSelection.ts から型定義を抽出

import { Task } from '@core/types'

// 選択モード
export type RowSelectionMode = 'single' | 'multiple' | 'range' | 'drag'

// ドラッグ選択状態
export interface DragSelectionState {
  isDragging: boolean
  startY: number
  currentY: number
  startTaskId: string | null
  previewTaskIds: Set<string>
}

// 選択状態
export interface RowSelectionState {
  selectedTaskIds: Set<string>
  lastSelectedTaskId: string | null
  selectionMode: RowSelectionMode
  isSelecting: boolean
  dragSelection: DragSelectionState
}

// タスク位置情報
export interface TaskPosition {
  top: number
  left: number
  width: number
  height: number
}

// ドラッグ判定用設定
export interface DragThresholdConfig {
  DRAG_THRESHOLD: number // ピクセル（ドラッグ検出の感度）
  DRAG_END_CLEAR_DELAY: number // ms（ドラッグ終了後のクリア防止時間）
}

// 基本選択フック戻り値
export interface UseSelectionReturn {
  // 状態
  selectedTaskIds: Set<string>
  selectedCount: number
  isSelecting: boolean
  lastSelectedTaskId: string | null
  
  // 選択操作
  selectTask: (taskId: string, mode?: RowSelectionMode) => void
  deselectTask: (taskId: string) => void
  toggleTaskSelection: (taskId: string, mode?: RowSelectionMode) => void
  selectAll: (tasks: Task[]) => void
  clearSelection: () => void
  
  // 状態確認
  isTaskSelected: (taskId: string) => boolean
  getSelectedTasks: (tasks: Task[]) => Task[]
}

// ドラッグ選択フック戻り値
export interface UseDragSelectionReturn {
  // ドラッグ状態
  isDragSelecting: boolean
  previewTaskIds: Set<string>
  dragSelectionStartY: number
  dragSelectionCurrentY: number
  
  // ドラッグ操作
  handleDragStart: (event: React.MouseEvent, taskId: string, isAdditive: boolean) => void
  handleDragMove: (event: MouseEvent) => void
  handleDragEnd: () => void
  handleDragCancel: () => void
  
  // ドラッグ状態確認
  isTaskPreview: (taskId: string) => boolean
  isRecentDragEnd: () => boolean
}

// 範囲選択フック戻り値
export interface UseRangeSelectionReturn {
  // 範囲選択操作
  handleRowClick: (event: React.MouseEvent, taskId: string) => void
  handleRowMouseDown: (event: React.MouseEvent, taskId: string) => void
  
  // 位置管理
  taskPositions: Map<string, TaskPosition>
  updateTaskPosition: (taskId: string, position: TaskPosition) => void
  registerRowElement: (taskId: string, element: HTMLElement) => void
  updateTasksRef: (tasks: Task[]) => void
}

// 統合選択フック戻り値（元のuseRowSelectionReturn）
export interface UseRowSelectionReturn extends 
  UseSelectionReturn, 
  UseDragSelectionReturn, 
  UseRangeSelectionReturn {
  // 追加の統合メソッドがあれば定義
}

// 初期状態定数
export const INITIAL_DRAG_STATE: DragSelectionState = {
  isDragging: false,
  startY: 0,
  currentY: 0,
  startTaskId: null,
  previewTaskIds: new Set()
}

export const INITIAL_ROW_SELECTION_STATE: RowSelectionState = {
  selectedTaskIds: new Set(),
  lastSelectedTaskId: null,
  selectionMode: 'single',
  isSelecting: false,
  dragSelection: INITIAL_DRAG_STATE
}

export const DEFAULT_DRAG_CONFIG: DragThresholdConfig = {
  DRAG_THRESHOLD: 10, // ピクセル
  DRAG_END_CLEAR_DELAY: 100 // ms
}