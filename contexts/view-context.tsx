"use client"

import React, { createContext, useState, ReactNode } from "react"

type ViewType = 'list' | 'timeline'

interface ViewContextType {
  currentView: ViewType
  setCurrentView: (view: ViewType) => void
}

export const ViewContext = createContext<ViewContextType | undefined>(undefined)

interface ViewProviderProps {
  children: ReactNode
}

export const ViewProvider: React.FC<ViewProviderProps> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>('list')

  const contextValue: ViewContextType = {
    currentView,
    setCurrentView
  }

  return <ViewContext.Provider value={contextValue}>{children}</ViewContext.Provider>
}