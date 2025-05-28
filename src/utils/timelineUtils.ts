import { addDays, getWeekStart } from '@/utils/dateUtils'

interface DateRange {
  startDate: Date
  endDate: Date
  cellWidth: number
  label: string
}

export function getTimeRangeByUnit(unit: 'day' | 'week', zoomLevel: number): DateRange {
  try {
    if (typeof zoomLevel !== 'number' || isNaN(zoomLevel)) {
      console.warn('getTimeRangeByUnit: invalid zoom level:', zoomLevel)
      zoomLevel = 100
    }

    const today = new Date()
    const baseCellWidth = unit === 'week' ? 20 : 30
    const cellWidth = Math.max(1, Math.round(baseCellWidth * (zoomLevel / 100)))

    const config = {
      day: { days: 365, ratio: [0.3, 0.7], label: '日表示' },
      week: { days: 365, ratio: [0.3, 0.7], label: '週表示' }
    }[unit]

    if (!config) {
      console.error(`Unsupported unit: ${unit}`)
      throw new Error(`Unsupported unit: ${unit}`)
    }

    const beforeDays = Math.floor(config.days * (config.ratio[0] ?? 0.3))
    const afterDays = Math.floor(config.days * (config.ratio[1] ?? 0.7))

    const rawStartDate = addDays(today, -beforeDays)
    const rawEndDate = addDays(today, afterDays)

    let actualStartDate = rawStartDate
    let actualEndDate = rawEndDate

    if (unit === 'week') {
      // 週表示の場合は月曜日基準に調整
      actualStartDate = getWeekStart(rawStartDate)
      actualEndDate = addDays(getWeekStart(rawEndDate), 6)
    }

    // 日付の妥当性チェック
    if (isNaN(actualStartDate.getTime()) || isNaN(actualEndDate.getTime())) {
      console.error('Invalid date range calculated')
      throw new Error('Invalid date range calculated')
    }

    return {
      startDate: actualStartDate,
      endDate: actualEndDate,
      cellWidth,
      label: config.label
    }
  } catch (error) {
    console.error('Error calculating time range:', error)
    
    // フォールバック値を返す
    const today = new Date()
    return {
      startDate: addDays(today, -30),
      endDate: addDays(today, 70),
      cellWidth: 30,
      label: '日表示'
    }
  }
}

export function calculateDynamicSizes(zoomLevel: number, viewUnit: 'day' | 'week') {
  try {
    if (typeof zoomLevel !== 'number' || isNaN(zoomLevel)) {
      console.warn('calculateDynamicSizes: invalid zoom level:', zoomLevel)
      zoomLevel = 100
    }

    const zoomRatio = Math.max(0.1, zoomLevel / 100)

    const baseSizes = {
      cellWidth: { day: 30, week: 20 },
      rowHeight: { project: 32, task: 48, subtask: 40 },
      taskBarHeight: 32
    }

    const fontSize = calculateFontSize(zoomLevel)

    return {
      cellWidth: Math.max(5, Math.round(baseSizes.cellWidth[viewUnit] * zoomRatio)),
      rowHeight: {
        project: Math.max(20, Math.round(baseSizes.rowHeight.project * zoomRatio)),
        task: Math.max(24, Math.round(baseSizes.rowHeight.task * zoomRatio)),
        subtask: Math.max(20, Math.round(baseSizes.rowHeight.subtask * zoomRatio))
      },
      fontSize,
      taskBarHeight: Math.max(16, Math.round(baseSizes.taskBarHeight * zoomRatio)),
      zoomRatio
    }
  } catch (error) {
    console.error('Error calculating dynamic sizes:', error)
    
    // フォールバック値を返す
    return {
      cellWidth: 30,
      rowHeight: {
        project: 32,
        task: 48,
        subtask: 40
      },
      fontSize: { base: 14, small: 12, large: 16, week: 13 },
      taskBarHeight: 32,
      zoomRatio: 1
    }
  }
}

function calculateFontSize(zoom: number) {
  try {
    if (typeof zoom !== 'number' || isNaN(zoom)) {
      console.warn('calculateFontSize: invalid zoom level:', zoom)
      zoom = 100
    }

    if (zoom <= 30) return { base: 8, small: 7, large: 9, week: 8 }
    if (zoom <= 50) return { base: 10, small: 9, large: 11, week: 10 }
    if (zoom <= 80) return { base: 12, small: 11, large: 13, week: 12 }
    if (zoom <= 120) return { base: 14, small: 12, large: 16, week: 13 }
    if (zoom <= 150) return { base: 16, small: 14, large: 18, week: 15 }
    return { base: 18, small: 16, large: 20, week: 17 }
  } catch (error) {
    console.error('Error calculating font size:', error)
    return { base: 14, small: 12, large: 16, week: 13 }
  }
}

