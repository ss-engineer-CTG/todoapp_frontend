/**
 * エラーレポーティングサービス（無効化版）
 * 理想形アプリケーションのため、エラーレポーティング機能を無効化
 */
import { errorHandler, ErrorReport } from '@core/utils/errorHandler'
import { logger } from '@core/utils/logger'

class ErrorReportingService {
  private readonly endpoint = '/api/errors/report'
  private reportQueue: ErrorReport[] = []
  private isReporting = false
  private readonly maxQueueSize = 50
  private readonly isEnabled = false // エラーレポーティングを無効化

  constructor() {
    if (!this.isEnabled) {
      logger.info('Error reporting service is disabled')
      return
    }
    
    // エラーハンドラーにコールバックを設定
    // errorHandler.setNotificationCallback(this.queueErrorReport.bind(this))
    
    // 定期的にキューを処理
    // setInterval(() => {
    //   this.processQueue()
    // }, 10000) // 10秒ごと
  }

  private queueErrorReport(error: ErrorReport): void {
    if (!this.isEnabled) {
      return // 無効化時は何もしない
    }
    
    // キューサイズ制限
    if (this.reportQueue.length >= this.maxQueueSize) {
      this.reportQueue.shift() // 古いエラーを削除
    }
    
    this.reportQueue.push(error)
    logger.debug(`Error queued for reporting: ${error.id}`, { queueSize: this.reportQueue.length })
  }

  private async processQueue(): Promise<void> {
    if (!this.isEnabled || this.isReporting || this.reportQueue.length === 0) {
      return
    }

    this.isReporting = true
    const errorsToReport = [...this.reportQueue]
    this.reportQueue = []

    try {
      await this.sendErrorReports(errorsToReport)
      logger.info(`Successfully reported ${errorsToReport.length} errors to backend`)
    } catch (error) {
      // 送信失敗時はキューに戻す
      this.reportQueue.unshift(...errorsToReport)
      logger.warn('Failed to report errors to backend', { error, queueSize: this.reportQueue.length })
    } finally {
      this.isReporting = false
    }
  }

  private async sendErrorReports(errors: ErrorReport[]): Promise<void> {
    const reports = errors.map(error => ({
      id: error.id,
      message: error.message,
      category: error.category,
      severity: error.severity,
      stackTrace: error.context?.stackTrace,
      context: {
        ...error.context,
        component: error.context?.component,
        action: error.context?.action,
        timestamp: error.reportedAt,
        fingerprint: error.fingerprint
      },
      userId: error.context?.userId,
      sessionId: error.context?.sessionId,
      correlationId: error.context?.correlationId || '',
      url: error.context?.url,
      userAgent: error.context?.userAgent
    }))

    // バッチでエラーレポートを送信
    for (const report of reports) {
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': report.correlationId || '',
            'X-User-ID': report.userId || '',
            'X-Session-ID': report.sessionId || ''
          },
          body: JSON.stringify(report)
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        logger.debug(`Error report sent successfully: ${result.error_id}`)
        
      } catch (error) {
        logger.warn(`Failed to send individual error report: ${report.id}`, { error })
        throw error // 全体の送信失敗として扱う
      }
    }
  }

  /**
   * 手動でエラーを報告
   */
  async reportError(
    message: string,
    category: string = 'unknown',
    severity: string = 'medium',
    context?: any
  ): Promise<void> {
    if (!this.isEnabled) {
      logger.debug('Error reporting is disabled, skipping manual report', { message, category, severity })
      return
    }
    
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          category,
          severity,
          context,
          userId: (window as any).__userId,
          sessionId: (window as any).__sessionId,
          correlationId: (window as any).__correlationId,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      logger.info(`Manual error report sent: ${result.error_id}`)
      
    } catch (error) {
      logger.error('Failed to send manual error report', { error, message, category, severity })
      throw error
    }
  }

  /**
   * キューの状態を取得
   */
  getQueueStatus(): { size: number; isReporting: boolean } {
    return {
      size: this.reportQueue.length,
      isReporting: this.isReporting
    }
  }

  /**
   * キューをクリア
   */
  clearQueue(): void {
    this.reportQueue = []
    logger.info('Error report queue cleared')
  }
}

// グローバルインスタンス
export const errorReportingService = new ErrorReportingService()

// グローバルアクセス用
;(window as any).__errorReportingService = errorReportingService