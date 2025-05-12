"use client"

import { useContext } from "react"
import { Search, Filter, ArrowUpDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UIContext } from "../../../contexts/UIContext"
import { TaskContext } from "../../../contexts/TaskContext"
import { useFilterAndSort } from "../../../hooks/useFilterAndSort"

export default function FilterToolbar() {
  const { 
    searchQuery, 
    setSearchQuery, 
    filterStatus, 
    setFilterStatus,
    filterTags, 
    setFilterTags,
    filterPriority, 
    setFilterPriority,
    sortBy, 
    setSortBy,
    sortDirection, 
    setSortDirection,
    setIsAdvancedSearchOpen
  } = useContext(UIContext)
  
  const { tasks } = useContext(TaskContext)
  const { resetFilters, toggleSortDirection, getAvailableTags } = useFilterAndSort()
  
  const availableTags = getAvailableTags()

  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex-1 relative">
          <Input
            id="search-input"
            type="text"
            placeholder="検索... (Ctrl+F)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          {searchQuery && (
            <button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchQuery("")}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1" 
          onClick={() => setIsAdvancedSearchOpen(true)}
        >
          <Search size={14} />
          <span>高度な検索</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Filter size={14} />
              <span>フィルター</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>ステータス</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => setFilterStatus("all")}
              className={filterStatus === "all" ? "bg-blue-50" : ""}
            >
              すべて
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setFilterStatus("active")}
              className={filterStatus === "active" ? "bg-blue-50" : ""}
            >
              未完了
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setFilterStatus("completed")}
              className={filterStatus === "completed" ? "bg-blue-50" : ""}
            >
              完了済み
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>優先度</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => setFilterPriority("all")}
              className={filterPriority === "all" ? "bg-blue-50" : ""}
            >
              すべて
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setFilterPriority("high")}
              className={filterPriority === "high" ? "bg-blue-50" : ""}
            >
              高
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setFilterPriority("medium")}
              className={filterPriority === "medium" ? "bg-blue-50" : ""}
            >
              中
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setFilterPriority("low")}
              className={filterPriority === "low" ? "bg-blue-50" : ""}
            >
              低
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>タグ</DropdownMenuLabel>
            {availableTags.map(tag => (
              <DropdownMenuItem
                key={tag}
                onClick={() => {
                  if (filterTags.includes(tag)) {
                    setFilterTags(filterTags.filter(t => t !== tag))
                  } else {
                    setFilterTags([...filterTags, tag])
                  }
                }}
                className={filterTags.includes(tag) ? "bg-blue-50" : ""}
              >
                {tag}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <ArrowUpDown size={14} />
              <span>並び替え</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>並び替え</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setSortBy("name")} className={sortBy === "name" ? "bg-blue-50" : ""}>
              タスク名
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortBy("dueDate")}
              className={sortBy === "dueDate" ? "bg-blue-50" : ""}
            >
              期限日
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortBy("startDate")}
              className={sortBy === "startDate" ? "bg-blue-50" : ""}
            >
              開始日
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortBy("assignee")}
              className={sortBy === "assignee" ? "bg-blue-50" : ""}
            >
              担当者
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortBy("priority")}
              className={sortBy === "priority" ? "bg-blue-50" : ""}
            >
              優先度
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleSortDirection}>
              {sortDirection === "asc" ? "昇順 ↑" : "降順 ↓"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {(filterStatus !== "all" || sortBy !== "dueDate" || sortDirection !== "asc" || searchQuery || filterTags.length > 0 || filterPriority !== "all") && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            リセット
          </Button>
        )}
      </div>
      
      {/* アクティブなフィルターの表示 */}
      {(filterStatus !== "all" || filterTags.length > 0 || filterPriority !== "all") && (
        <div className="mt-2 flex flex-wrap gap-1">
          {filterStatus !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              ステータス: {filterStatus === "active" ? "未完了" : "完了済み"}
              <button onClick={() => setFilterStatus("all")} className="ml-1">
                <X size={12} />
              </button>
            </Badge>
          )}
          
          {filterPriority !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              優先度: {
                filterPriority === "high" ? "高" : 
                filterPriority === "medium" ? "中" : "低"
              }
              <button onClick={() => setFilterPriority("all")} className="ml-1">
                <X size={12} />
              </button>
            </Badge>
          )}
          
          {filterTags.map(tag => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              タグ: {tag}
              <button 
                onClick={() => setFilterTags(filterTags.filter(t => t !== tag))} 
                className="ml-1"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}