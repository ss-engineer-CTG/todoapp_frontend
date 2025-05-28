import React, { Suspense } from 'react'
import { AppProvider } from '@/context/AppProvider'
import { ProjectProvider } from '@/context/ProjectContext'
import { TaskProvider } from '@/context/TaskContext'
import { ThemeProvider } from '@/context/ThemeProvider'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import AppHeader from '@/components/layout/AppHeader'
import ProjectList from '@/components/project/ProjectList'
import TaskList from '@/components/task/TaskList'
import TaskDetail from '@/components/task/TaskDetail'
import GanttChart from '@/components/timeline/GanttChart'
import { useKeyboard } from '@/hooks/useKeyboard'
import { useAppContext } from '@/context/AppProvider'

// メインアプリケーションコンテンツ（Context内で使用）
const AppContent: React.FC = React.memo(() => {
  const [isInitialized, setIsInitialized] = React.useState(false)
  const [initError, setInitError] = React.useState<string | null>(null)
  
  const context = useAppContext()
  
  if (!context) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <p className="text-destructive mb-4">アプリケーションコンテキストが利用できません</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }

  const { state } = context
  
  // 初期化処理（エラーハンドリング強化）
  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        // 初期ローダーを確実に非表示にする
        const loader = document.getElementById('initial-loader')
        if (loader) {
          loader.style.opacity = '0'
          setTimeout(() => {
            loader.style.display = 'none'
          }, 300)
        }

        // ローカルストレージからの設定復元
        const savedTheme = localStorage.getItem('vite-ui-theme')
        if (savedTheme) {
          console.log('Theme restored:', savedTheme)
        }

        setIsInitialized(true)
      } catch (error) {
        console.error('App initialization failed:', error)
        setInitError(error instanceof Error ? error.message : 'Unknown initialization error')
      }
    }

    const timer = setTimeout(initializeApp, 100)
    return () => clearTimeout(timer)
  }, [])

  // キーボードショートカットを有効化（エラーハンドリング付き）
  React.useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useKeyboard()
    } catch (error) {
      console.warn('Keyboard shortcuts initialization failed:', error)
    }
  }, [])

  if (initError) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold mb-2 text-destructive">初期化エラー</h1>
          <p className="text-muted-foreground mb-4">{initError}</p>
          <div className="space-x-2">
            <button 
              onClick={() => {
                setInitError(null)
                setIsInitialized(false)
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
            >
              再試行
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return <LoadingSpinner message="アプリケーションを初期化中..." />
  }

  const { viewMode, isDetailPanelVisible } = state

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <ErrorBoundary>
        <AppHeader />
      </ErrorBoundary>
      
      <main className="flex-1 flex overflow-hidden">
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner message="コンテンツを読み込み中..." />}>
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
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  )
})

AppContent.displayName = 'AppContent'

// メインアプリケーション（Context Provider内でAppContentを使用）
const MainApp: React.FC = React.memo(() => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <ProjectProvider>
          <TaskProvider>
            <AppContent />
          </TaskProvider>
        </ProjectProvider>
      </AppProvider>
    </ErrorBoundary>
  )
})

MainApp.displayName = 'MainApp'

// ルートアプリケーションコンポーネント
const TodoApp: React.FC = () => {
  // アプリレベルのエラーハンドリング
  React.useEffect(() => {
    const handleError = (error: Error) => {
      console.error('TodoApp error:', error)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('TodoApp unhandled rejection:', event.reason)
    }

    // エラーリスナーを追加
    window.addEventListener('error', (event) => handleError(event.error))
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', (event) => handleError(event.error))
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Suspense fallback={<LoadingSpinner message="アプリケーションを読み込み中..." />}>
          <MainApp />
        </Suspense>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default TodoApp