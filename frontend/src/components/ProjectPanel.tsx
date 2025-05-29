import React, { useState, useRef } from 'react'
import { Project } from '../types'
import { Plus, MoreHorizontal, Edit, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ColorPicker } from './ColorPicker'
import { PROJECT_COLORS } from '../utils/constants'
import { cn } from '@/lib/utils'

interface ProjectPanelProps {
  projects: Project[]
  onProjectsUpdate: (projects: Project[]) => void
  selectedProjectId: string
  onProjectSelect: (projectId: string) => void
  activeArea: string
  setActiveArea: (area: "projects" | "tasks" | "details") => void
}

export const ProjectPanel: React.FC<ProjectPanelProps> = ({
  projects,
  onProjectsUpdate,
  selectedProjectId,
  onProjectSelect,
  activeArea,
  setActiveArea
}) => {
  const [isAddingProject, setIsAddingProject] = useState(false)
  const [isEditingProject, setIsEditingProject] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectColor, setNewProjectColor] = useState(getRandomColor())
  const [editingProjectName, setEditingProjectName] = useState("")
  const [editingProjectColor, setEditingProjectColor] = useState("")

  const newProjectInputRef = useRef<HTMLInputElement>(null)
  const editProjectInputRef = useRef<HTMLInputElement>(null)

  function getRandomColor() {
    return PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)].value
  }

  const generateId = (prefix: string) => {
    return `${prefix}${Date.now()}`
  }

  const handleAddProject = () => {
    setIsAddingProject(true)
    setNewProjectColor(getRandomColor())
    setTimeout(() => {
      newProjectInputRef.current?.focus()
    }, 0)
  }

  const handleSaveNewProject = () => {
    if (newProjectName.trim()) {
      const newProject: Project = {
        id: generateId("p"),
        name: newProjectName,
        color: newProjectColor,
        collapsed: false,
      }
      onProjectsUpdate([...projects, newProject])
      setNewProjectName("")
      setIsAddingProject(false)
      onProjectSelect(newProject.id)
    } else {
      setIsAddingProject(false)
    }
  }

  const handleEditProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setEditingProjectId(projectId)
      setEditingProjectName(project.name)
      setEditingProjectColor(project.color)
      setIsEditingProject(true)
      setTimeout(() => {
        editProjectInputRef.current?.focus()
      }, 0)
    }
  }

  const handleSaveEditProject = () => {
    if (editingProjectName.trim() && editingProjectId) {
      onProjectsUpdate(
        projects.map((project) =>
          project.id === editingProjectId
            ? { ...project, name: editingProjectName, color: editingProjectColor }
            : project
        )
      )
      setIsEditingProject(false)
      setEditingProjectId(null)
    } else {
      setIsEditingProject(false)
      setEditingProjectId(null)
    }
  }

  const handleDeleteProject = (projectId: string) => {
    if (confirm('このプロジェクトを削除しますか？関連するタスクもすべて削除されます。')) {
      onProjectsUpdate(projects.filter((project) => project.id !== projectId))
      
      // 削除されたプロジェクトが選択されていた場合、他のプロジェクトを選択
      if (selectedProjectId === projectId) {
        const remainingProjects = projects.filter(p => p.id !== projectId)
        if (remainingProjects.length > 0) {
          onProjectSelect(remainingProjects[0].id)
        }
      }
    }
  }

  return (
    <div
      className={cn(
        "w-64 border-r p-4 flex flex-col h-full",
        activeArea === "projects" ? "bg-accent/40" : ""
      )}
      onClick={() => setActiveArea("projects")}
    >
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
        <div className="mb-2 space-y-2">
          <Input
            ref={newProjectInputRef}
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onBlur={handleSaveNewProject}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveNewProject()
              if (e.key === "Escape") setIsAddingProject(false)
            }}
            placeholder="プロジェクト名"
          />
          <ColorPicker
            selectedColor={newProjectColor}
            onColorSelect={setNewProjectColor}
          />
        </div>
      )}

      {/* プロジェクト編集フォーム */}
      {isEditingProject && editingProjectId && (
        <div className="mb-2 space-y-2">
          <Input
            ref={editProjectInputRef}
            value={editingProjectName}
            onChange={(e) => setEditingProjectName(e.target.value)}
            onBlur={handleSaveEditProject}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEditProject()
              if (e.key === "Escape") {
                setIsEditingProject(false)
                setEditingProjectId(null)
              }
            }}
            placeholder="プロジェクト名"
          />
          <ColorPicker
            selectedColor={editingProjectColor}
            onColorSelect={setEditingProjectColor}
          />
        </div>
      )}

      {/* プロジェクト一覧 */}
      <div className="space-y-1 overflow-y-auto flex-grow">
        {projects.map((project) => (
          <div
            key={project.id}
            className={cn(
              "flex items-center p-2 rounded-md cursor-pointer group transition-colors",
              selectedProjectId === project.id ? "bg-accent" : "hover:bg-accent/50"
            )}
            onClick={() => onProjectSelect(project.id)}
            style={{
              borderLeft: `4px solid ${project.color}`,
            }}
          >
            <span className="flex-grow truncate">{project.name}</span>
            
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
                    handleEditProject(project.id)
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