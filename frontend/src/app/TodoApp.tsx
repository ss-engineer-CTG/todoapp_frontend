// システムプロンプト準拠：メインアプリロジック統合・軽量化版（タイムライン全プロジェクト対応版）
// 🔧 修正内容：ビューモード別タスクロード制御により、タイムラインで全プロジェクトのタスクを表示

import React, { useState, useEffect, useCallback } from 'react'
import { AreaType, Task, AppViewMode, Project } from '@core/types'
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
import { TimelineView } from '@timeline'
import { Calendar, List } from 'lucide-react'
import { LoadingSpinner } from '@core/utils'
import { logger } from '@core/utils'

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
  
  // 🔧 修正：ビューモード管理（型安全性を向上）
  const [viewMode, setViewMode] = useState<AppViewMode>('tasklist' as AppViewMode)
  
  // タイムライン用今日スクロール状態管理
  const [timelineScrollToToday, setTimelineScrollToToday] = useState<(() => void) | null>(null)

  // プロジェクト・タスク状態管理（折りたたみ対応）
  const [managedProjects, setManagedProjects] = useState<Project[]>([])
  const [managedTasks, setManagedTasks] = useState<Task[]>([])

  const currentProjects = projects.data || []
  const currentTasks = tasks.data || []

  // プロジェクト状態の同期
  useEffect(() => {
    setManagedProjects(currentProjects.map(project => ({ ...project })))
  }, [currentProjects])

  // タスク状態の同期
  useEffect(() => {
    setManagedTasks(currentTasks.map(task => ({ ...task })))
  }, [currentTasks])

  // 草稿タスク込みの全タスク管理
  const [allTasksWithDrafts, setAllTasksWithDrafts] = useState<Task[]>([])

  useEffect(() => {
    setAllTasksWithDrafts(managedTasks)
  }, [managedTasks])

  const taskRelationMap = buildTaskRelationMap(allTasksWithDrafts)

  // 🔧 修正：ビューモードに応じたタスクフィルタリング
  const filteredTasks = (() => {
    try {
      if (viewMode === 'timeline') {
        // タイムラインビュー：全プロジェクトのタスクを表示（フィルタリングなし）
        logger.info('Timeline view: using all tasks', { 
          totalTasks: allTasksWithDrafts.length,
          viewMode 
        })
        return sortTasksHierarchically(allTasksWithDrafts, taskRelationMap)
      } else {
        // タスクリストビュー：選択されたプロジェクトのタスクのみ表示
        const filtered = filterTasks(allTasksWithDrafts, selectedProjectId, showCompleted, taskRelationMap)
        logger.info('Task list view: using filtered tasks', { 
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
  })()

  const selectedTask = allTasksWithDrafts.find(task => task.id === selection.selectedId)

  const taskApiActions = {
    createTask,
    updateTask,
    deleteTask,
    loadTasks: async () => {
      // 🔧 修正：ビューモードに応じたタスクロード
      if (viewMode === 'timeline') {
        logger.info('Loading all tasks for timeline view')
        return await loadTasks() // 引数なし = 全タスク
      } else {
        logger.info('Loading project tasks for list view', { selectedProjectId })
        return await loadTasks(selectedProjectId)
      }
    },
    batchUpdateTasks: async (operation: any, taskIds: string[]) => {
      const result = await batchUpdateTasks(operation, taskIds)
      // 🔧 修正：ビューモードに応じたリロード
      if (viewMode === 'timeline') {
        await loadTasks() // 全タスクリロード
      } else {
        await loadTasks(selectedProjectId) // 選択プロジェクトのみリロード
      }
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

  // プロジェクト折りたたみ処理
  const handleToggleProject = useCallback(async (projectId: string) => {
    try {
      const project = managedProjects.find(p => p.id === projectId)
      if (!project) return

      const updatedProject = { ...project, collapsed: !project.collapsed }
      
      // ローカル状態を即座に更新
      setManagedProjects(prev => 
        prev.map(p => p.id === projectId ? updatedProject : p)
      )

      // サーバーに保存
      await updateProject(projectId, { collapsed: updatedProject.collapsed })
      
      logger.info('Project toggle completed', { 
        projectId, 
        collapsed: updatedProject.collapsed 
      })
    } catch (error) {
      logger.error('Project toggle failed', { projectId, error })
      
      // エラー時は元の状態に戻す
      setManagedProjects(prev => 
        prev.map(p => p.id === projectId ? currentProjects.find(cp => cp.id === projectId) || p : p)
      )
    }
  }, [managedProjects, updateProject, currentProjects])

  // タスク折りたたみ処理
  const handleToggleTask = useCallback(async (taskId: string) => {
    try {
      const task = managedTasks.find(t => t.id === taskId)
      if (!task || isDraftTask(task)) return

      const updatedTask = { ...task, collapsed: !task.collapsed }
      
      // ローカル状態を即座に更新
      setManagedTasks(prev => 
        prev.map(t => t.id === taskId ? updatedTask : t)
      )
      setAllTasksWithDrafts(prev => 
        prev.map(t => t.id === taskId ? updatedTask : t)
      )

      // サーバーに保存
      await updateTask(taskId, { collapsed: updatedTask.collapsed })
      
      logger.info('Task toggle completed', { 
        taskId, 
        collapsed: updatedTask.collapsed 
      })
    } catch (error) {
      logger.error('Task toggle failed', { taskId, error })
      
      // エラー時は元の状態に戻す
      const originalTask = currentTasks.find(ct => ct.id === taskId)
      if (originalTask) {
        setManagedTasks(prev => 
          prev.map(t => t.id === taskId ? originalTask : t)
        )
        setAllTasksWithDrafts(prev => 
          prev.map(t => t.id === taskId ? originalTask : t)
        )
      }
    }
  }, [managedTasks, updateTask, currentTasks])

  // 全展開処理
  const handleExpandAll = useCallback(async () => {
    try {
      logger.info('Expanding all projects and tasks')
      
      // プロジェクトを全て展開
      const updatedProjects = managedProjects.map(project => ({ ...project, collapsed: false }))
      setManagedProjects(updatedProjects)
      
      // タスクを全て展開
      const updatedTasks = managedTasks.map(task => ({ ...task, collapsed: false }))
      setManagedTasks(updatedTasks)
      setAllTasksWithDrafts(updatedTasks)

      // サーバーに保存（並列実行）
      await Promise.all([
        ...managedProjects.map(project => 
          updateProject(project.id, { collapsed: false })
        ),
        ...managedTasks.filter(task => !isDraftTask(task)).map(task => 
          updateTask(task.id, { collapsed: false })
        )
      ])
      
    } catch (error) {
      logger.error('Expand all failed', { error })
    }
  }, [managedProjects, managedTasks, updateProject, updateTask])

  // 全折りたたみ処理
  const handleCollapseAll = useCallback(async () => {
    try {
      logger.info('Collapsing all projects and tasks')
      
      // プロジェクトを全て折りたたみ
      const updatedProjects = managedProjects.map(project => ({ ...project, collapsed: true }))
      setManagedProjects(updatedProjects)
      
      // タスクを全て折りたたみ
      const updatedTasks = managedTasks.map(task => ({ ...task, collapsed: true }))
      setManagedTasks(updatedTasks)
      setAllTasksWithDrafts(updatedTasks)

      // サーバーに保存（並列実行）
      await Promise.all([
        ...managedProjects.map(project => 
          updateProject(project.id, { collapsed: true })
        ),
        ...managedTasks.filter(task => !isDraftTask(task)).map(task => 
          updateTask(task.id, { collapsed: true })
        )
      ])
      
    } catch (error) {
      logger.error('Collapse all failed', { error })
    }
  }, [managedProjects, managedTasks, updateProject, updateTask])

  // 🔧 修正：ビューモード切り替え（タスクロード制御付き）
  const handleViewModeChange = useCallback(async (newMode: AppViewMode) => {
    logger.info('View mode changing', { from: viewMode, to: newMode })
    setViewMode(newMode)
    
    if (newMode === 'timeline') {
      setActiveArea('timeline')
      // タイムラインビュー：全プロジェクトのタスクをロード
      logger.info('Loading all tasks for timeline view')
      await loadTasks()
    } else if (newMode === 'tasklist') {
      setActiveArea('tasks')
      // タスクリストビュー：選択されたプロジェクトのタスクをロード
      if (selectedProjectId) {
        logger.info('Loading project tasks for list view', { selectedProjectId })
        await loadTasks(selectedProjectId)
      }
    }
  }, [viewMode, loadTasks, selectedProjectId])

  // タイムライン用今日スクロール処理
  const handleTimelineScrollToToday = useCallback(() => {
    logger.info('Timeline scroll to today requested from main app')
    if (timelineScrollToToday) {
      timelineScrollToToday()
    }
  }, [timelineScrollToToday])

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
      
      // 🔧 修正：ビューモードに応じたリロード
      if (viewMode === 'timeline') {
        await loadTasks() // 全タスクリロード
      } else {
        await loadTasks(selectedProjectId) // 選択プロジェクトのみリロード
      }
    }
  }, [deleteTaskOperation, selection, setSelectedTaskId, clearSelection, setIsMultiSelectMode, loadTasks, selectedProjectId, viewMode])

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
      // 🔧 修正：ビューモードに応じたリロード
      if (viewMode === 'timeline') {
        await loadTasks() // 全タスクリロード
      } else {
        await loadTasks(selectedProjectId) // 選択プロジェクトのみリロード
      }
    }
  }, [selection.selectedId, allTasksWithDrafts, pasteTasks, loadTasks, selectedProjectId, viewMode])

  // タスク完了状態切り替え
  const handleToggleTaskCompletion = useCallback(async (taskId: string) => {
    const success = await toggleTaskCompletion(
      taskId, 
      selection.isMultiSelectMode, 
      selection.selectedIds
    )
    if (success) {
      // 🔧 修正：ビューモードに応じたリロード
      if (viewMode === 'timeline') {
        await loadTasks() // 全タスクリロード
      } else {
        await loadTasks(selectedProjectId) // 選択プロジェクトのみリロード
      }
    }
  }, [toggleTaskCompletion, selection, loadTasks, selectedProjectId, viewMode])

  // タスク折りたたみ切り替え（管理状態経由）
  const handleToggleTaskCollapse = useCallback(async (taskId: string) => {
    await handleToggleTask(taskId)
  }, [handleToggleTask])

  // キーボード処理
  const extendedKeyboardProps = {
    ...useKeyboard({
      tasks: allTasksWithDrafts,
      projects: managedProjects,
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
      isInputActive: isAddingProject || isEditingProject,
      onScrollToToday: handleTimelineScrollToToday
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
      else if (e.key === 'Home' && activeArea === 'timeline') {
        e.preventDefault()
        logger.info('Home key pressed - triggering timeline scroll to today')
        handleTimelineScrollToToday()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleViewModeChange, activeArea, handleTimelineScrollToToday])

  // タスク保存
  const handleSaveTask = useCallback(async (taskId: string, updates: any): Promise<Task | null> => {
    try {
      const task = allTasksWithDrafts.find(t => t.id === taskId)
      if (!task) return null

      let savedTask: Task | null = null

      if (isDraftTask(task)) {
        savedTask = await saveDraft(taskId, updates)
        
        // 🔧 修正：ビューモードに応じたリロード
        if (viewMode === 'timeline') {
          await loadTasks() // 全タスクリロード
        } else {
          await loadTasks(selectedProjectId) // 選択プロジェクトのみリロード
        }
        
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
        
        // 🔧 修正：ビューモードに応じたリロード
        if (viewMode === 'timeline') {
          await loadTasks() // 全タスクリロード
        } else {
          await loadTasks(selectedProjectId) // 選択プロジェクトのみリロード
        }
        
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
    viewMode,
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
          // 初期化時はタスクリストビューなので選択されたプロジェクトのタスクをロード
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

  // 🔧 修正：プロジェクト切り替え時（ビューモード考慮）
  useEffect(() => {
    if (selectedProjectId && isInitialized) {
      // タスクリストビューの場合のみ、選択されたプロジェクトのタスクをロード
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
        // タイムラインビューでは全タスクを保持（リロード不要）
      }
    }
  }, [selectedProjectId, isInitialized, loadTasks, viewMode])

  // イベントハンドラー
  const handleProjectSelect = useCallback((projectId: string) => {
    setSelectedProjectId(projectId)
    setSelectedTaskId(null)
    clearSelection()
    setActiveArea("projects")
    setIsDetailPanelVisible(false)
    
    // 🔧 修正：タスクリストビューの場合のみ即座にタスクを更新
    if (viewMode === 'tasklist') {
      setAllTasksWithDrafts(tasks.data || [])
    }
    // タイムラインビューの場合は全タスクを保持
  }, [setSelectedTaskId, clearSelection, setActiveArea, setIsDetailPanelVisible, tasks.data, viewMode])

  const handleTaskSelectWrapper = useCallback((taskId: string, event?: React.MouseEvent) => {
    handleSelect(taskId, filteredTasks, event)
    setActiveArea("tasks")
    setIsDetailPanelVisible(true)
  }, [handleSelect, filteredTasks, setActiveArea, setIsDetailPanelVisible])

  if (!isInitialized) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
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
        <TimelineView
          projects={managedProjects}
          tasks={allTasksWithDrafts}
          onViewModeChange={handleViewModeChange}
          onScrollToToday={setTimelineScrollToToday}
          onToggleProject={handleToggleProject}
          onToggleTask={handleToggleTask}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
        />
      ) : (
        // タスクリストビュー（既存）
        <>
          <ProjectPanel
            projects={managedProjects}
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
              projects={managedProjects}
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