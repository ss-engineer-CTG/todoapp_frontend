import React, { useState, useEffect } from 'react'
import { Project, Task, AreaType } from './types'
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
import { logger } from './utils/logger'
import { handleError } from './utils/errorHandler'

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
    deleteTask
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

  // フィルタリングされたタスク
  const filteredTasks = currentTasks.filter((task) => {
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
  })

  // 複数選択機能
  const {
    selectedId: selectedTaskId,
    selectedIds: selectedTaskIds,
    isMultiSelectMode,
    lastSelectedIndex,
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
    selectedTaskId,
    taskList: filteredTasks
  })

  // 選択されたタスク
  const selectedTask = currentTasks.find((task) => task.id === selectedTaskId)

  // 初期データ読み込み
  useEffect(() => {
    const initializeApp = async () => {
      try {
        logger.info('Initializing application')
        
        // プロジェクトとタスクを並行読み込み
        const [projectsData] = await Promise.all([
          loadProjects(),
          loadTasks()
        ])

        // 最初のプロジェクトを選択
        if (projectsData.length > 0) {
          setSelectedProjectId(projectsData[0].id)
        }

        setIsInitialized(true)
        logger.info('Application initialized successfully')
      } catch (error) {
        handleError(error, 'アプリケーションの初期化に失敗しました')
      }
    }

    initializeApp()
  }, [])

  // プロジェクト変更時のタスク読み込み
  useEffect(() => {
    if (selectedProjectId && isInitialized) {
      loadTasks(selectedProjectId).catch(error => {
        handleError(error, 'タスクの読み込みに失敗しました')
      })
    }
  }, [selectedProjectId, isInitialized])

  // プロジェクト操作
  const handleProjectUpdate = async (updatedProjects: Project[]) => {
    // この関数は既存のロジックとの互換性のために残しているが、
    // 実際の更新は個別の操作関数で行う
    logger.debug('Project update requested', { count: updatedProjects.length })
  }

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
    setSelectedTaskId(null)
    setSelectedTaskIds([])
    setActiveArea("projects")
    setIsDetailPanelVisible(false)
  }

  // タスク操作
  const handleTaskUpdate = async (updatedTasks: Task[]) => {
    // 楽観的更新は避け、個別の操作関数を使用
    logger.debug('Task update requested', { count: updatedTasks.length })
  }

  const handleTaskSelectWrapper = (taskId: string, event?: React.MouseEvent) => {
    handleTaskSelect(taskId, event)
    setActiveArea("tasks")
    setIsDetailPanelVisible(true)
  }

  // ID生成
  const generateId = (prefix: string) => {
    return `${prefix}${Date.now()}`
  }

  // すべての子タスクを取得
  const getChildTasks = (parentId: string, taskList: Task[]): Task[] => {
    const childIds = taskRelationMap.childrenMap[parentId] || []
    const directChildren = childIds.map((id) => taskList.find((task) => task.id === id)).filter(Boolean) as Task[]

    let allChildren: Task[] = [...directChildren]
    directChildren.forEach((child) => {
      allChildren = [...allChildren, ...getChildTasks(child.id, taskList)]
    })

    return allChildren
  }

  // タスク追加（プレースホルダー関数）
  const handleAddTask = (_parentId: string | null = null, _level = 0) => {
    // TaskPanelで実際の追加処理を行うため、ここでは何もしない
  }

  // タスク削除
  const handleDeleteTask = async (taskId: string) => {
    try {
      if (isMultiSelectMode && selectedTaskIds.includes(taskId)) {
        // 複数選択の場合は一括削除
        for (const id of selectedTaskIds) {
          await deleteTask(id)
        }
        setSelectedTaskId(null)
        setSelectedTaskIds([])
        setIsMultiSelectMode(false)
      } else {
        // 単一削除
        await deleteTask(taskId)
        if (selectedTaskId === taskId) {
          setSelectedTaskId(null)
          setSelectedTaskIds([])
        }
      }
      
      // タスク一覧を再読み込み
      await loadTasks(selectedProjectId)
    } catch (error) {
      handleError(error, 'タスクの削除に失敗しました')
    }
  }

  // タスクコピー（既存ロジック維持）
  const handleCopyTask = (taskId: string) => {
    if (isMultiSelectMode && selectedTaskIds.includes(taskId)) {
      const tasksToCopy = currentTasks.filter((task) => selectedTaskIds.includes(task.id))
      let allTasksToCopy: Task[] = [...tasksToCopy]

      tasksToCopy.forEach((task) => {
        const childTasks = getChildTasks(task.id, currentTasks)
        const unselectedChildTasks = childTasks.filter((childTask) => !selectedTaskIds.includes(childTask.id))
        allTasksToCopy = [...allTasksToCopy, ...unselectedChildTasks]
      })

      setCopiedTasks(allTasksToCopy)
    } else {
      const taskToCopy = currentTasks.find((task) => task.id === taskId)
      if (taskToCopy) {
        const childTasks = getChildTasks(taskId, currentTasks)
        setCopiedTasks([taskToCopy, ...childTasks])
      }
    }
  }

  // タスク貼り付け
  const handlePasteTask = async () => {
    if (copiedTasks.length === 0 || !selectedProjectId) return

    try {
      const currentTask = selectedTaskId ? currentTasks.find((t) => t.id === selectedTaskId) : null
      const targetParentId = currentTask ? currentTask.parentId : null
      const targetLevel = currentTask ? currentTask.level : 0

      // 順次作成（階層構造を維持）
      const idMap: { [key: string]: string } = {}
      
      for (const task of copiedTasks) {
        const newTaskId = generateId("t")
        idMap[task.id] = newTaskId

        const newTask = {
          ...task,
          name: `${task.name} (コピー)`,
          projectId: selectedProjectId,
          parentId: task.parentId ? idMap[task.parentId] || targetParentId : targetParentId,
          level: task.parentId ? task.level : targetLevel,
        }

        await createTask(newTask)
      }

      // タスク一覧を再読み込み
      await loadTasks(selectedProjectId)
      
      logger.info('Tasks pasted successfully', { count: copiedTasks.length })
    } catch (error) {
      handleError(error, 'タスクの貼り付けに失敗しました')
    }
  }

  // タスク完了状態切り替え
  const handleToggleTaskCompletion = async (taskId: string) => {
    try {
      const task = currentTasks.find(t => t.id === taskId)
      if (!task) return

      const newCompletionState = !task.completed
      
      await updateTask(taskId, {
        completed: newCompletionState,
        completionDate: newCompletionState ? new Date() : null
      })

      // タスク一覧を再読み込み
      await loadTasks(selectedProjectId)
    } catch (error) {
      handleError(error, 'タスクの完了状態切り替えに失敗しました')
    }
  }

  // タスク折りたたみ切り替え
  const handleToggleTaskCollapse = async (taskId: string) => {
    try {
      const task = currentTasks.find(t => t.id === taskId)
      if (!task) return

      await updateTask(taskId, { collapsed: !task.collapsed })
      
      // タスク一覧を再読み込み
      await loadTasks(selectedProjectId)
    } catch (error) {
      handleError(error, 'タスクの折りたたみ切り替えに失敗しました')
    }
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
          lastSelectedIndex={lastSelectedIndex}
          apiActions={{
            createTask,
            updateTask,
            loadTasks: () => loadTasks(selectedProjectId)
          }}
        />

        {isDetailPanelVisible && (
          <DetailPanel
            selectedTask={selectedTask}
            onTaskUpdate={async (taskId, updates) => {
              try {
                await updateTask(taskId, updates)
                await loadTasks(selectedProjectId)
              } catch (error) {
                handleError(error, 'タスクの更新に失敗しました')
              }
            }}
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