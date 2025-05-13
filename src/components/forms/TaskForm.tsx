"use client"

import { useState, useContext, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, X } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Task } from "../../types/Task"
import { TaskContext } from "../../contexts/TaskContext"
import { getTaskPath } from "../common/TaskHierarchyUtility"

interface TaskFormProps {
  task: Task
  onSave: (task: Task) => void
  onCancel: () => void
  projects: Task[]
  availableTags: string[]
}

export default function TaskForm({ task, onSave, onCancel, projects, availableTags }: TaskFormProps) {
  const { tasks } = useContext(TaskContext)
  const [formData, setFormData] = useState<Task>(task)
  const [startDate, setStartDate] = useState<Date | undefined>(
    formData.startDate ? new Date(formData.startDate) : undefined,
  )
  const [dueDate, setDueDate] = useState<Date | undefined>(
    formData.dueDate ? new Date(formData.dueDate) : undefined,
  )
  const [newTag, setNewTag] = useState("")

  // 現在のプロジェクト内の選択可能な親タスク
  const availableParentTasks = useMemo(() => {
    // プロジェクト直下のタスクの場合、parentId は null
    if (formData.level <= 1) return [];
    
    // 同じプロジェクト内のタスクから選択可能な親を抽出
    return tasks.filter(t => 
      // 同じプロジェクトに属する
      t.projectId === formData.projectId && 
      // プロジェクト自体は選択肢に含めない
      !t.isProject && 
      // 自分自身は選択肢に含めない
      t.id !== formData.id &&
      // レベルが自分より1つ低いタスクのみ
      t.level === formData.level - 1
    );
  }, [tasks, formData.projectId, formData.level, formData.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date)
    if (date) {
      setFormData({ ...formData, startDate: date.toISOString().split("T")[0] })
    }
  }

  const handleDueDateChange = (date: Date | undefined) => {
    setDueDate(date)
    if (date) {
      setFormData({ ...formData, dueDate: date.toISOString().split("T")[0] })
    }
  }

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = Number.parseInt(e.target.value)
    const project = projects.find((p) => p.projectId === projectId)
    if (project) {
      // プロジェクト変更時は親を解除（プロジェクト直下に移動）
      setFormData({
        ...formData,
        projectId,
        projectName: project.name,
        parentId: null,
        level: 1
      })
    }
  }
  
  const handleParentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const parentId = e.target.value ? Number.parseInt(e.target.value) : null
    
    if (parentId === null) {
      // 親なし = プロジェクト直下
      setFormData({
        ...formData,
        parentId: null,
        level: 1
      })
    } else {
      const parentTask = tasks.find(t => t.id === parentId)
      if (parentTask) {
        // 親タスクのレベル + 1
        setFormData({
          ...formData,
          parentId,
          level: parentTask.level + 1
        })
      }
    }
  }
  
  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const priority = e.target.value as "low" | "medium" | "high"
    setFormData({ ...formData, priority })
  }
  
  const addTag = () => {
    if (newTag.trim() && (!formData.tags || !formData.tags.includes(newTag.trim()))) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()]
      })
      setNewTag("")
    }
  }
  
  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag) || []
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  // 親タスクのパス表示
  const renderParentPath = () => {
    if (!formData.parentId) return null;
    
    const parentTask = tasks.find(t => t.id === formData.parentId);
    if (!parentTask) return null;
    
    const path = getTaskPath(parentTask, tasks);
    
    return (
      <div className="text-xs text-gray-500 mt-1">
        パス: {path.map(t => t.name).join(" > ")}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="name" className="text-right">
            名前
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="col-span-3"
            required
            autoFocus
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="project" className="text-right">
            プロジェクト
          </label>
          <select
            id="project"
            name="project"
            value={formData.projectId}
            onChange={handleProjectChange}
            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {projects.map((project) => (
              <option key={project.projectId} value={project.projectId}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* 親タスク選択 - レベル1より深い場合のみ表示 */}
        {formData.level > 1 && (
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="parent" className="text-right">
              親タスク
            </label>
            <div className="col-span-3">
              <select
                id="parent"
                name="parent"
                value={formData.parentId || ""}
                onChange={handleParentChange}
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">プロジェクト直下</option>
                {availableParentTasks.map((parentTask) => (
                  <option key={parentTask.id} value={parentTask.id}>
                    {parentTask.name}
                  </option>
                ))}
              </select>
              {renderParentPath()}
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="assignee" className="text-right">
            担当者
          </label>
          <Input
            id="assignee"
            name="assignee"
            value={formData.assignee}
            onChange={handleChange}
            className="col-span-3"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="priority" className="text-right">
            優先度
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority || "medium"}
            onChange={handlePriorityChange}
            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <label className="text-right">開始日</label>
          <div className="col-span-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                  {startDate ? format(startDate, "yyyy年MM月dd日", { locale: ja }) : <span>日付を選択</span>}
                  <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent mode="single" selected={startDate} onSelect={handleStartDateChange} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <label className="text-right">期限日</label>
          <div className="col-span-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                  {dueDate ? format(dueDate, "yyyy年MM月dd日", { locale: ja }) : <span>日付を選択</span>}
                  <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent mode="single" selected={dueDate} onSelect={handleDueDateChange} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="grid grid-cols-4 items-start gap-4">
          <label className="text-right pt-2">
            タグ
          </label>
          <div className="col-span-3 space-y-2">
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="新しいタグを入力..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" onClick={addTag} size="sm">
                追加
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.tags?.map((tag) => (
                <Badge key={tag} className="px-2 py-1 flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
            {availableTags.length > 0 && (
              <div className="mt-2">
                <div className="text-sm text-gray-500 mb-1">既存のタグ:</div>
                <div className="flex flex-wrap gap-1">
                  {availableTags
                    .filter(tag => !formData.tags?.includes(tag))
                    .map(tag => (
                      <Badge 
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            tags: [...(formData.tags || []), tag]
                          })
                        }}
                      >
                        {tag}
                      </Badge>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="notes" className="text-right">
            メモ
          </label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="col-span-3 min-h-[100px]"
            placeholder="タスクに関するメモを入力..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit">保存</Button>
      </div>
    </form>
  )
}