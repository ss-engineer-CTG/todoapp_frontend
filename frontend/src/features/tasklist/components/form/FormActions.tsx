// システムプロンプト準拠：フォームアクションボタン（リファクタリング：アクション分離）
// リファクタリング対象：DetailPanel.tsx からアクションボタン部分を抽出

import React from 'react'
import { Save, X } from 'lucide-react'
import { Button } from '@core/components/ui/button'
import { logger } from '@core/utils'

interface FormActionsProps {
  canSave: boolean
  hasChanges: boolean
  isSaving: boolean
  isTaskDraft: boolean
  onSave: () => Promise<void>
  onCancel: () => void
  saveButtonRef?: React.RefObject<HTMLButtonElement>
}

export const FormActions: React.FC<FormActionsProps> = React.memo(({
  canSave,
  hasChanges,
  isSaving,
  isTaskDraft,
  onSave,
  onCancel,
  saveButtonRef
}) => {
  
  const handleSave = async () => {
    if (!canSave || isSaving) {
      logger.warn('Save action blocked', { canSave, isSaving })
      return
    }
    
    logger.info('Form save initiated', { 
      hasChanges, 
      isTaskDraft,
      source: 'form_actions'
    })
    
    await onSave()
  }

  const handleCancel = () => {
    logger.info('Form cancel initiated', { 
      hasChanges,
      isTaskDraft,
      source: 'form_actions'
    })
    
    onCancel()
  }

  const getSaveButtonText = () => {
    if (isSaving) {
      return isTaskDraft ? '作成中...' : '保存中...'
    }
    return isTaskDraft ? '作成' : '保存'
  }

  const getCancelButtonText = () => {
    return isTaskDraft ? 'キャンセル' : '閉じる'
  }

  return (
    <div className="flex justify-end space-x-2 pt-4 border-t">
      {/* キャンセル/閉じるボタン */}
      <Button
        variant="outline"
        onClick={handleCancel}
        disabled={isSaving}
        className="flex items-center space-x-1"
      >
        <X className="w-4 h-4" />
        <span>{getCancelButtonText()}</span>
      </Button>

      {/* 保存/作成ボタン */}
      <Button
        ref={saveButtonRef}
        onClick={handleSave}
        disabled={!canSave || isSaving}
        className="flex items-center space-x-1"
      >
        <Save className="w-4 h-4" />
        <span>{getSaveButtonText()}</span>
      </Button>
    </div>
  )
})

FormActions.displayName = 'FormActions'