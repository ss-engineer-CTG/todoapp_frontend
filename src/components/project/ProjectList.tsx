import React from 'react'
import { ChevronDown, ChevronRight, Plus, MoreHorizontal, Edit, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useProjects } from '@/hooks/useProjects'
import { useTasks } from '@/hooks/useTasks'
import { useApp } from '@/hooks/useApp'
import ProjectForm from '@/components/project/ProjectForm'

const ProjectList: React.FC = () => {
  const { projects, selectedProjectId, setSelectedProjectId, toggleProject, startEditProject, deleteProject } = useProjects()
  const { clearTaskSelection } = useTasks()
  const { activeArea, setActiveArea } = useApp()
  const [isAddingProject, setIsAddingProject] = React.useState(false)

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
    clearTaskSelection()
    setActiveArea('projects')
  }

  const handleAddProject = () => {
    setIsAddingProject(true)
  }

  const handleProjectAdded = () => {
    setIsAddingProject(false)
  }

  return (
    <div
      className={cn(
        "w-64 border-r p-4 flex flex-col h-full",
        activeArea === 'projects' ? "bg-accent/40" : ""
      )}
      onClick={() => setActiveArea('projects')}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">プロジェクト</h2>
        <Button variant="ghost" size="icon" onClick={handleAddProject} title="新規プロジェクト追加">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isAddingProject && (
        <div className="mb-2">
          <ProjectForm onSave={handleProjectAdded} onCancel={() => setIsAddingProject(false)} />
        </div>
      )}

      <div className="space-y-1 overflow-y-auto flex-grow">
        {projects.map((project) => (
          <div
            key={project.id}
            className={cn(
              "flex items-center p-2 rounded-md cursor-pointer group",
              selectedProjectId === project.id ? "bg-accent" : "hover:bg-accent/50"
            )}
            onClick={() => handleProjectSelect(project.id)}
            style={{
              borderLeft: `4px solid ${project.color}`,
            }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 mr-1"
              onClick={(e) => {
                e.stopPropagation()
                toggleProject(project.id)
              }}
            >
              {project.expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>

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
                    startEditProject(project.id)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  編集
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteProject(project.id)
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

export default ProjectList