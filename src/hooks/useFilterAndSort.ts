import { useContext } from "react"
import { TaskContext } from "../contexts/TaskContext"
import { UIContext } from "../contexts/UIContext"

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
    return tasks
      .filter((task) => {
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
        if (
          searchQuery &&
          !task.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !task.assignee.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !task.notes.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(task.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
        ) {
          return false
        }

        // 高度な検索条件によるフィルタリング
        if (
          advancedSearchCriteria.name &&
          !task.name.toLowerCase().includes(advancedSearchCriteria.name.toLowerCase())
        ) {
          return false
        }
        if (
          advancedSearchCriteria.assignee &&
          !task.assignee.toLowerCase().includes(advancedSearchCriteria.assignee.toLowerCase())
        ) {
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
        if (
          advancedSearchCriteria.tags &&
          (!task.tags ||
            !task.tags.some(tag =>
              tag.toLowerCase().includes(advancedSearchCriteria.tags.toLowerCase())
            ))
        ) {
          return false
        }
        if (
          advancedSearchCriteria.priority &&
          (!task.priority ||
            !task.priority.includes(advancedSearchCriteria.priority))
        ) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        // ソート
        let comparison = 0

        switch (sortBy) {
          case "name":
            comparison = a.name.localeCompare(b.name)
            break
          case "dueDate":
            comparison = a.dueDate.localeCompare(b.dueDate)
            break
          case "startDate":
            comparison = a.startDate.localeCompare(b.startDate)
            break
          case "assignee":
            comparison = a.assignee.localeCompare(b.assignee)
            break
          case "priority": {
            const priorityOrder = { high: 3, medium: 2, low: 1, undefined: 0 }
            const aPriority = a.priority ? priorityOrder[a.priority] : 0
            const bPriority = b.priority ? priorityOrder[b.priority] : 0
            comparison = (bPriority - aPriority)
            break
          }
        }

        // 同じ値の場合は順序フィールドを使用
        if (comparison === 0 && a.order !== undefined && b.order !== undefined) {
          comparison = a.order - b.order
        }

        return sortDirection === "asc" ? comparison : -comparison
      })
  }

  // 表示されるタスクのリストを取得
  const getVisibleTasks = () => {
    const filteredTasks = getFilteredTasks()
    return filteredTasks.filter((task) => {
      // レベル0のタスクは常に表示
      if (task.level === 0) return true

      // 親タスクが展開されているかチェック
      const parentVisible = isParentVisible(task, filteredTasks)
      return parentVisible
    })
  }

  // 親タスクが表示されているかチェック
  const isParentVisible = (task: Task, taskList: Task[]) => {
    if (task.level === 0) return true

    // 自分より前のタスクで、レベルが1つ小さいものを探す
    const taskIndex = taskList.findIndex((t) => t.id === task.id)
    for (let i = taskIndex - 1; i >= 0; i--) {
      const potentialParent = taskList[i]
      if (potentialParent.level === task.level - 1) {
        // この親が展開されていなければ、子は表示されない
        if (!potentialParent.expanded) return false
        // この親が表示されるなら、子も表示される可能性がある
        return isParentVisible(potentialParent, taskList)
      }
      // 自分と同じかより低いレベルのタスクが見つかったら、親はない
      if (potentialParent.level <= task.level) return false
    }

    return false
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