"use client"

import { useState } from "react"
import { TaskProvider } from "./contexts/TaskContext"
import { UIProvider } from "./contexts/UIContext"
import Header from "./components/layout/Header"
import Sidebar from "./components/layout/Sidebar"
import Footer from "./components/layout/Footer"
import TableView from "./components/views/TableView"
import ProjectListView from "./components/views/ProjectListView"
import TimelineView from "./components/views/TimelineView"
import TodayView from "./components/views/TodayView"
import KanbanView from "./components/views/KanbanView"
import TaskDialog from "./components/dialogs/TaskDialog"
import ProjectDialog from "./components/dialogs/ProjectDialog"
import NoteDialog from "./components/dialogs/NoteDialog"
import DeleteConfirmDialog from "./components/dialogs/DeleteConfirmDialog"
import ImportExportDialog from "./components/dialogs/ImportExportDialog"
import AdvancedSearchDialog from "./components/dialogs/AdvancedSearchDialog"
import HelpDialog from "./components/dialogs/HelpDialog"

export default function IdealToDoApp() {
  // アクティブなビューを追跡
  const [activeView, setActiveView] = useState("table")

  return (
    <TaskProvider>
      <UIProvider>
        <div className="flex flex-col h-screen bg-gray-50">
          <Header />
          
          {/* メインコンテンツエリア */}
          <div className="flex flex-1 overflow-hidden">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            
            {/* メインコンテンツ */}
            <div className="flex-1 overflow-auto p-4">
              {activeView === "project" && <ProjectListView />}
              {activeView === "timeline" && <TimelineView />}
              {activeView === "table" && <TableView />}
              {activeView === "today" && <TodayView />}
              {activeView === "kanban" && <KanbanView />}
            </div>
          </div>
          
          <Footer />

          {/* ダイアログコンポーネント */}
          <TaskDialog />
          <ProjectDialog />
          <NoteDialog />
          <DeleteConfirmDialog />
          <ImportExportDialog />
          <AdvancedSearchDialog />
          <HelpDialog />
        </div>
      </UIProvider>
    </TaskProvider>
  )
}