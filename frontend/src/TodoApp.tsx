// システムプロンプト準拠：メインアプリロジック統合・簡素化

import React, { useState, useEffect } from 'react'
import { AreaType } from './types'
import { ProjectPanel } from './components/ProjectPanel'
import { TaskPanel } from './components/TaskPanel'
import { DetailPanel } from './components/DetailPanel'
import { LoadingSpinner } from './utils/core'
import { useAppState } from './hooks/useAppState'
import { useTaskOperations } from './hooks/useTaskOperations'
import { useKeyboard } from './hooks/useKeyboard'
import { buildTaskRelationMap, filterTasks, sortTasksHierarchically, isDraftTask } from './utils/task'
import { logger } from './utils/core'

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
    setTaskRef
  } = useAppState()

  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [activeArea, setActiveArea] = useState<AreaType>("tasks")
  const [isDetailPanelVisible, setIsDetailPanelVisible] = useState<boolean>(true)
  const [showCompleted, setShowCompleted] = useState<boolean>(true)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [isAddingProject, setIsAddingProject] = useState<boolean>(false)
  const [isEditingProject, setIsEditingProject] = useState<boolean>(false)

  // 草稿タスク込みの全タスク管理
  const [allTasksWithDrafts, setAllTasksWithDrafts] = useState<any[]>([])

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
      return currentTasks.filter(task => task.projectId === selectedProjectId)
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

  // キーボード処理
  const keyboardProps = useKeyboard({
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
    onRangeSelect: (direction) => {
      // 範囲選択実装は簡素化
      logger.info('Range select', { direction })
    },
    copiedTasksCount: copiedTasks.length,
    isInputActive: isAddingProject || isEditingProject
  })

  // 草稿タスク作成
  const handleAddDraftTask = async (parentId: string | null = null, level = 0) => {
    try {
      if (!selectedProjectId) return

      const draft = createDraft(parentId, level)
      if (draft) {
        setSelectedTaskId(draft.id)
        setActiveArea("details")
        setIsDetailPanelVisible(true)
      }
    } catch (error) {
      logger.error('Draft task creation failed', { error })
    }
  }

  // タスク保存（草稿・確定統一）
  const handleSaveTask = async (taskId: string, updates: any) => {
    try {
      const task = allTasksWithDrafts.find(t => t.id === taskId)
      if (!task) return null

      if (isDraftTask(task)) {
        const savedTask = await saveDraft(taskId, updates)
        await loadTasks(selectedProjectId)
        setSelectedTaskId(savedTask.id)
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
  }

  // タスク削除
  const handleDeleteTask = async (taskId: string) => {
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
  }

  // その他のハンドラー（簡素化）
  const handleCopyTask = (taskId: string) => {
    const taskIds = selection.isMultiSelectMode && selection.selectedIds.includes(taskId)
      ? selection.selectedIds
      : [taskId]
    copyTasks(taskIds)
  }

  const handlePasteTask = async () => {
    const currentTask = selection.selectedId ? allTasksWithDrafts.find(t => t.id === selection.selectedId) : null
    const targetParentId = currentTask ? currentTask.parentId : null
    const targetLevel = currentTask ? currentTask.level : 0

    const success = await pasteTasks(targetParentId, targetLevel)
    if (success) {
      await loadTasks(selectedProjectId)
    }
  }

  const handleToggleTaskCompletion = async (taskId: string) => {
    const success = await toggleTaskCompletion(
      taskId, 
      selection.isMultiSelectMode, 
      selection.selectedIds
    )
    if (success) {
      await loadTasks(selectedProjectId)
    }
  }

  const handleToggleTaskCollapse = async (taskId: string) => {
    const success = await toggleTaskCollapse(taskId)
    if (success) {
      await loadTasks(selectedProjectId)
    }
  }

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
  }, [])

  // プロジェクト切り替え時
  useEffect(() => {
    if (selectedProjectId && isInitialized) {
      loadTasks(selectedProjectId)
    }
  }, [selectedProjectId, isInitialized])

  // イベントハンドラー
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
    setSelectedTaskId(null)
    clearSelection()
    setActiveArea("projects")
    setIsDetailPanelVisible(false)
    setAllTasksWithDrafts(tasks.data || [])
  }

  const handleTaskSelectWrapper = (taskId: string, event?: React.MouseEvent) => {
    handleSelect(taskId, filteredTasks, event)
    setActiveArea("tasks")
    setIsDetailPanelVisible(true)
  }

  if (!isInitialized) {
    return (
      <div className="flex h-screen bg-background">
        <LoadingSpinner size="lg" message="アプリケーションを初期化中..." />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
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
          taskNameInputRef={keyboardProps.taskNameInputRef}
          startDateButtonRef={keyboardProps.startDateButtonRef}
          dueDateButtonRef={keyboardProps.dueDateButtonRef}
          taskNotesRef={keyboardProps.taskNotesRef}
          saveButtonRef={keyboardProps.saveButtonRef}
        />
      )}
    </div>
  )
}

export default TodoApp