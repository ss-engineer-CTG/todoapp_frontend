// システムプロンプト準拠：レイアウト・UI構造分離（リファクタリング：プレゼンテーション層）
// リファクタリング対象：TodoApp.tsx からUI描画とレイアウト処理を抽出

import React from 'react'
import { AreaType, Task, AppViewMode, Project } from '@core/types'
import { 
  ProjectPanel, 
  TaskPanel, 
  DetailPanel,
  useKeyboard
} from '@tasklist'
import { TimelineView } from '@timeline'
import { DailyFocusView } from '@daily-focus'
import { LoadingSpinner } from '@core/components'
import { logger } from '@core/utils'
import { ViewSwitcher } from './ViewSwitcher'

// AppContainerから受け取るpropsの型定義
interface AppLayoutProps {
  // 状態
  projects: Project[]
  tasks: Task[]
  allTasksWithDrafts: Task[]
  selectedTask: Task | undefined
  selectedProjectId: string
  activeArea: AreaType
  isDetailPanelVisible: boolean
  showCompleted: boolean
  isInitialized: boolean
  isAddingProject: boolean
  isEditingProject: boolean
  viewMode: AppViewMode
  selection: any
  taskRelationMap: any
  copiedTasks: Task[]
  
  // ハンドラー（Container経由）
  onProjectSelect: (projectId: string) => void
  onToggleProject: (projectId: string) => Promise<void>
  onTaskSave: (taskId: string, updates: any) => Promise<Task | null>
  onAddDraftTask: (parentId: string | null, level?: number) => Promise<void>
  onCancelDraft: (taskId: string) => void
  onDeleteTask: (taskId: string) => Promise<void>
  onCopyTask: (taskId: string) => void
  onPasteTask: () => Promise<void>
  onToggleTaskCompletion: (taskId: string) => Promise<void>
  onToggleTaskCollapse: (taskId: string) => Promise<void>
  onTaskSelectWrapper: (taskId: string, event?: React.MouseEvent) => void
  onViewModeChange: (mode: AppViewMode) => Promise<void>
  onTimelineScrollToToday: () => void
  onExpandAll: () => Promise<void>
  onCollapseAll: () => Promise<void>
  onTaskUpdateViaDrag: (taskId: string, updates: Partial<Task>) => Promise<void>
  timelineProps: any
  
  // セッター
  setActiveArea: (area: AreaType) => void
  setIsDetailPanelVisible: (visible: boolean) => void
  setShowCompleted: (show: boolean) => void
  setIsAddingProject: (adding: boolean) => void
  setIsEditingProject: (editing: boolean) => void
  setSelectedTaskId: (id: string | null) => void
  setIsMultiSelectMode: (mode: boolean) => void
  setTaskRef: (id: string, element: HTMLDivElement | null) => void
  setTimelineScrollToToday: (fn: (() => void) | null) => void
  
  // API Actions
  apiActions: {
    projects: {
      createProject: any
      updateProject: any
      deleteProject: any
    }
    tasks: any
  }
  
  // タスク操作
  taskOperations: {
    createDraft: any
    saveDraft: any
    cancelDraft: any
    deleteTask: any
    toggleTaskCompletion: any
    copyTasks: any
    pasteTasks: any
  }
  
  // 選択操作
  selectionOperations: {
    handleSelect: any
    selectAll: any
    clearSelection: any
    focusTaskById: any
    setPendingFocusTaskId: any
  }
}

