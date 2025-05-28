import React, { useState, useEffect } from 'react'
import { Project, Task } from './types'
import { ProjectPanel } from './components/ProjectPanel'
import { TaskPanel } from './components/TaskPanel'
import { DetailPanel } from './components/DetailPanel'
import { useTaskRelations } from './hooks/useTaskRelations'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

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

  // 状態管理
  const [selectedProjectId, setSelectedProjectId] = useState<string>("p1")
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>("t1")
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(["t1"])
  const [activeArea, setActiveArea] = useState<"projects" | "tasks" | "details">("tasks")
  const [isDetailPanelVisible, setIsDetailPanelVisible] = useState<boolean>(true)
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false)
  const [showCompleted, setShowCompleted] = useState<boolean>(true)
  const [copiedTasks, setCopiedTasks] = useState<Task[]>([])

  // カスタムフック
  const { taskRelationMap, updateTaskRelationMap } = useTaskRelations(tasks)

  // フィルタリングされたタスク
  const filteredTasks = tasks.filter((task) => {
    if (task.projectId !== selectedProjectId) return false
    if (!showCompleted && task.completed) return false

    if (task.parentId) {
      let currentParentId = task.parentId
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

  const handleTaskSelect = (taskId: string, event?: React.MouseEvent) => {
    if (event && (event.ctrlKey || event.metaKey)) {
      setIsMultiSelectMode(true)
      if (selectedTaskIds.includes(taskId)) {
        setSelectedTaskIds(selectedTaskIds.filter((id) => id !== taskId))
        if (selectedTaskId === taskId) {
          const remainingTasks = selectedTaskIds.filter((id) => id !== taskId)
          setSelectedTaskId(remainingTasks.length > 0 ? remainingTasks[0] : null)
        }
      } else {
        setSelectedTaskIds([...selectedTaskIds, taskId])
        setSelectedTaskId(taskId)
      }
    } else if (event && event.shiftKey && selectedTaskId) {
      setIsMultiSelectMode(true)
      const currentIndex = filteredTasks.findIndex((t) => t.id === taskId)
      const lastIndex = filteredTasks.findIndex((t) => t.id === selectedTaskId)
      
      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex)
        const end = Math.max(currentIndex, lastIndex)
        const tasksInRange = filteredTasks.slice(start, end + 1).map((t) => t.id)
        setSelectedTaskIds(tasksInRange)
        setSelectedTaskId(taskId)
      }
    } else {
      setSelectedTaskId(taskId)
      setSelectedTaskIds([taskId])
      setIsMultiSelectMode(false)
    }

    setActiveArea("tasks")
    setIsDetailPanelVisible(true)
  }

  // キーボードショートカット
  useKeyboardShortcuts({
    tasks,
    setTasks: handleTaskUpdate,
    projects,
    setProjects: handleProjectUpdate,
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
    setIsDetailPanelVisible,
    isMultiSelectMode,
    setIsMultiSelectMode,
    taskRelationMap,
    copiedTasks,
    setCopiedTasks,
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
        onTaskSelect={handleTaskSelect}
        activeArea={activeArea}
        setActiveArea={setActiveArea}
        isDetailPanelVisible={isDetailPanelVisible}
        setIsDetailPanelVisible={setIsDetailPanelVisible}
        isMultiSelectMode={isMultiSelectMode}
        setIsMultiSelectMode={setIsMultiSelectMode}
        showCompleted={showCompleted}
        setShowCompleted={setShowCompleted}
        taskRelationMap={taskRelationMap}
        copiedTasks={copiedTasks}
        setCopiedTasks={setCopiedTasks}
        allTasks={tasks}
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