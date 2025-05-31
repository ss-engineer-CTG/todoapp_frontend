import React, { useState, useEffect } from 'react'
import { Project, Task, AreaType, BatchOperation, TaskCreationFlow, FocusManagement } from './types'
import { ProjectPanel } from './components/ProjectPanel'
import { TaskPanel } from './components/TaskPanel'
import { DetailPanel } from './components/DetailPanel'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { LoadingSpinner } from './components/common/LoadingSpinner'
import { useTaskRelations } from './hooks/useTaskRelations'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useMultiSelect } from './hooks/useMultiSelect'
import { useScrollToTask } from './hooks/useScrollToTask'
import { useApi } from './hooks/useApi'
import { createTaskOperations } from './utils/taskOperations'
import { logger } from './utils/logger'
import { handleError } from './utils/errorHandler'
import { isValidDate } from './utils/dateUtils'
import { BATCH_OPERATIONS } from './config/constants'

const TodoApp: React.FC = () => {
  const {
    projects,
    tasks,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    batchUpdateTasks
  } = useApi()

  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [activeArea, setActiveArea] = useState<AreaType>("tasks")
  const [isDetailPanelVisible, setIsDetailPanelVisible] = useState<boolean>(true)
  const [showCompleted, setShowCompleted] = useState<boolean>(true)
  const [copiedTasks, setCopiedTasks] = useState<Task[]>([])
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  const [isAddingProject, setIsAddingProject] = useState<boolean>(false)
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false)
  const [isEditingProject, setIsEditingProject] = useState<boolean>(false)

  // システムプロンプト準拠：新規追加 - タスク作成フロー管理
  const [taskCreationFlow, setTaskCreationFlow] = useState<TaskCreationFlow>({
    isActive: false,
    parentId: null,
    level: 0,
    source: 'shortcut',
    createdTaskId: null,
    shouldFocusOnCreation: false
  })

  // システムプロンプト準拠：新規追加 - フォーカス管理
  const [focusManagement, setFocusManagement] = useState<FocusManagement>({
    activeArea: "tasks",
    lastFocusedTaskId: null,
    shouldMaintainTaskFocus: true,
    detailPanelAutoShow: true,
    preventNextFocusChange: false
  })

  const currentProjects = projects.data || []
  const currentTasks = tasks.data || []

  const { taskRelationMap } = useTaskRelations(currentTasks)

  const filteredTasks = currentTasks.filter((task) => {
    try {
      if (!task.id || !task.projectId) {
        logger.warn('Task missing required fields during filtering', { task })
        return false
      }

      if (task.projectId !== selectedProjectId) return false
      if (!showCompleted && task.completed) return false

      if (task.parentId) {
        let currentParentId: string | null = task.parentId
        while (currentParentId) {
          const currentParent = currentTasks.find((t) => t.id === currentParentId)
          if (currentParent && currentParent.collapsed) return false
          currentParentId = taskRelationMap.parentMap[currentParentId] || null
        }
      }

      return true
    } catch (error) {
      logger.error('Error during task filtering', { task, error })
      return false
    }
  })

  const {
    selectedId: selectedTaskId,
    selectedIds: selectedTaskIds,
    isMultiSelectMode,
    handleSelect: handleTaskSelect,
    handleKeyboardRangeSelect,
    selectAll,
    clearSelection,
    setSelectedId: setSelectedTaskId,
    setSelectedIds: setSelectedTaskIds,
    setIsMultiSelectMode
  } = useMultiSelect({
    items: filteredTasks,
    getItemId: (task) => task.id,
    initialSelectedId: null
  })

  const { setTaskRef } = useScrollToTask({
    selectedTaskId
  })

  const selectedTask = (() => {
    try {
      if (!selectedTaskId) return undefined
      return currentTasks.find((task) => task.id === selectedTaskId)
    } catch (error) {
      logger.error('Error finding selected task', { selectedTaskId, error })
      return undefined
    }
  })()

  const taskApiActions = {
    createTask,
    updateTask,
    deleteTask,
    loadTasks: async () => {
      const result = await loadTasks(selectedProjectId)
      return result
    },
    batchUpdateTasks: async (operation: BatchOperation, taskIds: string[]) => {
      const result = await batchUpdateTasks(operation, taskIds)
      await loadTasks(selectedProjectId)
      return result
    }
  }

  const taskOperations = createTaskOperations(taskApiActions, currentTasks, selectedProjectId)

  // システムプロンプト準拠：フォーカス管理の改善
  useEffect(() => {
    if (selectedTaskId && isInitialized && !isAddingTask && !isEditingProject) {
      // システムプロンプト準拠：適切なタイミングでの詳細パネル表示
      const shouldShowDetail = focusManagement.detailPanelAutoShow && 
                              !isMultiSelectMode && 
                              selectedProjectId && 
                              !isAddingProject &&
                              !focusManagement.preventNextFocusChange

      if (shouldShowDetail) {
        logger.debug('Auto-showing detail panel for selected task', { 
          taskId: selectedTaskId,
          isMultiSelectMode,
          selectedProjectId 
        })
        setIsDetailPanelVisible(true)
        
        // アクティブエリアをタスクに維持（ショートカット継続のため）
        if (activeArea !== "details") {
          setActiveArea("tasks")
        }
      }
      
      // フォーカス管理状態の更新
      setFocusManagement(prev => ({
        ...prev,
        lastFocusedTaskId: selectedTaskId,
        preventNextFocusChange: false
      }))
    }
  }, [selectedTaskId, isInitialized, isMultiSelectMode, selectedProjectId, isAddingTask, isEditingProject, isAddingProject, focusManagement.detailPanelAutoShow, focusManagement.preventNextFocusChange, activeArea])

  // システムプロンプト準拠：タスク作成フロー管理
  const handleAddTask = async (parentId: string | null = null, level = 0) => {
    try {
      logger.info('Starting task creation via shortcut', { 
        parentId, 
        level,
        activeArea,
        isAddingTask: taskCreationFlow.isActive
      })
      
      // システムプロンプト準拠：作成中の重複防止
      if (taskCreationFlow.isActive) {
        logger.debug('Task creation already in progress, skipping')
        return
      }

      // タスク作成フロー開始
      setTaskCreationFlow({
        isActive: true,
        parentId,
        level,
        source: 'shortcut',
        createdTaskId: null,
        shouldFocusOnCreation: true
      })
      
      const createdTask = await taskOperations.addTask(parentId, level)
      if (createdTask) {
        await loadTasks(selectedProjectId)
        
        // システムプロンプト準拠：ショートカット継続のための状態管理
        setSelectedTaskId(createdTask.id)
        setSelectedTaskIds([createdTask.id])
        
        // アクティブエリアをタスクに維持
        setActiveArea("tasks")
        
        // フォーカス管理の更新
        setFocusManagement(prev => ({
          ...prev,
          activeArea: "tasks",
          lastFocusedTaskId: createdTask.id,
          shouldMaintainTaskFocus: true,
          preventNextFocusChange: false
        }))
        
        // 詳細パネルは条件に応じて表示
        if (!isMultiSelectMode) {
          setIsDetailPanelVisible(true)
        }
        
        // タスク作成フロー完了
        setTaskCreationFlow(prev => ({
          ...prev,
          isActive: false,
          createdTaskId: createdTask.id
        }))
        
        logger.info('Task created successfully via shortcut', { 
          taskId: createdTask.id,
          taskName: createdTask.name 
        })
      } else {
        // 作成失敗時のフロー終了
        setTaskCreationFlow(prev => ({
          ...prev,
          isActive: false
        }))
      }
    } catch (error) {
      logger.error('Task creation via shortcut failed', { parentId, level, error })
      handleError(error, 'ショートカットによるタスク追加に失敗しました')
      
      // エラー時のフロー終了
      setTaskCreationFlow(prev => ({
        ...prev,
        isActive: false
      }))
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      logger.info('Deleting task', { taskId, isMultiSelect: isMultiSelectMode })
      
      if (isMultiSelectMode && selectedTaskIds.includes(taskId)) {
        await batchUpdateTasks(BATCH_OPERATIONS.DELETE, selectedTaskIds)
        setSelectedTaskId(null)
        setSelectedTaskIds([])
        setIsMultiSelectMode(false)
        logger.info('Batch delete completed', { taskCount: selectedTaskIds.length })
      } else {
        const success = await taskOperations.deleteTask(taskId)
        if (success && selectedTaskId === taskId) {
          setSelectedTaskId(null)
          setSelectedTaskIds([])
        }
        logger.info('Single task deleted', { taskId })
      }
      
      await loadTasks(selectedProjectId)
    } catch (error) {
      logger.error('Task deletion failed', { taskId, error })
      handleError(error, 'タスクの削除に失敗しました')
    }
  }

  const handleCopyTask = async (taskId: string) => {
    try {
      if (isMultiSelectMode && selectedTaskIds.includes(taskId)) {
        const copiedTaskList = await taskOperations.copyTasks(selectedTaskIds)
        setCopiedTasks(copiedTaskList)
        logger.info('Multiple tasks copied', { taskCount: copiedTaskList.length })
      } else {
        const copiedTaskList = await taskOperations.copyTasks([taskId])
        setCopiedTasks(copiedTaskList)
        logger.info('Single task copied', { taskId, childCount: copiedTaskList.length - 1 })
      }
    } catch (error) {
      logger.error('Task copy failed', { taskId, error })
      handleError(error, 'タスクのコピーに失敗しました')
    }
  }

  const handlePasteTask = async () => {
    if (copiedTasks.length === 0 || !selectedProjectId) return

    try {
      logger.info('Pasting tasks via shortcut', { 
        count: copiedTasks.length, 
        projectId: selectedProjectId 
      })
      
      const currentTask = selectedTaskId ? currentTasks.find((t) => t.id === selectedTaskId) : null
      const targetParentId = currentTask ? currentTask.parentId : null
      const targetLevel = currentTask ? currentTask.level : 0

      const success = await taskOperations.pasteTasks(copiedTasks, targetParentId, targetLevel)
      
      if (success) {
        await loadTasks(selectedProjectId)
        logger.info('Tasks pasted successfully via shortcut', { count: copiedTasks.length })
      }
    } catch (error) {
      logger.error('Task paste via shortcut failed', { error })
      handleError(error, 'ショートカットによるタスク貼り付けに失敗しました')
    }
  }

  const handleToggleTaskCompletion = async (taskId: string) => {
    try {
      logger.info('Toggling task completion', { taskId, isMultiSelect: isMultiSelectMode })
      
      if (isMultiSelectMode && selectedTaskIds.includes(taskId)) {
        const targetTask = currentTasks.find(t => t.id === taskId)
        const newCompletionState = targetTask ? !targetTask.completed : false
        
        const operation = newCompletionState ? BATCH_OPERATIONS.COMPLETE : BATCH_OPERATIONS.INCOMPLETE
        await batchUpdateTasks(operation, selectedTaskIds)
        
        logger.info('Batch completion toggle', { 
          taskCount: selectedTaskIds.length, 
          newState: newCompletionState 
        })
      } else {
        await taskOperations.toggleTaskCompletion(taskId)
        logger.info('Single task completion toggle', { taskId })
      }

      await loadTasks(selectedProjectId)
    } catch (error) {
      logger.error('Task completion toggle failed', { taskId, error })
      handleError(error, 'タスクの完了状態切り替えに失敗しました')
    }
  }

  const handleToggleTaskCollapse = async (taskId: string) => {
    try {
      const success = await taskOperations.toggleTaskCollapse(taskId)
      
      if (success) {
        await loadTasks(selectedProjectId)
      }
    } catch (error) {
      logger.error('Task collapse toggle failed', { taskId, error })
      handleError(error, 'タスクの折りたたみ切り替えに失敗しました')
    }
  }

  useEffect(() => {
    const initializeApp = async () => {
      try {
        logger.info('Initializing application')
        
        const projectsData = await loadProjects()
        logger.info('Projects loaded during initialization', { count: projectsData.length })

        if (projectsData.length > 0) {
          const firstProject = projectsData[0]
          setSelectedProjectId(firstProject.id)
          logger.info('Selected initial project', { projectId: firstProject.id, name: firstProject.name })
          
          try {
            const tasksData = await loadTasks(firstProject.id)
            logger.info('Tasks loaded for initial project', { 
              projectId: firstProject.id, 
              taskCount: tasksData.length 
            })
          } catch (taskError) {
            logger.warn('Failed to load tasks for initial project', { 
              projectId: firstProject.id, 
              error: taskError 
            })
          }
        } else {
          logger.warn('No projects found during initialization')
        }

        setIsInitialized(true)
        logger.info('Application initialized successfully')
      } catch (error) {
        logger.error('Application initialization failed', { error })
        handleError(error, 'アプリケーションの初期化に失敗しました')
        setIsInitialized(true)
      }
    }

    initializeApp()
  }, [])

  useEffect(() => {
    if (selectedProjectId && isInitialized) {
      logger.info('Project selection changed, loading tasks', { projectId: selectedProjectId })
      
      loadTasks(selectedProjectId).catch(error => {
        logger.error('Failed to load tasks for project', { projectId: selectedProjectId, error })
        handleError(error, 'タスクの読み込みに失敗しました')
      })
    }
  }, [selectedProjectId, isInitialized, loadTasks])

  const handleProjectUpdate = async (updatedProjects: Project[]) => {
    logger.debug('Project update requested', { count: updatedProjects.length })
  }

  const handleProjectSelect = (projectId: string) => {
    logger.info('Project selected', { projectId })
    setSelectedProjectId(projectId)
    setSelectedTaskId(null)
    setSelectedTaskIds([])
    setActiveArea("projects")
    setIsDetailPanelVisible(false)
  }

  const handleTaskUpdate = async (updatedTasks: Task[]) => {
    logger.debug('Task update requested', { count: updatedTasks.length })
  }

  // システムプロンプト準拠：タスク選択処理の改善
  const handleTaskSelectWrapper = (taskId: string, event?: React.MouseEvent) => {
    logger.debug('Task selected', { taskId, source: 'user-click' })
    handleTaskSelect(taskId, event)
    
    // フォーカス管理の更新
    setFocusManagement(prev => ({
      ...prev,
      activeArea: "tasks",
      lastFocusedTaskId: taskId,
      shouldMaintainTaskFocus: true
    }))
    
    setActiveArea("tasks")
    setIsDetailPanelVisible(true)
  }

  const { taskNameInputRef, startDateButtonRef, dueDateButtonRef, taskNotesRef, saveButtonRef } = useKeyboardShortcuts({
    tasks: currentTasks,
    projects: currentProjects,
    selectedProjectId,
    setSelectedProjectId,
    selectedTaskId,
    setSelectedTaskId,
    selectedTaskIds,
    setSelectedTaskIds,
    filteredTasks,
    activeArea,
    setActiveArea,
    isDetailPanelVisible,
    isMultiSelectMode,
    setIsMultiSelectMode,
    taskRelationMap,
    copiedTasks,
    onAddTask: handleAddTask,
    onDeleteTask: handleDeleteTask,
    onCopyTask: handleCopyTask,
    onPasteTask: handlePasteTask,
    onToggleTaskCompletion: handleToggleTaskCompletion,
    onToggleTaskCollapse: handleToggleTaskCollapse,
    onSelectAll: selectAll,
    onHandleKeyboardRangeSelect: handleKeyboardRangeSelect,
    isAddingProject,
    isAddingTask,
    isEditingProject
  })

  if (!isInitialized) {
    return (
      <div className="flex h-screen bg-background">
        <LoadingSpinner size="lg" message="アプリケーションを初期化中..." className="m-auto" />
      </div>
    )
  }

  const handleTaskDetailUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      if (updates.startDate && !isValidDate(updates.startDate)) {
        logger.warn('Invalid startDate in task update, using current date', { taskId, startDate: updates.startDate })
        updates.startDate = new Date()
      }
      if (updates.dueDate && !isValidDate(updates.dueDate)) {
        logger.warn('Invalid dueDate in task update, using current date', { taskId, dueDate: updates.dueDate })
        updates.dueDate = new Date()
      }

      await updateTask(taskId, updates)
      await loadTasks(selectedProjectId)
      logger.debug('Task detail updated', { taskId, updates })
    } catch (error) {
      logger.error('Task detail update failed', { taskId, updates, error })
      handleError(error, 'タスクの更新に失敗しました')
    }
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-background">
        <ProjectPanel
          projects={currentProjects}
          onProjectsUpdate={handleProjectUpdate}
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
          onTasksUpdate={handleTaskUpdate}
          selectedProjectId={selectedProjectId}
          selectedTaskId={selectedTaskId}
          selectedTaskIds={selectedTaskIds}
          onTaskSelect={handleTaskSelectWrapper}
          activeArea={activeArea}
          setActiveArea={setActiveArea}
          isDetailPanelVisible={isDetailPanelVisible}
          setIsDetailPanelVisible={setIsDetailPanelVisible}
          isMultiSelectMode={isMultiSelectMode}
          setIsMultiSelectMode={setIsMultiSelectMode}
          showCompleted={showCompleted}
          setShowCompleted={setShowCompleted}
          taskRelationMap={taskRelationMap}
          allTasks={currentTasks}
          onDeleteTask={handleDeleteTask}
          onCopyTask={handleCopyTask}
          onToggleTaskCompletion={handleToggleTaskCompletion}
          onToggleTaskCollapse={handleToggleTaskCollapse}
          onClearSelection={clearSelection}
          setTaskRef={setTaskRef}
          isAddingTask={isAddingTask}
          setIsAddingTask={setIsAddingTask}
          apiActions={taskApiActions}
        />

        {isDetailPanelVisible && (
          <DetailPanel
            selectedTask={selectedTask}
            onTaskUpdate={handleTaskDetailUpdate}
            projects={currentProjects}
            activeArea={activeArea}
            setActiveArea={setActiveArea}
            isVisible={isDetailPanelVisible}
            setIsVisible={setIsDetailPanelVisible}
            taskNameInputRef={taskNameInputRef}
            startDateButtonRef={startDateButtonRef}
            dueDateButtonRef={dueDateButtonRef}
            taskNotesRef={taskNotesRef}
            saveButtonRef={saveButtonRef}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}

export default TodoApp