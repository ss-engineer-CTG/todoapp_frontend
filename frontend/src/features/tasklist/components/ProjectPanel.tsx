import React, { useState, useRef } from 'react'
import { Project } from '@core/types'
import { ProjectApiActions } from '@tasklist/types'
import { Plus, MoreHorizontal, Edit, Trash } from 'lucide-react'
import { Button } from '@core/components/ui/button'
import { Input } from '@core/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@core/components/ui/dropdown-menu'
import { ColorPicker } from './ColorPicker'
import { PROJECT_COLORS } from '@core/config'
import { cn } from '@core/utils/cn'
import { handleError, logger } from '@core/utils/core'

interface ProjectPanelProps {
  projects: Project[]
  onProjectsUpdate: (projects: Project[]) => void
  selectedProjectId: string
  onProjectSelect: (projectId: string) => void
  activeArea: string
  setActiveArea: (area: "projects" | "tasks" | "details") => void
  isAddingProject: boolean
  setIsAddingProject: (adding: boolean) => void
  isEditingProject: boolean
  setIsEditingProject: (editing: boolean) => void
  apiActions: ProjectApiActions
}

export const ProjectPanel: React.FC<ProjectPanelProps> = ({
  projects,
  onProjectsUpdate,
  selectedProjectId,
  onProjectSelect,
  activeArea,
  setActiveArea,
  isAddingProject,
  setIsAddingProject,
  isEditingProject,
  setIsEditingProject,
  apiActions
}) => {
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectColor, setNewProjectColor] = useState(getRandomColor())
  const [editingProjectName, setEditingProjectName] = useState("")
  const [editingProjectColor, setEditingProjectColor] = useState("")

  const newProjectInputRef = useRef<HTMLInputElement>(null)
  const editProjectInputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  function getRandomColor() {
    return PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)].value
  }

  const handleAddProject = () => {
    setIsAddingProject(true)
    setNewProjectColor(getRandomColor())
    setTimeout(() => {
      newProjectInputRef.current?.focus()
    }, 0)
  }

  const handleSaveNewProject = async () => {
    if (newProjectName.trim()) {
      try {
        const newProject = await apiActions.createProject({
          name: newProjectName,
          color: newProjectColor,
          collapsed: false,
        })
        
        onProjectsUpdate([...projects, newProject])
        setNewProjectName("")
        setIsAddingProject(false)
        onProjectSelect(newProject.id)
      } catch (error) {
        handleError(error, 'プロジェクトの作成に失敗しました')
        setIsAddingProject(false)
      }
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

  const handleSaveEditProject = async () => {
    if (editingProjectName.trim() && editingProjectId) {
      try {
        const updatedProject = await apiActions.updateProject(editingProjectId, {
          name: editingProjectName,
          color: editingProjectColor
        })
        
        onProjectsUpdate(
          projects.map((project) =>
            project.id === editingProjectId ? updatedProject : project
          )
        )
        setIsEditingProject(false)
        setEditingProjectId(null)
      } catch (error) {
        handleError(error, 'プロジェクトの更新に失敗しました')
        setIsEditingProject(false)
        setEditingProjectId(null)
      }
    } else {
      setIsEditingProject(false)
      setEditingProjectId(null)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('このプロジェクトを削除しますか？関連するタスクもすべて削除されます。')) {
      try {
        await apiActions.deleteProject(projectId)
        onProjectsUpdate(projects.filter((project) => project.id !== projectId))
        
        if (selectedProjectId === projectId) {
          const remainingProjects = projects.filter(p => p.id !== projectId)
          if (remainingProjects.length > 0) {
            onProjectSelect(remainingProjects[0].id)
          }
        }
      } catch (error) {
        handleError(error, 'プロジェクトの削除に失敗しました')
      }
    }
  }

  const handlePanelClick = () => {
    logger.info('Project panel clicked')
    setActiveArea("projects")
    if (panelRef.current) {
      panelRef.current.focus()
    }
  }

  const handlePanelFocus = () => {
    logger.info('Project panel focused')
    setActiveArea("projects")
  }

  return (
    <div
      ref={panelRef}
      className={cn(
        "w-64 border-r p-4 flex flex-col h-full outline-none",
        activeArea === "projects" ? "bg-accent/40 ring-1 ring-primary/20" : ""
      )}
      onClick={handlePanelClick}
      onFocus={handlePanelFocus}
      tabIndex={0}
      role="region"
      aria-label="プロジェクト一覧"
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

      <div className="space-y-1 overflow-y-auto flex-grow">
        {projects.map((project) => (
          <div
            key={project.id}
            className={cn(
              "flex items-center p-2 rounded-md cursor-pointer group transition-colors",
              selectedProjectId === project.id ? "bg-accent" : "hover:bg-accent/50"
            )}
            onClick={() => {
              logger.info('Project selected', { projectId: project.id })
              onProjectSelect(project.id)
            }}
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