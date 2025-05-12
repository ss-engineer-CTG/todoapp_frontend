"use client"

import { useContext, useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UIContext } from "../../contexts/UIContext"

export default function AdvancedSearchDialog() {
  const { 
    isAdvancedSearchOpen, 
    setIsAdvancedSearchOpen,
    advancedSearchCriteria, 
    setAdvancedSearchCriteria 
  } = useContext(UIContext)

  // 初期状態をリセットするためのローカルステート
  const [localCriteria, setLocalCriteria] = useState({
    name: "",
    assignee: "",
    startDateFrom: "",
    startDateTo: "",
    dueDateFrom: "",
    dueDateTo: "",
    tags: "",
    priority: "",
  })

  // ダイアログが開かれたときに現在の検索条件をローカルにコピー
  useEffect(() => {
    if (isAdvancedSearchOpen) {
      setLocalCriteria({ ...advancedSearchCriteria })
    }
  }, [isAdvancedSearchOpen, advancedSearchCriteria])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setLocalCriteria({ ...localCriteria, [name]: value })
  }

  const handleReset = () => {
    setLocalCriteria({
      name: "",
      assignee: "",
      startDateFrom: "",
      startDateTo: "",
      dueDateFrom: "",
      dueDateTo: "",
      tags: "",
      priority: "",
    })
  }

  const handleSearch = () => {
    setAdvancedSearchCriteria(localCriteria)
    setIsAdvancedSearchOpen(false)
  }

  return (
    <Dialog open={isAdvancedSearchOpen} onOpenChange={setIsAdvancedSearchOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>高度な検索</DialogTitle>
          <DialogDescription>
            複数の条件を組み合わせて検索できます。
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="search-name" className="text-sm font-medium">
                タスク名
              </label>
              <Input
                id="search-name"
                name="name"
                value={localCriteria.name}
                onChange={handleChange}
                placeholder="タスク名を入力..."
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="search-assignee" className="text-sm font-medium">
                担当者
              </label>
              <Input
                id="search-assignee"
                name="assignee"
                value={localCriteria.assignee}
                onChange={handleChange}
                placeholder="担当者名を入力..."
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="search-tags" className="text-sm font-medium">
                タグ
              </label>
              <Input
                id="search-tags"
                name="tags"
                value={localCriteria.tags}
                onChange={handleChange}
                placeholder="タグを入力..."
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="search-priority" className="text-sm font-medium">
                優先度
              </label>
              <select
                id="search-priority"
                name="priority"
                value={localCriteria.priority}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">すべて</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                開始日
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  name="startDateFrom"
                  value={localCriteria.startDateFrom}
                  onChange={handleChange}
                  placeholder="開始日（から）"
                />
                <Input
                  type="date"
                  name="startDateTo"
                  value={localCriteria.startDateTo}
                  onChange={handleChange}
                  placeholder="開始日（まで）"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                期限日
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  name="dueDateFrom"
                  value={localCriteria.dueDateFrom}
                  onChange={handleChange}
                  placeholder="期限日（から）"
                />
                <Input
                  type="date"
                  name="dueDateTo"
                  value={localCriteria.dueDateTo}
                  onChange={handleChange}
                  placeholder="期限日（まで）"
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleReset}
          >
            リセット
          </Button>
          <Button onClick={handleSearch}>
            検索
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}