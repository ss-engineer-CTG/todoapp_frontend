interface ProjectBadgeProps {
    name: string
    color: string
  }
  
  export default function ProjectBadge({ name, color }: ProjectBadgeProps) {
    return (
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color || '#4a6da7' }}></div>
        <span className="text-xs text-gray-600">{name}</span>
      </div>
    )
  }