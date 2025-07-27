// システムプロンプト準拠：ローディングスピナーコンポーネント
// フェーズ3リファクタリング：utils分離・適切な配置

import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-200 border-t-blue-600`}
        role="status"
        aria-label="読み込み中"
      />
      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}
    </div>
  )
}