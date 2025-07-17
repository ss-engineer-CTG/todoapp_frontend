import React from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { Star, Clock } from 'lucide-react'

export const LeftPanel: React.FC = () => {
  const { theme } = useTheme()
  
  return (
    <div className="space-y-6">
      {/* 今月の目標 */}
      <div className="mb-6">
        <h2 className={`text-lg font-semibold mb-2 flex items-center ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
          <Star className="mr-2" size={20} />
          今月の目標
        </h2>
        <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {new Date().getFullYear()}年{new Date().getMonth() + 1}月
        </p>
        
        {/* 目標リスト */}
        <div className="space-y-3">
          <div className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-opacity-80 ${
            theme === 'dark' 
              ? 'bg-blue-900/20 border-blue-800 hover:bg-blue-900/40' 
              : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
          }`}>
            <h3 className={`font-medium ${theme === 'dark' ? 'text-blue-100' : 'text-blue-900'}`}>
              プログラミングスキル向上
            </h3>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
              React + TypeScriptを使った実践的なアプリケーション開発をマスターする
            </p>
          </div>
          
          <div className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-opacity-80 ${
            theme === 'dark' 
              ? 'bg-green-900/20 border-green-800 hover:bg-green-900/40' 
              : 'bg-green-50 border-green-200 hover:bg-green-100'
          }`}>
            <h3 className={`font-medium ${theme === 'dark' ? 'text-green-100' : 'text-green-900'}`}>
              英語学習
            </h3>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
              TOEIC 800点を目指して毎日30分の学習を継続する
            </p>
          </div>
          
          <div className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-opacity-80 ${
            theme === 'dark' 
              ? 'bg-purple-900/20 border-purple-800 hover:bg-purple-900/40' 
              : 'bg-purple-50 border-purple-200 hover:bg-purple-100'
          }`}>
            <h3 className={`font-medium ${theme === 'dark' ? 'text-purple-100' : 'text-purple-900'}`}>
              健康管理
            </h3>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
              週3回の運動習慣を身につけて体力向上を図る
            </p>
          </div>
        </div>
        
        {/* 新しい目標追加 */}
        <button className={`w-full mt-4 p-2 border-2 border-dashed rounded-lg transition-colors ${
          theme === 'dark' 
            ? 'border-gray-600 text-gray-400 hover:border-gray-500' 
            : 'border-gray-300 text-gray-500 hover:border-gray-400'
        }`}>
          + 新しい目標を追加
        </button>
      </div>
      
      {/* 学習時間トラッキング */}
      <div className={`p-4 rounded-lg border ${
        theme === 'dark' 
          ? 'bg-blue-900/20 border-blue-800 from-blue-900/20 to-indigo-900/20' 
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
      }`}>
        <h3 className={`text-md font-semibold mb-3 flex items-center ${
          theme === 'dark' ? 'text-blue-100' : 'text-blue-900'
        }`}>
          <Clock className="mr-2" size={18} />
          学習時間トラッキング
        </h3>
        
        {/* 現在のセッション状態 */}
        <div className={`mb-4 p-3 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-blue-700' 
            : 'bg-white border-blue-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              現在のセッション
            </span>
            <span className="text-lg font-bold text-blue-600">00:00:00</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              今日の累計
            </span>
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
              2時間 34分
            </span>
          </div>
        </div>
        
        {/* カテゴリ選択と制御ボタン */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              カテゴリ:
            </label>
            <select className={`flex-1 px-3 py-1 text-sm border rounded-md ${
              theme === 'dark' 
                ? 'border-gray-600 bg-gray-800 text-gray-200' 
                : 'border-gray-300 bg-white text-gray-900'
            }`}>
              <option value="programming">📚 プログラミング</option>
              <option value="english">🗣️ 英語学習</option>
              <option value="reading">📖 読書</option>
              <option value="exercise">🏃 運動</option>
              <option value="other">📝 その他</option>
            </select>
          </div>
          
          <div className="flex space-x-2">
            <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
              ▶️ 学習開始
            </button>
            <button className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium opacity-50" disabled>
              ⏸️ 一時停止
            </button>
            <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium opacity-50" disabled>
              ⏹️ 終了
            </button>
          </div>
        </div>
        
        {/* 今日のカテゴリ別学習時間 */}
        <div className={`mt-4 p-3 rounded-lg ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <h4 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            今日のカテゴリ別時間
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                📚 プログラミング
              </span>
              <span className="font-medium">1時間 25分</span>
            </div>
            <div className="flex justify-between">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                🗣️ 英語学習
              </span>
              <span className="font-medium">45分</span>
            </div>
            <div className="flex justify-between">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                📖 読書
              </span>
              <span className="font-medium">24分</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}