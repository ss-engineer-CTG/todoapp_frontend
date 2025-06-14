// システムプロンプト準拠：メインアプリロジック統合・軽量化版
// タイムライン統合、ビューモード切り替え機能、軽量化対応

import React, { useState, useEffect, useCallback } from 'react'
import { AreaType, Task, AppViewMode } from '@core/types'
import { 
  ProjectPanel, 
  TaskPanel, 
  DetailPanel,
  useAppState,
  useTaskOperations,
  useKeyboard,
  buildTaskRelationMap,
  filterTasks,
  sortTasksHierarchically,
  isDraftTask
} from '@tasklist'
import { TimelineView, TimelineProject } from '@timeline'
import { Calendar, List } from 'lucide-react'
import { LoadingSpinner } from '@core/utils/core'
import { logger } from '@core/utils/core'
import { SAMPLE_TIMELINE_PROJECTS } from '@core/config'

const TodoApp: React.FC = () => {
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
    handleSelect,
    selectAll,
    clearSelection,
    setSelectedTaskId,
    setIsMultiSelectMode,
    setTaskRef,
    focusTaskById,
    setPendingFocusTaskId
  } = useAppState()

  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [activeArea, setActiveArea] = useState<AreaType>("tasks")
  const [isDetailPanelVisible, setIsDetailPanelVisible] = useState<boolean>(true)
  const [showCompleted, setShowCompleted] = useState<boolean>(true)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [isAddingProject, setIsAddingProject] = useState<boolean>(false)
  const [isEditingProject, setIsEditingProject] = useState<boolean>(false)
  
  // ビューモード管理
  const [viewMode, setViewMode] = useState<AppViewMode>('tasklist')
  const [timelineProjects, setTimelineProjects] = useState<TimelineProject[]>([])

  // 草稿タスク込みの全タスク管理
  const [allTasksWithDrafts, setAllTasksWithDrafts] = useState<Task[]>([])

  const currentProjects = projects.data || []
  const currentTasks = tasks.data || []

  useEffect(() => {
    setAllTasksWithDrafts(currentTasks)
  }, [currentTasks])

  const taskRelationMap = buildTaskRelationMap(allTasksWithDrafts)

  // フィルタリング・ソート済みタスク
  const filteredTasks = (() => {
    try {
      const filtered = filterTasks(allTasksWithDrafts, selectedProjectId, showCompleted, taskRelationMap)
      return sortTasksHierarchically(filtered, taskRelationMap)
    } catch (error) {
      logger.error('Task filtering and sorting failed', { error })
      return currentTasks.filter((task: Task) => task.projectId === selectedProjectId)
    }
  })()

  const selectedTask = allTasksWithDrafts.find(task => task.id === selection.selectedId)

  const taskApiActions = {
    createTask,
    updateTask,
    deleteTask,
    loadTasks: async () => {
      const result = await loadTasks(selectedProjectId)
      return result
    },
    batchUpdateTasks: async (operation: any, taskIds: string[]) => {
      const result = await batchUpdateTasks(operation, taskIds)
      await loadTasks(selectedProjectId)
      return result
    }
  }

  const {
    copiedTasks,
    createDraft,
    saveDraft,
    cancelDraft,
    deleteTask: deleteTaskOperation,
    toggleTaskCompletion,
    toggleTaskCollapse,
    copyTasks,
    pasteTasks
  } = useTaskOperations({
    allTasks: allTasksWithDrafts,
    setAllTasks: setAllTasksWithDrafts,
    selectedProjectId,
    apiActions: taskApiActions
  })

  // ビューモード切り替え
  const handleViewModeChange = useCallback((newMode: AppViewMode) => {
    logger.info('View mode changing', { from: viewMode, to: newMode })
    setViewMode(newMode)
    
    if (newMode === 'timeline') {
      // タスクリストからタイムライン用データに変換
      const timelineData = convertTasklistToTimeline(currentProjects, allTasksWithDrafts)
      setTimelineProjects(timelineData)
      setActiveArea('timeline')
    } else {
      setActiveArea('tasks')
    }
  }, [viewMode, currentProjects, allTasksWithDrafts])

  // タスクリスト→タイムライン データ変換（軽量化版）
  const convertTasklistToTimeline = useCallback((projects: any[], tasks: Task[]): TimelineProject[] => {
    try {
      return projects.map(project => {
        const projectTasks = tasks.filter(task => task.projectId === project.id && !task.parentId)
        
        const convertedTasks = projectTasks.map(task => {
          const subtasks = tasks
            .filter(t => t.parentId === task.id)
            .map(subtask => ({
              ...subtask,
              status: subtask.completed ? 'completed' as const : 
                     (subtask.dueDate && new Date() > subtask.dueDate) ? 'overdue' as const :
                     'not-started' as const,
              milestone: false
            }))

          return {
            ...task,
            status: task.completed ? 'completed' as const : 
                   (task.dueDate && new Date() > task.dueDate) ? 'overdue' as const :
                   'in-progress' as const,
            milestone: false,
            expanded: task.collapsed ? false : true,
            subtasks
          }
        })

        return {
          ...project,
          expanded: !project.collapsed,
          process: project.process || 'プロジェクト',
          line: project.line || '全体',
          tasks: convertedTasks
        }
      })
    } catch (error) {
      logger.error('Timeline data conversion failed', { error })
      return [...SAMPLE_TIMELINE_PROJECTS] as TimelineProject[]
    }
  }, [])

  // タイムライン→タスクリスト データ更新
  const handleTimelineProjectsUpdate = useCallback((updatedTimelineProjects: TimelineProject[]) => {
    setTimelineProjects(updatedTimelineProjects)
    logger.info('Timeline projects updated', { count: updatedTimelineProjects.length })
  }, [])

  // 草稿タスク作成
  const handleAddDraftTask = useCallback(async (parentId: string | null = null, level = 0) => {
    try {
      if (!selectedProjectId) {
        logger.warn('No project selected for draft task creation')
        return
      }

      logger.info('Creating draft task', { 
        parentId, 
        level, 
        selectedProjectId,
        source: 'unified_handler'
      })

      const draft = createDraft(parentId, level)
      if (draft) {
        setSelectedTaskId(draft.id)
        setActiveArea("details")
        setIsDetailPanelVisible(true)
      }
    } catch (error) {
      logger.error('Draft task creation failed', { parentId, level, error })
    }
  }, [selectedProjectId, createDraft, setSelectedTaskId, setActiveArea, setIsDetailPanelVisible])

  // 草稿タスクキャンセル
  const handleCancelDraft = useCallback((taskId: string) => {
    try {
      const success = cancelDraft(taskId)
      if (success) {
        logger.info('Draft task cancelled successfully', { taskId })
        setSelectedTaskId(null)
        setActiveArea("tasks")
      }
    } catch (error) {
      logger.error('Draft task cancellation failed', { taskId, error })
    }
  }, [cancelDraft, setSelectedTaskId, setActiveArea])

  // タスク削除
  const handleDeleteTask = useCallback(async (taskId: string) => {
    const success = await deleteTaskOperation(
      taskId, 
      selection.isMultiSelectMode, 
      selection.selectedIds
    )
    
    if (success) {
      if (selection.selectedId === taskId) {
        setSelectedTaskId(null)
      }
      if (selection.isMultiSelectMode) {
        clearSelection()
        setIsMultiSelectMode(false)
      }
      await loadTasks(selectedProjectId)
    }
  }, [deleteTaskOperation, selection, setSelectedTaskId, clearSelection, setIsMultiSelectMode, loadTasks, selectedProjectId])

  // タスクコピー
  const handleCopyTask = useCallback((taskId: string) => {
    const taskIds = selection.isMultiSelectMode && selection.selectedIds.includes(taskId)
      ? selection.selectedIds
      : [taskId]
    copyTasks(taskIds)
  }, [selection, copyTasks])

  // タスク貼り付け
  const handlePasteTask = useCallback(async () => {
    const currentTask = selection.selectedId ? allTasksWithDrafts.find(t => t.id === selection.selectedId) : null
    const targetParentId = currentTask ? currentTask.parentId : null
    const targetLevel = currentTask ? currentTask.level : 0

    const success = await pasteTasks(targetParentId, targetLevel)
    if (success) {
      await loadTasks(selectedProjectId)
    }
  }, [selection.selectedId, allTasksWithDrafts, pasteTasks, loadTasks, selectedProjectId])

  // タスク完了状態切り替え
  const handleToggleTaskCompletion = useCallback(async (taskId: string) => {
    const success = await toggleTaskCompletion(
      taskId, 
      selection.isMultiSelectMode, 
      selection.selectedIds
    )
    if (success) {
      await loadTasks(selectedProjectId)
    }
  }, [toggleTaskCompletion, selection, loadTasks, selectedProjectId])

  // タスク折りたたみ切り替え
  const handleToggleTaskCollapse = useCallback(async (taskId: string) => {
    const success = await toggleTaskCollapse(taskId)
    if (success) {
      await loadTasks(selectedProjectId)
    }
  }, [toggleTaskCollapse, loadTasks, selectedProjectId])

  // キーボード処理
  const extendedKeyboardProps = {
    ...useKeyboard({
      tasks: allTasksWithDrafts,
      projects: currentProjects,
      selectedProjectId,
      setSelectedProjectId,
      selectedTaskId: selection.selectedId,
      setSelectedTaskId,
      filteredTasks,
      activeArea,
      setActiveArea,
      isDetailPanelVisible,
      isMultiSelectMode: selection.isMultiSelectMode,
      onCreateDraft: handleAddDraftTask,
      onDeleteTask: handleDeleteTask,
      onCopyTask: handleCopyTask,
      onPasteTask: handlePasteTask,
      onToggleCompletion: handleToggleTaskCompletion,
      onToggleCollapse: handleToggleTaskCollapse,
      onSelectAll: () => selectAll(filteredTasks),
      onRangeSelect: (direction: 'up' | 'down') => {
        logger.info('Range select', { direction })
      },
      onCancelDraft: handleCancelDraft,
      copiedTasksCount: copiedTasks.length,
      isInputActive: isAddingProject || isEditingProject
    })
  }

  // 拡張キーボードイベント処理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault()
        handleViewModeChange('timeline')
      } else if (e.ctrlKey && e.key === 'l') {
        e.preventDefault()
        handleViewModeChange('tasklist')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleViewModeChange])

  // タスク保存
  const handleSaveTask = useCallback(async (taskId: string, updates: any): Promise<Task | null> => {
    try {
      const task = allTasksWithDrafts.find(t => t.id === taskId)
      if (!task) return null

      let savedTask: Task | null = null

      if (isDraftTask(task)) {
        savedTask = await saveDraft(taskId, updates)
        await loadTasks(selectedProjectId)
        
        if (savedTask) {
          logger.info('Setting focus to newly created task', { 
            oldDraftId: taskId, 
            newTaskId: savedTask.id 
          })
          
          setPendingFocusTaskId(savedTask.id)
          setSelectedTaskId(savedTask.id)
          setActiveArea("tasks")
          
          setTimeout(() => {
            if (savedTask) {
              focusTaskById(savedTask.id)
            }
          }, 100)
        }
        
        return savedTask
      } else {
        await updateTask(taskId, updates)
        await loadTasks(selectedProjectId)
        return task
      }
    } catch (error) {
      logger.error('Task save failed', { taskId, error })
      return null
    }
  }, [
    allTasksWithDrafts, 
    saveDraft, 
    updateTask, 
    loadTasks, 
    selectedProjectId, 
    setPendingFocusTaskId,
    setSelectedTaskId, 
    setActiveArea,
    focusTaskById
  ])

  // 初期化
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

  // プロジェクト切り替え時
  useEffect(() => {
    if (selectedProjectId && isInitialized) {
      loadTasks(selectedProjectId)
    }
  }, [selectedProjectId, isInitialized, loadTasks])

  // イベントハンドラー
  const handleProjectSelect = useCallback((projectId: string) => {
    setSelectedProjectId(projectId)
    setSelectedTaskId(null)
    clearSelection()
    setActiveArea("projects")
    setIsDetailPanelVisible(false)
    setAllTasksWithDrafts(tasks.data || [])
  }, [setSelectedTaskId, clearSelection, setActiveArea, setIsDetailPanelVisible, tasks.data])

  const handleTaskSelectWrapper = useCallback((taskId: string, event?: React.MouseEvent) => {
    handleSelect(taskId, filteredTasks, event)
    setActiveArea("tasks")
    setIsDetailPanelVisible(true)
  }, [handleSelect, filteredTasks, setActiveArea, setIsDetailPanelVisible])

  if (!isInitialized) {
    return (
      <div className="flex h-screen bg-background">
        <LoadingSpinner size="lg" message="アプリケーションを初期化中..." />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* ビューモード切り替えボタン */}
      {viewMode === 'tasklist' && (
        <div className="absolute top-4 left-4 z-50 flex bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            className={`px-3 py-2 text-sm font-medium rounded-none border-r border-gray-200 dark:border-gray-700 flex items-center space-x-2 transition-colors ${
              viewMode === 'tasklist' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => handleViewModeChange('tasklist')}
            title="リストビュー (Ctrl+L)"
          >
            <List size={16} />
            <span>リスト</span>
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium rounded-none flex items-center space-x-2 transition-colors ${
              viewMode === 'timeline' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => handleViewModeChange('timeline')}
            title="タイムラインビュー (Ctrl+T)"
          >
            <Calendar size={16} />
            <span>タイムライン</span>
          </button>
        </div>
      )}

      {/* メインコンテンツ */}
      {viewMode === 'timeline' ? (
        // タイムラインビュー（全画面表示）
        <TimelineView
          projects={timelineProjects}
          onProjectsUpdate={handleTimelineProjectsUpdate}
        />
      ) : (
        // タスクリストビュー（既存）
        <>
          <ProjectPanel
            projects={currentProjects}
            onProjectsUpdate={() => {}}
            selectedProjectId={selectedProjectId}
            onProjectSelect={handleProjectSelect}
            activeArea={activeArea}
            setActiveArea={setActiveArea}
            isAddingProject={isAddingProject}
            setIsAddingProject={setIsAddingProject}
            isEditingProject={isEditingProject}
            setIsEditingProject={setIsEditingProject}
            apiActions={{
              createProject,
              updateProject,
              deleteProject
            }}
          />

          <TaskPanel
            tasks={filteredTasks}
            selectedProjectId={selectedProjectId}
            selectedTaskId={selection.selectedId}
            selectedTaskIds={selection.selectedIds}
            onTaskSelect={handleTaskSelectWrapper}
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
            onDeleteTask={handleDeleteTask}
            onCopyTask={handleCopyTask}
            onToggleTaskCompletion={handleToggleTaskCompletion}
            onToggleTaskCollapse={handleToggleTaskCollapse}
            onClearSelection={clearSelection}
            setTaskRef={setTaskRef}
            onAddDraftTask={handleAddDraftTask}
            apiActions={taskApiActions}
          />

          {isDetailPanelVisible && (
            <DetailPanel
              selectedTask={selectedTask}
              onTaskSave={handleSaveTask}
              projects={currentProjects}
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

export default TodoApp