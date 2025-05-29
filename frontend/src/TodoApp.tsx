import React, { useState, useEffect } from 'react'
import { Project, Task, AreaType } from './types'
import { ProjectPanel } from './components/ProjectPanel'
import { TaskPanel } from './components/TaskPanel'
import { DetailPanel } from './components/DetailPanel'
import { useTaskRelations } from './hooks/useTaskRelations'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useMultiSelect } from './hooks/useMultiSelect'

const TodoApp: React.FC = () => {
  // 初期データ
  const [projects, setProjects] = useState<Project[]>([
    { id: "p1", name: "仕事", color: "#f97316", collapsed: false },
    { id: "p2", name: "個人", color: "#8b5cf6", collapsed: false },
    { id: "p3", name: "学習", color: "#10b981", collapsed: false },
  ])

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "t1",
      name: "プロジェクト提案書を完成させる",
      projectId: "p1",
      parentId: null,
      completed: false,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 86400000 * 3),
      completionDate: null,
      notes: "予算見積もりとスケジュールを含める",
      assignee: "自分",
      level: 0,
      collapsed: false,
    },
    {
      id: "t2",
      name: "競合他社の調査",
      projectId: "p1",
      parentId: "t1",
      completed: false,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 86400000 * 2),
      completionDate: null,
      notes: "価格と機能に焦点を当てる",
      assignee: "自分",
      level: 1,
      collapsed: false,
    },
    {
      id: "t3",
      name: "プレゼンテーションスライドの作成",
      projectId: "p1",
      parentId: "t1",
      completed: false,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 86400000 * 3),
      completionDate: null,
      notes: "会社のテンプレートを使用する",
      assignee: "自分",
      level: 1,
      collapsed: false,
    },
    {
      id: "t4",
      name: "食料品の買い物",
      projectId: "p2",
      parentId: null,
      completed: false,
      startDate: new Date(),
      dueDate: new Date(),
      completionDate: null,
      notes: "牛乳と卵を忘れないように",
      assignee: "自分",
      level: 0,
      collapsed: false,
    },
    {
      id: "t5",
      name: "Reactを学ぶ",
      projectId: "p3",
      parentId: null,
      completed: false,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 86400000 * 7),
      completionDate: null,
      notes: "オンラインコースを完了する",
      assignee: "自分",
      level: 0,
      collapsed: false,
    },
    {
      id: "t6",
      name: "練習プロジェクトの構築",
      projectId: "p3",
      parentId: "t5",
      completed: false,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 86400000 * 10),
      completionDate: null,
      notes: "ReactでTodoアプリを作る",
      assignee: "自分",
      level: 1,
      collapsed: false,
    },
  ])

  // 基本状態管理
  const [selectedProjectId, setSelectedProjectId] = useState<string>("p1")
  const [activeArea, setActiveArea] = useState<AreaType>("tasks")
  const [isDetailPanelVisible, setIsDetailPanelVisible] = useState<boolean>(true)
  const [showCompleted, setShowCompleted] = useState<boolean>(true)
  const [copiedTasks, setCopiedTasks] = useState<Task[]>([])

  // 編集状態管理
  const [isAddingProject, setIsAddingProject] = useState<boolean>(false)
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false)
  const [isEditingProject, setIsEditingProject] = useState<boolean>(false)

  // カスタムフック
  const { taskRelationMap, updateTaskRelationMap } = useTaskRelations(tasks)

  // 複数選択機能
  const {
    selectedId: selectedTaskId,
    selectedIds: selectedTaskIds,
    isMultiSelectMode,
    handleSelect: handleTaskSelect,
    handleKeyboardRangeSelect,
    selectAll,
    clearSelection,
    toggleMultiSelectMode,
    setSelectedId: setSelectedTaskId,
    setSelectedIds: setSelectedTaskIds,
    setIsMultiSelectMode
  } = useMultiSelect({
    items: tasks.filter(task => task.projectId === selectedProjectId),
    getItemId: (task) => task.id,
    initialSelectedId: "t1"
  })

  // フィルタリングされたタスク
  const filteredTasks = tasks.filter((task) => {
    if (task.projectId !== selectedProjectId) return false
    if (!showCompleted && task.completed) return false

    if (task.parentId) {
      let currentParentId: string | null = task.parentId
      while (currentParentId) {
        const currentParent = tasks.find((t) => t.id === currentParentId)
        if (currentParent && currentParent.collapsed) return false
        currentParentId = taskRelationMap.parentMap[currentParentId] || null
      }
    }

    return true
  })

  // 選択されたタスク
  const selectedTask = tasks.find((task) => task.id === selectedTaskId)

  // プロジェクト操作
  const handleProjectUpdate = (updatedProjects: Project[]) => {
    setProjects(updatedProjects)
  }

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
    setSelectedTaskId(null)
    setSelectedTaskIds([])
    setActiveArea("projects")
    setIsDetailPanelVisible(false)
  }

  // タスク操作
  const handleTaskUpdate = (updatedTasks: Task[]) => {
    setTasks(updatedTasks)
    updateTaskRelationMap(updatedTasks)
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

  // タスク追加
  const handleAddTask = (parentId: string | null = null, level = 0) => {
    setIsAddingTask(true)
    // TaskPanelで実際の追加処理を行う
  }

  // タスク削除
  const handleDeleteTask = (taskId: string) => {
    if (isMultiSelectMode && selectedTaskIds.includes(taskId)) {
      let allTaskIdsToDelete: string[] = []

      selectedTaskIds.forEach((id) => {
        const childTaskIds = getChildTasks(id, tasks).map((task) => task.id)
        allTaskIdsToDelete = [...allTaskIdsToDelete, id, ...childTaskIds]
      })

      allTaskIdsToDelete = [...new Set(allTaskIdsToDelete)]
      const updatedTasks = tasks.filter((task) => !allTaskIdsToDelete.includes(task.id))
      handleTaskUpdate(updatedTasks)

      setSelectedTaskId(null)
      setSelectedTaskIds([])
      setIsMultiSelectMode(false)
    } else {
      const childTaskIds = getChildTasks(taskId, tasks).map((task) => task.id)
      const allTaskIdsToDelete = [taskId, ...childTaskIds]
      const updatedTasks = tasks.filter((task) => !allTaskIdsToDelete.includes(task.id))
      handleTaskUpdate(updatedTasks)

      if (selectedTaskId === taskId) {
        setSelectedTaskId(null)
        setSelectedTaskIds([])
      }
    }
  }

  // タスクコピー
  const handleCopyTask = (taskId: string) => {
    if (isMultiSelectMode && selectedTaskIds.includes(taskId)) {
      const tasksToCopy = tasks.filter((task) => selectedTaskIds.includes(task.id))
      let allTasksToCopy: Task[] = [...tasksToCopy]

      tasksToCopy.forEach((task) => {
        const childTasks = getChildTasks(task.id, tasks)
        const unselectedChildTasks = childTasks.filter((childTask) => !selectedTaskIds.includes(childTask.id))
        allTasksToCopy = [...allTasksToCopy, ...unselectedChildTasks]
      })

      setCopiedTasks(allTasksToCopy)
    } else {
      const taskToCopy = tasks.find((task) => task.id === taskId)
      if (taskToCopy) {
        const childTasks = getChildTasks(taskId, tasks)
        setCopiedTasks([taskToCopy, ...childTasks])
      }
    }
  }

  // タスク貼り付け
  const handlePasteTask = () => {
    if (copiedTasks.length === 0 || !selectedProjectId) return

    const newTasks: Task[] = []
    const idMap: { [key: string]: string } = {}

    const rootTasks = copiedTasks.filter((task) => !task.parentId || !copiedTasks.some((t) => t.id === task.parentId))
    const currentTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null
    const targetParentId = currentTask ? currentTask.parentId : null
    const targetLevel = currentTask ? currentTask.level : 0

    rootTasks.forEach((rootTask) => {
      const newTaskId = generateId("t")
      idMap[rootTask.id] = newTaskId

      const newTask: Task = {
        ...rootTask,
        id: newTaskId,
        name: `${rootTask.name}${rootTasks.length === 1 ? " (コピー)" : ""}`,
        projectId: selectedProjectId,
        parentId: targetParentId,
        level: targetLevel,
      }

      newTasks.push(newTask)
    })

    const childTasks = copiedTasks.filter((task) => task.parentId && copiedTasks.some((t) => t.id === task.parentId))

    childTasks.forEach((childTask) => {
      const newChildId = generateId("t")
      idMap[childTask.id] = newChildId

      const newParentId = childTask.parentId ? idMap[childTask.parentId] : null
      const parentTask = newTasks.find((t) => t.id === newParentId)
      const newLevel = parentTask ? parentTask.level + 1 : childTask.level

      const newTask: Task = {
        ...childTask,
        id: newChildId,
        name: childTask.name,
        projectId: selectedProjectId,
        parentId: newParentId,
        level: newLevel,
      }

      newTasks.push(newTask)
    })

    handleTaskUpdate([...tasks, ...newTasks])

    if (newTasks.length > 0) {
      setSelectedTaskId(newTasks[0].id)
      setSelectedTaskIds([newTasks[0].id])
      setIsMultiSelectMode(false)
    }
  }

  // タスク完了状態切り替え
  const handleToggleTaskCompletion = (taskId: string) => {
    if (isMultiSelectMode && selectedTaskIds.includes(taskId)) {
      const targetTask = tasks.find((t) => t.id === taskId)
      const newCompletionState = targetTask ? !targetTask.completed : false

      const updatedTasks = [...tasks]

      selectedTaskIds.forEach((id) => {
        const taskIndex = updatedTasks.findIndex((task) => task.id === id)
        if (taskIndex !== -1) {
          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            completed: newCompletionState,
            completionDate: newCompletionState ? new Date() : null,
          }

          const childTasks = getChildTasks(id, updatedTasks)
          childTasks.forEach((childTask) => {
            const childIndex = updatedTasks.findIndex((task) => task.id === childTask.id)
            if (childIndex !== -1) {
              updatedTasks[childIndex] = {
                ...updatedTasks[childIndex],
                completed: newCompletionState,
                completionDate: newCompletionState ? new Date() : null,
              }
            }
          })
        }
      })

      handleTaskUpdate(updatedTasks)
    } else {
      const updatedTasks = [...tasks]
      const taskIndex = updatedTasks.findIndex((task) => task.id === taskId)

      if (taskIndex !== -1) {
        const isCompleting = !updatedTasks[taskIndex].completed
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          completed: isCompleting,
          completionDate: isCompleting ? new Date() : null,
        }

        const childTasks = getChildTasks(taskId, updatedTasks)
        childTasks.forEach((childTask) => {
          const childIndex = updatedTasks.findIndex((task) => task.id === childTask.id)
          if (childIndex !== -1) {
            updatedTasks[childIndex] = {
              ...updatedTasks[childIndex],
              completed: isCompleting,
              completionDate: isCompleting ? new Date() : null,
            }
          }
        })

        handleTaskUpdate(updatedTasks)
      }
    }
  }

  // タスク折りたたみ切り替え
  const handleToggleTaskCollapse = (taskId: string) => {
    handleTaskUpdate(
      tasks.map((task) => (task.id === taskId ? { ...task, collapsed: !task.collapsed } : task))
    )
  }

  // 全選択
  const handleSelectAll = () => {
    if (filteredTasks.length === 0) return

    setIsMultiSelectMode(true)
    const allIds = filteredTasks.map((task) => task.id)
    setSelectedTaskIds(allIds)

    if (!selectedTaskId && filteredTasks.length > 0) {
      setSelectedTaskId(filteredTasks[0].id)
    }
  }

  // プロジェクト変更時のタスク選択リセット
  useEffect(() => {
    const projectTasks = tasks.filter(task => task.projectId === selectedProjectId)
    if (projectTasks.length > 0) {
      const firstTaskId = projectTasks[0].id
      setSelectedTaskId(firstTaskId)
      setSelectedTaskIds([firstTaskId])
    } else {
      setSelectedTaskId(null)
      setSelectedTaskIds([])
    }
    setIsMultiSelectMode(false)
  }, [selectedProjectId])

  // キーボードショートカット
  useKeyboardShortcuts({
    tasks,
    setTasks: handleTaskUpdate,
    projects,
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
    setCopiedTasks,
    onAddTask: handleAddTask,
    onDeleteTask: handleDeleteTask,
    onCopyTask: handleCopyTask,
    onPasteTask: handlePasteTask,
    onToggleTaskCompletion: handleToggleTaskCompletion,
    onToggleTaskCollapse: handleToggleTaskCollapse,
    onSelectAll: handleSelectAll,
    onHandleKeyboardRangeSelect: handleKeyboardRangeSelect,
    isAddingProject,
    isAddingTask,
    isEditingProject
  })

  return (
    <div className="flex h-screen bg-background">
      <ProjectPanel
        projects={projects}
        onProjectsUpdate={handleProjectUpdate}
        selectedProjectId={selectedProjectId}
        onProjectSelect={handleProjectSelect}
        activeArea={activeArea}
        setActiveArea={setActiveArea}
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
        setCopiedTasks={setCopiedTasks}
        allTasks={tasks}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
        onCopyTask={handleCopyTask}
        onToggleTaskCompletion={handleToggleTaskCompletion}
        onToggleTaskCollapse={handleToggleTaskCollapse}
        onClearSelection={clearSelection}
      />

      {isDetailPanelVisible && (
        <DetailPanel
          selectedTask={selectedTask}
          onTaskUpdate={(taskId, updates) => {
            const updatedTasks = tasks.map((task) =>
              task.id === taskId ? { ...task, ...updates } : task
            )
            handleTaskUpdate(updatedTasks)
          }}
          projects={projects}
          activeArea={activeArea}
          setActiveArea={setActiveArea}
          isVisible={isDetailPanelVisible}
          setIsVisible={setIsDetailPanelVisible}
        />
      )}
    </div>
  )
}

export default TodoApp