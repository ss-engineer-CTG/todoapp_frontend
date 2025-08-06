import React from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { ArrowLeft } from 'lucide-react'
import { useDailyMemo } from '../hooks/useDailyMemo'

interface LearningMemoPanelProps {
  selectedDate: string
  onBackToToday: () => void
}

export const LearningMemoPanel: React.FC<LearningMemoPanelProps> = ({
  selectedDate,
  onBackToToday
}) => {
  const { resolvedTheme } = useTheme()
  const {
    memo,
    loading,
    error,
    isEditing,
    lastSaved,
    isToday,
    wordCount,
    updateMemoContent,
    toggleEditing,
    manualSave
  } = useDailyMemo(selectedDate)

  // 日付をフォーマット
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={`p-4 rounded-lg border ${
      resolvedTheme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className={`text-lg font-semibold ${
            resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'
          }`}>
            📝 学習メモ - {formatDate(selectedDate)}
            {isToday && (
              <span className={`text-sm font-normal ml-2 ${
                resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}>
                (今日)
              </span>
            )}
          </h3>
          {!isToday && (
            <button
              onClick={onBackToToday}
              className={`p-1 rounded transition-colors ${
                resolvedTheme === 'dark'
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="今日に戻る"
            >
              <ArrowLeft size={16} />
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {lastSaved && (
            <span className={`text-xs ${
              resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {lastSaved.toLocaleTimeString()} に保存 ({wordCount}文字)
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-100 border border-red-200 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {isEditing ? (
          <textarea
            value={memo}
            onChange={(e) => updateMemoContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                toggleEditing()
              }
            }}
            onBlur={toggleEditing}
            placeholder="今日の学習内容、気づき、振り返りなどを自由に記録してください..."
            className={`w-full h-64 p-3 border rounded-lg resize-none ${
              resolvedTheme === 'dark'
                ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400'
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            autoFocus
          />
        ) : (
          <div 
            className={`min-h-[256px] p-3 border rounded-lg cursor-text transition-colors ${
              resolvedTheme === 'dark'
                ? 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
            }`}
            onClick={toggleEditing}
          >
            {memo ? (
              <div className={`whitespace-pre-wrap ${
                resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'
              }`}>
                {memo}
              </div>
            ) : (
              <div className={`text-center py-16 ${
                resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <p className="text-sm">クリックしてメモを開始...</p>
                <p className="text-xs mt-1">学習内容、気づき、振り返りなどを記録</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}