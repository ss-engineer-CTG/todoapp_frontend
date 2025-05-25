export interface DateRange {
    startDate: Date
    endDate: Date
    rawStartDate: Date
    rawEndDate: Date
    cellWidth: number
    unit: 'day' | 'week'
    label: string
  }
  
  export interface DynamicSizes {
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
      week?: number
    }
    taskBarHeight: number
    zoomRatio: number
  }
  
  export interface TimelineEvent {
    id: string
    title: string
    start: Date
    end: Date
    type: 'task' | 'milestone' | 'project'
    status: 'not-started' | 'in-progress' | 'completed' | 'overdue'
    color?: string
  }
  
  export interface ZoomConfig {
    min: number
    max: number
    default: number
    step: number
  }
  
  export interface ViewConfig {
    key: 'day' | 'week'
    label: string
    days: number
    ratio: [number, number]
  }