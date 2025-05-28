import type { ProjectFormData } from '@/types/project'

interface ValidationResult {
  isValid: boolean
  errors: { field: string; message: string }[]
}

export function validateProject(data: ProjectFormData): ValidationResult {
  const errors: { field: string; message: string }[] = []

  try {
    // 名前のバリデーション
    if (!data.name || typeof data.name !== 'string') {
      errors.push({ field: 'name', message: 'プロジェクト名は必須です' })
    } else if (data.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'プロジェクト名を入力してください' })
    } else if (data.name.length > 100) {
      errors.push({ field: 'name', message: 'プロジェクト名は100文字以下で入力してください' })
    }

    // 色のバリデーション
    if (!data.color || typeof data.color !== 'string') {
      errors.push({ field: 'color', message: 'プロジェクトの色を選択してください' })
    } else if (!/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
      errors.push({ field: 'color', message: '有効な色を選択してください' })
    }

    // 説明のバリデーション（任意）
    if (data.description && typeof data.description === 'string' && data.description.length > 500) {
      errors.push({ field: 'description', message: 'プロジェクトの説明は500文字以下で入力してください' })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  } catch (error) {
    console.error('Error validating project:', error)
    return {
      isValid: false,
      errors: [{ field: 'name', message: 'バリデーションエラーが発生しました' }]
    }
  }
}

export function generateProjectId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `p${timestamp}_${random}`
}

export function getProjectColor(colorValue: string): { name: string; value: string } | null {
  const PROJECT_COLORS = [
    { name: 'オレンジ', value: '#f97316' },
    { name: '紫', value: '#8b5cf6' },
    { name: '緑', value: '#10b981' },
    { name: '赤', value: '#ef4444' },
    { name: '青', value: '#3b82f6' },
    { name: '琥珀', value: '#f59e0b' },
    { name: 'ピンク', value: '#ec4899' },
    { name: 'ティール', value: '#14b8a6' },
    { name: 'インディゴ', value: '#6366f1' },
    { name: 'ライム', value: '#84cc16' },
    { name: 'ローズ', value: '#f43f5e' },
    { name: 'シアン', value: '#06b6d4' },
  ]

  return PROJECT_COLORS.find(color => color.value === colorValue) || null
}