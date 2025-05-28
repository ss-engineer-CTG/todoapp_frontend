import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  message?: string
  className?: string
  showMessage?: boolean
  variant?: 'default' | 'overlay'
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message = '読み込み中...',
  className,
  showMessage = true,
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  if (variant === 'overlay') {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center space-y-4 p-6 bg-card rounded-lg shadow-lg border">
          <Loader2 className={cn(sizeClasses[size], 'animate-spin text-primary')} />
          {showMessage && (
            <p className={cn(textSizeClasses[size], 'text-foreground font-medium')}>
              {message}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-2',
      className
    )}>
      <Loader2 className={cn(sizeClasses[size], 'animate-spin text-primary')} />
      {showMessage && (
        <p className={cn(textSizeClasses[size], 'text-muted-foreground')}>
          {message}
        </p>
      )}
    </div>
  )
}

// 全画面ローディング用のコンポーネント
export const FullPageLoader: React.FC<{ message?: string }> = ({ 
  message = 'アプリケーションを読み込み中...' 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <LoadingSpinner size="xl" message={message} />
  </div>
)

// インライン用の小さなスピナー
export const InlineSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <Loader2 className={cn('h-4 w-4 animate-spin', className)} />
)

// ボタン内用のスピナー
export const ButtonSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <Loader2 className={cn('h-4 w-4 animate-spin mr-2', className)} />
)

export default LoadingSpinner