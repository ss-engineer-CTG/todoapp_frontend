import React, { useState, useEffect } from 'react'
import { Project, Task, AreaType, BatchOperation } from './types'
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
  // API フック
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
    batchUpdateTasks
  } = useApi()

  // 基本状態管理
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [activeArea, setActiveArea] = useState<AreaType>("tasks")
  const [isDetailPanelVisible, setIsDetailPanelVisible] = useState<boolean>(true)
  const [showCompleted, setShowCompleted] = useState<boolean>(true)
  const [copiedTasks, setCopiedTasks] = useState<Task[]>([])
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  // 編集状態管理
  const [isAddingProject, setIsAddingProject] = useState<boolean>(false)
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false)
  const [isEditingProject, setIsEditingProject] = useState<boolean>(false)

  // 現在のプロジェクトとタスクデータ
  const currentProjects = projects.data || []
  const currentTasks = tasks.data || []

  // カスタムフック
  const { taskRelationMap } = useTaskRelations(currentTasks)

  // システムプロンプト準拠：安全なタスクフィルタリング
  const filteredTasks = currentTasks.filter((task) => {
    try {
      // 基本検証
      if (!task.id || !task.projectId) {
        logger.warn('Task missing required fields during filtering', { task })
        return false
      }

      if (task.projectId !== selectedProjectId) return false
      if (!showCompleted && task.completed) return false

      // 親タスクの折りたたみ状態をチェック
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

  // 複数選択機能
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

  // スクロール管理
  const { setTaskRef } = useScrollToTask({
    selectedTaskId
  })

  // 選択されたタスク（システムプロンプト準拠：安全な取得）
  const selectedTask = (() => {
    try {
      if (!selectedTaskId) return undefined
      return currentTasks.find((task) => task.id === selectedTaskId)
    } catch (error) {
      logger.error('Error finding selected task', { selectedTaskId, error })
      return undefined
    }
  })()

  // TaskOperationsインスタンス作成
  const taskApiActions = {
    createTask,
    updateTask,
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

  // システムプロンプト準拠：修正 - タスク追加処理の完全実装
  const handleAddTask = async (parentId: string | null = null, level = 0) => {
    try {
      logger.info('Adding task via shortcut', { parentId, level })
      
      const createdTask = await taskOperations.addTask(parentId, level)
      if (createdTask) {
        setSelectedTaskId(createdTask.id)
        setSelectedTaskIds([createdTask.id])
        setActiveArea("tasks")
        setIsDetailPanelVisible(true)
        
        logger.info('Task added successfully via shortcut', { 
          taskId: createdTask.id,
          taskName: createdTask.name 
        })
      }
    } catch (error) {
      logger.error('Task addition via shortcut failed', { parentId, level, error })
      handleError(error, 'ショートカットによるタスク追加に失敗しました')
    }
  }

  // システムプロンプト準拠：修正 - タスク削除処理の実装
  const handleDeleteTask = async (taskId: string) => {
    try {
      logger.info('Deleting task', { taskId, isMultiSelect: isMultiSelectMode })
      
      if (isMultiSelectMode && selectedTaskIds.includes(taskId)) {
        // 複数選択の場合は一括削除
        await batchUpdateTasks(BATCH_OPERATIONS.DELETE, selectedTaskIds)
        setSelectedTaskId(null)
        setSelectedTaskIds([])
        setIsMultiSelectMode(false)
        logger.info('Batch delete completed', { taskCount: selectedTaskIds.length })
      } else {
        // 単一削除
        const success = await taskOperations.deleteTask(taskId)
        if (success && selectedTaskId === taskId) {
          setSelectedTaskId(null)
          setSelectedTaskIds([])
        }
        logger.info('Single task deleted', { taskId })
      }
      
      // タスク一覧を再読み込み
      await loadTasks(selectedProjectId)
    } catch (error) {
      logger.error('Task deletion failed', { taskId, error })
      handleError(error, 'タスクの削除に失敗しました')
    }
  }

  // システムプロンプト準拠：修正 - タスクコピー処理の実装
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

  // システムプロンプト準拠：修正 - タスク貼り付け処理の実装
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
        logger.info('Tasks pasted successfully via shortcut', { count: copiedTasks.length })
      }
    } catch (error) {
      logger.error('Task paste via shortcut failed', { error })
      handleError(error, 'ショートカットによるタスク貼り付けに失敗しました')
    }
  }

  // システムプロンプト準拠：修正 - タスク完了状態切り替えの実装
  const handleToggleTaskCompletion = async (taskId: string) => {
    try {
      logger.info('Toggling task completion', { taskId, isMultiSelect: isMultiSelectMode })
      
      if (isMultiSelectMode && selectedTaskIds.includes(taskId)) {
        // 複数選択の場合は一括切り替え
        const targetTask = currentTasks.find(t => t.id === taskId)
        const newCompletionState = targetTask ? !targetTask.completed : false
        
        const operation = newCompletionState ? BATCH_OPERATIONS.COMPLETE : BATCH_OPERATIONS.INCOMPLETE
        await batchUpdateTasks(operation, selectedTaskIds)
        
        logger.info('Batch completion toggle', { 
          taskCount: selectedTaskIds.length, 
          newState: newCompletionState 
        })
      } else {
        // 単一タスクの場合
        await taskOperations.toggleTaskCompletion(taskId)
        logger.info('Single task completion toggle', { taskId })
      }

      // タスク一覧を再読み込み
      await loadTasks(selectedProjectId)
    } catch (error) {
      logger.error('Task completion toggle failed', { taskId, error })
      handleError(error, 'タスクの完了状態切り替えに失敗しました')
    }
  }

  // システムプロンプト準拠：修正 - タスク折りたたみ切り替えの実装
  const handleToggleTaskCollapse = async (taskId: string) => {
    try {
      const success = await taskOperations.toggleTaskCollapse(taskId)
      
      if (success) {
        // タスク一覧を再読み込み
        await loadTasks(selectedProjectId)
      }
    } catch (error) {
      logger.error('Task collapse toggle failed', { taskId, error })
      handleError(error, 'タスクの折りたたみ切り替えに失敗しました')
    }
  }

  // システムプロンプト準拠：初期データ読み込み（順序調整）
  useEffect(() => {
    const initializeApp = async () => {
      try {
        logger.info('Initializing application')
        
        // 1. プロジェクトを先に読み込み
        const projectsData = await loadProjects()
        logger.info('Projects loaded during initialization', { count: projectsData.length })

        // 2. 最初のプロジェクトを選択
        if (projectsData.length > 0) {
          const firstProject = projectsData[0]
          setSelectedProjectId(firstProject.id)
          logger.info('Selected initial project', { projectId: firstProject.id, name: firstProject.name })
          
          // 3. 選択されたプロジェクトのタスクを読み込み
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
            // プロジェクトは読み込めたので、初期化は継続
          }
        } else {
          logger.warn('No projects found during initialization')
        }

        setIsInitialized(true)
        logger.info('Application initialized successfully')
      } catch (error) {
        logger.error('Application initialization failed', { error })
        handleError(error, 'アプリケーションの初期化に失敗しました')
        setIsInitialized(true) // エラーでも画面は表示する
      }
    }

    initializeApp()
  }, [])

  // プロジェクト変更時のタスク読み込み（システムプロンプト準拠：条件付き実行）
  useEffect(() => {
    if (selectedProjectId && isInitialized) {
      logger.info('Project selection changed, loading tasks', { projectId: selectedProjectId })
      
      loadTasks(selectedProjectId).catch(error => {
        logger.error('Failed to load tasks for project', { projectId: selectedProjectId, error })
        handleError(error, 'タスクの読み込みに失敗しました')
      })
    }
  }, [selectedProjectId, isInitialized, loadTasks])

  // プロジェクト操作
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

  // タスク操作
  const handleTaskUpdate = async (updatedTasks: Task[]) => {
    logger.debug('Task update requested', { count: updatedTasks.length })
  }

  const handleTaskSelectWrapper = (taskId: string, event?: React.MouseEvent) => {
    logger.debug('Task selected', { taskId })
    handleTaskSelect(taskId, event)
    setActiveArea("tasks")
    setIsDetailPanelVisible(true)
  }

  // キーボードショートカット
  const { taskNameInputRef, startDateButtonRef, dueDateButtonRef, taskNotesRef } = useKeyboardShortcuts({
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

  // 初期化中のローディング表示
  if (!isInitialized) {
    return (
      <div className="flex h-screen bg-background">
        <LoadingSpinner size="lg" message="アプリケーションを初期化中..." className="m-auto" />
      </div>
    )
  }

  // システムプロンプト準拠：安全なタスク更新処理
  const handleTaskDetailUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      // 日付フィールドの検証
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
          />
        )}
      </div>
    </ErrorBoundary>
  )
}

export default TodoApp