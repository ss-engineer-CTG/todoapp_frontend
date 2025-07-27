// システムプロンプト準拠：タイムラインビューメニューバー
// 機能：選択されたタスクの一括操作メニューをトップバーに提供

import React, { useCallback } from 'react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@core/components/ui/dropdown-menu'
import { Button } from '@core/components/ui/button'
import { 
  Calendar,
  CalendarDays,
  Clock,
  ChevronDown,
  Settings,
  Move
} from 'lucide-react'
import { Task } from '@core/types'
import { DateShiftType } from './ContextMenu'

interface TimelineMenuBarProps {
  selectedTasks: Task[]
  onDateShift: (type: DateShiftType) => void
  onClearSelection: () => void
  theme: 'light' | 'dark'
}

export const TimelineMenuBar: React.FC<TimelineMenuBarProps> = ({
  selectedTasks,
  onDateShift,
  onClearSelection,
  theme
}) => {
  const hasSelection = selectedTasks.length > 0

  const handleDateShift = useCallback((type: DateShiftType) => {
    onDateShift(type)
  }, [onDateShift])

  const handleClearSelection = useCallback(() => {
    onClearSelection()
  }, [onClearSelection])

  if (!hasSelection) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 px-4 py-2 border-b ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-600 text-gray-100' 
        : 'bg-gray-50 border-gray-200 text-gray-900'
    }`}>
      <div className="flex items-center gap-2">
        <Move size={16} className="text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-medium">
          {selectedTasks.length}個のタスクを選択中
        </span>
      </div>
      
      <div className="flex items-center gap-2 ml-auto">
        {/* 一括日付ずらし */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Calendar size={14} className="mr-2" />
              日付を一括変更
              <ChevronDown size={14} className="ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="flex items-center gap-2">
              <Settings size={16} />
              日付変更オプション
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => handleDateShift('start-only')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Calendar size={16} />
              <span>開始日のみ</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => handleDateShift('due-only')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <CalendarDays size={16} />
              <span>期限日のみ</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => handleDateShift('both')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Clock size={16} />
              <span>両方の日付</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* 選択解除 */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleClearSelection}
          className="h-8 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          選択解除
        </Button>
      </div>
    </div>
  )
}