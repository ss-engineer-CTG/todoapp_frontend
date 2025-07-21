// システムプロンプト準拠：日付一括変更ダイアログ
// 機能：選択されたタスクの日付を一括で変更

import React, { useState, useCallback } from 'react'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@core/components/ui/dialog'
import { Button } from '@core/components/ui/button'
import { Input } from '@core/components/ui/input'
import { Label } from '@core/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@core/components/ui/select'
import { 
  Calendar,
  CalendarDays,
  Clock,
  ArrowLeft,
  ArrowRight,
  Info
} from 'lucide-react'
import { Task } from '@core/types'
import { DateShiftType } from './ContextMenu'

export interface DateShiftOptions {
  type: DateShiftType
  direction: 'forward' | 'backward'
  days: number
}

interface DateShiftDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedTasks: Task[]
  shiftType: DateShiftType
  onConfirm: (options: DateShiftOptions) => void
}

export const DateShiftDialog: React.FC<DateShiftDialogProps> = ({
  isOpen,
  onClose,
  selectedTasks,
  shiftType,
  onConfirm
}) => {
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [days, setDays] = useState<number>(1)
  const [isProcessing, setIsProcessing] = useState(false)

  const getTitle = () => {
    switch (shiftType) {
      case 'start-only':
        return '開始日を一括変更'
      case 'due-only':
        return '期限日を一括変更'
      case 'both':
        return '両方の日付を一括変更'
      default:
        return '日付を一括変更'
    }
  }

  const getIcon = () => {
    switch (shiftType) {
      case 'start-only':
        return <Calendar size={20} />
      case 'due-only':
        return <CalendarDays size={20} />
      case 'both':
        return <Clock size={20} />
      default:
        return <Calendar size={20} />
    }
  }

  const getDescription = () => {
    const taskCount = selectedTasks.length
    switch (shiftType) {
      case 'start-only':
        return `${taskCount}個のタスクの開始日を一括で変更します。`
      case 'due-only':
        return `${taskCount}個のタスクの期限日を一括で変更します。`
      case 'both':
        return `${taskCount}個のタスクの開始日と期限日を同じ日数分だけ一括で変更します。`
      default:
        return `${taskCount}個のタスクの日付を一括で変更します。`
    }
  }

  const handleConfirm = useCallback(async () => {
    if (days <= 0) return
    
    setIsProcessing(true)
    try {
      await onConfirm({
        type: shiftType,
        direction,
        days
      })
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }, [shiftType, direction, days, onConfirm, onClose])

  const handleClose = useCallback(() => {
    if (!isProcessing) {
      onClose()
    }
  }, [isProcessing, onClose])

  const handleDaysChange = useCallback((value: string) => {
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 999) {
      setDays(numValue)
    }
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* 方向選択 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="direction" className="text-right">
              方向
            </Label>
            <Select value={direction} onValueChange={setDirection}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="方向を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forward">
                  <div className="flex items-center gap-2">
                    <ArrowRight size={16} />
                    <span>前に進める</span>
                  </div>
                </SelectItem>
                <SelectItem value="backward">
                  <div className="flex items-center gap-2">
                    <ArrowLeft size={16} />
                    <span>後に戻す</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 日数入力 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="days" className="text-right">
              日数
            </Label>
            <Input
              id="days"
              type="number"
              min="1"
              max="999"
              value={days}
              onChange={(e) => handleDaysChange(e.target.value)}
              className="col-span-3"
              placeholder="1-999"
            />
          </div>

          {/* 情報表示 */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium">変更内容:</p>
              <p>
                {direction === 'forward' ? '前に' : '後に'}
                <span className="font-bold">{days}日</span>
                {direction === 'forward' ? '進める' : '戻す'}
              </p>
              {shiftType === 'both' && (
                <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                  ※開始日と期限日の間隔は保持されます
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isProcessing}
          >
            キャンセル
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isProcessing || days <= 0}
          >
            {isProcessing ? '処理中...' : '変更実行'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}