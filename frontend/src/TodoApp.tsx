import React, { useState, useEffect } from 'react'
import { Task, AreaType, BatchOperation, TaskCreationFlow, FocusManagement } from './types'
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
import { handleError, handleTemporaryTaskError } from './utils/errorHandler'
import { isValidDate } from './utils/dateUtils'
import { BATCH_OPERATIONS } from './config/constants'

const TodoApp: React.FC = () => {
  const {
    projects,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    batchUpdateTasks,
    // システムプロンプト準拠：一時的タスク管理機能
    createTemporaryTask,
    removeTemporaryTask,
    saveTemporaryTask,
    getAllTasksIncludingTemporary
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

  // システムプロンプト準拠：軽量化されたタスク作成フロー管理（一時的タスク対応）
  const [taskCreationFlow, setTaskCreationFlow] = useState<TaskCreationFlow>({
    isActive: false,
    parentId: null,
    level: 0,
    source: 'shortcut',
    createdTaskId: null,
    shouldFocusOnCreation: false
  })

  // システムプロンプト準拠：軽量化されたフォーカス管理
  const [focusManagement, setFocusManagement] = useState<FocusManagement>({
    activeArea: "tasks",
    lastFocusedTaskId: null,
    shouldMaintainTaskFocus: true,
    detailPanelAutoShow: true,
    preventNextFocusChange: false
  })

  const currentProjects = projects.data || []
  // システムプロンプト準拠：一時的タスクを含む全タスク取得
  const currentTasks = getAllTasksIncludingTemporary()

  const { taskRelationMap } = useTaskRelations(currentTasks)

  const filteredTasks = currentTasks.filter((task) => {
    try {
      if (!task.id || !task.projectId) {
        logger.warn('Task missing required fields during filtering', { task })
        return false
      }

      if (task.projectId !== selectedProjectId) return false
      if (!showCompleted && task.completed) return false

      // システムプロンプト準拠：一時的タスクは常に表示
      if (task.isTemporary) return true

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
    },
    // システムプロンプト準拠：一時的タスク管理機能追加
    createTemporaryTask,
    removeTemporaryTask,
    saveTemporaryTask
  }

  const taskOperations = createTaskOperations(taskApiActions, currentTasks, selectedProjectId)

  // システムプロンプト準拠：プロジェクト一覧更新処理
  const handleProjectsUpdate = (updatedProjects: any[]) => {
    // 内部的にはuseApiのstateが管理しているため、
    // 特別な処理は不要（APIの結果で自動更新される）
    logger.debug('Projects update requested', { count: updatedProjects.length })
  }

  // システムプロンプト準拠：軽量化されたフォーカス管理
  useEffect(() => {
    if (selectedTaskId && isInitialized && !isAddingTask && !isEditingProject) {
      const shouldShowDetail = focusManagement.detailPanelAutoShow && 
                              !isMultiSelectMode && 
                              selectedProjectId && 
                              !isAddingProject &&
                              !focusManagement.preventNextFocusChange

      if (shouldShowDetail) {
        setIsDetailPanelVisible(true)
        if (activeArea !== "details") {
          setActiveArea("tasks")
        }
      }
      
      setFocusManagement(prev => ({
        ...prev,
        lastFocusedTaskId: selectedTaskId,
        preventNextFocusChange: false
      }))
    }
  }, [selectedTaskId, isInitialized, isMultiSelectMode, selectedProjectId, isAddingTask, isEditingProject, isAddingProject, focusManagement.detailPanelAutoShow, focusManagement.preventNextFocusChange, activeArea])

  // システムプロンプト準拠：一時的タスク作成処理（新機能）
  const handleAddTemporaryTask = async (parentId: string | null = null, level = 0) => {
    try {
      if (taskCreationFlow.isActive) {
        logger.debug('Task creation already in progress, skipping')
        return
      }

      if (!selectedProjectId) {
        logger.warn('No project selected for temporary task creation')
        return
      }

      setTaskCreationFlow({
        isActive: true,
        parentId,
        level,
        source: 'shortcut',
        createdTaskId: null,
        shouldFocusOnCreation: true
      })
      
      logger.logTaskCreationFlow('temporary_task_creation_start', 'shortcut', {
        parentId,
        level,
        projectId: selectedProjectId
      })

      // 一時的タスクを作成
      const temporaryTask = createTemporaryTask(parentId, level)
      
      // プロジェクトIDを設定
      temporaryTask.projectId = selectedProjectId
      
      // タスクを選択状態にして詳細パネルを表示
      setSelectedTaskId(temporaryTask.id)
      setSelectedTaskIds([temporaryTask.id])
      setActiveArea("details")
      setIsDetailPanelVisible(true)
      
      setTaskCreationFlow(prev => ({
        ...prev,
        isActive: false,
        createdTaskId: temporaryTask.id
      }))
      
      logger.logTemporaryTaskLifecycle('temporary_created_via_shortcut', temporaryTask.id, '', {
        parentId,
        level,
        projectId: selectedProjectId
      })
      
    } catch (error) {
      logger.error('Temporary task creation via shortcut failed', { parentId, level, error })
      handleTemporaryTaskError(error as Error, { parentId, level, source: 'shortcut' })
      setTaskCreationFlow(prev => ({
        ...prev,
        isActive: false
      }))
    }
  }

  // システムプロンプト準拠：一時的タスク保存処理（新機能）
  const handleTemporaryTaskSave = async (taskId: string, taskData: Partial<Task>): Promise<Task | null> => {
    try {
      logger.logTemporaryTaskOperation('save_attempt', taskId, { taskData })
      
      const savedTask = await saveTemporaryTask(taskId, taskData)
      
      if (savedTask) {
        // 保存成功時は新しいタスクを選択状態に
        setSelectedTaskId(savedTask.id)
        setSelectedTaskIds([savedTask.id])
        
        // タスク一覧を再読み込み
        await loadTasks(selectedProjectId)
        
        logger.logTemporaryTaskOperation('save_success', taskId, {
          newTaskId: savedTask.id,
          taskName: savedTask.name
        })
        
        return savedTask
      }
      
      return null
    } catch (error) {
      logger.error('Temporary task save failed', { taskId, taskData, error })
      handleTemporaryTaskError(error as Error, { taskId, taskData, operation: 'save' })
      return null
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      if (isMultiSelectMode && selectedTaskIds.includes(taskId)) {
        // 一時的タスクを除外してバッチ削除
        const regularTaskIds = selectedTaskIds.filter(id => {
          const task = currentTasks.find(t => t.id === id)
          return task && !task.isTemporary
        })
        
        if (regularTaskIds.length > 0) {
          await batchUpdateTasks(BATCH_OPERATIONS.DELETE, regularTaskIds)
        }
        
        // 一時的タスクは個別に削除
        selectedTaskIds.forEach(id => {
          const task = currentTasks.find(t => t.id === id)
          if (task?.isTemporary) {
            removeTemporaryTask(id)
            logger.logTemporaryTaskOperation('delete_via_selection', id, { 
              reason: 'multi_select_delete'
            })
          }
        })
        
        setSelectedTaskId(null)
        setSelectedTaskIds([])
        setIsMultiSelectMode(false)
      } else {
        // 単一タスクの削除
        const task = currentTasks.find(t => t.id === taskId)
        if (task?.isTemporary) {
          // 一時的タスクの場合
          removeTemporaryTask(taskId)
          logger.logTemporaryTaskOperation('delete_single', taskId, { 
            reason: 'user_delete'
          })
        } else {
          // 通常タスクの場合
          const success = await taskOperations.deleteTask(taskId)
          if (success && selectedTaskId === taskId) {
            setSelectedTaskId(null)
            setSelectedTaskIds([])
          }
        }
      }
      
      if (selectedTaskIds.includes(taskId)) {
        await loadTasks(selectedProjectId)
      }
    } catch (error) {
      logger.error('Task deletion failed', { taskId, error })
      handleError(error, 'タスクの削除に失敗しました')
    }
  }

  const handleCopyTask = async (taskId: string) => {
    try {
      if (isMultiSelectMode && selectedTaskIds.includes(taskId)) {
        // 一時的タスクを除外してコピー
        const regularTaskIds = selectedTaskIds.filter(id => {
          const task = currentTasks.find(t => t.id === id)
          return task && !task.isTemporary
        })
        
        if (regularTaskIds.length > 0) {
          const copiedTaskList = await taskOperations.copyTasks(regularTaskIds)
          setCopiedTasks(copiedTaskList)
        } else {
          logger.warn('No regular tasks selected for copy operation')
        }
      } else {
        // 一時的タスクはコピー不可
        const task = currentTasks.find(t => t.id === taskId)
        if (task?.isTemporary) {
          logger.debug('Copy operation skipped for temporary task', { taskId })
          return
        }
        
        const copiedTaskList = await taskOperations.copyTasks([taskId])
        setCopiedTasks(copiedTaskList)
      }
    } catch (error) {
      logger.error('Task copy failed', { taskId, error })
      handleError(error, 'タスクのコピーに失敗しました')
    }
  }

  const handlePasteTask = async () => {
    if (copiedTasks.length === 0 || !selectedProjectId) return

    try {
      const currentTask = selectedTaskId ? currentTasks.find((t) => t.id === selectedTaskId) : null
      // 一時的タスクを親にすることは不可
      if (currentTask?.isTemporary) {
        logger.debug('Paste operation skipped - temporary task selected as parent')
        return
      }
      
      const targetParentId = currentTask ? currentTask.parentId : null
      const targetLevel = currentTask ? currentTask.level : 0

      const success = await taskOperations.pasteTasks(copiedTasks, targetParentId, targetLevel)
      
      if (success) {
        await loadTasks(selectedProjectId)
      }
    } catch (error) {
      logger.error('Task paste via shortcut failed', { error })
      handleError(error, 'ショートカットによるタスク貼り付けに失敗しました')
    }
  }

  const handleToggleTaskCompletion = async (taskId: string) => {
    try {
      // 一時的タスクは完了状態切り替え不可
      const task = currentTasks.find(t => t.id === taskId)
      if (task?.isTemporary) {
        logger.debug('Completion toggle skipped for temporary task', { taskId })
        return
      }
      
      if (isMultiSelectMode && selectedTaskIds.includes(taskId)) {
        // 一時的タスクを除外してバッチ操作
        const regularTaskIds = selectedTaskIds.filter(id => {
          const task = currentTasks.find(t => t.id === id)
          return task && !task.isTemporary
        })
        
        if (regularTaskIds.length > 0) {
          const targetTask = currentTasks.find(t => t.id === taskId)
          const newCompletionState = targetTask ? !targetTask.completed : false
          
          const operation = newCompletionState ? BATCH_OPERATIONS.COMPLETE : BATCH_OPERATIONS.INCOMPLETE
          await batchUpdateTasks(operation, regularTaskIds)
        }
      } else {
        await taskOperations.toggleTaskCompletion(taskId)
      }

      await loadTasks(selectedProjectId)
    } catch (error) {
      logger.error('Task completion toggle failed', { taskId, error })
      handleError(error, 'タスクの完了状態切り替えに失敗しました')
    }
  }

  const handleToggleTaskCollapse = async (taskId: string) => {
    try {
      // 一時的タスクは折りたたみ不可
      const task = currentTasks.find(t => t.id === taskId)
      if (task?.isTemporary) {
        logger.debug('Collapse toggle skipped for temporary task', { taskId })
        return
      }
      
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

        if (projectsData.length > 0) {
          const firstProject = projectsData[0]
          setSelectedProjectId(firstProject.id)
          
          try {
            await loadTasks(firstProject.id)
          } catch (taskError) {
            logger.warn('Failed to load tasks for initial project', { 
              projectId: firstProject.id, 
              error: taskError 
            })
          }
        }

        setIsInitialized(true)
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
      loadTasks(selectedProjectId).catch(error => {
        logger.error('Failed to load tasks for project', { projectId: selectedProjectId, error })
        handleError(error, 'タスクの読み込みに失敗しました')
      })
    }
  }, [selectedProjectId, isInitialized, loadTasks])

  // システムプロンプト準拠：YAGNI原則 - 未使用ハンドラーをシンプル化
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
    setSelectedTaskId(null)
    setSelectedTaskIds([])
    setActiveArea("projects")
    setIsDetailPanelVisible(false)
  }

  const handleTaskSelectWrapper = (taskId: string, event?: React.MouseEvent) => {
    handleTaskSelect(taskId, event)
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
    onAddTemporaryTask: handleAddTemporaryTask, // システムプロンプト準拠：一時的タスク作成に変更
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
        updates.startDate = new Date()
      }
      if (updates.dueDate && !isValidDate(updates.dueDate)) {
        updates.dueDate = new Date()
      }

      await updateTask(taskId, updates)
      await loadTasks(selectedProjectId)
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
          onProjectsUpdate={handleProjectsUpdate}
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
            onTemporaryTaskSave={handleTemporaryTaskSave} // システムプロンプト準拠：一時的タスク保存処理追加
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