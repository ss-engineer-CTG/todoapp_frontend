import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId: string
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false,
      errorId: this.generateErrorId()
    }
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    console.error('ErrorBoundary - Error caught:', error)
    return { 
      hasError: true, 
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    }

    console.error('ErrorBoundary caught an error:', errorDetails)

    this.setState({
      error,
      errorInfo
    })

    // カスタムエラーハンドラーを呼び出し
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo)
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError)
      }
    }

    // エラー報告サービスに送信（将来実装）
    if (import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true') {
      this.reportError(errorDetails)
    }
  }

  private async reportError(errorDetails: any) {
    try {
      // TODO: エラー報告サービスへの送信実装
      console.log('Error would be reported:', errorDetails)
    } catch (reportError) {
      console.error('Failed to report error:', reportError)
    }
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      console.log(`Retrying... (${this.retryCount}/${this.maxRetries})`)
      
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined,
        errorId: this.generateErrorId()
      })
    } else {
      console.warn('Maximum retry attempts reached')
    }
  }

  private handleReload = () => {
    try {
      window.location.reload()
    } catch (reloadError) {
      console.error('Failed to reload page:', reloadError)
    }
  }

  private handleGoHome = () => {
    try {
      window.location.href = '/'
    } catch (navigationError) {
      console.error('Failed to navigate home:', navigationError)
    }
  }

  private copyErrorToClipboard = async () => {
    try {
      const errorText = `
エラーID: ${this.state.errorId}
時刻: ${new Date().toLocaleString()}
エラー: ${this.state.error?.message || 'Unknown error'}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

スタックトレース:
${this.state.error?.stack || 'No stack trace available'}

コンポーネントスタック:
${this.state.errorInfo?.componentStack || 'No component stack available'}
      `.trim()

      await navigator.clipboard.writeText(errorText)
      
      // 成功フィードバック
      const button = document.getElementById('copy-error-button')
      if (button) {
        const originalText = button.textContent
        button.textContent = 'コピーしました！'
        setTimeout(() => {
          button.textContent = originalText
        }, 2000)
      }
    } catch (copyError) {
      console.error('Failed to copy error to clipboard:', copyError)
    }
  }

  override render() {
    if (this.state.hasError) {
      // カスタムフォールバックUIが提供されている場合はそれを使用
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
          <div className="text-center max-w-2xl w-full">
            <div className="mb-6">
              <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2 text-destructive">
                アプリケーションエラー
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                申し訳ございません。予期しないエラーが発生しました。
              </p>
              <p className="text-sm text-muted-foreground">
                エラーID: <code className="bg-muted px-2 py-1 rounded">{this.state.errorId}</code>
              </p>
            </div>

            {/* エラー詳細（開発環境または詳細表示時） */}
            {(import.meta.env.DEV || import.meta.env.VITE_DEBUG_MODE === 'true') && this.state.error && (
              <details className="text-left bg-muted p-4 rounded-md mb-6 max-h-64 overflow-auto">
                <summary className="cursor-pointer font-medium mb-2 text-foreground">
                  エラー詳細を表示
                </summary>
                <div className="space-y-2">
                  <div>
                    <strong className="text-destructive">エラーメッセージ:</strong>
                    <pre className="text-xs mt-1 whitespace-pre-wrap break-words">
                      {this.state.error.message}
                    </pre>
                  </div>
                  
                  {this.state.error.stack && (
                    <div>
                      <strong className="text-destructive">スタックトレース:</strong>
                      <pre className="text-xs mt-1 whitespace-pre-wrap break-words">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong className="text-destructive">コンポーネントスタック:</strong>
                      <pre className="text-xs mt-1 whitespace-pre-wrap break-words">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* アクションボタン */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3 justify-center">
                {this.retryCount < this.maxRetries && (
                  <button
                    onClick={this.handleRetry}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    再試行 ({this.maxRetries - this.retryCount}回まで)
                  </button>
                )}

                <button
                  onClick={this.handleReload}
                  className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  ページを再読み込み
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2 bg-muted text-muted-foreground px-4 py-2 rounded-md hover:bg-muted/80 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  ホームに戻る
                </button>
              </div>

              <button
                id="copy-error-button"
                onClick={this.copyErrorToClipboard}
                className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
              >
                エラー情報をクリップボードにコピー
              </button>
            </div>

            {/* ユーザーガイダンス */}
            <div className="mt-8 p-4 bg-muted/50 rounded-md">
              <h3 className="font-semibold mb-2">問題が解決しない場合</h3>
              <ul className="text-sm text-muted-foreground space-y-1 text-left">
                <li>• ブラウザのキャッシュをクリアしてください</li>
                <li>• 別のブラウザで試してください</li>
                <li>• しばらく時間をおいてから再度お試しください</li>
                <li>• エラーID とともにサポートまでお問い合わせください</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary