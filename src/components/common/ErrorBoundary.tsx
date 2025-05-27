import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('ErrorBoundary - Error caught:', error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    console.error('Component stack:', errorInfo.componentStack)
    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-lg">
            <h1 className="text-2xl font-bold mb-4 text-destructive">
              アプリケーションエラー
            </h1>
            <p className="text-muted-foreground mb-4">
              申し訳ございません。予期しないエラーが発生しました。
            </p>
            {this.state.error && (
              <details className="text-left bg-muted p-4 rounded-md mb-4">
                <summary className="cursor-pointer font-medium mb-2">
                  エラー詳細
                </summary>
                <pre className="text-xs overflow-auto whitespace-pre-wrap">
                  <strong>Error:</strong> {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <br /><br />
                      <strong>Component Stack:</strong>
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
            <div className="space-x-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined, errorInfo: undefined })
                }}
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 mr-2"
              >
                再試行
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                ページを再読み込み
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary