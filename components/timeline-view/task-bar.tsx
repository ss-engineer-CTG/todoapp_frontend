"use client"

import React from "react"
import { Check, AlertTriangle, Star, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Task } from "@/types/todo"
import type { DynamicSizes } from "@/types/timeline"

interface TaskBarProps {
  task: Task
  projectColor: string
  left: number
  width: number
  height: number
  dynamicSizes: DynamicSizes
  isSubtask?: boolean
  onClick?: () => void
}

export default function TaskBar({
  task,
  projectColor,
  left,
  width,
  height,
  dynamicSizes,
  isSubtask = false,
  onClick
}: TaskBarProps) {
  // ステータスに基づくスタイル計算
  const getStatusStyle = () => {
    const baseStyle = {
      borderWidth: Math.max(1, Math.round(dynamicSizes.zoomRatio)),
      borderStyle: isSubtask ? 'dashed' : 'solid'
    }

    const adjustOpacity = (color: string, opacity: number) => {
      if (color.startsWith('#')) {
        const r = parseInt(color.substr(1, 2), 16)
        const g = parseInt(color.substr(3, 2), 16)
        const b = parseInt(color.substr(5, 2), 16)
        return `rgba(${r}, ${g}, ${b}, ${opacity})`
      }
      return color
    }

    switch (task.status) {
      case 'completed':
        return {
          ...baseStyle,
          backgroundColor: isSubtask 
            ? 'rgba(16, 185, 129, 0.35)' 
            : 'rgba(16, 185, 129, 0.65)',
          borderColor: isSubtask 
            ? 'rgba(5, 150, 105, 0.45)' 
            : 'rgba(5, 150, 105, 0.75)',
          textColor: isSubtask 
            ? 'text-muted-foreground' 
            : 'text-white'
        }
      case 'in-progress':
        return {
          ...baseStyle,
          backgroundColor: adjustOpacity(projectColor, isSubtask ? 0.35 : 0.65),
          borderColor: adjustOpacity(projectColor, isSubtask ? 0.45 : 0.75),
          textColor: isSubtask 
            ? 'text-muted-foreground' 
            : 'text-white'
        }
      case 'overdue':
        return {
          ...baseStyle,
          backgroundColor: isSubtask 
            ? 'rgba(239, 68, 68, 0.35)' 
            : 'rgba(239, 68, 68, 0.65)',
          borderColor: isSubtask 
            ? 'rgba(220, 38, 38, 0.45)' 
            : 'rgba(220, 38, 38, 0.75)',
          textColor: isSubtask 
            ? 'text-muted-foreground' 
            : 'text-white'
        }
      default:
        return {
          ...baseStyle,
          backgroundColor: isSubtask 
            ? 'rgba(243, 244, 246, 0.4)' 
            : 'rgba(243, 244, 246, 0.7)',
          borderColor: isSubtask 
            ? 'rgba(156, 163, 175, 0.4)' 
            : 'rgba(156, 163, 175, 0.6)',
          textColor: 'text-muted-foreground'
        }
    }
  }

  const statusStyle = getStatusStyle()
  const iconSize = Math.max(12, Math.round(16 * dynamicSizes.zoomRatio))

  // 表示レベルに基づくテキスト制御
  const getDisplayText = () => {
    if (dynamicSizes.zoomRatio <= 0.3) return ''
    if (dynamicSizes.zoomRatio <= 0.5) return task.name.length > 5 ? task.name.substring(0, 3) + '…' : task.name
    if (dynamicSizes.zoomRatio <= 0.8) return task.name.length > 15 ? task.name.substring(0, 12) + '…' : task.name
    return task.name
  }

  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <Check size={iconSize} className="flex-shrink-0" />
      case 'in-progress':
        return <Clock size={iconSize} className="flex-shrink-0" />
      case 'overdue':
        return <AlertTriangle size={iconSize} className="flex-shrink-0" />
      default:
        return null
    }
  }

  return (
    <div
      className={cn(
        "absolute rounded-md shadow-md flex items-center transition-all duration-200 hover:shadow-lg cursor-pointer group",
        statusStyle.textColor
      )}
      style={{
        left,
        width: Math.max(width, 20),
        height,
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: statusStyle.backgroundColor,
        borderWidth: statusStyle.borderWidth,
        borderStyle: statusStyle.borderStyle,
        borderColor: statusStyle.borderColor,
        zIndex: task.milestone ? 3 : 2
      }}
      onClick={onClick}
    >
      {/* アイコン部分 */}
      <div className="px-2 flex items-center flex-shrink-0">
        {getStatusIcon()}
        {task.milestone && <Star size={iconSize} className="text-yellow-300 ml-1 flex-shrink-0" />}
      </div>

      {/* テキスト部分（ズームレベルに応じて表示） */}
      {dynamicSizes.zoomRatio > 0.3 && (
        <div 
          className="flex-1 min-w-0 px-1 font-medium truncate"
          style={{ fontSize: Math.max(8, dynamicSizes.fontSize.small) }}
        >
          {getDisplayText()}
        </div>
      )}
    </div>
  )
}