export function getDatePosition(
  date: Date | string | number, 
  dateRange: { startDate: Date; cellWidth: number }, 
  viewUnit: 'day' | 'week'
): number {
  try {
    // 日付の正規化
    let normalizedDate: Date
    if (date instanceof Date) {
      normalizedDate = date
    } else {
      normalizedDate = new Date(date)
    }

    if (isNaN(normalizedDate.getTime())) {
      console.warn('getDatePosition: invalid date provided:', date)
      return 0
    }

    if (!dateRange?.startDate || !(dateRange.startDate instanceof Date)) {
      console.warn('getDatePosition: invalid dateRange provided:', dateRange)
      return 0
    }

    if (isNaN(dateRange.startDate.getTime())) {
      console.warn('getDatePosition: invalid start date in dateRange:', dateRange.startDate)
      return 0
    }

    const cellWidth = Math.max(1, dateRange.cellWidth || 30)

    if (viewUnit === 'week') {
      // 週表示：週単位での位置計算
      const startOfWeek = getWeekStart(normalizedDate)
      const startOfWeekRange = getWeekStart(dateRange.startDate)
      
      if (isNaN(startOfWeek.getTime()) || isNaN(startOfWeekRange.getTime())) {
        console.warn('getDatePosition: failed to calculate week start')
        return 0
      }

      const weeksDiff = Math.round((startOfWeek.getTime() - startOfWeekRange.getTime()) / (7 * 24 * 60 * 60 * 1000))
      const daysInWeek = (normalizedDate.getDay() + 6) % 7 // 月曜日を0とした週内の日数
      
      return Math.max(0, weeksDiff * cellWidth * 7 + daysInWeek * cellWidth)
    } else {
      // 日表示：日単位での位置計算
      const diffDays = Math.round((normalizedDate.getTime() - dateRange.startDate.getTime()) / (24 * 60 * 60 * 1000))
      return Math.max(0, diffDays * cellWidth)
    }
  } catch (error) {
    console.error('Error calculating date position:', error)
    return 0
  }
}

export function scrollToToday(
  timelineRef: HTMLDivElement | null,
  todayPosition: number
) {
  try {
    if (!timelineRef) {
      console.warn('scrollToToday: timelineRef is null')
      return
    }

    if (typeof todayPosition !== 'number' || isNaN(todayPosition)) {
      console.warn('scrollToToday: invalid todayPosition:', todayPosition)
      return
    }

    const containerWidth = timelineRef.clientWidth || 0
    const scrollPosition = Math.max(0, todayPosition - containerWidth / 2)

    // メインタイムラインのスクロール
    timelineRef.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    })

    // ヘッダーも同期してスクロール
    const headerScroll = document.querySelector('.timeline-header') as HTMLElement
    if (headerScroll) {
      headerScroll.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      })
    }
  } catch (error) {
    console.error('Error scrolling to today:', error)
  }
}

// 日付範囲の重複チェック
export function isDateRangeOverlap(
  range1: { start: Date; end: Date },
  range2: { start: Date; end: Date }
): boolean {
  try {
    if (!range1?.start || !range1?.end || !range2?.start || !range2?.end) {
      console.warn('isDateRangeOverlap: invalid date ranges provided')
      return false
    }

    const start1 = range1.start instanceof Date ? range1.start : new Date(range1.start)
    const end1 = range1.end instanceof Date ? range1.end : new Date(range1.end)
    const start2 = range2.start instanceof Date ? range2.start : new Date(range2.start)
    const end2 = range2.end instanceof Date ? range2.end : new Date(range2.end)

    if ([start1, end1, start2, end2].some(date => isNaN(date.getTime()))) {
      console.warn('isDateRangeOverlap: invalid dates in ranges')
      return false
    }

    return start1 <= end2 && start2 <= end1
  } catch (error) {
    console.error('Error checking date range overlap:', error)
    return false
  }
}

// 可視範囲内の日付を取得
export function getVisibleDates(
  dateRange: DateRange,
  viewUnit: 'day' | 'week'
): Date[] {
  try {
    if (!dateRange?.startDate || !dateRange?.endDate) {
      console.warn('getVisibleDates: invalid dateRange provided:', dateRange)
      return []
    }

    const startDate = dateRange.startDate instanceof Date ? dateRange.startDate : new Date(dateRange.startDate)
    const endDate = dateRange.endDate instanceof Date ? dateRange.endDate : new Date(dateRange.endDate)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.warn('getVisibleDates: invalid dates in dateRange')
      return []
    }

    const dates: Date[] = []
    
    if (viewUnit === 'week') {
      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 7)
      }
    } else {
      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    return dates
  } catch (error) {
    console.error('Error getting visible dates:', error)
    return []
  }
}

// 日付の範囲をクランプ
export function clampDate(
  date: Date,
  minDate: Date,
  maxDate: Date
): Date {
  try {
    const normalizedDate = date instanceof Date ? date : new Date(date)
    const normalizedMin = minDate instanceof Date ? minDate : new Date(minDate)
    const normalizedMax = maxDate instanceof Date ? maxDate : new Date(maxDate)

    if ([normalizedDate, normalizedMin, normalizedMax].some(d => isNaN(d.getTime()))) {
      console.warn('clampDate: invalid dates provided')
      return new Date()
    }

    if (normalizedDate < normalizedMin) return normalizedMin
    if (normalizedDate > normalizedMax) return normalizedMax
    return normalizedDate
  } catch (error) {
    console.error('Error clamping date:', error)
    return new Date()
  }
}

// タスクバーの幅を計算
export function calculateTaskBarWidth(
  startDate: Date,
  endDate: Date,
  dateRange: { startDate: Date; cellWidth: number },
  viewUnit: 'day' | 'week',
  minWidth = 20
): number {
  try {
    const startPosition = getDatePosition(startDate, dateRange, viewUnit)
    const endPosition = getDatePosition(endDate, dateRange, viewUnit)
    
    const calculatedWidth = endPosition - startPosition + dateRange.cellWidth
    return Math.max(minWidth, calculatedWidth)
  } catch (error) {
    console.error('Error calculating task bar width:', error)
    return minWidth
  }
}