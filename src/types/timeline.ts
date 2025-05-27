export type TimelineViewUnit = 'day' | 'week' | 'month'

export interface TimelineConfig {
  viewUnit: TimelineViewUnit
  zoomLevel: number
  cellWidth: number
  rowHeight: {
    project: number
    task: number
    subtask: number
  }
  fontSize: {
    base: number
    small: number
    large: number
    week: number
  }
}

export interface DateRange {
  startDate: Date
  endDate: Date
  cellWidth: number
  label: string
}

export interface TimelineState {
  viewUnit: TimelineViewUnit
  zoomLevel: number
  scrollLeft: number
  isZooming: boolean
  showWeekends: boolean
  showHolidays: boolean
  highlightToday: boolean
}

export interface ZoomConfig {
  min: number
  max: number
  default: number
  step: number
}

export interface TimelineEvent {
  id: string
  title: string
  startDate: Date
  endDate: Date
  color: string
  type: 'task' | 'milestone' | 'project'
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue'
}

export interface TimelineRow {
  id: string
  title: string
  type: 'project' | 'task' | 'subtask'
  level: number
  expanded: boolean
  events: TimelineEvent[]
  height: number
}

export interface VisibleDateInfo {
  date: Date
  isToday: boolean
  isWeekend: boolean
  isHoliday: boolean
  isFirstOfMonth: boolean
  isFirstOfWeek: boolean
  position: number
  width: number
}