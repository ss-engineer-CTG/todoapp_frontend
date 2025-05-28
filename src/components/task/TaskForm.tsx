import React from 'react'
import { Check, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTasks } from '@/hooks/useTasks'
import { cn } from '@/lib/utils'
import ErrorMessage from '@/components/common/ErrorMessage'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const TaskForm: React.FC = () => {
  const {
    newTaskName,
    newTaskLevel,
    setNewTaskName,
    saveNewTask,
    cancelAddTask
  } = useTasks()
  
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [validationError, setValidationError] = React.useState<string | null>(null)

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // リアルタイムバリデーション
  const validateTaskName = (name: string): string | null => {
    if (!name.trim()) {
      return 'タスク名は必須です'
    }
    if (name.length > 200) {
      return 'タスク名は200文字以下で入力してください'
    }
    return null
  }

  const handleNameChange = (value: string) => {
    try {
      setNewTaskName(value)
      
      // リアルタイムバリデーション
      const validationErr = validateTaskName(value)
      setValidationError(validationErr)
      
      // エラーをクリア
      if (error) {
        setError(null)
      }
    } catch (err) {
      console.error('Error handling name change:', err)
      setError('入力処理中にエラーが発生しました')
    }
  }

  const handleSave = async () => {
    try {
      setError(null)
      setIsLoading(true)

      // バリデーション
      const validationErr = validateTaskName(newTaskName)
      if (validationErr) {
        setValidationError(validationErr)
        return
      }

      const result = saveNewTask()
      if (!result.success) {
        setError(result.message)
      }
    } catch (err) {
      console.error('Error saving task:', err)
      setError('タスクの保存中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    try {
      const result = cancelAddTask()
      if (!result.success) {
        console.warn('Failed to cancel add task:', result.message)
      }
    } catch (error) {
      console.error('Error canceling add task:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleBlur = () => {
    // ユーザーが何も入力していない場合は自動的にキャンセル
    if (!newTaskName.trim()) {
      handleCancel()
    } else {
      handleSave()
    }
  }

  return (
    <div className="space-y-2">
      {/* エラー表示 */}
      {error && (
        <ErrorMessage
          type="error"
          message={error}
          onClose={() => setError(null)}
          className="text-sm"
        />
      )}

      <div 
        className="flex items-center p-2 bg-card border rounded-lg shadow-sm" 
        style={{ marginLeft: `${newTaskLevel * 1.5}rem` }}
      >
        {/* 展開アイコンのスペース */}
        <div className="w-6 mr-2" />
        
        {/* チェックボックス（無効状態） */}
        <Checkbox 
          className="mr-3 opacity-50" 
          disabled 
          checked={false}
        />
        
        {/* 入力フィールド */}
        <div className="flex-1">
          <Input
            ref={inputRef}
            value={newTaskName}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="新しいタスクを入力..."
            className={cn(
              "border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0",
              validationError && "text-destructive"
            )}
            disabled={isLoading}
            maxLength={200}
          />
          
          {/* バリデーションエラー */}
          {validationError && (
            <p className="text-xs text-destructive mt-1">{validationError}</p>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex items-center space-x-1 ml-2">
          {isLoading ? (
            <LoadingSpinner size="sm" showMessage={false} />
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleSave}
                disabled={!newTaskName.trim() || !!validationError}
                title="保存 (Enter)"
              >
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCancel}
                title="キャンセル (Escape)"
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ヘルプテキスト */}
      <div className="text-xs text-muted-foreground ml-2" style={{ marginLeft: `${newTaskLevel * 1.5 + 0.5}rem` }}>
        Enter で保存、Escape でキャンセル
      </div>
    </div>
  )
}

export default TaskForm