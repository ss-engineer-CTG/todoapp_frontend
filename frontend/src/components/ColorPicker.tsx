import React from 'react'
import { Check } from 'lucide-react'
import { PROJECT_COLORS } from '../config/constants'
import { cn } from '@/lib/utils'
import { ProjectColor } from '../types'

interface ColorPickerProps {
  selectedColor: string
  onColorSelect: (color: string) => void
  className?: string
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorSelect,
  className
}) => {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {PROJECT_COLORS.map((color: ProjectColor) => (
        <button
          key={color.value}
          className={cn(
            "w-6 h-6 rounded-full border transition-all hover:scale-110",
            selectedColor === color.value ? "ring-2 ring-primary ring-offset-2" : ""
          )}
          style={{ backgroundColor: color.value }}
          onClick={() => onColorSelect(color.value)}
          title={color.name}
          type="button"
        >
          {selectedColor === color.value && (
            <Check className="h-4 w-4 text-white mx-auto" />
          )}
        </button>
      ))}
    </div>
  )
}