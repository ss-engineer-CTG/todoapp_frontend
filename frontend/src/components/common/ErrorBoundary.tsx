import React, { Component, ReactNode } from 'react'
import { handleError, AppError, ErrorType, getSafeErrorInfo } from '../../utils/errorHandler'
import { logger } from '../../utils/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    
    // システムプロンプト準拠: エラー詳細や例外スタックトレースを記録
    const appError = new AppError(
      this.categorizeError(error),
      error.message,
      this.getUserFriendlyMessage(error),
      {
        componentStack: errorInfo.componentStack,
        stack: error.stack,
        errorBoundary: true,
        timestamp: new Date().toISOString()
      }
    )

    logger.error('ErrorBoundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })

    handleError(appError)
  }

  // システムプロンプト準拠：エラー分類の詳細化
  private categorizeError(error: Error): ErrorType {
    // 日付関連エラーの詳細判定
    if (error.message.includes('Invalid time value') ||
        error.message.includes('Invalid Date') ||
        error.message.includes('date') ||
        error.name === 'RangeError' ||
        error.stack?.includes('dateUtils') ||
        error.stack?.includes('formatDate')) {
      return ErrorType.DATE_CONVERSION_ERROR
    }
    
    // API関連エラー
    if (error.message.includes('fetch') ||
        error.message.includes('Network') ||
        error.message.includes('HTTP')) {
      return ErrorType.NETWORK_ERROR
    }
    
    // バリデーションエラー
    if (error.message.includes('validation') ||
        error.message.includes('required') ||
        error.message.includes('invalid')) {
      return ErrorType.VALIDATION_ERROR
    }
    
    return ErrorType.UNKNOWN_ERROR
  }

  // システムプロンプト準拠：ユーザーフレンドリーなエラーメッセージ
  private getUserFriendlyMessage(error: Error): string {
    const errorType = this.categorizeError(error)
    
    switch (errorType) {
      case ErrorType.DATE_CONVERSION_ERROR:
        return 'タスクの日付データに問題があります。アプリケーションを再読み込みしてください。'
      case ErrorType.NETWORK_ERROR:
        return 'ネットワーク接続に問題があります。インターネット接続を確認してください。'
      case ErrorType.VALIDATION_ERROR:
        return '入力されたデータに問題があります。内容を確認して再試行してください。'
      default:
        return 'アプリケーションでエラーが発生しました。ページを再読み込みしてください。'
    }
  }

  private handleRetry = () => {
    logger.info('User triggered error boundary retry')
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  private handleReload = () => {
    logger.info('User triggered page reload from error boundary')
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const safeErrorInfo = getSafeErrorInfo(this.state.error)
      const errorType = this.state.error ? this.categorizeError(this.state.error) : ErrorType.UNKNOWN_ERROR

      return (
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center p-8 max-w-md">
            <div className="mb-4">
              {/* エラータイプに応じたアイコン表示 */}
              {errorType === ErrorType.DATE_CONVERSION_ERROR && (
                <div className="text-6xl mb-4">📅</div>
              )}
              {errorType === ErrorType.NETWORK_ERROR && (
                <div className="text-6xl mb-4">🌐</div>
              )}
              {errorType === ErrorType.VALIDATION_ERROR && (
                <div className="text-6xl mb-4">⚠️</div>
              )}
              {errorType === ErrorType.UNKNOWN_ERROR && (
                <div className="text-6xl mb-4">🔧</div>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-destructive mb-4">
              エラーが発生しました
            </h2>
            
            <p className="text-muted-foreground mb-6">
              {safeErrorInfo.message}
            </p>

            <div className="space-y-3">
              {/* エラータイプに応じた復旧ボタン */}
              {errorType === ErrorType.DATE_CONVERSION_ERROR && (
                <button
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={this.handleReload}
                >
                  アプリケーションを再読み込み
                </button>
              )}
              
              {errorType !== ErrorType.DATE_CONVERSION_ERROR && (
                <button
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  onClick={this.handleRetry}
                >
                  再試行
                </button>
              )}
              
              <button
                className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                onClick={this.handleReload}
              >
                ページを再読み込み
              </button>
            </div>

            {/* 開発環境での詳細情報表示 */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  開発者向け詳細情報
                </summary>
                <div className="mt-3 p-3 bg-muted rounded text-xs">
                  <div className="mb-2">
                    <strong>エラータイプ:</strong> {errorType}
                  </div>
                  <div className="mb-2">
                    <strong>エラーメッセージ:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">{this.state.error.message}</pre>
                  </div>
                  {this.state.error.stack && (
                    <div className="mb-2">
                      <strong>スタックトレース:</strong>
                      <pre className="mt-1 overflow-auto max-h-32 whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>コンポーネントスタック:</strong>
                      <pre className="mt-1 overflow-auto max-h-32 whitespace-pre-wrap text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}