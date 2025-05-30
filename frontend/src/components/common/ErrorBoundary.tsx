import React, { Component, ReactNode } from 'react'
import { logger } from '../../utils/logger'
import { handleError, AppError, ErrorType } from '../../utils/errorHandler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // システムプロンプト準拠: エラー詳細や例外スタックトレースを記録
    const appError = new AppError(
      ErrorType.UNKNOWN_ERROR,
      error.message,
      'アプリケーションでエラーが発生しました',
      {
        componentStack: errorInfo.componentStack,
        stack: error.stack,
        errorBoundary: true
      }
    )

    handleError(appError)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-2xl font-bold text-destructive mb-4">
              エラーが発生しました
            </h2>
            <p className="text-muted-foreground mb-4">
              申し訳ございません。予期しないエラーが発生しました。
              ページを再読み込みしてもう一度お試しください。
            </p>
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              onClick={() => window.location.reload()}
            >
              ページを再読み込み
            </button>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  開発者向け詳細情報
                </summary>
                <pre className="mt-2 p-2 bg-muted text-xs overflow-auto rounded">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}