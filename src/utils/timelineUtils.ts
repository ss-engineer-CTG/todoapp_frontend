import { addDays, getWeekStart } from '@/utils/dateUtils'

interface DateRange {
  startDate: Date
  endDate: Date
  cellWidth: number
  label: string
}

export function getTimeRangeByUnit(unit: 'day' | 'week', zoomLevel: number): DateRange {
  const today = new Date()
  const baseCellWidth = unit === 'week' ? 20 : 30
  const cellWidth = Math.round(baseCellWidth * (zoomLevel / 100))

  const config = {
    day: { days: 365, ratio: [0.3, 0.7], label: '日表示' },
    week: { days: 365, ratio: [0.3, 0.7], label: '週表示' }
  }[unit]

  const beforeDays = Math.floor(config.days * config.ratio[0])
  const afterDays = Math.floor(config.days * config.ratio[1])

  const rawStartDate = addDays(today, -beforeDays)
  const rawEndDate = addDays(today, afterDays)

  let actualStartDate = rawStartDate
  let actualEndDate = rawEndDate

  if (unit === 'week') {
    // 週表示の場合は月曜日基準に調整
    actualStartDate = getWeekStart(rawStartDate)
    actualEndDate = addDays(getWeekStart(rawEndDate), 6)
  }

  return {
    startDate: actualStartDate,
    endDate: actualEndDate,
    cellWidth,
    label: config.label
  }
}

export function calculateDynamicSizes(zoomLevel: number, viewUnit: 'day' | 'week') {
  const zoomRatio = zoomLevel / 100

  const baseSizes = {
    cellWidth: { day: 30, week: 20 },
    rowHeight: { project: 32, task: 48, subtask: 40 },
    taskBarHeight: 32
  }

  const fontSize = calculateFontSize(zoomLevel)

  return {
    cellWidth: Math.round(baseSizes.cellWidth[viewUnit] * zoomRatio),
    rowHeight: {
      project: Math.round(baseSizes.rowHeight.project * zoomRatio),
      task: Math.round(baseSizes.rowHeight.task * zoomRatio),
      subtask: Math.round(baseSizes.rowHeight.subtask * zoomRatio)
    },
    fontSize,
    taskBarHeight: Math.round(baseSizes.taskBarHeight * zoomRatio),
    zoomRatio
  }
}

function calculateFontSize(zoom: number) {
  if (zoom <= 30) return { base: 8, small: 7, large: 9, week: 8 }
  if (zoom <= 50) return { base: 10, small: 9, large: 11, week: 10 }
  if (zoom <= 80) return { base: 12, small: 11, large: 13, week: 12 }
  if (zoom <= 120) return { base: 14, small: 12, large: 16, week: 13 }
  if (zoom <= 150) return { base: 16, small: 14, large: 18, week: 15 }
  return { base: 18, small: 16, large: 20, week: 17 }
}

export function getDatePosition(
  date: Date, 
  dateRange: { startDate: Date; cellWidth: number }, 
  viewUnit: 'day' | 'week'
): number {
  if (viewUnit === 'week') {
    // 週表示：週単位での位置計算
    const startOfWeek = getWeekStart(date)
    const weeksDiff = Math.round((startOfWeek.getTime() - dateRange.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    const daysInWeek = (date.getDay() + 6) % 7 // 月曜日を0とした週内の日数
    
    return weeksDiff * dateRange.cellWidth * 7 + daysInWeek * dateRange.cellWidth
  } else {
    // 日表示：日単位での位置計算
    const diffDays = Math.round((date.getTime() - dateRange.startDate.getTime()) / (24 * 60 * 60 * 1000))
    return diffDays * dateRange.cellWidth
  }
}

export function scrollToToday(
  timelineRef: HTMLDivElement | null,
  todayPosition: number
) {
  if (!timelineRef) return

  const containerWidth = timelineRef.clientWidth
  const scrollPosition = Math.max(0, todayPosition - containerWidth / 2)

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
}