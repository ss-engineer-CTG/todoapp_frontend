export type ViewMode = 'list' | 'timeline'
export type ActiveArea = 'projects' | 'tasks' | 'details'

export interface AppState {
  viewMode: ViewMode
  activeArea: ActiveArea
  showCompleted: boolean
  isDetailPanelVisible: boolean
  sidebarWidth?: number
  detailPanelWidth?: number
  isLoading?: boolean
  error?: string | null
}

export type AppAction =
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_ACTIVE_AREA'; payload: ActiveArea }
  | { type: 'TOGGLE_SHOW_COMPLETED' }
  | { type: 'SET_SHOW_COMPLETED'; payload: boolean }
  | { type: 'TOGGLE_DETAIL_PANEL' }
  | { type: 'SET_DETAIL_PANEL_VISIBLE'; payload: boolean }
  | { type: 'SET_SIDEBAR_WIDTH'; payload: number }
  | { type: 'SET_DETAIL_PANEL_WIDTH'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

export interface AppConfig {
  defaultViewMode: ViewMode
  autoSave: boolean
  autoSaveInterval: number
  theme: 'light' | 'dark' | 'system'
  language: 'ja' | 'en'
  dateFormat: 'YYYY/MM/DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY'
  timeFormat: '24h' | '12h'
}

export interface AppNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
  createdAt: Date
}

export interface AppPreferences {
  sidebarCollapsed: boolean
  detailPanelCollapsed: boolean
  showCompletedTasks: boolean
  defaultProjectView: 'expanded' | 'collapsed'
  keyboardShortcutsEnabled: boolean
  animationsEnabled: boolean
}