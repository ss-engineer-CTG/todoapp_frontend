import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { Calendar, TrendingUp, Target, Clock, Filter } from 'lucide-react'
import { useHeatmap, HeatmapData } from '../hooks/useHeatmap'
import { LearningCategory, LEARNING_CATEGORIES } from '../types'
import { useCustomTags } from '../hooks/useCustomTags'

interface HeatmapCalendarProps {
  onDateSelect?: (date: string, data: HeatmapData) => void
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({ onDateSelect }) => {
  const { theme } = useTheme()
  const { getCategoryTags } = useCustomTags()
  const { 
    heatmapData, 
    config, 
    loading, 
    error, 
    updateConfig,
    getMonthlyStats,
    getCurrentStreak,
    getLongestStreak,
    getIntensityColor,
    getCategoryColor
  } = useHeatmap()
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [tooltipData, setTooltipData] = useState<{
    date: string
    data: HeatmapData
    x: number
    y: number
  } | null>(null)
  
  // スクロール同期のための参照
  const monthScrollRef = useRef<HTMLDivElement>(null)
  const heatmapScrollRef = useRef<HTMLDivElement>(null)

  // 日付のクリック処理
  const handleDateClick = useCallback((date: string, data: HeatmapData) => {
    setSelectedDate(date)
    if (onDateSelect) {
      onDateSelect(date, data)
    }
  }, [onDateSelect])

  // ツールチップの表示
  const handleCellHover = useCallback((
    event: React.MouseEvent<HTMLDivElement>,
    date: string,
    data: HeatmapData
  ) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setTooltipData({
      date,
      data,
      x: rect.right + 10,
      y: rect.top
    })
  }, [])

  // ツールチップの非表示
  const handleCellLeave = useCallback(() => {
    setTooltipData(null)
  }, [])

  // 月間統計の取得
  const monthlyStats = getMonthlyStats()
  const currentStreak = getCurrentStreak()
  const longestStreak = getLongestStreak()

