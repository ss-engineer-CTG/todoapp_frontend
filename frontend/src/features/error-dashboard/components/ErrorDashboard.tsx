import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@core/components/ui/card'
import { Button } from '@core/components/ui/button'
import { Badge } from '@core/components/ui/badge'
import { AlertTriangle, TrendingUp, Users, Clock, Filter, Download, RefreshCw } from 'lucide-react'
import { errorHandler, ErrorCategory, ErrorSeverity } from '@core/utils/errorHandler'
import { logger } from '@core/utils/logger'

interface ErrorReport {
  id: string
  fingerprint: string
  message: string
  category: string
  severity: string
  status: string
  first_occurrence: string
  last_occurrence: string
  occurrence_count: number
  affected_users: string[]
  stack_trace?: string
  context?: any
  resolution_notes?: string
  assigned_to?: string
}

interface ErrorStatistics {
  total_errors: number
  error_rate: number
  errors_by_category: Record<string, number>
  errors_by_severity: Record<string, number>
  top_errors: ErrorReport[]
  timeframe_hours: number
}

interface ErrorTrend {
  timestamp: string
  error_count: number
}

const ErrorDashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<ErrorStatistics | null>(null)
  const [reports, setReports] = useState<ErrorReport[]>([])
  const [trends, setTrends] = useState<ErrorTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('')
  const [timeframeHours, setTimeframeHours] = useState(24)

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 30000) // 30秒ごとに更新
    return () => clearInterval(interval)
  }, [timeframeHours])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // 統計データ取得
      const statsResponse = await fetch(`/api/errors/statistics?hours=${timeframeHours}`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStatistics(statsData)
      }
      
      // エラーレポート取得
      const reportsResponse = await fetch(
        `/api/errors/reports?${new URLSearchParams({
          ...(selectedCategory && { category: selectedCategory }),
          ...(selectedSeverity && { severity: selectedSeverity }),
          limit: '50'
        })}`
      )
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json()
        setReports(reportsData.reports)
      }
      
      // トレンドデータ取得
      const trendsResponse = await fetch(
        `/api/errors/trends?hours=${timeframeHours}&interval_minutes=60`
      )
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json()
        setTrends(trendsData.trends)
      }
      
      logger.info('Error dashboard data loaded', undefined, 'ErrorDashboard', 'loadData')
      
    } catch (error) {
      errorHandler.handleError(error as Error, {
        category: ErrorCategory.UI_COMPONENT,
        component: 'ErrorDashboard',
        action: 'loadDashboardData'
      })
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700'
      case 'high': return 'text-orange-700'
      case 'medium': return 'text-yellow-700'
      case 'low': return 'text-blue-700'
      default: return 'text-gray-700'
    }
  }

  const exportErrors = () => {
    try {
      const errorData = errorHandler.exportErrors('csv')
      const blob = new Blob([errorData], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `error-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      logger.info('Error report exported', undefined, 'ErrorDashboard', 'exportErrors')
    } catch (error) {
      errorHandler.handleUIError(error as Error, 'ErrorDashboard', 'exportErrors')
    }
  }

  const resolveError = async (errorId: string) => {
    try {
      const response = await fetch(`/api/errors/reports/${errorId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resolution_notes: 'Resolved from dashboard',
          assigned_to: 'dashboard-user'
        })
      })
      
      if (response.ok) {
        // リストを更新
        setReports(prev => prev.filter(report => report.id !== errorId))
        logger.info(`Error resolved: ${errorId}`, undefined, 'ErrorDashboard', 'resolveError')
      }
    } catch (error) {
      errorHandler.handleError(error as Error, {
        category: ErrorCategory.API,
        component: 'ErrorDashboard',
        action: 'resolveError'
      })
    }
  }

  if (loading && !statistics) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="ml-2 text-lg">Loading error dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Error Monitoring Dashboard</h1>
          <p className="text-muted-foreground">
            エンタープライズグレードエラー監視システム
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeframeHours}
            onChange={(e) => setTimeframeHours(Number(e.target.value))}
            className="px-3 py-2 border rounded-md"
          >
            <option value={1}>Last 1 hour</option>
            <option value={6}>Last 6 hours</option>
            <option value={24}>Last 24 hours</option>
            <option value={168}>Last 7 days</option>
          </select>
          <Button onClick={loadDashboardData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportErrors} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_errors}</div>
              <p className="text-xs text-muted-foreground">
                Last {statistics.timeframe_hours} hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.error_rate.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                errors per minute
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Affected Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.top_errors.reduce((acc, error) => acc + error.affected_users.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                unique users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.errors_by_severity.critical || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                need immediate attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="ml-2 px-3 py-1 border rounded-md"
              >
                <option value="">All Categories</option>
                {Object.values(ErrorCategory).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Severity</label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="ml-2 px-3 py-1 border rounded-md"
              >
                <option value="">All Severities</option>
                {Object.values(ErrorSeverity).map(severity => (
                  <option key={severity} value={severity}>{severity}</option>
                ))}
              </select>
            </div>
            <Button onClick={loadDashboardData} size="sm">
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* エラーレポートリスト */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Error Reports</CardTitle>
          <CardDescription>
            Latest error reports from your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(report.severity)}>
                        {report.severity}
                      </Badge>
                      <Badge variant="outline">{report.category}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {report.occurrence_count} occurrences
                      </span>
                    </div>
                    <h3 className="font-medium mt-1">{report.message}</h3>
                    <p className="text-sm text-muted-foreground">
                      First seen: {new Date(report.first_occurrence).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Last seen: {new Date(report.last_occurrence).toLocaleString()}
                    </p>
                    {report.affected_users.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Affected users: {report.affected_users.length}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => resolveError(report.id)}
                      size="sm"
                      variant="outline"
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
                {report.stack_trace && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {report.stack_trace}
                    </pre>
                  </details>
                )}
              </div>
            ))}
            {reports.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No error reports found for the selected filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ErrorDashboard