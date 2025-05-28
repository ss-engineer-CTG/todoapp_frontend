import React, { useState, useRef } from 'react'
import { Project, ProjectColor } from '../types'
import { Plus, MoreHorizontal, Edit, Trash, Check } from 'lucide-react'

const PROJECT_COLORS: ProjectColor[] = [
  { name: "オレンジ", value: "#f97316" },
  { name: "紫", value: "#8b5cf6" },
  { name: "緑", value: "#10b981" },
  { name: "赤", value: "#ef4444" },
  { name: "青", value: "#3b82f6" },
  { name: "琥珀", value: "#f59e0b" },
  { name: "ピンク", value: "#ec4899" },
  { name: "ティール", value: "#14b8a6" },
]

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
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectColor, setNewProjectColor] = useState(getRandomColor())
  const [isEditingProject, setIsEditingProject] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
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
    onProjectsUpdate(projects.filter((project) => project.id !== projectId))
    if (selectedProjectId === projectId && projects.length > 1) {
      const remainingProjects = projects.filter((p) => p.id !== projectId)
      onProjectSelect(remainingProjects[0]?.id || "")
    }
  }

  return (
    <div
      className={`w-64 border-r p-4 flex flex-col h-full ${
        activeArea === "projects" ? "bg-accent/40" : ""
      }`}
      onClick={() => setActiveArea("projects")}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">プロジェクト</h2>
        <button
          className="p-1 hover:bg-accent rounded"
          onClick={handleAddProject}
          title="新規プロジェクト追加"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {isAddingProject && (
        <div className="mb-2 space-y-2">
          <input
            ref={newProjectInputRef}
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onBlur={handleSaveNewProject}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveNewProject()
              if (e.key === "Escape") setIsAddingProject(false)
            }}
            placeholder="プロジェクト名"
            className="w-full p-2 border rounded bg-background"
          />
          <div className="flex flex-wrap gap-1">
            {PROJECT_COLORS.map((color) => (
              <button
                key={color.value}
                className={`w-6 h-6 rounded-full border ${
                  newProjectColor === color.value ? "ring-2 ring-primary" : ""
                }`}
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

      {isEditingProject && editingProjectId && (
        <div className="mb-2 space-y-2">
          <input
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
            className="w-full p-2 border rounded bg-background"
          />
          <div className="flex flex-wrap gap-1">
            {PROJECT_COLORS.map((color) => (
              <button
                key={color.value}
                className={`w-6 h-6 rounded-full border ${
                  editingProjectColor === color.value ? "ring-2 ring-primary" : ""
                }`}
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

      <div className="space-y-1 overflow-y-auto flex-grow">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`flex items-center p-2 rounded-md cursor-pointer group ${
              selectedProjectId === project.id ? "bg-accent" : "hover:bg-accent/50"
            }`}
            onClick={() => onProjectSelect(project.id)}
            style={{
              borderLeft: `4px solid ${project.color}`,
            }}
          >
            <span className="flex-grow truncate">{project.name}</span>
            <div className="relative">
              <button
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-accent rounded"
                onClick={(e) => {
                  e.stopPropagation()
                  // ここでドロップダウンメニューを表示する処理
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {/* ドロップダウンメニューはシンプルな実装で表示 */}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}