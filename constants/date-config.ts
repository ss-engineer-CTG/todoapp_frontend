// 日付設定定数

// 週の開始日設定
export const WEEK_START_OPTIONS = [
    { value: 0, label: '日曜日' },
    { value: 1, label: '月曜日' },
    { value: 6, label: '土曜日' }
  ] as const
  
  // デフォルト設定
  export const DEFAULT_WEEK_START = 1 // 月曜日
  
  // 日付フォーマットオプション
  export const DATE_FORMAT_OPTIONS = [
    { value: 'yyyy/MM/dd', label: '2024/01/15' },
    { value: 'yyyy-MM-dd', label: '2024-01-15' },
    { value: 'MM/dd/yyyy', label: '01/15/2024' },
    { value: 'dd/MM/yyyy', label: '15/01/2024' },
    { value: 'yyyy年MM月dd日', label: '2024年01月15日' },
    { value: 'M月d日', label: '1月15日' }
  ] as const
  
  export const DEFAULT_DATE_FORMAT = 'yyyy/MM/dd'
  
  // 時間フォーマットオプション
  export const TIME_FORMAT_OPTIONS = [
    { value: 'HH:mm', label: '14:30 (24時間)' },
    { value: 'hh:mm a', label: '2:30 PM (12時間)' },
    { value: 'HH:mm:ss', label: '14:30:45 (秒付き)' }
  ] as const
  
  export const DEFAULT_TIME_FORMAT = 'HH:mm'
  
  // タイムゾーン設定
  export const TIMEZONE_OPTIONS = [
    { value: 'Asia/Tokyo', label: '日本標準時 (JST)' },
    { value: 'UTC', label: '協定世界時 (UTC)' },
    { value: 'America/New_York', label: '東部標準時 (EST)' },
    { value: 'America/Los_Angeles', label: '太平洋標準時 (PST)' },
    { value: 'Europe/London', label: 'グリニッジ標準時 (GMT)' }
  ] as const
  
  export const DEFAULT_TIMEZONE = 'Asia/Tokyo'
  
  // 営業日設定
  export const WORKING_DAYS = [1, 2, 3, 4, 5] // 月曜日から金曜日
  export const WEEKEND_DAYS = [0, 6] // 日曜日と土曜日
  
  // 営業時間設定
  export const DEFAULT_WORKING_HOURS = {
    start: '09:00',
    end: '17:30',
    lunchStart: '12:00',
    lunchEnd: '13:00'
  } as const
  
  // 日本の祝日設定（2024-2026年）
  export const JAPANESE_HOLIDAYS = {
    2024: [
      { date: '2024-01-01', name: '元日' },
      { date: '2024-01-08', name: '成人の日' },
      { date: '2024-02-11', name: '建国記念の日' },
      { date: '2024-02-12', name: '振替休日' },
      { date: '2024-02-23', name: '天皇誕生日' },
      { date: '2024-03-20', name: '春分の日' },
      { date: '2024-04-29', name: '昭和の日' },
      { date: '2024-05-03', name: '憲法記念日' },
      { date: '2024-05-04', name: 'みどりの日' },
      { date: '2024-05-05', name: 'こどもの日' },
      { date: '2024-05-06', name: '振替休日' },
      { date: '2024-07-15', name: '海の日' },
      { date: '2024-08-11', name: '山の日' },
      { date: '2024-08-12', name: '振替休日' },
      { date: '2024-09-16', name: '敬老の日' },
      { date: '2024-09-22', name: '秋分の日' },
      { date: '2024-09-23', name: '振替休日' },
      { date: '2024-10-14', name: 'スポーツの日' },
      { date: '2024-11-03', name: '文化の日' },
      { date: '2024-11-04', name: '振替休日' },
      { date: '2024-11-23', name: '勤労感謝の日' }
    ],
    2025: [
      { date: '2025-01-01', name: '元日' },
      { date: '2025-01-13', name: '成人の日' },
      { date: '2025-02-11', name: '建国記念の日' },
      { date: '2025-02-23', name: '天皇誕生日' },
      { date: '2025-03-20', name: '春分の日' },
      { date: '2025-04-29', name: '昭和の日' },
      { date: '2025-05-03', name: '憲法記念日' },
      { date: '2025-05-04', name: 'みどりの日' },
      { date: '2025-05-05', name: 'こどもの日' },
      { date: '2025-07-21', name: '海の日' },
      { date: '2025-08-11', name: '山の日' },
      { date: '2025-09-15', name: '敬老の日' },
      { date: '2025-09-23', name: '秋分の日' },
      { date: '2025-10-13', name: 'スポーツの日' },
      { date: '2025-11-03', name: '文化の日' },
      { date: '2025-11-23', name: '勤労感謝の日' }
    ],
    2026: [
      { date: '2026-01-01', name: '元日' },
      { date: '2026-01-12', name: '成人の日' },
      { date: '2026-02-11', name: '建国記念の日' },
      { date: '2026-02-23', name: '天皇誕生日' },
      { date: '2026-03-20', name: '春分の日' },
      { date: '2026-04-29', name: '昭和の日' },
      { date: '2026-05-03', name: '憲法記念日' },
      { date: '2026-05-04', name: 'みどりの日' },
      { date: '2026-05-05', name: 'こどもの日' },
      { date: '2026-05-06', name: '振替休日' },
      { date: '2026-07-20', name: '海の日' },
      { date: '2026-08-11', name: '山の日' },
      { date: '2026-09-21', name: '敬老の日' },
      { date: '2026-09-22', name: '秋分の日' },
      { date: '2026-10-12', name: 'スポーツの日' },
      { date: '2026-11-03', name: '文化の日' },
      { date: '2026-11-23', name: '勤労感謝の日' }
    ]
  } as const
  
  // 期間設定オプション
  export const DURATION_OPTIONS = [
    { value: 1, label: '1日' },
    { value: 3, label: '3日' },
    { value: 7, label: '1週間' },
    { value: 14, label: '2週間' },
    { value: 30, label: '1ヶ月' },
    { value: 90, label: '3ヶ月' },
    { value: 180, label: '6ヶ月' },
    { value: 365, label: '1年' }
  ] as const
  
  // デフォルトのタスク期間
  export const DEFAULT_TASK_DURATION = 7 // 7日
  
  // リマインダー設定オプション
  export const REMINDER_OPTIONS = [
    { value: 0, label: '期限当日' },
    { value: 1, label: '1日前' },
    { value: 3, label: '3日前' },
    { value: 7, label: '1週間前' },
    { value: 14, label: '2週間前' },
    { value: 30, label: '1ヶ月前' }
  ] as const
  
  // カレンダー表示設定
  export const CALENDAR_VIEW_OPTIONS = [
    { value: 'month', label: '月表示' },
    { value: 'week', label: '週表示' },
    { value: 'day', label: '日表示' },
    { value: 'agenda', label: 'アジェンダ表示' }
  ] as const
  
  export const DEFAULT_CALENDAR_VIEW = 'month'
  
  // 日付範囲プリセット
  export const DATE_RANGE_PRESETS = [
    { 
      key: 'today', 
      label: '今日',
      getDates: () => {
        const today = new Date()
        return { start: today, end: today }
      }
    },
    { 
      key: 'tomorrow', 
      label: '明日',
      getDates: () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return { start: tomorrow, end: tomorrow }
      }
    },
    { 
      key: 'thisWeek', 
      label: '今週',
      getDates: () => {
        const today = new Date()
        const start = new Date(today)
        start.setDate(today.getDate() - today.getDay() + DEFAULT_WEEK_START)
        const end = new Date(start)
        end.setDate(start.getDate() + 6)
        return { start, end }
      }
    },
    { 
      key: 'nextWeek', 
      label: '来週',
      getDates: () => {
        const today = new Date()
        const start = new Date(today)
        start.setDate(today.getDate() - today.getDay() + DEFAULT_WEEK_START + 7)
        const end = new Date(start)
        end.setDate(start.getDate() + 6)
        return { start, end }
      }
    },
    { 
      key: 'thisMonth', 
      label: '今月',
      getDates: () => {
        const today = new Date()
        const start = new Date(today.getFullYear(), today.getMonth(), 1)
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        return { start, end }
      }
    },
    { 
      key: 'nextMonth', 
      label: '来月',
      getDates: () => {
        const today = new Date()
        const start = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        const end = new Date(today.getFullYear(), today.getMonth() + 2, 0)
        return { start, end }
      }
    }
  ] as const