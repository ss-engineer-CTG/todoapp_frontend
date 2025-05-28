import React from 'react'
import { AlertCircle, X, RefreshCw, Info, CheckCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ErrorType = 'error' | 'warning' | 'info' | 'success'

interface ErrorMessageProps {
  type?: ErrorType
  title?: string
  message: string
  details?: string
  onClose?: () => void
  onRetry?: () => void
  className?: string
  showIcon?: boolean
  closable?: boolean
  retryable?: boolean
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  type = 'error',
  title,
  message,
  details,
  onClose,
  onRetry,
  className,
  showIcon = true,
  closable = true,
  retryable = false
}) => {
  const icons = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle
  }

  const styles = {
    error: 'bg-destructive/10 border-destructive/20 text-destructive',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
  }

  const IconComponent = icons[type]

  return (
    <div className={cn(
      'rounded-lg border p-4',
      styles[type],
      className
    )}>
      <div className="flex items-start space-x-3">
        {showIcon && (
          <IconComponent className="h-5 w-5 flex-shrink-0 mt-0.5" />
        )}
        
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-semibold mb-1">
              {title}
            </h3>
          )}
          
          <p className="text-sm">
            {message}
          </p>
          
          {details && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium hover:underline">
                詳細を表示
              </summary>
              <pre className="mt-2 text-xs whitespace-pre-wrap break-words bg-black/5 dark:bg-white/5 p-2 rounded">
                {details}
              </pre>
            </details>
          )}
          
          {(retryable || onRetry) && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className="inline-flex items-center text-sm font-medium hover:underline"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                再試行
              </button>
            </div>
          )}
        </div>
        
        {(closable || onClose) && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// 特定のエラータイプ用のショートカットコンポーネント
export const ErrorAlert: React.FC<Omit<ErrorMessageProps, 'type'>> = (props) => (
  <ErrorMessage type="error" {...props} />
)

export const WarningAlert: React.FC<Omit<ErrorMessageProps, 'type'>> = (props) => (
  <ErrorMessage type="warning" {...props} />
)

export const InfoAlert: React.FC<Omit<ErrorMessageProps, 'type'>> = (props) => (
  <ErrorMessage type="info" {...props} />
)

export const SuccessAlert: React.FC<Omit<ErrorMessageProps, 'type'>> = (props) => (
  <ErrorMessage type="success" {...props} />
)

// 通知用のトースト風コンポーネント
export const ToastMessage: React.FC<ErrorMessageProps & { 
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  duration?: number
}> = ({ 
  position = 'top-right',
  duration = 5000,
  onClose,
  ...props 
}) => {
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  if (!isVisible) return null

  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50'
  }

  return (
    <div className={cn(positionClasses[position], 'max-w-md shadow-lg')}>
      <ErrorMessage
        onClose={() => {
          setIsVisible(false)
          onClose?.()
        }}
        {...props}
      />
    </div>
  )
}

export default ErrorMessage