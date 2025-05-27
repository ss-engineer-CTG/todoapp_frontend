import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PROJECT_COLORS } from '@/constants/colors'

interface ProjectColorPickerProps {
  selectedColor: string
  onColorSelect: (color: string) => void
}

const ProjectColorPicker: React.FC<ProjectColorPickerProps> = ({
  selectedColor,
  onColorSelect,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {PROJECT_COLORS.map((color) => (
        <button
          key={color.value}
          className={cn(
            "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
            selectedColor === color.value 
              ? "ring-2 ring-primary ring-offset-2" 
              : "hover:scale-110"
          )}
          style={{ backgroundColor: color.value }}
          onClick={() => onColorSelect(color.value)}
          title={color.name}
        >
          {selectedColor === color.value && (
            <Check className="h-4 w-4 text-white drop-shadow-sm" />
          )}
        </button>
      ))}
    </div>
  )
}

export default ProjectColorPicker