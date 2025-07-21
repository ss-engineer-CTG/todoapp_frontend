// システムプロンプト準拠：タイムラインコンテキストメニュー
// 機能：選択されたタスクの一括操作メニューを提供

import React, { useCallback, useState } from 'react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@core/components/ui/dropdown-menu'
import { 
  Calendar,
  CalendarDays,
  CalendarX,
  ChevronRight,
  Clock,
  Move
} from 'lucide-react'
import { Task } from '@core/types'

export type DateShiftType = 'start-only' | 'due-only' | 'both'

interface ContextMenuProps {
  children: React.ReactNode
  selectedTasks: Task[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onDateShift: (type: DateShiftType) => void
  onClearSelection: () => void
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  children,
  selectedTasks,
  isOpen,
  onOpenChange,
  onDateShift,
  onClearSelection
}) => {
  const hasSelection = selectedTasks.length > 0

  const handleDateShift = useCallback((type: DateShiftType) => {
    onDateShift(type)
  }, [onDateShift])

  const handleClearSelection = useCallback(() => {
    onClearSelection()
    onOpenChange(false)
  }, [onClearSelection, onOpenChange])

  if (!hasSelection) {
    return <>{children}</>
  }

  return (
    <DropdownMenu 
      open={isOpen} 
      onOpenChange={onOpenChange}
      modal={false}
    >
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 z-50" 
        align="start"
        sideOffset={5}
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <Move size={16} />
          {selectedTasks.length}個のタスクを選択中
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* 一括日付ずらし操作 */}
        <DropdownMenuItem 
          onClick={() => handleDateShift('start-only')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Calendar size={16} />
          <span>開始日を一括変更</span>
          <ChevronRight size={12} className="ml-auto" />
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleDateShift('due-only')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <CalendarDays size={16} />
          <span>期限日を一括変更</span>
          <ChevronRight size={12} className="ml-auto" />
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleDateShift('both')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Clock size={16} />
          <span>両方の日付を一括変更</span>
          <ChevronRight size={12} className="ml-auto" />
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* 選択解除 */}
        <DropdownMenuItem 
          onClick={handleClearSelection}
          className="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-400"
        >
          <CalendarX size={16} />
          <span>選択解除</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}