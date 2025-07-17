import React from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { FileText, BarChart3 } from 'lucide-react'

export const RightPanel: React.FC = () => {
  const { theme } = useTheme()
  
  // 簡単なヒートマップデータ生成
  const generateHeatmapData = () => {
    const data = []
    const today = new Date()
    
    // 過去53週間のデータを生成（1年分）
    for (let week = 0; week < 53; week++) {
      const weekData = []
      for (let day = 0; day < 7; day++) {
        const date = new Date(today)
        date.setDate(date.getDate() - (52 - week) * 7 + day)
        
        // ランダムな学習時間（0-6時間）
        const hours = Math.random() < 0.15 ? 0 : Math.floor(Math.random() * 6) + 1
        
        weekData.push({
          date: date.toISOString().split('T')[0],
          hours,
          intensity: getIntensityClass(hours)
        })
      }
      data.push(weekData)
    }
    
    return data
  }
  
  const getIntensityClass = (hours: number): string => {
    if (hours === 0) return theme === 'dark' ? 'bg-gray-600' : 'bg-gray-100'
    if (hours <= 1) return theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'
    if (hours <= 2) return theme === 'dark' ? 'bg-green-800/50' : 'bg-green-200'
    if (hours <= 3) return theme === 'dark' ? 'bg-green-700/70' : 'bg-green-300'
    if (hours <= 4) return theme === 'dark' ? 'bg-green-600' : 'bg-green-400'
    if (hours <= 5) return theme === 'dark' ? 'bg-green-500' : 'bg-green-500'
    return theme === 'dark' ? 'bg-green-400' : 'bg-green-600'
  }
  
  const heatmapData = generateHeatmapData()
  
  return (
    <div className="space-y-6">
      {/* アウトプットメモ */}
      <div className="mb-6">
        <h2 className={`text-lg font-semibold mb-2 flex items-center ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
          <FileText className="mr-2" size={20} />
          学習メモ
        </h2>
        
        <textarea
          className={`w-full p-3 border rounded-lg resize-vertical ${
            theme === 'dark' 
              ? 'border-gray-600 bg-gray-800 text-gray-200' 
              : 'border-gray-300 bg-white text-gray-900'
          }`}
          style={{ minHeight: '300px' }}
          placeholder={`# 今日の学習内容

## React Hooks - useEffect

### 学んだこと
- useEffectの基本的な使い方
- 依存配列の重要性
- クリーンアップ関数の必要性

### 実践例
\`\`\`javascript
useEffect(() => {
  // サイドエフェクトの処理
  return () => {
    // クリーンアップ処理
  };
}, [dependencies]);
\`\`\`

### 疑問・課題
- カスタムフックでの使い分け
- パフォーマンス最適化のベストプラクティス`}
        />
      </div>
      
      {/* 成長可視化ダッシュボード */}
      <div className="mb-6">
        <h3 className={`text-md font-semibold mb-3 flex items-center ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
          <BarChart3 className="mr-2" size={18} />
          成長トラッキング
        </h3>
        
        {/* 活動ヒートマップ */}
        <div className={`rounded-lg p-4 mb-4 ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="mb-3">
            <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              アクティビティ
            </h4>
            <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              過去365日
            </div>
          </div>
          
          {/* 月ラベル */}
          <div className="flex text-xs text-gray-500 mb-2">
            <div className="w-8"></div>
            <div className="flex-1 flex justify-between">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                <div key={month}>{month}</div>
              ))}
            </div>
          </div>
          
          {/* ヒートマップ */}
          <div className="flex">
            {/* 曜日ラベル */}
            <div className="w-8 flex flex-col gap-0.5 text-xs text-gray-500 mr-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="h-3 flex items-center">{day}</div>
              ))}
            </div>
            
            {/* グリッド */}
            <div className="flex-1 overflow-x-auto">
              <div className="flex gap-0.5" style={{ minWidth: '600px' }}>
                {heatmapData.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-0.5">
                    {week.map((day, dayIndex) => (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`w-3 h-3 rounded-sm cursor-pointer transition-all duration-200 hover:scale-125 border ${
                          theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                        } ${day.intensity}`}
                        title={`${day.date}: ${day.hours}時間`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* 凡例 */}
          <div className={`flex items-center justify-between mt-3 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <span>Less</span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-sm ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-100'}`} />
              <div className={`w-2 h-2 rounded-sm ${theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'}`} />
              <div className={`w-2 h-2 rounded-sm ${theme === 'dark' ? 'bg-green-800/50' : 'bg-green-200'}`} />
              <div className={`w-2 h-2 rounded-sm ${theme === 'dark' ? 'bg-green-700/70' : 'bg-green-300'}`} />
              <div className={`w-2 h-2 rounded-sm ${theme === 'dark' ? 'bg-green-600' : 'bg-green-400'}`} />
              <div className={`w-2 h-2 rounded-sm ${theme === 'dark' ? 'bg-green-500' : 'bg-green-500'}`} />
              <div className={`w-2 h-2 rounded-sm ${theme === 'dark' ? 'bg-green-400' : 'bg-green-600'}`} />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  )
}