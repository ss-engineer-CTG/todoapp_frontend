import { useState, useEffect, useCallback } from 'react'
import { DailyStats, LearningCategory } from '../types'
import { statsStorage } from '../utils/storage'

export interface HeatmapData {
  date: string
  totalMinutes: number
  categoryBreakdown: Record<LearningCategory, number>
  intensity: number // 0-4 (0=なし, 1=低, 2=中, 3=高, 4=最高)
}

export interface HeatmapConfig {
  startDate: Date
  endDate: Date
  showCategories: boolean
  selectedCategory: LearningCategory | 'all'
}

export const useHeatmap = () => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([])
  const [config, setConfig] = useState<HeatmapConfig>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1),
    endDate: new Date(),
    showCategories: false,
    selectedCategory: 'all'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 日付の範囲を生成
  const generateDateRange = useCallback((start: Date, end: Date): string[] => {
    const dates: string[] = []
    const current = new Date(start)
    
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }
    
    return dates
  }, [])

  // 学習時間の強度を計算（0-4）
  const calculateIntensity = useCallback((minutes: number): number => {
    if (minutes === 0) return 0
    if (minutes <= 30) return 1
    if (minutes <= 60) return 2
    if (minutes <= 120) return 3
    return 4
  }, [])

  // ヒートマップデータの生成
  const generateHeatmapData = useCallback(() => {
    try {
      setLoading(true)
      setError(null)

      const dateRange = generateDateRange(config.startDate, config.endDate)
      const allStats = statsStorage.getAll()

      const heatmapData: HeatmapData[] = dateRange.map(date => {
        const dayStats = allStats.find(stat => stat.date === date)
        
        if (!dayStats) {
          return {
            date,
            totalMinutes: 0,
            categoryBreakdown: {
              programming: 0,
              english: 0,
              health: 0,
              reading: 0,
              exercise: 0,
              other: 0
            },
            intensity: 0
          }
        }

        const totalMinutes = Object.values(dayStats.categoryTimes).reduce((sum, time) => sum + time, 0)
        
        return {
          date,
          totalMinutes,
          categoryBreakdown: dayStats.categoryTimes,
          intensity: calculateIntensity(totalMinutes)
        }
      })

      setHeatmapData(heatmapData)
    } catch (err) {
      setError('ヒートマップデータの生成に失敗しました')
      console.error('Failed to generate heatmap data:', err)
    } finally {
      setLoading(false)
    }
  }, [config, generateDateRange, calculateIntensity])

  // 設定の更新
  const updateConfig = useCallback((newConfig: Partial<HeatmapConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  // 特定の日付のデータを取得
  const getDataForDate = useCallback((date: string): HeatmapData | null => {
    return heatmapData.find(data => data.date === date) || null
  }, [heatmapData])

  // 月間の統計を取得
  const getMonthlyStats = useCallback(() => {
    const totalMinutes = heatmapData.reduce((sum, data) => sum + data.totalMinutes, 0)
    const activeDays = heatmapData.filter(data => data.totalMinutes > 0).length
    const averageDaily = activeDays > 0 ? totalMinutes / activeDays : 0
    
    const categoryTotals: Record<LearningCategory, number> = {
      programming: 0,
      english: 0,
      health: 0,
      reading: 0,
      exercise: 0,
      other: 0
    }

    heatmapData.forEach(data => {
      Object.entries(data.categoryBreakdown).forEach(([category, minutes]) => {
        categoryTotals[category as LearningCategory] += minutes
      })
    })

    const intensityDistribution = {
      none: heatmapData.filter(data => data.intensity === 0).length,
      low: heatmapData.filter(data => data.intensity === 1).length,
      medium: heatmapData.filter(data => data.intensity === 2).length,
      high: heatmapData.filter(data => data.intensity === 3).length,
      max: heatmapData.filter(data => data.intensity === 4).length
    }

    return {
      totalMinutes,
      activeDays,
      averageDaily,
      categoryTotals,
      intensityDistribution,
      totalDays: heatmapData.length
    }
  }, [heatmapData])

  // 週間の統計を取得
  const getWeeklyStats = useCallback(() => {
    const weeks: Array<{
      weekStart: string
      weekEnd: string
      totalMinutes: number
      activeDays: number
      averageDaily: number
    }> = []

    // 週ごとにデータを分割
    for (let i = 0; i < heatmapData.length; i += 7) {
      const weekData = heatmapData.slice(i, i + 7)
      const totalMinutes = weekData.reduce((sum, data) => sum + data.totalMinutes, 0)
      const activeDays = weekData.filter(data => data.totalMinutes > 0).length
      const averageDaily = weekData.length > 0 ? totalMinutes / weekData.length : 0

      weeks.push({
        weekStart: weekData[0]?.date || '',
        weekEnd: weekData[weekData.length - 1]?.date || '',
        totalMinutes,
        activeDays,
        averageDaily
      })
    }

    return weeks
  }, [heatmapData])

  // 最長連続学習日数を取得
  const getLongestStreak = useCallback(() => {
    let currentStreak = 0
    let longestStreak = 0
    let currentStreakStart = ''
    let longestStreakStart = ''
    let longestStreakEnd = ''

    heatmapData.forEach((data, index) => {
      if (data.totalMinutes > 0) {
        if (currentStreak === 0) {
          currentStreakStart = data.date
        }
        currentStreak++
        
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak
          longestStreakStart = currentStreakStart
          longestStreakEnd = data.date
        }
      } else {
        currentStreak = 0
      }
    })

    return {
      days: longestStreak,
      startDate: longestStreakStart,
      endDate: longestStreakEnd
    }
  }, [heatmapData])

  // 現在の連続学習日数を取得
  const getCurrentStreak = useCallback(() => {
    let streak = 0
    let startDate = ''
    
    // 最新の日付から逆順でチェック
    for (let i = heatmapData.length - 1; i >= 0; i--) {
      const data = heatmapData[i]
      if (data.totalMinutes > 0) {
        if (streak === 0) {
          startDate = data.date
        }
        streak++
      } else {
        break
      }
    }

    return {
      days: streak,
      startDate
    }
  }, [heatmapData])

  // カテゴリ別の色を取得
  const getCategoryColor = useCallback((category: LearningCategory): string => {
    const colors = {
      programming: '#3b82f6', // blue
      english: '#10b981', // green
      health: '#f59e0b', // orange
      reading: '#8b5cf6', // purple
      exercise: '#ef4444', // red
      other: '#6b7280' // gray
    }
    return colors[category]
  }, [])

  // 強度別の色を取得
  const getIntensityColor = useCallback((intensity: number): string => {
    const colors = ['#f3f4f6', '#dbeafe', '#93c5fd', '#3b82f6', '#1e40af']
    return colors[intensity] || colors[0]
  }, [])

  // 初期化
  useEffect(() => {
    generateHeatmapData()
  }, [generateHeatmapData])

  // データの更新（外部から呼び出し可能）
  const refreshData = useCallback(() => {
    generateHeatmapData()
  }, [generateHeatmapData])

  return {
    // データ
    heatmapData,
    config,
    loading,
    error,
    
    // 設定
    updateConfig,
    
    // データ取得
    getDataForDate,
    getMonthlyStats,
    getWeeklyStats,
    getLongestStreak,
    getCurrentStreak,
    
    // ユーティリティ
    getCategoryColor,
    getIntensityColor,
    
    // 操作
    refreshData
  }
}