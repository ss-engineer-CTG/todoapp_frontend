"use client"

import { useState } from "react"
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
import { COLORS } from "../../constants/colors"

interface ProjectFormProps {
  project: Task
  onSave: (project: Task) => void
  onCancel: () => void
  availableTags: string[]
}

export default function ProjectForm({ project, onSave, onCancel, availableTags }: ProjectFormProps) {
  const [formData, setFormData] = useState<Task>(project)
  const [startDate, setStartDate] = useState<Date | undefined>(
    formData.startDate ? new Date(formData.startDate) : undefined,
  )
  const [dueDate, setDueDate] = useState<Date | undefined>(
    formData.dueDate ? new Date(formData.dueDate) : undefined,
  )
  const [newTag, setNewTag] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
  
  const handleColorChange = (color: string) => {
    setFormData({ ...formData, color })
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
    // プロジェクト名をプロジェクト名フィールドにも設定
    const updatedProject = {
      ...formData,
      projectName: formData.name,
    }
    onSave(updatedProject)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="name" className="text-right">
            プロジェクト名
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
          <label htmlFor="assignee" className="text-right">
            責任者
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
          <label className="text-right">
            色
          </label>
          <div className="col-span-3 flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`w-8 h-8 rounded-full border border-gray-300 ${formData.color === color ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
              />
            ))}
          </div>
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
            placeholder="プロジェクトに関するメモを入力..."
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