import React from 'react'
import { CalendarIcon, X, Save, AlertCircle, User, Tag, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useProjects } from '@/hooks/useProjects'
import { useTasks } from '@/hooks/useTasks'
import { useApp } from '@/hooks/useApp'
import ErrorMessage from '@/components/common/ErrorMessage'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '@/types/task'
import type { TaskPriority, TaskStatus } from '@/types/task'

const TaskDetail: React.FC = () => {
  const { projects } = useProjects()
  const { selectedTask, updateTask, error: taskError } = useTasks()
  const { activeArea, setActiveArea, isDetailPanelVisible, setIsDetailPanelVisible } = useApp()

  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
  const [validationErrors, setValidationErrors] = React.useState<{
    name?: string
    startDate?: string
    dueDate?: string
    notes?: string
    assignee?: string
  }>({})

  // フォームの状態管理
  const [formData, setFormData] = React.useState({
    name: selectedTask?.name || '',
    startDate: selectedTask?.startDate || new Date(),
    dueDate: selectedTask?.dueDate || new Date(),
    notes: selectedTask?.notes || '',
    assignee: selectedTask?.assignee || '',
    priority: selectedTask?.priority || 'medium' as TaskPriority,
    status: selectedTask?.status || 'not-started' as TaskStatus
  })

  // selectedTaskが変更された時にフォームデータを更新
  React.useEffect(() => {
    if (selectedTask) {
      setFormData({
        name: selectedTask.name,
        startDate: selectedTask.startDate,
        dueDate: selectedTask.dueDate,
        notes: selectedTask.notes || '',
        assignee: selectedTask.assignee || '',
        priority: selectedTask.priority || 'medium',
        status: selectedTask.status || 'not-started'
      })
      setHasUnsavedChanges(false)
      setValidationErrors({})
      setError(null)
    }
  }, [selectedTask])

  const taskNameRef = React.useRef<HTMLInputElement>(null)
  const startDateButtonRef = React.useRef<HTMLButtonElement>(null)
  const dueDateButtonRef = React.useRef<HTMLButtonElement>(null)
  const notesRef = React.useRef<HTMLTextAreaElement>(null)

  if (!isDetailPanelVisible) return null

  // フォームバリデーション
  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {}
    let isValid = true

    // 名前のバリデーション
    if (!formData.name.trim()) {
      errors.name = 'タスク名は必須です'
      isValid = false
    } else if (formData.name.length > 200) {
      errors.name = 'タスク名は200文字以下で入力してください'
      isValid = false
    }

    // 日付のバリデーション
    if (formData.startDate && formData.dueDate && formData.startDate > formData.dueDate) {
      errors.dueDate = '期限日は開始日以降を設定してください'
      isValid = false
    }

    // メモの長さチェック
    if (formData.notes && formData.notes.length > 2000) {
      errors.notes = 'メモは2000文字以下で入力してください'
      isValid = false
    }

    // 担当者の長さチェック
    if (formData.assignee && formData.assignee.length > 50) {
      errors.assignee = '担当者は50文字以下で入力してください'
      isValid = false
    }

    setValidationErrors(errors)
    return isValid
  }

  // フォームデータの変更処理
  const handleFormChange = (field: keyof typeof formData, value: any) => {
    try {
      setFormData(prev => ({ ...prev, [field]: value }))
      setHasUnsavedChanges(true)
      
      // リアルタイムバリデーション（エラーをクリア）
      if (validationErrors[field as keyof typeof validationErrors]) {
        setValidationErrors(prev => ({ ...prev, [field]: undefined }))
      }
      
      if (error) {
        setError(null)
      }
    } catch (err) {
      console.error('Error handling form change:', err)
      setError('フォームの更新中にエラーが発生しました')
    }
  }

  // タスクの保存
  const handleSave = async () => {
    if (!selectedTask) {
      setError('選択されたタスクが見つかりません')
      return
    }

    try {
      setError(null)
      setIsLoading(true)

      if (!validateForm()) {
        return
      }

      const updates = {
        name: formData.name.trim(),
        startDate: formData.startDate,
        dueDate: formData.dueDate,
        endDate: formData.dueDate, // 期限日を終了日としても設定
        notes: formData.notes.trim(),
        assignee: formData.assignee.trim(),
        priority: formData.priority,
        status: formData.status
      }

      const result = updateTask(selectedTask.id, updates)
      if (result.success) {
        setHasUnsavedChanges(false)
      } else {
        setError(result.message)
      }
    } catch (err) {
      console.error('Error saving task:', err)
      setError('タスクの保存中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  // パネルを閉じる
  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm('未保存の変更があります。閉じてもよろしいですか？')
      if (!confirmClose) {
        return
      }
    }

    setIsDetailPanelVisible(false)
    if (activeArea === 'details') {
      setActiveArea('tasks')
    }
  }

  // エラーをクリア
  const clearError = () => {
    setError(null)
  }

  const selectedProject = selectedTask ? projects.find(p => p?.id === selectedTask.projectId) : null

  return (
    <div
      className={cn(
        "w-80 border-l h-full bg-background transition-colors",
        activeArea === 'details' ? "bg-accent/40" : ""
      )}
      onClick={() => setActiveArea('details')}
    >
      {selectedTask ? (
        <div className="p-4 h-full flex flex-col">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">タスク詳細</h2>
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="text-xs"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" showMessage={false} />
                  ) : (
                    <Save className="h-3 w-3 mr-1" />
                  )}
                  保存
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                title="詳細パネルを非表示"
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* エラー表示 */}
          {(error || taskError) && (
            <div className="mb-4">
              <ErrorMessage
                type="error"
                message={error || taskError || ''}
                onClose={clearError}
              />
            </div>
          )}

          {/* フォーム */}
          <div className="space-y-4 flex-grow overflow-y-auto">
            {/* タスク名 */}
            <div className="space-y-2">
              <Label htmlFor="task-name">
                タスク名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="task-name"
                ref={taskNameRef}
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                className={cn(validationErrors.name && "border-destructive")}
                disabled={isLoading}
                maxLength={200}
              />
              {validationErrors.name && (
                <p className="text-sm text-destructive">{validationErrors.name}</p>
              )}
            </div>

            {/* 日付 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>開始日</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      ref={startDateButtonRef}
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        validationErrors.startDate && "border-destructive"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.startDate, "M月d日", { locale: ja })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => handleFormChange('startDate', date || new Date())}
                      initialFocus
                      locale={ja}
                    />
                  </PopoverContent>
                </Popover>
                {validationErrors.startDate && (
                  <p className="text-xs text-destructive">{validationErrors.startDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>期限日</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      ref={dueDateButtonRef}
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        validationErrors.dueDate && "border-destructive"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.dueDate, "M月d日", { locale: ja })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.dueDate}
                      onSelect={(date) => handleFormChange('dueDate', date || new Date())}
                      initialFocus
                      locale={ja}
                    />
                  </PopoverContent>
                </Popover>
                {validationErrors.dueDate && (
                  <p className="text-xs text-destructive">{validationErrors.dueDate}</p>
                )}
              </div>
            </div>

            {/* 完了日（完了している場合のみ表示） */}
            {selectedTask.completionDate && (
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  完了日
                </Label>
                <div className="text-sm p-2 border rounded-md bg-muted/50">
                  {format(selectedTask.completionDate, "yyyy年M月d日 HH:mm", { locale: ja })}
                </div>
              </div>
            )}

            {/* ステータス */}
            <div className="space-y-2">
              <Label>ステータス</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleFormChange('status', value as TaskStatus)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 優先度 */}
            <div className="space-y-2">
              <Label>優先度</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleFormChange('priority', value as TaskPriority)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* プロジェクト */}
            <div className="space-y-2">
              <Label>プロジェクト</Label>
              <div className="text-sm p-2 border rounded-md bg-muted/50 flex items-center">
                {selectedProject ? (
                  <>
                    <span
                      className="inline-block w-3 h-3 mr-2 rounded-full"
                      style={{ backgroundColor: selectedProject.color }}
                    />
                    {selectedProject.name}
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2 text-destructive" />
                    プロジェクトが見つかりません
                  </>
                )}
              </div>
            </div>

            {/* 担当者 */}
            <div className="space-y-2">
              <Label htmlFor="task-assignee" className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                担当者
              </Label>
              <Input
                id="task-assignee"
                value={formData.assignee}
                onChange={(e) => handleFormChange('assignee', e.target.value)}
                placeholder="担当者を入力"
                className={cn(validationErrors.assignee && "border-destructive")}
                disabled={isLoading}
                maxLength={50}
              />
              {validationErrors.assignee && (
                <p className="text-sm text-destructive">{validationErrors.assignee}</p>
              )}
            </div>

            {/* メモ */}
            <div className="space-y-2">
              <Label htmlFor="task-notes" className="flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                メモ
              </Label>
              <Textarea
                id="task-notes"
                ref={notesRef}
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                className={cn(
                  "min-h-[100px] resize-none",
                  validationErrors.notes && "border-destructive"
                )}
                placeholder="メモを追加..."
                disabled={isLoading}
                maxLength={2000}
              />
              <div className="flex justify-between items-center">
                {validationErrors.notes ? (
                  <p className="text-sm text-destructive">{validationErrors.notes}</p>
                ) : (
                  <div />
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.notes.length}/2000
                </p>
              </div>
            </div>
          </div>

          {/* 保存ボタン（変更がある場合のみ表示） */}
          {hasUnsavedChanges && (
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" showMessage={false} />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                変更を保存
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-center p-6">
          <div>
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">タスクを選択してください</p>
            <p className="text-muted-foreground">
              タスクを選択すると詳細情報が表示されます
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskDetail