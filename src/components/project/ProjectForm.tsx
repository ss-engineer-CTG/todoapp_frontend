import React from 'react'
import { Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useProjects } from '@/hooks/useProjects'
import { PROJECT_COLORS } from '@/constants/colors'

interface ProjectFormProps {
  projectId?: string
  onSave: () => void
  onCancel: () => void
}

const ProjectForm: React.FC<ProjectFormProps> = ({ projectId, onSave, onCancel }) => {
  const { projects, addProject, updateProject } = useProjects()
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  const isEditing = !!projectId
  const existingProject = isEditing ? projects.find(p => p.id === projectId) : null
  
  const [name, setName] = React.useState(existingProject?.name || '')
  const [color, setColor] = React.useState(
    existingProject?.color || (PROJECT_COLORS.length > 0 ? PROJECT_COLORS[0]!.value : '#f97316')
  )

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSave = () => {
    if (name.trim()) {
      if (isEditing && projectId) {
        updateProject(projectId, { name: name.trim(), color })
      } else {
        addProject({ name: name.trim(), color })
      }
      onSave()
    } else {
      onCancel()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="space-y-2">
      <Input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder="プロジェクト名"
      />
      <div className="flex flex-wrap gap-1">
        {PROJECT_COLORS.map((colorOption) => (
          <button
            key={colorOption.value}
            className={cn(
              "w-6 h-6 rounded-full border",
              color === colorOption.value ? "ring-2 ring-primary" : ""
            )}
            style={{ backgroundColor: colorOption.value }}
            onClick={() => setColor(colorOption.value)}
            title={colorOption.name}
          >
            {color === colorOption.value && (
              <Check className="h-4 w-4 text-white mx-auto" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ProjectForm