import React from 'react'
import { useTheme } from '@core/components/ThemeProvider'

export const CenterPanel: React.FC = () => {
  const { resolvedTheme } = useTheme()

  return (
    <div className={`text-center py-16 ${
      resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
    }`}>
      <h2 className={`text-lg font-semibold mb-4 ${resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
        📝 フォーカスビュー
      </h2>
      <p className="text-sm">
        目標・今月の目標・今日のToDo機能が削除されました。
      </p>
      <p className="text-xs mt-2">
        学習時間トラッキング、メモ機能、成長トラッキング機能は左右のパネルから利用できます。
      </p>
    </div>
  )
}