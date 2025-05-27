// 全ての型定義をエクスポート
export * from './project'
export * from './task'
export * from './timeline'
export * from './app'

// 共通の基本型
export interface BaseEntity {
  id: string
  createdAt?: Date
  updatedAt?: Date
}

export interface SelectOption {
  value: string
  label: string
  color?: string
}

export const DATE_FORMATS = {
  SHORT: 'M月d日',
  LONG: 'yyyy年M月d日',
  TIME: 'HH:mm',
  DATETIME: 'yyyy年M月d日 HH:mm',
} as const

export const VALIDATION_RULES = {
  PROJECT_NAME_MAX_LENGTH: 100,
  TASK_NAME_MAX_LENGTH: 200,
  NOTES_MAX_LENGTH: 1000,
  MIN_PASSWORD_LENGTH: 8,
} as const