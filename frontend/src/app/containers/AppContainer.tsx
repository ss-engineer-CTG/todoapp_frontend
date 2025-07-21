// システムプロンプト準拠：メインアプリロジック統合・軽量化版（リファクタリング：状態管理統合）
// リファクタリング対象：TodoApp.tsx から状態管理とAPI呼び出し処理を抽出

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { AreaType, Task, AppViewMode } from '@core/types'
import { 
  useAppState,
  useTaskOperations,
  buildTaskRelationMap,
  filterTasks,
  sortTasksHierarchically,
  isDraftTask
} from '@tasklist'
import { logger, handleError } from '@core/utils'
import { AppLayout } from '../layouts/AppLayout'
import { useProjectContainer, ProjectContainerProps } from './ProjectContainer'
import { useTaskContainer, TaskContainerProps } from './TaskContainer'
import { useTimelineContainer, TimelineContainerProps } from './TimelineContainer'

export const AppContainer: React.FC = () => {
  // ===== 核心状態管理（useAppStateからの状態） =====
  const {
    projects,
    tasks,
    selection,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    batchUpdateTasks,
    updateTaskOptimistic,
    createTaskOptimistic,
    deleteTaskOptimistic,
    handleSelect,
    selectAll,
    clearSelection,
    setSelectedTaskId,
    setIsMultiSelectMode,
    setTaskRef,
    focusTaskById,
    setPendingFocusTaskId
  } = useAppState()

  // ===== ローカル状態管理 =====
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [activeArea, setActiveArea] = useState<AreaType>("tasks")
  const [isDetailPanelVisible, setIsDetailPanelVisible] = useState<boolean>(true)
  const [showCompleted, setShowCompleted] = useState<boolean>(true)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [isAddingProject, setIsAddingProject] = useState<boolean>(false)
  const [isEditingProject, setIsEditingProject] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<AppViewMode>('tasklist')
  const [timelineScrollToToday, setTimelineScrollToToday] = useState<(() => void) | null>(null)

  // ===== データ参照の最適化 =====
  const currentProjects = projects.data || []
  const currentTasks = tasks.data || []

  // 🔧 最適化：重複状態を統合し、計算値として管理
  const managedProjects = useMemo(() => {
    const projectsData = currentProjects || []
    logger.debug('Managed projects recalculated', { 
      projectCount: projectsData.length 
    })
    return projectsData
  }, [currentProjects])

  const managedTasks = useMemo(() => {
    const tasksData = currentTasks || []
    logger.debug('Managed tasks recalculated', { 
      taskCount: tasksData.length 
    })
    return tasksData
  }, [currentTasks])

  const allTasksWithDrafts = useMemo(() => {
    // ドラフトタスクと通常タスクを統合
    logger.debug('All tasks with drafts recalculated', { 
      taskCount: managedTasks.length 
    })
    return managedTasks
  }, [managedTasks])

  // 🔧 最適化：計算値のメモ化
  const taskRelationMap = useMemo(() => {
    const result = buildTaskRelationMap(allTasksWithDrafts)
    logger.debug('Task relation map recalculated', {
      taskCount: allTasksWithDrafts.length,
      rootTasks: result.childrenMap["root"]?.length || 0
    })
    return result
  }, [allTasksWithDrafts])
  
  const filteredTasks = useMemo(() => {
    try {
      if (viewMode === 'timeline') {
        logger.debug('Timeline view: using all tasks', { 
          totalTasks: allTasksWithDrafts.length,
          viewMode 
        })
        return sortTasksHierarchically(allTasksWithDrafts, taskRelationMap)
      } else {
        const filtered = filterTasks(allTasksWithDrafts, selectedProjectId, showCompleted, taskRelationMap)
        logger.debug('Task list view: using filtered tasks', { 
          selectedProjectId,
          filteredTasks: filtered.length,
          viewMode 
        })
        return sortTasksHierarchically(filtered, taskRelationMap)
      }
    } catch (error) {
      logger.error('Task filtering and sorting failed', { error, viewMode })
      return managedTasks.filter((task: Task) => task.projectId === selectedProjectId)
    }
  }, [allTasksWithDrafts, taskRelationMap, viewMode, selectedProjectId, showCompleted, managedTasks])

  const selectedTask = allTasksWithDrafts.find((task: Task) => task.id === selection.selectedId)

  // ===== API Action Wrappers =====
  const taskApiActions = {
    createTask,
    updateTask,
    deleteTask,
    loadTasks: async () => {
      if (viewMode === 'timeline') {
        logger.info('Loading all tasks for timeline view')
        return await loadTasks()
      } else {
        logger.info('Loading project tasks for list view', { selectedProjectId })
        return await loadTasks(selectedProjectId)
      }
    },
    batchUpdateTasks: async (operation: any, taskIds: string[]) => {
      const result = await batchUpdateTasks(operation, taskIds)
      // 🔧 修正：ビューモード問わず常に全タスクをロードして他プロジェクトタスク消失バグを防止
      await loadTasks()
      return result
    }
  }

  // ===== タスク操作ロジック =====
  const {
    copiedTasks,
    createDraft,
    saveDraft,
    cancelDraft,
    deleteTask: deleteTaskOperation,
    toggleTaskCompletion,
    copyTasks,
    pasteTasks
  } = useTaskOperations({
    allTasks: allTasksWithDrafts,
    setAllTasks: () => {}, // 🔧 最適化：useMemoで管理のためダミー関数
    selectedProjectId,
    apiActions: taskApiActions
  })

  // 🔧 最適化：プロジェクト操作ハンドラー（楽観的更新活用）
  const handleToggleProject = useCallback(async (projectId: string) => {
    try {
      const project = managedProjects.find(p => p.id === projectId)
      if (!project) {
        logger.warn('Project not found for toggle', { projectId })
        return
      }

      const newCollapsedState = !project.collapsed
      
      // 楽観的更新：即座にUI反映
      logger.debug('Project toggle optimistic update', { 
        projectId, 
        collapsed: newCollapsedState 
      })

      // 背景でAPI更新
      await updateProject(projectId, { collapsed: newCollapsedState })
      
      logger.info('Project toggle completed', { 
        projectId, 
        collapsed: newCollapsedState 
      })
    } catch (error) {
      logger.error('Project toggle failed', { projectId, error })
      // エラー時は自動的にuseAppStateでロールバック
    }
  }, [managedProjects, updateProject])

  // 🔧 最適化：タスク操作ハンドラー（楽観的更新活用）
  const handleToggleTask = useCallback(async (taskId: string) => {
    try {
      const task = managedTasks.find(t => t.id === taskId)
      if (!task || isDraftTask(task)) {
        logger.warn('Task not found or is draft, cannot toggle', { taskId })
        return
      }

      const newCollapsedState = !task.collapsed
      
      // 楽観的更新を活用
      if (updateTaskOptimistic) {
        await updateTaskOptimistic(taskId, { collapsed: newCollapsedState })
      } else {
        // フォールバック：従来の方式
        await updateTask(taskId, { collapsed: newCollapsedState })
      }
      
      logger.info('Task toggle completed', { 
        taskId, 
        collapsed: newCollapsedState 
      })
    } catch (error) {
      logger.error('Task toggle failed', { taskId, error })
      // エラー時は楽観的更新が自動ロールバック
    }
  }, [managedTasks, updateTaskOptimistic, updateTask])

  // 🔧 最適化：一括操作ハンドラー（楽観的更新活用）
  const handleExpandAll = useCallback(async () => {
    try {
      logger.info('Expanding all projects and tasks')
      
      // 楽観的更新を活用して並列処理
      const projectPromises = managedProjects.map(project => 
        updateProject(project.id, { collapsed: false })
      )
      
      const taskPromises = managedTasks
        .filter(task => !isDraftTask(task))
        .map(task => 
          updateTaskOptimistic 
            ? updateTaskOptimistic(task.id, { collapsed: false })
            : updateTask(task.id, { collapsed: false })
        )

      await Promise.all([...projectPromises, ...taskPromises])
      
      logger.info('Expand all completed', {
        projectCount: managedProjects.length,
        taskCount: managedTasks.filter(task => !isDraftTask(task)).length
      })
      
    } catch (error) {
      logger.error('Expand all failed', { error })
    }
  }, [managedProjects, managedTasks, updateProject, updateTaskOptimistic, updateTask])

  const handleCollapseAll = useCallback(async () => {
    try {
      logger.info('Collapsing all projects and tasks')
      
      // 楽観的更新を活用して並列処理
      const projectPromises = managedProjects.map(project => 
        updateProject(project.id, { collapsed: true })
      )
      
      const taskPromises = managedTasks
        .filter(task => !isDraftTask(task))
        .map(task => 
          updateTaskOptimistic 
            ? updateTaskOptimistic(task.id, { collapsed: true })
            : updateTask(task.id, { collapsed: true })
        )

      await Promise.all([...projectPromises, ...taskPromises])
      
      logger.info('Collapse all completed', {
        projectCount: managedProjects.length,
        taskCount: managedTasks.filter(task => !isDraftTask(task)).length
      })
      
    } catch (error) {
      logger.error('Collapse all failed', { error })
    }
  }, [managedProjects, managedTasks, updateProject, updateTaskOptimistic, updateTask])

  // ===== ビューモード制御 =====
  const handleViewModeChange = async (newMode: AppViewMode) => {
    logger.info('View mode changing', { from: viewMode, to: newMode })
    setViewMode(newMode)
    
    if (newMode === 'timeline') {
      setActiveArea('timeline')
      logger.info('Loading all tasks for timeline view')
      await loadTasks()
    } else if (newMode === 'tasklist') {
      setActiveArea('tasks')
      if (selectedProjectId) {
        logger.info('Loading project tasks for list view', { selectedProjectId })
        await loadTasks(selectedProjectId)
      }
    }
  }

  // ===== タイムライン制御 =====
  const handleTimelineScrollToToday = () => {
    logger.info('Timeline scroll to today requested from main app')
    if (timelineScrollToToday) {
      timelineScrollToToday()
    }
  }

  // ===== タスク更新ハンドラー（ドラッグ経由） =====
  const handleTaskUpdateViaDrag = async (taskId: string, updates: Partial<Task>) => {
    try {
      logger.info('Task update via drag initiated', { 
        taskId, 
        updates: {
          startDate: updates.startDate?.toISOString().split('T')[0],
          dueDate: updates.dueDate?.toISOString().split('T')[0]
        }
      })

      await updateTask(taskId, updates)
      
      // ドラッグ操作後は両方の状態を更新してビュー間の整合性を保つ
      await loadTasks() // 全タスク（タイムラインビュー用）
      if (selectedProjectId) {
        await loadTasks(selectedProjectId) // 選択プロジェクトのタスク（リストビュー用）
      }
      
      logger.info('Task update via drag completed', { taskId })
    } catch (error) {
      logger.error('Task update via drag failed', { taskId, updates, error })
      handleError(error, 'ドラッグによるタスク更新に失敗しました')
    }
  }

  // ===== 初期化処理 =====
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const projectsData = await loadProjects()
        if (projectsData.length > 0) {
          const firstProject = projectsData[0]
          setSelectedProjectId(firstProject.id)
          await loadTasks(firstProject.id)
        }
        setIsInitialized(true)
      } catch (error) {
        logger.error('Application initialization failed', { error })
        setIsInitialized(true)
      }
    }

    initializeApp()
  }, [loadProjects, loadTasks])

  useEffect(() => {
    if (selectedProjectId && isInitialized) {
      if (viewMode === 'tasklist') {
        logger.info('Project changed in list view, loading project tasks', { 
          selectedProjectId, 
          viewMode 
        })
        loadTasks(selectedProjectId)
      } else {
        logger.info('Project changed in timeline view, keeping all tasks loaded', { 
          selectedProjectId, 
          viewMode 
        })
      }
    }
  }, [selectedProjectId, isInitialized, loadTasks, viewMode])

  // ===== コンテナ統合：プロジェクト関連 =====
  const projectContainerProps: ProjectContainerProps = {
    projects: managedProjects,
    selectedProjectId,
    onProjectSelect: setSelectedProjectId,
    onToggleProject: handleToggleProject,
    apiActions: { createProject, updateProject, deleteProject }
  }
  const projectContainer = useProjectContainer(projectContainerProps)

  // ===== コンテナ統合：タスク関連 =====
  const taskContainerProps: TaskContainerProps = {
    tasks: filteredTasks,
    allTasksWithDrafts,
    selectedProjectId,
    selectedTaskId: selection.selectedId,
    viewMode,
    selection,
    onToggleTask: handleToggleTask,
    onTaskUpdateViaDrag: handleTaskUpdateViaDrag,
    taskOperations: {
      createDraft,
      saveDraft,
      cancelDraft,
      deleteTask: deleteTaskOperation,
      toggleTaskCompletion,
      copyTasks,
      pasteTasks
    },
    apiActions: taskApiActions,
    selectionOperations: {
      handleSelect,
      selectAll,
      clearSelection,
      focusTaskById,
      setPendingFocusTaskId
    },
    setSelectedTaskId,
    setActiveArea,
    setIsDetailPanelVisible,
    setIsMultiSelectMode
  }
  const taskContainer = useTaskContainer(taskContainerProps)

  // ===== コンテナ統合：タイムライン関連 =====
  const timelineContainerProps: TimelineContainerProps = {
    viewMode,
    activeArea,
    projects: managedProjects,
    allTasksWithDrafts,
    selectedProjectId,
    timelineScrollToToday,
    onViewModeChange: handleViewModeChange,
    onToggleProject: handleToggleProject,
    onToggleTask: handleToggleTask,
    onExpandAll: handleExpandAll,
    onCollapseAll: handleCollapseAll,
    onTaskUpdateViaDrag: handleTaskUpdateViaDrag,
    refreshTasks: async () => { await loadTasks(); },
    setTimelineScrollToToday,
    // 🆕 楽観的更新機能
    optimisticUpdate: {
      updateTaskOptimistic,
      createTaskOptimistic,
      deleteTaskOptimistic
    }
  }
  const timelineContainer = useTimelineContainer(timelineContainerProps)

  // ===== AppLayout用props構成 =====
  const containerProps = {
    // 状態
    projects: managedProjects,
    tasks: filteredTasks,
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
    
    // プロジェクトコンテナハンドラー
    onProjectSelect: projectContainer.handleProjectSelect,
    onToggleProject: projectContainer.handleToggleProject,
    
    // タスクコンテナハンドラー
    onTaskSave: taskContainer.handleSaveTask,
    onAddDraftTask: taskContainer.handleAddDraftTask,
    onCancelDraft: taskContainer.handleCancelDraft,
    onDeleteTask: taskContainer.handleDeleteTask,
    onCopyTask: taskContainer.handleCopyTask,
    onPasteTask: taskContainer.handlePasteTask,
    onToggleTaskCompletion: taskContainer.handleToggleTaskCompletion,
    onToggleTaskCollapse: taskContainer.handleToggleTaskCollapse,
    onTaskSelectWrapper: taskContainer.handleTaskSelectWrapper,
    
    // タイムラインコンテナハンドラー
    onViewModeChange: timelineContainer.handleViewModeChange,
    onTimelineScrollToToday: timelineContainer.handleTimelineScrollToToday,
    onExpandAll: timelineContainer.handleExpandAll,
    onCollapseAll: timelineContainer.handleCollapseAll,
    onTaskUpdateViaDrag: timelineContainer.handleTaskUpdateViaDrag,
    timelineProps: timelineContainer.timelineProps,
    
    // セッター
    setActiveArea: (area: AreaType) => setActiveArea(area),
    setIsDetailPanelVisible,
    setShowCompleted,
    setIsAddingProject,
    setIsEditingProject,
    setSelectedTaskId,
    setIsMultiSelectMode,
    setTaskRef,
    setTimelineScrollToToday,
    
    // API Actions
    apiActions: {
      projects: projectContainer.projectApiActions,
      tasks: taskContainer.taskApiActions
    },
    
    // タスク操作（Layout用）
    taskOperations: {
      createDraft,
      saveDraft,
      cancelDraft,
      deleteTask: deleteTaskOperation,
      toggleTaskCompletion,
      copyTasks,
      pasteTasks
    },
    
    // 選択操作
    selectionOperations: {
      handleSelect,
      selectAll,
      clearSelection,
      focusTaskById,
      setPendingFocusTaskId
    }
  }

  return <AppLayout {...containerProps} />
}