export const AppLayout: React.FC<AppLayoutProps> = (props) => {
  const {
    // 状態
    projects,
    tasks,
    allTasksWithDrafts,
    selectedTask,
    selectedProjectId,
    activeArea,
    isDetailPanelVisible,
    showCompleted,
    isInitialized,
    isAddingProject,
    isEditingProject,
    viewMode,
    selection,
    taskRelationMap,
    copiedTasks,
    
    // ハンドラー（Container経由）
    onProjectSelect,
    onToggleProject,
    onTaskSave,
    onAddDraftTask,
    onCancelDraft,
    onDeleteTask,
    onCopyTask,
    onPasteTask,
    onToggleTaskCompletion,
    onToggleTaskCollapse,
    onTaskSelectWrapper,
    onViewModeChange,
    onTimelineScrollToToday,
    onExpandAll,
    onCollapseAll,
    onTaskUpdateViaDrag,
    timelineProps,
    
    // セッター
    setActiveArea,
    setIsDetailPanelVisible,
    setShowCompleted,
    setIsAddingProject,
    setIsEditingProject,
    setSelectedTaskId,
    setIsMultiSelectMode,
    setTaskRef,
    setTimelineScrollToToday,
    
    // API Actions
    apiActions,
    
    // タスク操作
    taskOperations,
    
    // 選択操作
    selectionOperations
  } = props

  // ===== ハンドラーはすべてContainer経由で提供される =====

  // ===== キーボードフック統合 =====
  const extendedKeyboardProps = {
    ...useKeyboard({
      tasks: allTasksWithDrafts,
      projects,
      selectedProjectId,
      setSelectedProjectId: onProjectSelect,
      selectedTaskId: selection.selectedId,
      setSelectedTaskId,
      filteredTasks: tasks,
      activeArea,
      setActiveArea,
      isDetailPanelVisible,
      isMultiSelectMode: selection.isMultiSelectMode,
      onCreateDraft: onAddDraftTask,
      onDeleteTask: onDeleteTask,
      onCopyTask: onCopyTask,
      onPasteTask: onPasteTask,
      onToggleCompletion: onToggleTaskCompletion,
      onToggleCollapse: onToggleTaskCollapse,
      onSelectAll: () => selectionOperations.selectAll(tasks),
      onRangeSelect: (direction: 'up' | 'down') => {
        logger.info('Range select', { direction })
      },
      onCancelDraft: onCancelDraft,
      copiedTasksCount: copiedTasks.length,
      isInputActive: isAddingProject || isEditingProject,
      onScrollToToday: onTimelineScrollToToday
    })
  }

  // ===== ローディング画面 =====
  if (!isInitialized) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <LoadingSpinner size="lg" message="アプリケーションを初期化中..." />
      </div>
    )
  }

  // ===== メインレイアウト =====
  return (
    <div className="flex h-screen bg-background">
      {/* ビュー切り替えボタン（全ビューに表示） */}
      <ViewSwitcher 
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />

      {viewMode === 'timeline' ? (
        // タイムラインビュー（Container経由props使用）
        <TimelineView {...timelineProps} />
      ) : viewMode === 'daily-focus' ? (
        // Daily Focus View
        <DailyFocusView />
      ) : (
        // タスクリストビュー（Container経由ハンドラー使用）
        <>
          <ProjectPanel
            projects={projects}
            onProjectsUpdate={() => {}}
            selectedProjectId={selectedProjectId}
            onProjectSelect={onProjectSelect}
            activeArea={activeArea}
            setActiveArea={setActiveArea}
            isAddingProject={isAddingProject}
            setIsAddingProject={setIsAddingProject}
            isEditingProject={isEditingProject}
            setIsEditingProject={setIsEditingProject}
            apiActions={apiActions.projects}
          />

          <TaskPanel
            tasks={tasks}
            selectedProjectId={selectedProjectId}
            selectedTaskId={selection.selectedId}
            selectedTaskIds={selection.selectedIds}
            onTaskSelect={onTaskSelectWrapper}
            activeArea={activeArea}
            setActiveArea={setActiveArea}
            isDetailPanelVisible={isDetailPanelVisible}
            setIsDetailPanelVisible={setIsDetailPanelVisible}
            isMultiSelectMode={selection.isMultiSelectMode}
            setIsMultiSelectMode={setIsMultiSelectMode}
            showCompleted={showCompleted}
            setShowCompleted={setShowCompleted}
            taskRelationMap={taskRelationMap}
            allTasks={allTasksWithDrafts}
            onDeleteTask={onDeleteTask}
            onCopyTask={onCopyTask}
            onToggleTaskCompletion={onToggleTaskCompletion}
            onToggleTaskCollapse={onToggleTaskCollapse}
            onClearSelection={selectionOperations.clearSelection}
            setTaskRef={setTaskRef}
            onAddDraftTask={onAddDraftTask}
            apiActions={apiActions.tasks}
          />

          {isDetailPanelVisible && (
            <DetailPanel
              selectedTask={selectedTask}
              onTaskSave={onTaskSave}
              projects={projects}
              activeArea={activeArea}
              setActiveArea={setActiveArea}
              isVisible={isDetailPanelVisible}
              setIsVisible={setIsDetailPanelVisible}
              taskNameInputRef={extendedKeyboardProps.taskNameInputRef}
              startDateButtonRef={extendedKeyboardProps.startDateButtonRef}
              dueDateButtonRef={extendedKeyboardProps.dueDateButtonRef}
              taskNotesRef={extendedKeyboardProps.taskNotesRef}
              saveButtonRef={extendedKeyboardProps.saveButtonRef}
            />
          )}
        </>
      )}
    </div>
  )
}