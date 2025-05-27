import React, { createContext, useContext, useReducer } from 'react'
import type { AppState, AppAction, ViewMode, ActiveArea } from '@/types/app'

const initialState: AppState = {
  viewMode: 'list',
  activeArea: 'projects',
  showCompleted: true,
  isDetailPanelVisible: true,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload }
    case 'SET_ACTIVE_AREA':
      return { ...state, activeArea: action.payload }
    case 'TOGGLE_SHOW_COMPLETED':
      return { ...state, showCompleted: !state.showCompleted }
    case 'SET_SHOW_COMPLETED':
      return { ...state, showCompleted: action.payload }
    case 'TOGGLE_DETAIL_PANEL':
      return { ...state, isDetailPanelVisible: !state.isDetailPanelVisible }
    case 'SET_DETAIL_PANEL_VISIBLE':
      return { ...state, isDetailPanelVisible: action.payload }
    default:
      return state
  }
}

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  // Convenience methods
  setViewMode: (mode: ViewMode) => void
  setActiveArea: (area: ActiveArea) => void
  toggleShowCompleted: () => void
  setShowCompleted: (show: boolean) => void
  toggleDetailPanel: () => void
  setIsDetailPanelVisible: (visible: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const contextValue: AppContextType = {
    state,
    dispatch,
    setViewMode: (mode: ViewMode) => dispatch({ type: 'SET_VIEW_MODE', payload: mode }),
    setActiveArea: (area: ActiveArea) => dispatch({ type: 'SET_ACTIVE_AREA', payload: area }),
    toggleShowCompleted: () => dispatch({ type: 'TOGGLE_SHOW_COMPLETED' }),
    setShowCompleted: (show: boolean) => dispatch({ type: 'SET_SHOW_COMPLETED', payload: show }),
    toggleDetailPanel: () => dispatch({ type: 'TOGGLE_DETAIL_PANEL' }),
    setIsDetailPanelVisible: (visible: boolean) => dispatch({ type: 'SET_DETAIL_PANEL_VISIBLE', payload: visible }),
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}