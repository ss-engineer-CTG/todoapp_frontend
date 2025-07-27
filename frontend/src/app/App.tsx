// システムプロンプト準拠：ルートコンポーネント（ErrorBoundary統合）

import React, { Component, ReactNode } from 'react'
import TodoApp from './TodoApp'
import { ThemeProvider } from '@core/components/ThemeProvider'
import { APP_CONFIG } from '@core/config'
import { handleError, logger } from '@core/utils/core'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class App extends Component<Record<string, never>, ErrorBoundaryState> {
  constructor(props: Record<string, never>) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })

    handleError(error)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  private handleReload = () => {
    window.location.reload()
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-4">🔧</div>
            <h2 className="text-2xl font-bold text-destructive mb-4">
              エラーが発生しました
            </h2>
            <p className="text-muted-foreground mb-6">
              アプリケーションでエラーが発生しました。ページを再読み込みしてください。
            </p>
            <div className="space-y-3">
              <button
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                onClick={this.handleRetry}
              >
                再試行
              </button>
              <button
                className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                onClick={this.handleReload}
              >
                ページを再読み込み
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <ThemeProvider 
        attribute="class" 
        defaultTheme={APP_CONFIG.THEME.DEFAULT} 
        storageKey={APP_CONFIG.THEME.STORAGE_KEY}
        enableSystem 
        disableTransitionOnChange
      >
        <TodoApp />
      </ThemeProvider>
    )
  }
}

export default App