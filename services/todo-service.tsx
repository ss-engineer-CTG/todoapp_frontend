"use client"

import type { TodoState, TodoAction, Project, Task, TaskRelationMap } from "@/types/todo"

// 初期データ
export const initialState: TodoState = {
  projects: [
    { 
      id: "p1", 
      name: "仕事", 
      color: "#f97316", 
      collapsed: false 
    },
    { 
      id: "p2", 
      name: "個人", 
      color: "#8b5cf6", 
      collapsed: false 
    },
    { 
      id: "p3", 
      name: "学習", 
      color: "#10b981", 
      collapsed: false 
    },
  ],
  tasks: [
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
      status: 'in-progress'
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
      status: 'not-started'
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
      status: 'not-started'
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
      status: 'not-started'
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
      status: 'in-progress'
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
      status: 'not-started'
    },
  ],
  selectedProjectId: "p1",
  selectedTaskIds: ["t1"],
  isMultiSelectMode: false,
  showCompleted: true,
  isDetailPanelVisible: true,
  activeArea: "tasks",
  copiedTasks: [],
  taskRelationMap: { childrenMap: {}, parentMap: {} },
  isAddingProject: false,
  isAddingTask: false,
  isEditingProject: false
}

// ユニークID生成
const generateId = (prefix: string): string => {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// タスク関係マップの初期化
export const initializeTaskRelationMap = (tasks: Task[]): TaskRelationMap => {
  const childrenMap: { [parentId: string]: string[] } = {}
  const parentMap: { [childId: string]: string | null } = {}

  tasks.forEach((task) => {
    if (task.parentId === null) {
      childrenMap["root"] = childrenMap["root"] || []
      childrenMap["root"].push(task.id)
      parentMap[task.id] = null
    } else {
      childrenMap[task.parentId] = childrenMap[task.parentId] || []
      childrenMap[task.parentId].push(task.id)
      parentMap[task.id] = task.parentId
    }
  })

  return { childrenMap, parentMap }
}

// 初期状態にタスク関係マップを追加
initialState.taskRelationMap = initializeTaskRelationMap(initialState.tasks)

// すべての子タスクを取得
const getAllChildTasks = (parentId: string, tasks: Task[], relationMap: TaskRelationMap): Task[] => {
  const childIds = relationMap.childrenMap[parentId] || []
  const directChildren = childIds.map(id => tasks.find(task => task.id === id)).filter(Boolean) as Task[]

  let allChildren: Task[] = [...directChildren]
  directChildren.forEach(child => {
    allChildren = [...allChildren, ...getAllChildTasks(child.id, tasks, relationMap)]
  })

  return allChildren
}

// タスクの状態を自動判定
const determineTaskStatus = (task: Task): Task['status'] => {
  const now = new Date()
  
  if (task.completed) return 'completed'
  if (task.dueDate < now) return 'overdue'
  if (task.startDate <= now) return 'in-progress'
  return 'not-started'
}

// Reducerの実装
export const todoReducer = (state: TodoState, action: TodoAction): TodoState => {
  switch (action.type) {
    case 'LOAD_DATA':
      return {
        ...action.payload,
        taskRelationMap: initializeTaskRelationMap(action.payload.tasks)
      }

    case 'ADD_PROJECT': {
      const newProject: Project = {
        ...action.payload,
        id: generateId('p')
      }
      
      return {
        ...state,
        projects: [...state.projects, newProject],
        selectedProjectId: newProject.id
      }
    }

    case 'UPDATE_PROJECT': {
      const { id, updates } = action.payload
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === id ? { ...project, ...updates } : project
        )
      }
    }

    case 'DELETE_PROJECT': {
      const projectId = action.payload
      const remainingProjects = state.projects.filter(p => p.id !== projectId)
      const remainingTasks = state.tasks.filter(t => t.projectId !== projectId)
      
      return {
        ...state,
        projects: remainingProjects,
        tasks: remainingTasks,
        selectedProjectId: remainingProjects.length > 0 ? remainingProjects[0].id : "",
        selectedTaskIds: [],
        taskRelationMap: initializeTaskRelationMap(remainingTasks)
      }
    }

    case 'SELECT_PROJECT': {
      return {
        ...state,
        selectedProjectId: action.payload,
        selectedTaskIds: [],
        activeArea: "projects",
        isDetailPanelVisible: false
      }
    }

    case 'TOGGLE_PROJECT_COLLAPSE': {
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload 
            ? { ...project, collapsed: !project.collapsed }
            : project
        )
      }
    }

    case 'ADD_TASK': {
      const newTask: Task = {
        ...action.payload,
        id: generateId('t'),
        status: determineTaskStatus({ ...action.payload, id: '' })
      }
      
      const updatedTasks = [...state.tasks, newTask]
      
      return {
        ...state,
        tasks: updatedTasks,
        selectedTaskIds: [newTask.id],
        taskRelationMap: initializeTaskRelationMap(updatedTasks)
      }
    }

    case 'UPDATE_TASK': {
      const { id, updates } = action.payload
      const updatedTasks = state.tasks.map(task => {
        if (task.id === id) {
          const updatedTask = { ...task, ...updates }
          return {
            ...updatedTask,
            status: determineTaskStatus(updatedTask)
          }
        }
        return task
      })
      
      return {
        ...state,
        tasks: updatedTasks,
        taskRelationMap: 'parentId' in updates 
          ? initializeTaskRelationMap(updatedTasks)
          : state.taskRelationMap
      }
    }

    case 'DELETE_TASK': {
      const taskId = action.payload
      const childTasks = getAllChildTasks(taskId, state.tasks, state.taskRelationMap)
      const allTaskIdsToDelete = [taskId, ...childTasks.map(t => t.id)]
      
      const updatedTasks = state.tasks.filter(task => !allTaskIdsToDelete.includes(task.id))
      
      return {
        ...state,
        tasks: updatedTasks,
        selectedTaskIds: state.selectedTaskIds.filter(id => !allTaskIdsToDelete.includes(id)),
        taskRelationMap: initializeTaskRelationMap(updatedTasks)
      }
    }

    case 'DELETE_TASKS': {
      const taskIds = action.payload
      let allTaskIdsToDelete: string[] = []
      
      taskIds.forEach(taskId => {
        const childTasks = getAllChildTasks(taskId, state.tasks, state.taskRelationMap)
        allTaskIdsToDelete = [...allTaskIdsToDelete, taskId, ...childTasks.map(t => t.id)]
      })
      
      allTaskIdsToDelete = [...new Set(allTaskIdsToDelete)]
      const updatedTasks = state.tasks.filter(task => !allTaskIdsToDelete.includes(task.id))
      
      return {
        ...state,
        tasks: updatedTasks,
        selectedTaskIds: [],
        isMultiSelectMode: false,
        taskRelationMap: initializeTaskRelationMap(updatedTasks)
      }
    }

    case 'SELECT_TASK': {
      const { id, event } = action.payload
      
      if (event && (event.ctrlKey || event.metaKey)) {
        // Ctrl/Cmd+クリック：複数選択
        const newSelectedIds = state.selectedTaskIds.includes(id)
          ? state.selectedTaskIds.filter(taskId => taskId !== id)
          : [...state.selectedTaskIds, id]
          
        return {
          ...state,
          selectedTaskIds: newSelectedIds,
          isMultiSelectMode: true,
          activeArea: "tasks",
          isDetailPanelVisible: true
        }
      } else if (event && event.shiftKey && state.selectedTaskIds.length > 0) {
        // Shift+クリック：範囲選択
        const filteredTasks = state.tasks.filter(task => 
          task.projectId === state.selectedProjectId &&
          (state.showCompleted || !task.completed)
        )
        
        const currentIndex = filteredTasks.findIndex(t => t.id === id)
        const lastIndex = filteredTasks.findIndex(t => t.id === state.selectedTaskIds[0])
        
        if (currentIndex !== -1 && lastIndex !== -1) {
          const start = Math.min(currentIndex, lastIndex)
          const end = Math.max(currentIndex, lastIndex)
          const tasksInRange = filteredTasks.slice(start, end + 1).map(t => t.id)
          
          return {
            ...state,
            selectedTaskIds: tasksInRange,
            isMultiSelectMode: true,
            activeArea: "tasks",
            isDetailPanelVisible: true
          }
        }
      }
      
      // 通常の単一選択
      return {
        ...state,
        selectedTaskIds: [id],
        isMultiSelectMode: false,
        activeArea: "tasks",
        isDetailPanelVisible: true
      }
    }

    case 'TOGGLE_TASK_COMPLETION': {
      const taskId = action.payload
      const taskIndex = state.tasks.findIndex(task => task.id === taskId)
      
      if (taskIndex === -1) return state
      
      const task = state.tasks[taskIndex]
      const isCompleting = !task.completed
      const updatedTasks = [...state.tasks]
      
      // メインタスクの更新
      updatedTasks[taskIndex] = {
        ...task,
        completed: isCompleting,
        completionDate: isCompleting ? new Date() : null,
        status: isCompleting ? 'completed' : determineTaskStatus({ ...task, completed: false })
      }
      
      // 子タスクも同じ状態に更新
      const childTasks = getAllChildTasks(taskId, state.tasks, state.taskRelationMap)
      childTasks.forEach(childTask => {
        const childIndex = updatedTasks.findIndex(t => t.id === childTask.id)
        if (childIndex !== -1) {
          updatedTasks[childIndex] = {
            ...updatedTasks[childIndex],
            completed: isCompleting,
            completionDate: isCompleting ? new Date() : null,
            status: isCompleting ? 'completed' : determineTaskStatus({ ...updatedTasks[childIndex], completed: false })
          }
        }
      })
      
      return {
        ...state,
        tasks: updatedTasks
      }
    }

    case 'TOGGLE_TASK_COLLAPSE': {
      const { id, forceState } = action.payload
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === id 
            ? { ...task, collapsed: forceState !== undefined ? !forceState : !task.collapsed }
            : task
        )
      }
    }

    case 'COPY_TASK': {
      const taskId = action.payload
      const taskToCopy = state.tasks.find(task => task.id === taskId)
      
      if (taskToCopy) {
        const childTasks = getAllChildTasks(taskId, state.tasks, state.taskRelationMap)
        
        return {
          ...state,
          copiedTasks: [taskToCopy, ...childTasks]
        }
      }
      
      return state
    }

    case 'COPY_TASKS': {
      const taskIds = action.payload
      const tasksToCopy = state.tasks.filter(task => taskIds.includes(task.id))
      let allTasksToCopy: Task[] = [...tasksToCopy]
      
      tasksToCopy.forEach(task => {
        const childTasks = getAllChildTasks(task.id, state.tasks, state.taskRelationMap)
        const unselectedChildTasks = childTasks.filter(childTask => !taskIds.includes(childTask.id))
        allTasksToCopy = [...allTasksToCopy, ...unselectedChildTasks]
      })
      
      return {
        ...state,
        copiedTasks: allTasksToCopy
      }
    }

    case 'PASTE_TASK': {
      if (state.copiedTasks.length === 0 || !state.selectedProjectId) return state
      
      const newTasks: Task[] = []
      const idMap: { [key: string]: string } = {}
      
      const rootTasks = state.copiedTasks.filter(task => 
        !task.parentId || !state.copiedTasks.some(t => t.id === task.parentId)
      )
      
      const currentTask = state.selectedTaskIds.length > 0 
        ? state.tasks.find(t => t.id === state.selectedTaskIds[0])
        : null
      
      const targetParentId = currentTask ? currentTask.parentId : null
      const targetLevel = currentTask ? currentTask.level : 0
      
      // ルートタスクを処理
      rootTasks.forEach(rootTask => {
        const newTaskId = generateId('t')
        idMap[rootTask.id] = newTaskId
        
        const newTask: Task = {
          ...rootTask,
          id: newTaskId,
          name: `${rootTask.name}${rootTasks.length === 1 ? " (コピー)" : ""}`,
          projectId: state.selectedProjectId,
          parentId: targetParentId,
          level: targetLevel,
          status: determineTaskStatus(rootTask)
        }
        
        newTasks.push(newTask)
      })
      
      // 子タスクを処理
      const childTasks = state.copiedTasks.filter(task => 
        task.parentId && state.copiedTasks.some(t => t.id === task.parentId)
      )
      
      childTasks.forEach(childTask => {
        const newChildId = generateId('t')
        idMap[childTask.id] = newChildId
        
        const newParentId = childTask.parentId ? idMap[childTask.parentId] : null
        const parentTask = newTasks.find(t => t.id === newParentId)
        const newLevel = parentTask ? parentTask.level + 1 : childTask.level
        
        const newTask: Task = {
          ...childTask,
          id: newChildId,
          projectId: state.selectedProjectId,
          parentId: newParentId,
          level: newLevel,
          status: determineTaskStatus(childTask)
        }
        
        newTasks.push(newTask)
      })
      
      const updatedTasks = [...state.tasks, ...newTasks]
      
      return {
        ...state,
        tasks: updatedTasks,
        selectedTaskIds: newTasks.length > 0 ? [newTasks[0].id] : state.selectedTaskIds,
        isMultiSelectMode: false,
        taskRelationMap: initializeTaskRelationMap(updatedTasks)
      }
    }

    case 'TOGGLE_SHOW_COMPLETED':
      return {
        ...state,
        showCompleted: !state.showCompleted
      }

    case 'TOGGLE_DETAIL_PANEL':
      return {
        ...state,
        isDetailPanelVisible: !state.isDetailPanelVisible,
        activeArea: !state.isDetailPanelVisible ? state.activeArea : "tasks"
      }

    case 'SET_ACTIVE_AREA':
      return {
        ...state,
        activeArea: action.payload
      }

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedTaskIds: [],
        isMultiSelectMode: false
      }

    case 'TOGGLE_MULTI_SELECT_MODE':
      return {
        ...state,
        isMultiSelectMode: !state.isMultiSelectMode,
        selectedTaskIds: !state.isMultiSelectMode && state.selectedTaskIds.length === 0 
          ? state.selectedTaskIds 
          : state.selectedTaskIds.slice(0, 1)
      }

    default:
      return state
  }
}