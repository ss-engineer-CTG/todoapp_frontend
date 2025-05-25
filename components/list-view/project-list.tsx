"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTodoContext } from "@/hooks/use-todo-context"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Check 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PROJECT_COLORS } from "@/constants/colors"
import type { Project } from "@/types/todo"

export default function ProjectList() {
  const {
    projects,
    selectedProjectId,
    addProject,
    updateProject,
    deleteProject,
    selectProject,
    activeArea
  } = useTodoContext()

  const [isAddingProject, setIsAddingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0].value)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editingProjectName, setEditingProjectName] = useState("")
  const [editingProjectColor, setEditingProjectColor] = useState("")

  // プロジェクト追加
  const handleAddProject = () => {
    setIsAddingProject(true)
    setNewProjectColor(PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)].value)
  }

  const handleSaveNewProject = () => {
    if (newProjectName.trim()) {
      addProject({
        name: newProjectName.trim(),
        color: newProjectColor,
        collapsed: false
      })
      setNewProjectName("")
      setIsAddingProject(false)
    } else {
      setIsAddingProject(false)
    }
  }

  // プロジェクト編集
  const handleEditProject = (project: Project) => {
    setEditingProjectId(project.id)
    setEditingProjectName(project.name)
    setEditingProjectColor(project.color)
  }

  const handleSaveEditProject = () => {
    if (editingProjectName.trim() && editingProjectId) {
      updateProject(editingProjectId, {
        name: editingProjectName.trim(),
        color: editingProjectColor
      })
      setEditingProjectId(null)
      setEditingProjectName("")
      setEditingProjectColor("")
    } else {
      setEditingProjectId(null)
      setEditingProjectName("")
      setEditingProjectColor("")
    }
  }

  const handleDeleteProject = (projectId: string) => {
    if (confirm("このプロジェクトとすべてのタスクを削除しますか？")) {
      deleteProject(projectId)
    }
  }

  return (
    <div className={cn(
      "h-full flex flex-col p-4",
      activeArea === "projects" ? "bg-accent/40" : ""
    )}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">プロジェクト</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleAddProject}
          title="新規プロジェクト追加"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* 新規プロジェクト追加フォーム */}
      {isAddingProject && (
        <div className="mb-4 space-y-2">
          <Input
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onBlur={handleSaveNewProject}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveNewProject()
              if (e.key === "Escape") setIsAddingProject(false)
            }}
            placeholder="プロジェクト名"
            autoFocus
          />
          <div className="flex flex-wrap gap-1">
            {PROJECT_COLORS.map((color) => (
              <button
                key={color.value}
                className={cn(
                  "w-6 h-6 rounded-full border-2",
                  newProjectColor === color.value ? "ring-2 ring-primary" : ""
                )}
                style={{ backgroundColor: color.value }}
                onClick={() => setNewProjectColor(color.value)}
                title={color.name}
              >
                {newProjectColor === color.value && (
                  <Check className="h-4 w-4 text-white mx-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* プロジェクト編集フォーム */}
      {editingProjectId && (
        <div className="mb-4 space-y-2">
          <Input
            value={editingProjectName}
            onChange={(e) => setEditingProjectName(e.target.value)}
            onBlur={handleSaveEditProject}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEditProject()
              if (e.key === "Escape") {
                setEditingProjectId(null)
                setEditingProjectName("")
                setEditingProjectColor("")
              }
            }}
            placeholder="プロジェクト名"
            autoFocus
          />
          <div className="flex flex-wrap gap-1">
            {PROJECT_COLORS.map((color) => (
              <button
                key={color.value}
                className={cn(
                  "w-6 h-6 rounded-full border-2",
                  editingProjectColor === color.value ? "ring-2 ring-primary" : ""
                )}
                style={{ backgroundColor: color.value }}
                onClick={() => setEditingProjectColor(color.value)}
                title={color.name}
              >
                {editingProjectColor === color.value && (
                  <Check className="h-4 w-4 text-white mx-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* プロジェクト一覧 */}
      <div className="space-y-1 overflow-y-auto flex-1">
        {projects.map((project) => (
          <div
            key={project.id}
            className={cn(
              "flex items-center p-2 rounded-md cursor-pointer group transition-colors",
              selectedProjectId === project.id ? "bg-accent" : "hover:bg-accent/50"
            )}
            onClick={() => selectProject(project.id)}
            style={{
              borderLeft: `4px solid ${project.color}`,
            }}
          >
            <span className="flex-1 truncate font-medium">{project.name}</span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditProject(project)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  編集
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteProject(project.id)
                  }}
                  className="text-destructive"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  )
}