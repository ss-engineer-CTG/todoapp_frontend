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

export type ViewMode = 'list' | 'timeline'
export type ActiveArea = 'projects' | 'tasks' | 'details'
export type ThemeMode = 'light' | 'dark' | 'system'