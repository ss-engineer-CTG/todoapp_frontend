// システムプロンプト準拠：メインアプリロジック統合・軽量化版（タイムライン全プロジェクト対応版）
// 🔧 修正内容：ドラッグによるタスク更新機能を追加

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
import { logger, handleError } from '@core/utils'

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
  
  const [viewMode, setViewMode] = useState<AppViewMode>('tasklist')
  
  const [timelineScrollToToday, setTimelineScrollToToday] = useState<(() => void) | null>(null)

  const [managedProjects, setManagedProjects] = useState<Project[]>([])
  const [managedTasks, setManagedTasks] = useState<Task[]>([])

  const currentProjects = projects.data || []
  const currentTasks = tasks.data || []

  useEffect(() => {
    setManagedProjects(currentProjects.map(project => ({ ...project })))
  }, [currentProjects])

  useEffect(() => {
    setManagedTasks(currentTasks.map(task => ({ ...task })))
  }, [currentTasks])

  const [allTasksWithDrafts, setAllTasksWithDrafts] = useState<Task[]>([])

  useEffect(() => {
    setAllTasksWithDrafts(managedTasks)
  }, [managedTasks])

  const taskRelationMap = buildTaskRelationMap(allTasksWithDrafts)

  const filteredTasks = (() => {
    try {
      if (viewMode === 'timeline') {
        logger.info('Timeline view: using all tasks', { 
          totalTasks: allTasksWithDrafts.length,
          viewMode 
        })
        return sortTasksHierarchically(allTasksWithDrafts, taskRelationMap)
      } else {
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
      if (viewMode === 'timeline') {
        await loadTasks()
      } else {
        await loadTasks(selectedProjectId)
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
    copyTasks,
    pasteTasks
  } = useTaskOperations({
    allTasks: allTasksWithDrafts,
    setAllTasks: setAllTasksWithDrafts,
    selectedProjectId,
    apiActions: taskApiActions
  })

  const handleToggleProject = useCallback(async (projectId: string) => {
    try {
      const project = managedProjects.find(p => p.id === projectId)
      if (!project) return

      const updatedProject = { ...project, collapsed: !project.collapsed }
      
      setManagedProjects(prev => 
        prev.map(p => p.id === projectId ? updatedProject : p)
      )

      await updateProject(projectId, { collapsed: updatedProject.collapsed })
      
      logger.info('Project toggle completed', { 
        projectId, 
        collapsed: updatedProject.collapsed 
      })
    } catch (error) {
      logger.error('Project toggle failed', { projectId, error })
      
      setManagedProjects(prev => 
        prev.map(p => p.id === projectId ? currentProjects.find(cp => cp.id === projectId) || p : p)
      )
    }
  }, [managedProjects, updateProject, currentProjects])

  const handleToggleTask = useCallback(async (taskId: string) => {
    try {
      const task = managedTasks.find(t => t.id === taskId)
      if (!task || isDraftTask(task)) return

      const updatedTask = { ...task, collapsed: !task.collapsed }
      
      setManagedTasks(prev => 
        prev.map(t => t.id === taskId ? updatedTask : t)
      )
      setAllTasksWithDrafts(prev => 
        prev.map(t => t.id === taskId ? updatedTask : t)
      )

      await updateTask(taskId, { collapsed: updatedTask.collapsed })
      
      logger.info('Task toggle completed', { 
        taskId, 
        collapsed: updatedTask.collapsed 
      })
    } catch (error) {
      logger.error('Task toggle failed', { taskId, error })
      
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

  const handleExpandAll = useCallback(async () => {
    try {
      logger.info('Expanding all projects and tasks')
      
      const updatedProjects = managedProjects.map(project => ({ ...project, collapsed: false }))
      setManagedProjects(updatedProjects)
      
      const updatedTasks = managedTasks.map(task => ({ ...task, collapsed: false }))
      setManagedTasks(updatedTasks)
      setAllTasksWithDrafts(updatedTasks)

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

  const handleCollapseAll = useCallback(async () => {
    try {
      logger.info('Collapsing all projects and tasks')
      
      const updatedProjects = managedProjects.map(project => ({ ...project, collapsed: true }))
      setManagedProjects(updatedProjects)
      
      const updatedTasks = managedTasks.map(task => ({ ...task, collapsed: true }))
      setManagedTasks(updatedTasks)
      setAllTasksWithDrafts(updatedTasks)

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

  const handleViewModeChange = useCallback(async (newMode: AppViewMode) => {
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
  }, [viewMode, loadTasks, selectedProjectId])

  const handleTimelineScrollToToday = useCallback(() => {
    logger.info('Timeline scroll to today requested from main app')
    if (timelineScrollToToday) {
      timelineScrollToToday()
    }
  }, [timelineScrollToToday])

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
      
      if (viewMode === 'timeline') {
        await loadTasks()
      } else {
        await loadTasks(selectedProjectId)
      }
    }
  }, [deleteTaskOperation, selection, setSelectedTaskId, clearSelection, setIsMultiSelectMode, loadTasks, selectedProjectId, viewMode])

  const handleCopyTask = useCallback((taskId: string) => {
    const taskIds = selection.isMultiSelectMode && selection.selectedIds.includes(taskId)
      ? selection.selectedIds
      : [taskId]
    copyTasks(taskIds)
  }, [selection, copyTasks])

  const handlePasteTask = useCallback(async () => {
    const currentTask = selection.selectedId ? allTasksWithDrafts.find(t => t.id === selection.selectedId) : null
    const targetParentId = currentTask ? currentTask.parentId : null
    const targetLevel = currentTask ? currentTask.level : 0

    const success = await pasteTasks(targetParentId, targetLevel)
    if (success) {
      if (viewMode === 'timeline') {
        await loadTasks()
      } else {
        await loadTasks(selectedProjectId)
      }
    }
  }, [selection.selectedId, allTasksWithDrafts, pasteTasks, loadTasks, selectedProjectId, viewMode])

  const handleToggleTaskCompletion = useCallback(async (taskId: string) => {
    const success = await toggleTaskCompletion(
      taskId, 
      selection.isMultiSelectMode, 
      selection.selectedIds
    )
    if (success) {
      if (viewMode === 'timeline') {
        await loadTasks()
      } else {
        await loadTasks(selectedProjectId)
      }
    }
  }, [toggleTaskCompletion, selection, loadTasks, selectedProjectId, viewMode])

  const handleToggleTaskCollapse = useCallback(async (taskId: string) => {
    await handleToggleTask(taskId)
  }, [handleToggleTask])

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

  const handleSaveTask = useCallback(async (taskId: string, updates: any): Promise<Task | null> => {
    try {
      const task = allTasksWithDrafts.find(t => t.id === taskId)
      if (!task) return null

      let savedTask: Task | null = null

      if (isDraftTask(task)) {
        logger.info('Saving draft task and initiating UI update flow', { 
          draftId: taskId,
          projectId: selectedProjectId,
          viewMode 
        })
        
        savedTask = await saveDraft(taskId, updates)
        
        // 根本解決: データの再読み込みで確実に最新状態を反映
        logger.info('Reloading tasks after draft save to ensure UI consistency')
        const updatedTasks = viewMode === 'timeline' 
          ? await loadTasks()
          : await loadTasks(selectedProjectId)
        
        if (updatedTasks) {
          setManagedTasks(updatedTasks.map(task => ({ ...task })))
          setAllTasksWithDrafts(updatedTasks.map(task => ({ ...task })))
          
          logger.info('Task data reloaded successfully', { 
            taskCount: updatedTasks.length,
            newTaskFound: updatedTasks.some(t => t.id === savedTask?.id)
          })
        }
        
        if (savedTask) {
          logger.info('Initiating post-save UI transition sequence', { 
            oldDraftId: taskId, 
            newTaskId: savedTask.id,
            sequence: 'focus_transition -> detail_panel_hide'
          })
          
          // 1. タスク一覧セクションにフォーカス移動
          setActiveArea("tasks")
          
          // 2. 詳細パネルを非表示にする
          setIsDetailPanelVisible(false)
          
          // 3. 新しいタスクを選択状態にして視覚的に確認可能にする
          setSelectedTaskId(savedTask.id)
          setPendingFocusTaskId(savedTask.id)
          
          // 4. DOM更新後にフォーカスを新しいタスクに設定
          setTimeout(() => {
            if (savedTask) {
              logger.info('Focusing newly created task in task list', { 
                taskId: savedTask.id,
                detailPanelVisible: false,
                activeArea: 'tasks'
              })
              focusTaskById(savedTask.id)
            }
          }, 150) // DOM更新とアニメーション完了を待つ
        }
        
        return savedTask
      } else {
        // 既存タスク更新の場合
        logger.info('Updating existing task and initiating UI update flow', { 
          taskId,
          projectId: selectedProjectId,
          viewMode 
        })
        
        await updateTask(taskId, updates)
        
        // 既存タスク更新時も同様に自動リロードを実行
        logger.info('Executing automatic reload for existing task update')
        const updatedTasks = viewMode === 'timeline' 
          ? await loadTasks()
          : await loadTasks(selectedProjectId)
        
        if (updatedTasks) {
          setManagedTasks(updatedTasks.map(task => ({ ...task })))
          setAllTasksWithDrafts(updatedTasks.map(task => ({ ...task })))
          
          logger.info('Local task state updated after existing task modification', { 
            taskCount: updatedTasks.length,
            updatedTaskId: taskId
          })
        }
        
        // 既存タスク更新時も新規作成時と同様のUI遷移を実行
        logger.info('Initiating post-update UI transition sequence', { 
          taskId,
          sequence: 'focus_transition -> detail_panel_hide'
        })
        
        // 1. タスク一覧セクションにフォーカス移動
        setActiveArea("tasks")
        
        // 2. 詳細パネルを非表示にする
        setIsDetailPanelVisible(false)
        
        // 3. 更新されたタスクを選択状態にして視覚的に確認可能にする
        setSelectedTaskId(taskId)
        setPendingFocusTaskId(taskId)
        
        // 4. DOM更新後にフォーカスを更新されたタスクに設定
        setTimeout(() => {
          logger.info('Focusing updated task in task list', { 
            taskId,
            detailPanelVisible: false,
            activeArea: 'tasks'
          })
          focusTaskById(taskId)
        }, 150) // DOM更新とアニメーション完了を待つ
        
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
    setIsDetailPanelVisible,
    focusTaskById,
    setManagedTasks,
    setAllTasksWithDrafts
  ])

  // 🆕 追加：ドラッグによるタスク更新ハンドラー
  const handleTaskUpdateViaDrag = useCallback(async (taskId: string, updates: Partial<Task>) => {
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
  }, [updateTask, loadTasks, selectedProjectId, viewMode])

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

  const handleProjectSelect = useCallback((projectId: string) => {
    setSelectedProjectId(projectId)
    setSelectedTaskId(null)
    clearSelection()
    setActiveArea("projects")
    setIsDetailPanelVisible(false)
    
    if (viewMode === 'tasklist') {
      setAllTasksWithDrafts(tasks.data || [])
    }
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
          onTaskUpdate={handleTaskUpdateViaDrag} // 🆕 追加
        />
      ) : (
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