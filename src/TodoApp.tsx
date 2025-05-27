import React from 'react'
import { AppProvider } from '@/context/AppProvider'
import { ProjectProvider } from '@/context/ProjectContext'
import { TaskProvider } from '@/context/TaskContext'
import { ThemeProvider } from '@/context/ThemeProvider'
import AppHeader from '@/components/layout/AppHeader'
import ProjectList from '@/components/project/ProjectList'
import TaskList from '@/components/task/TaskList'
import TaskDetail from '@/components/task/TaskDetail'
import GanttChart from '@/components/timeline/GanttChart'
import { useApp } from '@/hooks/useApp'
import { useKeyboard } from '@/hooks/useKeyboard'
import { cn } from '@/lib/utils'

// メインアプリケーションコンテンツ
const AppContent: React.FC = () => {
  const { viewMode, isDetailPanelVisible } = useApp()
  
  // キーボードショートカットを有効化
  useKeyboard()

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <AppHeader />
      
      <main className="flex-1 flex overflow-hidden">
        {viewMode === 'list' ? (
          // リスト表示モード
          <>
            <ProjectList />
            <TaskList />
            {isDetailPanelVisible && <TaskDetail />}
          </>
        ) : (
          // タイムライン表示モード
          <div className="flex-1 flex">
            <ProjectList />
            <GanttChart />
          </div>
        )}
      </main>
    </div>
  )
}

// ルートアプリケーションコンポーネント
const TodoApp: React.FC = () => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AppProvider>
        <ProjectProvider>
          <TaskProvider>
            <AppContent />
          </TaskProvider>
        </ProjectProvider>
      </AppProvider>
    </ThemeProvider>
  )
}

export default TodoApp