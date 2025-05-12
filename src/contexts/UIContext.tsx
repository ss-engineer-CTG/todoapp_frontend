"use client"

import { createContext, useState, useRef, ReactNode } from "react"
import { Task } from "../types/Task"

interface UIContextProps {
  // 選択状態
  selectedTaskId: number | null
  setSelectedTaskId: (id: number | null) => void
  taskRefs: React.MutableRefObject<{ [key: number]: HTMLElement | null }>

  // ダイアログ状態
  isTaskDialogOpen: boolean
  setIsTaskDialogOpen: (open: boolean) => void
  isProjectDialogOpen: boolean
  setIsProjectDialogOpen: (open: boolean) => void
  isNoteDialogOpen: boolean
  setIsNoteDialogOpen: (open: boolean) => void
  isDeleteConfirmOpen: boolean
  setIsDeleteConfirmOpen: (open: boolean) => void
  isImportExportOpen: boolean
  setIsImportExportOpen: (open: boolean) => void
  isAdvancedSearchOpen: boolean
  setIsAdvancedSearchOpen: (open: boolean) => void
  isHelpOpen: boolean
  setIsHelpOpen: (open: boolean) => void

  // タスク操作状態
  currentTask: Task | null
  setCurrentTask: (task: Task | null) => void
  noteContent: string
  setNoteContent: (content: string) => void
  taskToDelete: number | null
  setTaskToDelete: (id: number | null) => void

  // フィルタリングとソート
  filterStatus: "all" | "active" | "completed"
  setFilterStatus: (status: "all" | "active" | "completed") => void
  filterTags: string[]
  setFilterTags: (tags: string[]) => void
  filterPriority: "all" | "low" | "medium" | "high"
  setFilterPriority: (priority: "all" | "low" | "medium" | "high") => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  sortBy: "name" | "dueDate" | "startDate" | "assignee" | "priority"
  setSortBy: (sortBy: "name" | "dueDate" | "startDate" | "assignee" | "priority") => void
  sortDirection: "asc" | "desc"
  setSortDirection: (direction: "asc" | "desc") => void
  
  // 高度な検索条件
  advancedSearchCriteria: {
    name: string
    assignee: string
    startDateFrom: string
    startDateTo: string
    dueDateFrom: string
    dueDateTo: string
    tags: string
    priority: string
  }
  setAdvancedSearchCriteria: (criteria: {
    name: string
    assignee: string
    startDateFrom: string
    startDateTo: string
    dueDateFrom: string
    dueDateTo: string
    tags: string
    priority: string
  }) => void
  
  // アクティブビュー
  activeView: string
  setActiveView: (view: string) => void
  
  // キーボードイベントハンドラ
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>, taskId: number) => void
}

export const UIContext = createContext<UIContextProps>({
  // 選択状態
  selectedTaskId: null,
  setSelectedTaskId: () => {},
  taskRefs: { current: {} },

  // ダイアログ状態
  isTaskDialogOpen: false,
  setIsTaskDialogOpen: () => {},
  isProjectDialogOpen: false,
  setIsProjectDialogOpen: () => {},
  isNoteDialogOpen: false,
  setIsNoteDialogOpen: () => {},
  isDeleteConfirmOpen: false,
  setIsDeleteConfirmOpen: () => {},
  isImportExportOpen: false,
  setIsImportExportOpen: () => {},
  isAdvancedSearchOpen: false,
  setIsAdvancedSearchOpen: () => {},
  isHelpOpen: false,
  setIsHelpOpen: () => {},

  // タスク操作状態
  currentTask: null,
  setCurrentTask: () => {},
  noteContent: "",
  setNoteContent: () => {},
  taskToDelete: null,
  setTaskToDelete: () => {},

  // フィルタリングとソート
  filterStatus: "all",
  setFilterStatus: () => {},
  filterTags: [],
  setFilterTags: () => {},
  filterPriority: "all",
  setFilterPriority: () => {},
  searchQuery: "",
  setSearchQuery: () => {},
  sortBy: "dueDate",
  setSortBy: () => {},
  sortDirection: "asc",
  setSortDirection: () => {},
  
  // 高度な検索条件
  advancedSearchCriteria: {
    name: "",
    assignee: "",
    startDateFrom: "",
    startDateTo: "",
    dueDateFrom: "",
    dueDateTo: "",
    tags: "",
    priority: "",
  },
  setAdvancedSearchCriteria: () => {},
  
  // アクティブビュー
  activeView: "table",
  setActiveView: () => {},
  
  // キーボードイベントハンドラ
  onKeyDown: () => {},
})

interface UIProviderProps {
  children: ReactNode
}

export function UIProvider({ children }: UIProviderProps) {
  // 選択状態
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const taskRefs = useRef<{ [key: number]: HTMLElement | null }>({})

  // ダイアログ状態
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isImportExportOpen, setIsImportExportOpen] = useState(false)
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  // タスク操作状態
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [noteContent, setNoteContent] = useState("")
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null)

  // フィルタリングとソート
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("all")
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [filterPriority, setFilterPriority] = useState<"all" | "low" | "medium" | "high">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "dueDate" | "startDate" | "assignee" | "priority">("dueDate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  
  // 高度な検索条件
  const [advancedSearchCriteria, setAdvancedSearchCriteria] = useState({
    name: "",
    assignee: "",
    startDateFrom: "",
    startDateTo: "",
    dueDateFrom: "",
    dueDateTo: "",
    tags: "",
    priority: "",
  })
  
  // アクティブビュー
  const [activeView, setActiveView] = useState("table")
  
  // タスク操作のためのキーボードショートカットを処理
  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>, taskId: number) => {
    // ここではユーザー入力を直接処理せず、useTasks/useTaskSelection フックでこれを使用
    // イベントオブジェクトを渡すだけの役割
  }

  const contextValue: UIContextProps = {
    // 選択状態
    selectedTaskId,
    setSelectedTaskId,
    taskRefs,

    // ダイアログ状態
    isTaskDialogOpen,
    setIsTaskDialogOpen,
    isProjectDialogOpen,
    setIsProjectDialogOpen,
    isNoteDialogOpen,
    setIsNoteDialogOpen,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    isImportExportOpen,
    setIsImportExportOpen,
    isAdvancedSearchOpen,
    setIsAdvancedSearchOpen,
    isHelpOpen,
    setIsHelpOpen,

    // タスク操作状態
    currentTask,
    setCurrentTask,
    noteContent,
    setNoteContent,
    taskToDelete,
    setTaskToDelete,

    // フィルタリングとソート
    filterStatus,
    setFilterStatus,
    filterTags,
    setFilterTags,
    filterPriority,
    setFilterPriority,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    
    // 高度な検索条件
    advancedSearchCriteria,
    setAdvancedSearchCriteria,
    
    // アクティブビュー
    activeView,
    setActiveView,
    
    // キーボードイベントハンドラ
    onKeyDown,
  }

  return (
    <UIContext.Provider value={contextValue}>
      {children}
    </UIContext.Provider>
  )
}