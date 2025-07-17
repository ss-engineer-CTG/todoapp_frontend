import React from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { CheckSquare } from 'lucide-react'

export const CenterPanel: React.FC = () => {
  const { theme } = useTheme()
  
  const getCurrentDateString = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1
    const day = today.getDate()
    const dayNames = ['日', '月', '火', '水', '木', '金', '土']
    const dayName = dayNames[today.getDay()]
    
    return `${year}年${month}月${day}日 (${dayName})`
  }
  
  return (
    <div className="mb-4">
      <h2 className={`text-lg font-semibold mb-2 flex items-center ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
        <CheckSquare className="mr-2" size={20} />
        今日のToDo
      </h2>
      <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
        {getCurrentDateString()}
      </p>
      
      {/* ToDoリスト */}
      <div className="space-y-2">
        <div className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-700 hover:bg-gray-600' 
            : 'bg-gray-50 hover:bg-gray-100'
        }`}>
          <input 
            type="checkbox" 
            className="mr-3 w-4 h-4 text-blue-600 rounded" 
          />
          <span className="flex-1">React Hooksの復習（useEffect編）</span>
          <span className={`text-xs px-2 py-1 rounded ${
            theme === 'dark' 
              ? 'bg-blue-900 text-blue-200' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            プログラミング
          </span>
        </div>
        
        <div className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-700 hover:bg-gray-600' 
            : 'bg-gray-50 hover:bg-gray-100'
        }`}>
          <input 
            type="checkbox" 
            defaultChecked 
            className="mr-3 w-4 h-4 text-blue-600 rounded" 
          />
          <span className={`flex-1 line-through ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
            英語リスニング30分
          </span>
          <span className={`text-xs px-2 py-1 rounded ${
            theme === 'dark' 
              ? 'bg-green-900 text-green-200' 
              : 'bg-green-100 text-green-800'
          }`}>
            英語
          </span>
        </div>
        
        <div className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-700 hover:bg-gray-600' 
            : 'bg-gray-50 hover:bg-gray-100'
        }`}>
          <input 
            type="checkbox" 
            className="mr-3 w-4 h-4 text-blue-600 rounded" 
          />
          <span className="flex-1">ランニング（5km）</span>
          <span className={`text-xs px-2 py-1 rounded ${
            theme === 'dark' 
              ? 'bg-purple-900 text-purple-200' 
              : 'bg-purple-100 text-purple-800'
          }`}>
            運動
          </span>
        </div>
        
        <div className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-700 hover:bg-gray-600' 
            : 'bg-gray-50 hover:bg-gray-100'
        }`}>
          <input 
            type="checkbox" 
            className="mr-3 w-4 h-4 text-blue-600 rounded" 
          />
          <span className="flex-1">TypeScript型定義の実践</span>
          <span className={`text-xs px-2 py-1 rounded ${
            theme === 'dark' 
              ? 'bg-blue-900 text-blue-200' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            プログラミング
          </span>
        </div>
        
        <div className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-700 hover:bg-gray-600' 
            : 'bg-gray-50 hover:bg-gray-100'
        }`}>
          <input 
            type="checkbox" 
            className="mr-3 w-4 h-4 text-blue-600 rounded" 
          />
          <span className="flex-1">技術書読書（Clean Code）</span>
          <span className={`text-xs px-2 py-1 rounded ${
            theme === 'dark' 
              ? 'bg-orange-900 text-orange-200' 
              : 'bg-orange-100 text-orange-800'
          }`}>
            読書
          </span>
        </div>
      </div>
      
      {/* 新しいToDo追加 */}
      <div className="mt-4 space-y-2">
        <div className="flex">
          <input 
            type="text" 
            placeholder="新しいToDoを追加..." 
            className={`flex-1 p-2 border rounded-l-lg ${
              theme === 'dark' 
                ? 'border-gray-600 bg-gray-800 text-gray-200' 
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors">
            追加
          </button>
        </div>
      </div>
    </div>
  )
}