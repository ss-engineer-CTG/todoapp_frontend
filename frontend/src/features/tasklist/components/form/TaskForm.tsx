// システムプロンプト準拠：タスクフォーム基本構造（リファクタリング：フォーム責任分離）
// リファクタリング対象：DetailPanel.tsx からフォーム構造部分を抽出

import React from 'react'
import { Task, Project } from '@core/types'
import { Input } from '@core/components/ui/input'
import { Textarea } from '@core/components/ui/textarea'
import { DatePickerField } from './DatePickerField'
import { FormActions } from './FormActions'
import { isDraftTask } from '@tasklist/utils/task'

interface TaskFormProps {
  task: Task | undefined
  formData: {
    name: string
    startDate: Date | null
    dueDate: Date | null
    assignee: string
    notes: string
    hasChanges: boolean
    canSave: boolean
  }
  onFormChange: (field: string, value: any) => void
  onSave: () => Promise<void>
  onCancel: () => void
  isSaving: boolean
  projects: Project[]
  
  // Refs for keyboard navigation
  taskNameInputRef: React.RefObject<HTMLInputElement>
  startDateButtonRef: React.RefObject<HTMLButtonElement>
  dueDateButtonRef: React.RefObject<HTMLButtonElement>
  taskNotesRef: React.RefObject<HTMLTextAreaElement>
  saveButtonRef: React.RefObject<HTMLButtonElement>
}

export const TaskForm: React.FC<TaskFormProps> = React.memo(({
  task,
  formData,
  onFormChange,
  onSave,
  onCancel,
  isSaving,
  projects,
  taskNameInputRef,
  startDateButtonRef,
  dueDateButtonRef,
  taskNotesRef,
  saveButtonRef
}) => {
  const isTaskDraft = task ? isDraftTask(task) : false
  const currentProject = task ? projects.find(p => p.id === task.projectId) : null

  return (
    <div className="space-y-6">
      {/* タスク名入力 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          タスク名 <span className="text-red-500">*</span>
        </label>
        <Input
          ref={taskNameInputRef}
          type="text"
          value={formData.name}
          onChange={(e) => onFormChange('name', e.target.value)}
          className="w-full"
          placeholder="タスク名を入力してください"
          disabled={isSaving}
        />
      </div>

      {/* プロジェクト表示 */}
      {currentProject && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            プロジェクト
          </label>
          <div className="p-2 bg-muted rounded border text-sm">
            {currentProject.name}
          </div>
        </div>
      )}

      {/* 日付選択 */}
      <div className="grid grid-cols-2 gap-4">
        <DatePickerField
          label="開始日"
          value={formData.startDate}
          onChange={(date) => onFormChange('startDate', date)}
          buttonRef={startDateButtonRef}
          disabled={isSaving}
        />
        
        <DatePickerField
          label="期限日"
          value={formData.dueDate}
          onChange={(date) => onFormChange('dueDate', date)}
          buttonRef={dueDateButtonRef}
          disabled={isSaving}
        />
      </div>

      {/* 担当者入力 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          担当者
        </label>
        <Input
          type="text"
          value={formData.assignee}
          onChange={(e) => onFormChange('assignee', e.target.value)}
          className="w-full"
          placeholder="担当者を入力してください"
          disabled={isSaving}
        />
      </div>

      {/* ノート入力 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          ノート
        </label>
        <Textarea
          ref={taskNotesRef}
          value={formData.notes}
          onChange={(e) => onFormChange('notes', e.target.value)}
          className="w-full min-h-[120px] resize-none"
          placeholder="メモや詳細情報を入力してください"
          disabled={isSaving}
        />
      </div>

      {/* アクションボタン */}
      <FormActions
        canSave={formData.canSave}
        hasChanges={formData.hasChanges}
        isSaving={isSaving}
        isTaskDraft={isTaskDraft}
        onSave={onSave}
        onCancel={onCancel}
        saveButtonRef={saveButtonRef}
      />
    </div>
  )
})

TaskForm.displayName = 'TaskForm'