import React, { useState, useEffect } from 'react'
import { Task, AreaType, BatchOperation, FocusManagement } from './types'
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
import { useTaskDraft } from './hooks/useTaskDraft'
import { createTaskOperations } from './utils/taskOperations'
import { sortTasksHierarchically } from './utils/hierarchySort'
import { isDraftTask, canCompleteTask, canCollapseTask, canCopyTask, filterTasksForBatchOperation } from './utils/taskUtils'
import { logger } from './utils/logger'
import { handleError } from './utils/errorHandler'
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

  // 統合フラグアプローチ：草稿管理hook
  const { createDraft, saveDraft } = useTaskDraft()

  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [activeArea, setActiveArea] = useState<AreaType>("tasks")
  const [isDetailPanelVisible, setIsDetailPanelVisible] = useState<boolean>(true)
  const [showCompleted, setShowCompleted] = useState<boolean>(true)
  const [copiedTasks, setCopiedTasks] = useState<Task[]>([])
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  const [isAddingProject, setIsAddingProject] = useState<boolean>(false)
  const [isEditingProject, setIsEditingProject] = useState<boolean>(false)

  // 統合フラグアプローチ：草稿タスクを含む全タスクを管理
  const [allTasksWithDrafts, setAllTasksWithDrafts] = useState<Task[]>([])

  // システムプロンプト準拠：軽量化されたフォーカス管理
  const [focusManagement, setFocusManagement] = useState<FocusManagement>({
    activeArea: "tasks",
    lastFocusedTaskId: null,
    shouldMaintainTaskFocus: true,
    detailPanelAutoShow: true,
    preventNextFocusChange: false
  })

  const currentProjects = projects.data || []
  const currentTasks = tasks.data || []

  // 統合フラグアプローチ：草稿タスクと確定タスクを統合
  useEffect(() => {
    setAllTasksWithDrafts(currentTasks)
  }, [currentTasks])

  const { taskRelationMap } = useTaskRelations(allTasksWithDrafts)

  // システムプロンプト準拠：軽量な階層ソート適用（草稿タスクは除外）
  const filteredTasks = (() => {
    try {
      const basicFilteredTasks = allTasksWithDrafts.filter((task: Task) => {
        try {
          if (!task.id || !task.projectId) {
            logger.warn('Task missing required fields during filtering', { task })
            return false
          }

          if (task.projectId !== selectedProjectId) return false
          if (!showCompleted && task.completed) return false

          // 統合フラグアプローチ：草稿タスクは一覧に表示しない
          if (isDraftTask(task)) return false

          if (task.parentId) {
            let currentParentId: string | null = task.parentId
            while (currentParentId) {
              const currentParent = allTasksWithDrafts.find((t: Task) => t.id === currentParentId)
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

      return sortTasksHierarchically(basicFilteredTasks, taskRelationMap)

    } catch (error) {
      logger.error('Task filtering and sorting failed', { 
        projectId: selectedProjectId, 
        taskCount: allTasksWithDrafts.length,
        error 
      })
      
      return currentTasks.filter((task: Task) => {
        if (!task.id || !task.projectId) return false
        if (task.projectId !== selectedProjectId) return false
        if (!showCompleted && task.completed) return false
        if (isDraftTask(task)) return false
        return true
      })
    }
  })()

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
    getItemId: (task: Task) => task.id,
    initialSelectedId: null
  })

  const { setTaskRef } = useScrollToTask({
    selectedTaskId
  })

  const selectedTask = (() => {
    try {
      if (!selectedTaskId) return undefined
      return allTasksWithDrafts.find((task: Task) => task.id === selectedTaskId)
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

  const taskOperations = createTaskOperations(taskApiActions, allTasksWithDrafts, selectedProjectId)

  // システムプロンプト準拠：プロジェクト一覧更新処理
  const handleProjectsUpdate = (updatedProjects: any[]) => {
    logger.debug('Projects update requested', { count: updatedProjects.length })
  }

  // 統合フラグアプローチ：草稿タスク作成処理（強化版）
  const handleAddDraftTask = async (parentId: string | null = null, level = 0) => {
    try {
      if (!selectedProjectId) {
        logger.warn('No project selected for draft task creation')
        return
      }

      logger.info('Creating draft task with immediate detail panel focus', { 
        parentId, 
        level, 
        projectId: selectedProjectId 
      })

      const draft = createDraft(selectedProjectId, parentId, level)
      
      // 草稿タスクをローカル状態に追加（一覧には表示されない）
      setAllTasksWithDrafts(prev => [...prev, draft])
      
      // タスクを選択状態にして詳細パネルを即表示
      setSelectedTaskId(draft.id)
      setSelectedTaskIds([draft.id])
      setActiveArea("details")
      setIsDetailPanelVisible(true)
      
      logger.info('Draft task created, detail panel activated', { 
        draftId: draft.id,
        activeArea: "details"
      })
      
    } catch (error) {
      logger.error('Draft task creation failed', { parentId, level, error })
      handleError(error, '草稿タスクの作成に失敗しました')
    }
  }

  // 統合フラグアプローチ：統一された保存処理
  const handleSaveTask = async (taskId: string, updates: Partial<Task>): Promise<Task | null> => {
    try {
      const task = allTasksWithDrafts.find((t: Task) => t.id === taskId)
      if (!task) {
        throw new Error(`Task not found: ${taskId}`)
      }

      if (isDraftTask(task)) {
        // 草稿の場合：新規作成として保存
        logger.info('Saving draft task as new task', { taskId, updates })
        const savedTask = await saveDraft(task, updates, taskApiActions)
        
        // 草稿をローカル状態から削除
        setAllTasksWithDrafts(prev => prev.filter(t => t.id !== taskId))
        
        // タスク一覧を再読み込み
        await loadTasks(selectedProjectId)
        
        // 新しいタスクを選択状態に
        setSelectedTaskId(savedTask.id)
        setSelectedTaskIds([savedTask.id])
        
        logger.info('Draft task saved successfully, switched to new task', { 
          draftId: taskId, 
          newTaskId: savedTask.id 
        })
        
        return savedTask
      } else {
        // 確定タスクの場合：通常の更新
        logger.info('Updating existing task', { taskId, updates })
        await updateTask(taskId, updates)
        await loadTasks(selectedProjectId)
        
        return task
      }
    } catch (error) {
      logger.error('Task save failed', { taskId, updates, error })
      handleError(error, 'タスクの保存に失敗しました')
      return null
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const task = allTasksWithDrafts.find((t: Task) => t.id === taskId)
      if (!task) return

      if (isMultiSelectMode && selectedTaskIds.includes(taskId)) {
        // 確定タスクのみバッチ削除
        const regularTaskIds = filterTasksForBatchOperation(allTasksWithDrafts, selectedTaskIds)
        
        if (regularTaskIds.length > 0) {
          await batchUpdateTasks(BATCH_OPERATIONS.DELETE, regularTaskIds)
        }
        
        // 草稿タスクはローカル状態から削除
        const draftTaskIds = selectedTaskIds.filter(id => {
          const t = allTasksWithDrafts.find(task => task.id === id)
          return t && isDraftTask(t)
        })
        
        if (draftTaskIds.length > 0) {
          setAllTasksWithDrafts(prev => prev.filter(t => !draftTaskIds.includes(t.id)))
          logger.info('Draft tasks discarded', { draftTaskIds })
        }
        
        setSelectedTaskId(null)
        setSelectedTaskIds([])
        setIsMultiSelectMode(false)
      } else {
        // 単一タスクの削除
        if (isDraftTask(task)) {
          // 草稿タスクの場合：ローカル状態から削除
          setAllTasksWithDrafts(prev => prev.filter(t => t.id !== taskId))
          logger.info('Draft task discarded', { taskId })
        } else {
          // 確定タスクの場合：API削除
          await taskOperations.deleteTask(taskId)
        }
        
        if (selectedTaskId === taskId) {
          setSelectedTaskId(null)
          setSelectedTaskIds([])
        }
      }
      
      await loadTasks(selectedProjectId)
    } catch (error) {
      logger.error('Task deletion failed', { taskId, error })
      handleError(error, 'タスクの削除に失敗しました')
    }
  }

  const handleCopyTask = async (taskId: string) => {
    try {
      const task = allTasksWithDrafts.find((t: Task) => t.id === taskId)
      if (!task || !canCopyTask(task)) {
        logger.debug('Copy operation skipped', { taskId, reason: 'invalid_or_draft' })
        return
      }

      if (isMultiSelectMode && selectedTaskIds.includes(taskId)) {
        const validTaskIds = filterTasksForBatchOperation(allTasksWithDrafts, selectedTaskIds)
        if (validTaskIds.length > 0) {
          const copiedTaskList = await taskOperations.copyTasks(validTaskIds)
          setCopiedTasks(copiedTaskList)
        }
      } else {
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
      const currentTask = selectedTaskId ? allTasksWithDrafts.find((t: Task) => t.id === selectedTaskId) : null
      if (currentTask && isDraftTask(currentTask)) {
        logger.debug('Paste operation skipped - draft task selected as parent')
        return
      }
      
      const targetParentId = currentTask ? currentTask.parentId : null
      const targetLevel = currentTask ? currentTask.level : 0

      const success = await taskOperations.pasteTasks(copiedTasks, targetParentId, targetLevel)
      
      if (success) {
        await loadTasks(selectedProjectId)
      }
    } catch (error) {
      logger.error('Task paste failed', { error })
      handleError(error, 'タスク貼り付けに失敗しました')
    }
  }

  const handleToggleTaskCompletion = async (taskId: string) => {
    try {
      const task = allTasksWithDrafts.find((t: Task) => t.id === taskId)
      if (!task || !canCompleteTask(task)) {
        logger.debug('Completion toggle skipped', { taskId, reason: 'invalid_or_draft' })
        return
      }
      
      if (isMultiSelectMode && selectedTaskIds.includes(taskId)) {
        const validTaskIds = filterTasksForBatchOperation(allTasksWithDrafts, selectedTaskIds)
        
        if (validTaskIds.length > 0) {
          const targetTask = allTasksWithDrafts.find((t: Task) => t.id === taskId)
          const newCompletionState = targetTask ? !targetTask.completed : false
          
          const operation = newCompletionState ? BATCH_OPERATIONS.COMPLETE : BATCH_OPERATIONS.INCOMPLETE
          await batchUpdateTasks(operation, validTaskIds)
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
      const task = allTasksWithDrafts.find((t: Task) => t.id === taskId)
      if (!task || !canCollapseTask(task)) {
        logger.debug('Collapse toggle skipped', { taskId, reason: 'invalid_or_draft' })
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
    if (selectedTaskId && isInitialized && !isEditingProject) {
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
  }, [selectedTaskId, isInitialized, isMultiSelectMode, selectedProjectId, isEditingProject, isAddingProject, focusManagement.detailPanelAutoShow, focusManagement.preventNextFocusChange, activeArea])

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

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
    setSelectedTaskId(null)
    setSelectedTaskIds([])
    setActiveArea("projects")
    setIsDetailPanelVisible(false)
    // 草稿タスクもクリア
    setAllTasksWithDrafts(tasks.data || [])
  }

  const handleTaskSelectWrapper = (taskId: string, event?: React.MouseEvent) => {
    handleTaskSelect(taskId, event)
    setActiveArea("tasks")
    setIsDetailPanelVisible(true)
  }

  const { taskNameInputRef, startDateButtonRef, dueDateButtonRef, taskNotesRef, saveButtonRef } = useKeyboardShortcuts({
    tasks: allTasksWithDrafts,
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
    onAddDraftTask: handleAddDraftTask,
    onDeleteTask: handleDeleteTask,
    onCopyTask: handleCopyTask,
    onPasteTask: handlePasteTask,
    onToggleTaskCompletion: handleToggleTaskCompletion,
    onToggleTaskCollapse: handleToggleTaskCollapse,
    onSelectAll: selectAll,
    onHandleKeyboardRangeSelect: handleKeyboardRangeSelect,
    isAddingProject,
    isAddingTask: false, // 統合フラグアプローチ：isAddingTaskは廃止
    isEditingProject
  })

  if (!isInitialized) {
    return (
      <div className="flex h-screen bg-background">
        <LoadingSpinner size="lg" message="アプリケーションを初期化中..." className="m-auto" />
      </div>
    )
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