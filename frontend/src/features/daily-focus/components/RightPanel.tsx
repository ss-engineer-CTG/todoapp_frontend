import React from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { FileText, BarChart3 } from 'lucide-react'
import { HeatmapCalendar } from './HeatmapCalendar'
import { LearningMemoPanel } from './LearningMemoPanel'

export const RightPanel: React.FC = () => {
  const { theme } = useTheme()
  
  return (
    <div className="space-y-6">
      {/* アウトプットメモ */}
      <LearningMemoPanel />
      
      {/* 成長可視化ダッシュボード */}
      <div className="mb-6">
        <h3 className={`text-md font-semibold mb-3 flex items-center ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
          <BarChart3 className="mr-2" size={18} />
          成長トラッキング
        </h3>
        
        {/* 活動ヒートマップ */}
        <HeatmapCalendar />
      </div>
    </div>
  )
}