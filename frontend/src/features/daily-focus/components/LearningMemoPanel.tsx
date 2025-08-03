import React from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { Edit3, Save } from 'lucide-react'
import { useLearningMemo } from '../hooks/useLearningMemo'

export const LearningMemoPanel: React.FC = () => {
  const { resolvedTheme } = useTheme()
  const {
    memo,
    loading,
    error,
    isEditing,
    lastSaved,
    updateMemoContent,
    toggleEditing,
    manualSave
  } = useLearningMemo()

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
        <h3 className={`text-lg font-semibold ${
          resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'
        }`}>
          📝 学習メモ
        </h3>
        
        <div className="flex items-center space-x-2">
          {lastSaved && (
            <span className={`text-xs ${
              resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {lastSaved.toLocaleTimeString()} に保存
            </span>
          )}
          
          <button
            onClick={toggleEditing}
            className={`p-2 rounded-lg transition-colors ${
              isEditing
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : resolvedTheme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={isEditing ? '編集を終了' : '編集開始'}
          >
            <Edit3 size={16} />
          </button>
          
          <button
            onClick={manualSave}
            disabled={!isEditing}
            className={`p-2 rounded-lg transition-colors ${
              isEditing
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title="保存"
          >
            <Save size={16} />
          </button>
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
            placeholder="今日の学習内容、気づき、振り返りなどを自由に記録してください..."
            className={`w-full h-64 p-3 border rounded-lg resize-none ${
              resolvedTheme === 'dark'
                ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400'
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        ) : (
          <div className={`min-h-[256px] p-3 border rounded-lg ${
            resolvedTheme === 'dark'
              ? 'border-gray-600 bg-gray-700'
              : 'border-gray-300 bg-gray-50'
          }`}>
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
                <p className="text-sm">まだメモがありません</p>
                <p className="text-xs mt-1">編集ボタンを押して記録を開始してください</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}