  // 日付をフォーマット
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }, [])

  // 分を時間文字列に変換
  const formatDuration = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }, [])

  // 週単位ヒートマップデータの生成
  const generateWeeklyHeatmapData = useCallback((): (HeatmapData | null)[][] => {
    const today = new Date()
    const oneYearAgo = new Date(today)
    oneYearAgo.setFullYear(today.getFullYear() - 1)
    
    // 開始日を日曜日に調整
    const startDate = new Date(oneYearAgo)
    startDate.setDate(startDate.getDate() - startDate.getDay())
    
    const weeks: (HeatmapData | null)[][] = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= today) {
      const week: (HeatmapData | null)[] = []
      
      for (let day = 0; day < 7; day++) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const data = heatmapData.find(d => d.date === dateStr)
        
        if (currentDate <= today && currentDate >= oneYearAgo) {
          week.push(data || {
            date: dateStr,
            totalMinutes: 0,
            intensity: 0,
            categoryBreakdown: {},
            sessionsCount: 0
          })
        } else {
          week.push(null)
        }
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      weeks.push(week)
    }
    
    return weeks
  }, [heatmapData])

  // カテゴリフィルターの変更（タグベースに移行予定）
  const handleCategoryFilter = useCallback((category: LearningCategory | 'all') => {
    updateConfig({ selectedCategory: category })
  }, [updateConfig])
  
  // タグフィルターの変更（新しいタグシステム）
  const handleTagFilter = useCallback((_tagId: string | 'all') => {
    // TODO: タグベースのフィルタリングを実装
    // 将来的にタグフィルタリング機能を実装
  }, [])

  // 期間の変更
  const handlePeriodChange = useCallback((period: 'week' | 'month' | 'quarter') => {
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        break
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    }
    
    updateConfig({ startDate, endDate: now })
  }, [updateConfig])

  // プロトタイプ品質のスクロール同期
  useEffect(() => {
    const monthScroll = monthScrollRef.current
    const heatmapScroll = heatmapScrollRef.current
    
    if (!monthScroll || !heatmapScroll) return

    let isScrolling = false

    const handleMonthScroll = () => {
      if (isScrolling) return
      isScrolling = true
      
      requestAnimationFrame(() => {
        if (heatmapScroll.scrollLeft !== monthScroll.scrollLeft) {
          heatmapScroll.scrollLeft = monthScroll.scrollLeft
        }
        isScrolling = false
      })
    }

    const handleHeatmapScroll = () => {
      if (isScrolling) return
      isScrolling = true
      
      requestAnimationFrame(() => {
        if (monthScroll.scrollLeft !== heatmapScroll.scrollLeft) {
          monthScroll.scrollLeft = heatmapScroll.scrollLeft
        }
        isScrolling = false
      })
    }

    // パッシブリスナーを使用してパフォーマンス向上
    monthScroll.addEventListener('scroll', handleMonthScroll, { passive: true })
    heatmapScroll.addEventListener('scroll', handleHeatmapScroll, { passive: true })

    // 初期位置を右端（今日の日付）にスムーズに設定
    setTimeout(() => {
      const maxScroll = heatmapScroll.scrollWidth - heatmapScroll.clientWidth
      if (maxScroll > 0) {
        heatmapScroll.scrollTo({
          left: maxScroll,
          behavior: 'smooth'
        })
        monthScroll.scrollTo({
          left: maxScroll,
          behavior: 'smooth'
        })
      }
    }, 100)

    return () => {
      monthScroll.removeEventListener('scroll', handleMonthScroll)
      heatmapScroll.removeEventListener('scroll', handleHeatmapScroll)
    }
  }, [heatmapData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg border ${
        theme === 'dark' 
          ? 'bg-red-900/20 border-red-800 text-red-200' 
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className={`text-md font-semibold flex items-center ${
          theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
        }`}>
          <Calendar className="mr-2" size={18} />
          学習ヒートマップ
        </h3>
        
        {/* フィルター選択 */}
        <div className="flex items-center space-x-2">
          <Filter size={14} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
          
          {/* カテゴリフィルター（従来） */}
          <select
            value={config.selectedCategory}
            onChange={(e) => handleCategoryFilter(e.target.value as LearningCategory | 'all')}
            className={`text-xs px-2 py-1 border rounded ${
              theme === 'dark' 
                ? 'border-gray-600 bg-gray-800 text-gray-200' 
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          >
            <option value="all">すべて</option>
            {LEARNING_CATEGORIES.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          
          {/* タグフィルター（新しいタグシステム） */}
          <select
            onChange={(e) => handleTagFilter(e.target.value)}
            className={`text-xs px-2 py-1 border rounded ${
              theme === 'dark' 
                ? 'border-gray-600 bg-gray-800 text-gray-200' 
                : 'border-gray-300 bg-white text-gray-900'
            }`}
            disabled={true} // 一時的に無効
          >
            <option value="all">タグ：すべて</option>
            {getCategoryTags().map(tag => (
              <option key={tag.id} value={tag.id}>
                {tag.emoji} {tag.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`p-3 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-blue-900/20 border-blue-800' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            <TrendingUp size={16} className="text-blue-600" />
            <span className={`text-xs font-medium ${
              theme === 'dark' ? 'text-blue-200' : 'text-blue-800'
            }`}>
              現在の連続
            </span>
          </div>
          <p className={`text-lg font-bold ${
            theme === 'dark' ? 'text-blue-100' : 'text-blue-900'
          }`}>
            {currentStreak.days}日
          </p>
        </div>
        
        <div className={`p-3 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-green-900/20 border-green-800' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center space-x-2">
            <Target size={16} className="text-green-600" />
            <span className={`text-xs font-medium ${
              theme === 'dark' ? 'text-green-200' : 'text-green-800'
            }`}>
              最長連続
            </span>
          </div>
          <p className={`text-lg font-bold ${
            theme === 'dark' ? 'text-green-100' : 'text-green-900'
          }`}>
            {longestStreak.days}日
          </p>
        </div>
        
        <div className={`p-3 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-purple-900/20 border-purple-800' 
            : 'bg-purple-50 border-purple-200'
        }`}>
          <div className="flex items-center space-x-2">
            <Clock size={16} className="text-purple-600" />
            <span className={`text-xs font-medium ${
              theme === 'dark' ? 'text-purple-200' : 'text-purple-800'
            }`}>
              総学習時間
            </span>
          </div>
          <p className={`text-lg font-bold ${
            theme === 'dark' ? 'text-purple-100' : 'text-purple-900'
          }`}>
            {formatDuration(monthlyStats.totalMinutes)}
          </p>
        </div>
      </div>

      {/* 期間選択ボタン */}
      <div className="flex space-x-2">
        {[
          { label: '1週間', value: 'week' },
          { label: '1ヶ月', value: 'month' },
          { label: '3ヶ月', value: 'quarter' }
        ].map(period => (
          <button
            key={period.value}
            onClick={() => handlePeriodChange(period.value as 'week' | 'month' | 'quarter')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* ヒートマップグリッド（GitHub風） */}
      <div className="space-y-2">
        {/* 月ラベル（スクロール可能・動的生成） */}
        <div className="flex">
          <div className="w-8"></div>
          <div 
            ref={monthScrollRef}
            className="flex-1 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="relative h-6 min-w-max">
              {/* 動的な月ラベルを週単位で配置 */}
              {generateWeeklyHeatmapData().map((week, weekIndex) => {
                const firstDayOfWeek = week[0]?.date
                if (!firstDayOfWeek) return null
                
                const date = new Date(firstDayOfWeek)
                const isFirstWeekOfMonth = date.getDate() <= 7
                
                if (!isFirstWeekOfMonth) return null
                
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                const monthName = monthNames[date.getMonth()]
                
                return (
                  <div
                    key={`month-${weekIndex}`}
                    className={`absolute text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}
                    style={{
                      left: `${weekIndex * 14}px`, // セル幅12px + gap 2px = 14px
                      top: '2px'
                    }}
                  >
                    {monthName}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ヒートマップ本体 */}
        <div className="flex">
          {/* 曜日ラベル */}
          <div className="w-8 flex flex-col gap-0.5 text-xs text-gray-500 mr-2">
            {['', '月', '', '水', '', '金', ''].map((day, index) => (
              <div key={index} className="h-3 flex items-center">
                {day}
              </div>
            ))}
          </div>
          
          {/* ヒートマップグリッド（スクロール可能） */}
          <div 
            ref={heatmapScrollRef}
            className="flex-1 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex gap-0.5 min-w-max">
              {generateWeeklyHeatmapData().map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-0.5">
                  {week.map((data, dayIndex) => {
                    if (!data) {
                      return <div key={dayIndex} className="w-3 h-3" />
                    }
                    
                    const intensity = config.selectedCategory === 'all' 
                      ? data.intensity 
                      : Math.min(4, Math.floor(data.categoryBreakdown[config.selectedCategory] / 30))
                    
                    const isToday = data.date === new Date().toISOString().split('T')[0]
                    
                    return (
                      <div
                        key={data.date}
                        className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:scale-125 border ${
                          theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                        } ${selectedDate === data.date ? 'ring-2 ring-blue-500' : ''} ${
                          isToday ? 'animate-pulse ring-1 ring-blue-400' : ''
                        }`}
                        style={{ 
                          backgroundColor: config.selectedCategory === 'all' 
                            ? getIntensityColor(intensity)
                            : getCategoryColor(config.selectedCategory)
                        }}
                        onClick={() => handleDateClick(data.date, data)}
                        onMouseEnter={(e) => handleCellHover(e, data.date, data)}
                        onMouseLeave={handleCellLeave}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 凡例 */}
      <div className="flex items-center justify-between text-xs">
        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
          少ない
        </span>
        <div className="flex space-x-1">
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className="w-3 h-3 rounded"
              style={{ backgroundColor: getIntensityColor(level) }}
            />
          ))}
        </div>
        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
          多い
        </span>
      </div>

      {/* ツールチップ */}
      {tooltipData && (
        <div
          className={`fixed z-50 p-3 rounded-lg shadow-lg border max-w-xs ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700 text-gray-100' 
              : 'bg-white border-gray-200 text-gray-900'
          }`}
          style={{
            left: tooltipData.x,
            top: tooltipData.y,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="font-medium mb-2">
            {formatDate(tooltipData.date)}
          </div>
          <div className="space-y-1 text-sm">
            <div>
              総学習時間: {formatDuration(tooltipData.data.totalMinutes)}
            </div>
            {Object.entries(tooltipData.data.categoryBreakdown).map(([category, minutes]) => {
              if (minutes === 0) return null
              const categoryInfo = LEARNING_CATEGORIES.find(c => c.value === category)
              return (
                <div key={category} className="flex justify-between">
                  <span>{categoryInfo?.label || category}:</span>
                  <span>{formatDuration(minutes)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}