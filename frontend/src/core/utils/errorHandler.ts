// Enterprise-grade Error Handling System
// エンタープライズレベルのエラーハンドリングシステム

import { logger, LogLevel } from './logger'
import { v4 as uuidv4 } from 'uuid'

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  BUSINESS_LOGIC = 'business_logic',
  UI_COMPONENT = 'ui_component',
  PERFORMANCE = 'performance',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  sessionId?: string
  correlationId?: string
  url?: string
  userAgent?: string
  timestamp: string
  stackTrace?: string
  breadcrumbs?: string[]
  metadata?: Record<string, any>
}

export interface ErrorReport {
  id: string
  message: string
  category: ErrorCategory
  severity: ErrorSeverity
  context: ErrorContext
  originalError?: Error
  resolved: boolean
  reportedAt: string
  fingerprint: string
}

class EnterpriseErrorHandler {
  private errorReports: Map<string, ErrorReport> = new Map()
  private errorCounts: Map<string, number> = new Map()
  private breadcrumbs: string[] = []
  private readonly MAX_BREADCRUMBS = 20
  private readonly MAX_ERROR_REPORTS = 1000
  private notificationCallback?: (error: ErrorReport) => void

  constructor() {
    this.setupGlobalErrorHandling()
  }

  private setupGlobalErrorHandling(): void {
    // JavaScriptエラーをキャッチ
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.HIGH,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      })
    })

    // Promise rejectionをキャッチ
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(String(event.reason)), {
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.HIGH,
        context: {
          type: 'unhandledPromiseRejection'
        }
      })
    })
  }

  addBreadcrumb(message: string): void {
    const timestamp = new Date().toISOString()
    this.breadcrumbs.push(`${timestamp}: ${message}`)
    
    if (this.breadcrumbs.length > this.MAX_BREADCRUMBS) {
      this.breadcrumbs.shift()
    }
  }

  setNotificationCallback(callback: (error: ErrorReport) => void): void {
    this.notificationCallback = callback
  }

  private generateFingerprint(error: Error | string, category: ErrorCategory): string {
    const message = typeof error === 'string' ? error : error.message
    const stack = typeof error === 'string' ? '' : (error.stack || '')
    
    // エラーの特徴からフィンガープリントを生成
    const key = `${category}:${message}:${stack.split('\n')[0] || ''}`
    return btoa(key).substring(0, 16)
  }

  private createErrorContext(
    component?: string,
    action?: string,
    additionalContext?: Record<string, any>
  ): ErrorContext {
    return {
      component,
      action,
      userId: (window as any).__userId,
      sessionId: (window as any).__sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      breadcrumbs: [...this.breadcrumbs],
      metadata: additionalContext
    }
  }

  handleError(
    error: Error | string,
    options: {
      category?: ErrorCategory
      severity?: ErrorSeverity
      component?: string
      action?: string
      context?: Record<string, any>
      notify?: boolean
    } = {}
  ): ErrorReport {
    const {
      category = ErrorCategory.UNKNOWN,
      severity = ErrorSeverity.MEDIUM,
      component,
      action,
      context = {},
      notify = true
    } = options

    const errorMessage = typeof error === 'string' ? error : error.message
    const fingerprint = this.generateFingerprint(error, category)
    
    // エラー発生回数をカウント
    const currentCount = this.errorCounts.get(fingerprint) || 0
    this.errorCounts.set(fingerprint, currentCount + 1)

    const errorContext = this.createErrorContext(component, action, {
      ...context,
      errorCount: currentCount + 1,
      stackTrace: typeof error === 'string' ? undefined : error.stack
    })

    const errorReport: ErrorReport = {
      id: uuidv4(),
      message: errorMessage,
      category,
      severity,
      context: errorContext,
      originalError: typeof error === 'string' ? undefined : error,
      resolved: false,
      reportedAt: new Date().toISOString(),
      fingerprint
    }

    // エラーレポートを保存
    this.errorReports.set(errorReport.id, errorReport)
    
    // 最大件数制限
    if (this.errorReports.size > this.MAX_ERROR_REPORTS) {
      const oldestKey = this.errorReports.keys().next().value
      if (oldestKey) {
        this.errorReports.delete(oldestKey)
      }
    }

    // ログに記録
    this.getLogLevelFromSeverity(severity)
    logger.error(
      `[${category.toUpperCase()}] ${errorMessage}`,
      {
        errorId: errorReport.id,
        fingerprint,
        category,
        severity,
        count: currentCount + 1,
        context: errorContext
      },
      component,
      action
    )

    // 通知
    if (notify && this.notificationCallback) {
      this.notificationCallback(errorReport)
    }

    // 重要度が高い場合は即座にサーバーに送信
    if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH) {
      this.reportToServer(errorReport)
    }

    return errorReport
  }

  private getLogLevelFromSeverity(severity: ErrorSeverity): LogLevel {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return LogLevel.ERROR
      case ErrorSeverity.MEDIUM:
        return LogLevel.WARN
      case ErrorSeverity.LOW:
        return LogLevel.INFO
      default:
        return LogLevel.ERROR
    }
  }

  private async reportToServer(errorReport: ErrorReport): Promise<void> {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorReport)
      })
    } catch (e) {
      console.warn('Failed to report error to server:', e)
    }
  }

  // 定義済みエラーハンドラー
  handleNetworkError(error: Error | string, component?: string, action?: string): ErrorReport {
    return this.handleError(error, {
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      component,
      action
    })
  }

  handleValidationError(error: Error | string, component?: string, action?: string): ErrorReport {
    return this.handleError(error, {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      component,
      action
    })
  }

  handleUIError(error: Error | string, component?: string, action?: string): ErrorReport {
    return this.handleError(error, {
      category: ErrorCategory.UI_COMPONENT,
      severity: ErrorSeverity.MEDIUM,
      component,
      action
    })
  }

  handlePerformanceError(error: Error | string, component?: string, metrics?: Record<string, number>): ErrorReport {
    return this.handleError(error, {
      category: ErrorCategory.PERFORMANCE,
      severity: ErrorSeverity.LOW,
      component,
      context: { metrics }
    })
  }

  // エラー管理機能
  getErrorReports(filters?: {
    category?: ErrorCategory
    severity?: ErrorSeverity
    resolved?: boolean
    startTime?: Date
    endTime?: Date
  }): ErrorReport[] {
    let reports = Array.from(this.errorReports.values())
    
    if (filters) {
      reports = reports.filter(report => {
        if (filters.category && report.category !== filters.category) return false
        if (filters.severity && report.severity !== filters.severity) return false
        if (filters.resolved !== undefined && report.resolved !== filters.resolved) return false
        if (filters.startTime && new Date(report.reportedAt) < filters.startTime) return false
        if (filters.endTime && new Date(report.reportedAt) > filters.endTime) return false
        return true
      })
    }
    
    return reports.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
  }

  resolveError(errorId: string): boolean {
    const report = this.errorReports.get(errorId)
    if (report) {
      report.resolved = true
      return true
    }
    return false
  }

  getErrorStatistics(): {
    total: number
    byCategory: Record<ErrorCategory, number>
    bySeverity: Record<ErrorSeverity, number>
    resolved: number
    unresolved: number
  } {
    const reports = Array.from(this.errorReports.values())
    
    const byCategory = Object.values(ErrorCategory).reduce((acc, category) => {
      acc[category] = reports.filter(r => r.category === category).length
      return acc
    }, {} as Record<ErrorCategory, number>)
    
    const bySeverity = Object.values(ErrorSeverity).reduce((acc, severity) => {
      acc[severity] = reports.filter(r => r.severity === severity).length
      return acc
    }, {} as Record<ErrorSeverity, number>)
    
    return {
      total: reports.length,
      byCategory,
      bySeverity,
      resolved: reports.filter(r => r.resolved).length,
      unresolved: reports.filter(r => !r.resolved).length
    }
  }

  clearErrors(): void {
    this.errorReports.clear()
    this.errorCounts.clear()
    this.breadcrumbs = []
  }

  exportErrors(format: 'json' | 'csv' = 'json'): string {
    const reports = this.getErrorReports()
    
    if (format === 'csv') {
      const headers = ['id', 'message', 'category', 'severity', 'component', 'timestamp', 'resolved']
      const rows = reports.map(report => [
        report.id,
        report.message,
        report.category,
        report.severity,
        report.context.component || '',
        report.reportedAt,
        report.resolved.toString()
      ])
      
      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }
    
    return JSON.stringify(reports, null, 2)
  }
}

// エラーメッセージ定数（後方互換性のため）
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  VALIDATION_ERROR: '入力値に誤りがあります',
  SERVER_ERROR: 'サーバーエラーが発生しました',
  UNKNOWN_ERROR: '予期しないエラーが発生しました',
  TASK_OPERATION_ERROR: 'タスク操作でエラーが発生しました',
  TIMELINE_ERROR: 'タイムライン表示でエラーが発生しました',
  DRAG_ERROR: 'ドラッグ操作でエラーが発生しました',
}

export const errorHandler = new EnterpriseErrorHandler()

// 後方互換性のためのレガシー関数
export const handleError = (error: any, fallbackMessage: string = ERROR_MESSAGES.UNKNOWN_ERROR) => {
  const errorMessage = typeof error === 'string' ? error : (error?.message || fallbackMessage)
  errorHandler.handleError(errorMessage, {
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM
  })
  return errorMessage
}

// グローバルアクセス用
;(window as any).__errorHandler = errorHandler