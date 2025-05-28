import React from 'react'
import { Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useProjects } from '@/hooks/useProjects'
import { PROJECT_COLORS } from '@/constants/colors'
import ErrorMessage from '@/components/common/ErrorMessage'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface ProjectFormProps {
  projectId?: string
  onSave: () => void
  onCancel: () => void
}

const ProjectForm: React.FC<ProjectFormProps> = ({ projectId, onSave, onCancel }) => {
  const { projects, addProject, updateProject, stopEditProject } = useProjects()
  
  const nameInputRef = React.useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  const isEditing = !!projectId
  const existingProject = isEditing ? projects.find(p => p.id === projectId) : null
  
  const [formData, setFormData] = React.useState({
    name: existingProject?.name || '',
    color: existingProject?.color || (PROJECT_COLORS[0]?.value || '#f97316'),
    description: existingProject?.description || ''
  })

  const [validationErrors, setValidationErrors] = React.useState<{
    name?: string
    color?: string
    description?: string
  }>({})

  React.useEffect(() => {
    nameInputRef.current?.focus()
  }, [])

  // フォームバリデーション
  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {}
    let isValid = true

    // 名前のバリデーション
    if (!formData.name.trim()) {
      errors.name = 'プロジェクト名は必須です'
      isValid = false
    } else if (formData.name.length > 100) {
      errors.name = 'プロジェクト名は100文字以下で入力してください'
      isValid = false
    }

    // 色のバリデーション
    if (!formData.color) {
      errors.color = 'プロジェクトの色を選択してください'
      isValid = false
    } else if (!/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      errors.color = '有効な色を選択してください'
      isValid = false
    }

    // 説明のバリデーション（任意）
    if (formData.description && formData.description.length > 500) {
      errors.description = 'プロジェクトの説明は500文字以下で入力してください'
      isValid = false
    }

    // 重複チェック（編集時は自分自身を除く）
    const duplicateProject = projects.find(p => 
      p.name.toLowerCase() === formData.name.toLowerCase() && 
      p.id !== projectId
    )
    if (duplicateProject) {
      errors.name = '同じ名前のプロジェクトが既に存在します'
      isValid = false
    }

    setValidationErrors(errors)
    return isValid
  }

  const handleSave = async () => {
    try {
      setError(null)
      setIsLoading(true)

      if (!validateForm()) {
        return
      }

      const projectData = {
        name: formData.name.trim(),
        color: formData.color,
        description: formData.description.trim()
      }

      let result
      if (isEditing && projectId) {
        result = updateProject(projectId, projectData)
        if (result.success) {
          stopEditProject()
        }
      } else {
        result = addProject(projectData)
      }

      if (result.success) {
        onSave()
      } else {
        setError(result.message)
      }
    } catch (error) {
      console.error('Error saving project:', error)
      setError('プロジェクトの保存中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    try {
      if (isEditing) {
        stopEditProject()
      }
      onCancel()
    } catch (error) {
      console.error('Error canceling project form:', error)
      onCancel() // エラーでもキャンセルは実行
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

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // リアルタイムバリデーション（エラーをクリア）
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="space-y-4 p-4 bg-card border rounded-lg shadow-sm">
      {/* エラー表示 */}
      {error && (
        <ErrorMessage
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* プロジェクト名 */}
      <div className="space-y-2">
        <Label htmlFor="project-name">
          プロジェクト名 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="project-name"
          ref={nameInputRef}
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="プロジェクト名を入力"
          className={cn(validationErrors.name && "border-destructive")}
          disabled={isLoading}
          maxLength={100}
        />
        {validationErrors.name && (
          <p className="text-sm text-destructive">{validationErrors.name}</p>
        )}
      </div>

      {/* プロジェクトの色 */}
      <div className="space-y-2">
        <Label>
          プロジェクトの色 <span className="text-destructive">*</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {PROJECT_COLORS.map((colorOption) => (
            <button
              key={colorOption.value}
              type="button"
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                formData.color === colorOption.value 
                  ? "ring-2 ring-primary ring-offset-2" 
                  : "hover:scale-110",
                validationErrors.color && "ring-1 ring-destructive"
              )}
              style={{ backgroundColor: colorOption.value }}
              onClick={() => handleInputChange('color', colorOption.value)}
              title={colorOption.name}
              disabled={isLoading}
            >
              {formData.color === colorOption.value && (
                <Check className="h-4 w-4 text-white drop-shadow-sm" />
              )}
            </button>
          ))}
        </div>
        {validationErrors.color && (
          <p className="text-sm text-destructive">{validationErrors.color}</p>
        )}
      </div>

      {/* 説明（任意） */}
      <div className="space-y-2">
        <Label htmlFor="project-description">
          説明 <span className="text-muted-foreground">(任意)</span>
        </Label>
        <Textarea
          id="project-description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="プロジェクトの説明を入力"
          className={cn(
            "min-h-[80px] resize-none",
            validationErrors.description && "border-destructive"
          )}
          disabled={isLoading}
          maxLength={500}
        />
        <div className="flex justify-between items-center">
          {validationErrors.description ? (
            <p className="text-sm text-destructive">{validationErrors.description}</p>
          ) : (
            <div />
          )}
          <p className="text-xs text-muted-foreground">
            {formData.description.length}/500
          </p>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex justify-end space-x-2 pt-2">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
          size="sm"
        >
          <X className="h-4 w-4 mr-1" />
          キャンセル
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading || !formData.name.trim()}
          size="sm"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" showMessage={false} />
          ) : (
            <Check className="h-4 w-4 mr-1" />
          )}
          {isEditing ? '更新' : '作成'}
        </Button>
      </div>
    </div>
  )
}

export default ProjectForm