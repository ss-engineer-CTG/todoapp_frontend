import React from 'react'
import { AppProvider } from '@/context/AppProvider'
import { ProjectProvider } from '@/context/ProjectContext'
import { TaskProvider } from '@/context/TaskContext'
import { ThemeProvider } from '@/context/ThemeProvider'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import AppHeader from '@/components/layout/AppHeader'
import ProjectList from '@/components/project/ProjectList'
import TaskList from '@/components/task/TaskList'
import TaskDetail from '@/components/task/TaskDetail'
import GanttChart from '@/components/timeline/GanttChart'
import { useApp } from '@/hooks/useApp'
import { useKeyboard } from '@/hooks/useKeyboard'

// ローディングコンポーネント
const LoadingScreen: React.FC = () => (
  <div className="h-screen flex items-center justify-center bg-background text-foreground">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">アプリケーションを読み込み中...</p>
    </div>
  </div>
)

// メインアプリケーションコンテンツ
const AppContent: React.FC = () => {
  const [isInitialized, setIsInitialized] = React.useState(false)
  const { viewMode, isDetailPanelVisible } = useApp()
  
  // 初期化処理
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true)
    }, 100) // 短い遅延でContextの初期化を待つ

    return () => clearTimeout(timer)
  }, [])

  // キーボードショートカットを有効化
  useKeyboard()

  if (!isInitialized) {
    return <LoadingScreen />
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <ErrorBoundary>
        <AppHeader />
      </ErrorBoundary>
      
      <main className="flex-1 flex overflow-hidden">
        <ErrorBoundary>
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
        </ErrorBoundary>
      </main>
    </div>
  )
}

// Contextプロバイダーラッパー
const ContextProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
            {children}
          </TaskProvider>
        </ProjectProvider>
      </AppProvider>
    </ThemeProvider>
  )
}

// ルートアプリケーションコンポーネント
const TodoApp: React.FC = () => {
  return (
    <ErrorBoundary>
      <ContextProviders>
        <AppContent />
      </ContextProviders>
    </ErrorBoundary>
  )
}

export default TodoApp