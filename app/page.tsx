"use client"

import React from "react"
import { TodoProvider } from "@/contexts/todo-context"
import { ViewProvider } from "@/contexts/view-context"
import Navigation from "@/components/common/navigation"
import ListView from "@/components/list-view/list-view"
import TimelineView from "@/components/timeline-view/timeline-view"
import { useViewContext } from "@/hooks/use-view-context"

function MainContent() {
  const { currentView } = useViewContext()

  return (
    <div className="h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 overflow-hidden">
        {currentView === 'list' ? <ListView /> : <TimelineView />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <TodoProvider>
      <ViewProvider>
        <MainContent />
      </ViewProvider>
    </TodoProvider>
  )
}