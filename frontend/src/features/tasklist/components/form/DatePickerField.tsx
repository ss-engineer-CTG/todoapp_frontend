// システムプロンプト準拠：日付選択フィールド（リファクタリング：日付UI分離）
// リファクタリング対象：DetailPanel.tsx から日付選択UI部分を抽出

import React, { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@core/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@core/components/ui/popover'
import { Calendar } from '@core/components/ui/calendar'
import { formatDate, isValidDate } from '@core/utils/core'
import { cn } from '@core/utils/cn'

interface DatePickerFieldProps {
  label: string
  value: Date | null
  onChange: (date: Date | null) => void
  buttonRef?: React.RefObject<HTMLButtonElement>
  disabled?: boolean
  required?: boolean
}

export const DatePickerField: React.FC<DatePickerFieldProps> = React.memo(({
  label,
  value,
  onChange,
  buttonRef,
  disabled = false,
  required = false
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const handleDateSelect = (date: Date | undefined) => {
    onChange(date || null)
    setIsCalendarOpen(false)
  }

  const handleClearDate = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange(null)
  }

  const getDisplayText = () => {
    if (value && isValidDate(value)) {
      return formatDate(value)
    }
    return `${label}を選択`
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={buttonRef}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {getDisplayText()}
            {value && (
              <button
                onClick={handleClearDate}
                className="ml-auto p-1 rounded hover:bg-muted"
                title="日付をクリア"
              >
                ×
              </button>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value || undefined}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
})

DatePickerField.displayName = 'DatePickerField'