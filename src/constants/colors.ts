export interface ProjectColor {
    name: string
    value: string
    lightValue?: string
    darkValue?: string
  }
  
  export const PROJECT_COLORS: ProjectColor[] = [
    { name: 'オレンジ', value: '#f97316', lightValue: '#fed7aa', darkValue: '#ea580c' },
    { name: '紫', value: '#8b5cf6', lightValue: '#ddd6fe', darkValue: '#7c3aed' },
    { name: '緑', value: '#10b981', lightValue: '#a7f3d0', darkValue: '#059669' },
    { name: '赤', value: '#ef4444', lightValue: '#fecaca', darkValue: '#dc2626' },
    { name: '青', value: '#3b82f6', lightValue: '#bfdbfe', darkValue: '#2563eb' },
    { name: '琥珀', value: '#f59e0b', lightValue: '#fde68a', darkValue: '#d97706' },
    { name: 'ピンク', value: '#ec4899', lightValue: '#f9a8d4', darkValue: '#db2777' },
    { name: 'ティール', value: '#14b8a6', lightValue: '#99f6e4', darkValue: '#0f766e' },
    { name: 'インディゴ', value: '#6366f1', lightValue: '#c7d2fe', darkValue: '#4f46e5' },
    { name: 'ライム', value: '#84cc16', lightValue: '#d9f99d', darkValue: '#65a30d' },
    { name: 'ローズ', value: '#f43f5e', lightValue: '#fda4af', darkValue: '#e11d48' },
    { name: 'シアン', value: '#06b6d4', lightValue: '#a5f3fc', darkValue: '#0891b2' },
  ]
  
  export const STATUS_COLORS = {
    'not-started': {
      background: '#f3f4f6',
      border: '#9ca3af',
      text: '#6b7280',
    },
    'in-progress': {
      background: '#dbeafe',
      border: '#3b82f6',
      text: '#1e40af',
    },
    'completed': {
      background: '#d1fae5',
      border: '#10b981',
      text: '#065f46',
    },
    'overdue': {
      background: '#fee2e2',
      border: '#ef4444',
      text: '#991b1b',
    },
  } as const
  
  export const PRIORITY_COLORS = {
    low: {
      background: '#f0fdf4',
      border: '#22c55e',
      text: '#15803d',
    },
    medium: {
      background: '#fffbeb',
      border: '#f59e0b',
      text: '#d97706',
    },
    high: {
      background: '#fef2f2',
      border: '#ef4444',
      text: '#dc2626',
    },
  } as const
  
  export const THEME_COLORS = {
    light: {
      background: '#ffffff',
      foreground: '#0f172a',
      primary: '#3b82f6',
      secondary: '#f1f5f9',
      accent: '#f8fafc',
      muted: '#f1f5f9',
      border: '#e2e8f0',
    },
    dark: {
      background: '#0f172a',
      foreground: '#f8fafc',
      primary: '#3b82f6',
      secondary: '#1e293b',
      accent: '#1e293b',
      muted: '#1e293b',
      border: '#334155',
    },
  } as const