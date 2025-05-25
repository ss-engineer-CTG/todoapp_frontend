export interface KeyboardShortcut {
    key: string
    description: string
    action?: () => void
  }
  
  export interface KeyboardShortcutSection {
    section: string
    shortcuts: KeyboardShortcut[]
  }
  
  export interface ColorOption {
    name: string
    value: string
  }
  
  export interface AppConfig {
    name: string
    version: string
    description: string
  }
  
  export interface UserPreferences {
    theme: 'light' | 'dark' | 'system'
    defaultView: 'list' | 'timeline'
    autoSave: boolean
    showKeyboardShortcuts: boolean
  }
  
  export type ActiveArea = 'projects' | 'tasks' | 'details'
  export type ViewType = 'list' | 'timeline'
  export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'overdue'