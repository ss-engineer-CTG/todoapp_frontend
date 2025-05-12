import { useContext } from "react"
import { TaskContext } from "../contexts/TaskContext"
import { UIContext } from "../contexts/UIContext"
import { Task } from "../types/Task"
import { isTaskVisible, sortTasksWithConsistency } from "../utils/taskUtils"
import { logDebug } from "../utils/logUtils"

export function useFilterAndSort() {
  const { tasks } = useContext(TaskContext)
  const { 
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
    advancedSearchCriteria
  } = useContext(UIContext)

  // 利用可能なタグのリストを取得
  const getAvailableTags = () => {
    const allTags = tasks.flatMap(task => task.tags || [])
    return [...new Set(allTags)]
  }

  // フィルタリングされたタスクを取得
  const getFilteredTasks = () => {
    if (!tasks || tasks.length === 0) {
      logDebug("No tasks available for filtering")
      return []
    }

    // 最初にタスクの一貫性を保った並べ替えを適用
    const sortedTasks = sortTasksWithConsistency([...tasks])

    return sortedTasks.filter((task) => {
      // プロジェクトはステータスフィルタの影響を受けない
      if (task.isProject) {
        return true
      }
      
      // ステータスによるフィルタリング
      if (filterStatus === "active" && task.completed) return false
      if (filterStatus === "completed" && !task.completed) return false

      // タグによるフィルタリング
      if (filterTags.length > 0) {
        if (!task.tags || !task.tags.some(tag => filterTags.includes(tag))) {
          return false
        }
      }

      // 優先度によるフィルタリング
      if (filterPriority !== "all" && task.priority !== filterPriority) {
        return false
      }

      // 検索クエリによるフィルタリング
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const searchFields = [
          task.name.toLowerCase(),
          task.assignee.toLowerCase(),
          task.notes.toLowerCase(),
          ...(task.tags?.map(tag => tag.toLowerCase()) || [])
        ]
        if (!searchFields.some(field => field.includes(query))) {
          return false
        }
      }

      // 高度な検索条件によるフィルタリング
      if (advancedSearchCriteria.name &&
          !task.name.toLowerCase().includes(advancedSearchCriteria.name.toLowerCase())) {
        return false
      }
      
      if (advancedSearchCriteria.assignee &&
          !task.assignee.toLowerCase().includes(advancedSearchCriteria.assignee.toLowerCase())) {
        return false
      }
      
      if (advancedSearchCriteria.startDateFrom && task.startDate < advancedSearchCriteria.startDateFrom) {
        return false
      }
      
      if (advancedSearchCriteria.startDateTo && task.startDate > advancedSearchCriteria.startDateTo) {
        return false
      }
      
      if (advancedSearchCriteria.dueDateFrom && task.dueDate < advancedSearchCriteria.dueDateFrom) {
        return false
      }
      
      if (advancedSearchCriteria.dueDateTo && task.dueDate > advancedSearchCriteria.dueDateTo) {
        return false
      }
      
      if (advancedSearchCriteria.tags) {
        const tagQuery = advancedSearchCriteria.tags.toLowerCase()
        if (!task.tags || !task.tags.some(tag => tag.toLowerCase().includes(tagQuery))) {
          return false
        }
      }
      
      if (advancedSearchCriteria.priority &&
          (!task.priority || task.priority !== advancedSearchCriteria.priority)) {
        return false
      }

      return true
    })
  }

  // 表示されるタスクのリストを取得
  const getVisibleTasks = () => {
    const filteredTasks = getFilteredTasks()
    
    if (filteredTasks.length === 0) {
      return []
    }
    
    // 表示条件（親タスクが展開されているか）を確認
    return filteredTasks.filter((task) => {
      // レベル0のタスクやプロジェクトは常に表示
      if (task.level === 0 || task.isProject) return true

      // 親タスクが展開されているかチェック
      return isTaskVisible(task, filteredTasks)
    })
  }

  // ソート方向の切り替え
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
  }

  // フィルターとソートのリセット
  const resetFilters = () => {
    setFilterStatus("all")
    setSortBy("dueDate")
    setSortDirection("asc")
    setSearchQuery("")
    setFilterTags([])
    setFilterPriority("all")
  }

  return {
    getAvailableTags,
    getFilteredTasks,
    getVisibleTasks,
    toggleSortDirection,
    resetFilters
  }
}