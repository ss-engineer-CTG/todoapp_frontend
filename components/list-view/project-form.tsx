"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { PROJECT_COLORS } from "@/constants/colors"
import type { Project } from "@/types/todo"

interface ProjectFormProps {
  project?: Project
  isOpen: boolean
  onClose: () => void
  onSave: (projectData: Omit<Project, 'id'>) => void
}

export default function ProjectForm({ project, isOpen, onClose, onSave }: ProjectFormProps) {
  const [name, setName] = useState(project?.name || "")
  const [color, setColor] = useState(project?.color || PROJECT_COLORS[0].value)

  const handleSave = () => {
    if (name.trim()) {
      onSave({
        name: name.trim(),
        color,
        collapsed: project?.collapsed || false
      })
      onClose()
    }
  }

  const handleClose = () => {
    setName(project?.name || "")
    setColor(project?.color || PROJECT_COLORS[0].value)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {project ? "プロジェクトを編集" : "新しいプロジェクト"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">プロジェクト名</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="プロジェクト名を入力"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave()
                if (e.key === "Escape") handleClose()
              }}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">カラー</label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((projectColor) => (
                <button
                  key={projectColor.value}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                    color === projectColor.value 
                      ? "ring-2 ring-primary scale-110" 
                      : "hover:scale-105"
                  )}
                  style={{ backgroundColor: projectColor.value }}
                  onClick={() => setColor(projectColor.value)}
                  title={projectColor.name}
                >
                  {color === projectColor.value && (
                    <Check className="h-4 w-4 text-white drop-shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {project ? "更新" : "作成"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}