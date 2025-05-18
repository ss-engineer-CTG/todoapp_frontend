/**
 * タスクステータス関連の定数
 */
export const statusConstants = {
    // タスクステータス
    TASK_STATUS: {
      NOT_STARTED: 'not-started',
      IN_PROGRESS: 'in-progress',
      COMPLETED: 'completed',
      OVERDUE: 'overdue'
    },
    
    // タスク優先度
    TASK_PRIORITY: {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high'
    },
    
    // 繰り返しタイプ
    REPEAT_TYPE: {
      DAILY: 'daily',
      WEEKLY: 'weekly',
      MONTHLY: 'monthly',
      YEARLY: 'yearly',
      CUSTOM: 'custom'
    },
    
    // フィルタリングモード
    FILTER_MODE: {
      ALL: 'all',
      TODAY: 'today',
      OVERDUE: 'overdue'
    },
    
    // 表示モード
    VIEW_MODE: {
      DAY: 'day',
      WEEK: 'week',
      MONTH: 'month'
    },
    
    // 表示密度
    DENSITY: {
      COMPACT: 'compact',
      STANDARD: 'standard',
      EXPANDED: 'expanded'
    },
    
    // テーマモード
    THEME_MODE: {
      LIGHT: 'light',
      DARK: 'dark',
      SYSTEM: 'system'
    },
    
    // 通知タイプ
    NOTIFICATION_TYPE: {
      INFO: 'info',
      SUCCESS: 'success',
      WARNING: 'warning',
      ERROR: 'error'
    },
    
    // ステータスの表示名（日本語）
    STATUS_LABELS: {
      'not-started': '未開始',
      'in-progress': '進行中',
      'completed': '完了',
      'overdue': '遅延'
    },
    
    // 優先度の表示名（日本語）
    PRIORITY_LABELS: {
      'low': '低',
      'medium': '中',
      'high': '高'
    },
    
    // 繰り返しタイプの表示名（日本語）
    REPEAT_TYPE_LABELS: {
      'daily': '毎日',
      'weekly': '毎週',
      'monthly': '毎月',
      'yearly': '毎年',
      'custom': 'カスタム'
    },
    
    // ステータス遷移
    // あるステータスから別のステータスへの遷移が許可されているかを定義
    STATUS_TRANSITIONS: {
      'not-started': ['in-progress', 'completed', 'overdue'],
      'in-progress': ['completed', 'overdue', 'not-started'],
      'completed': ['not-started', 'in-progress'],
      'overdue': ['in-progress', 'completed', 'not-started']
    },
    
    // ステータス変更時のデフォルト通知メッセージ
    STATUS_CHANGE_MESSAGES: {
      'not-started': {
        'in-progress': 'タスクを開始しました',
        'completed': 'タスクを完了しました',
        'overdue': 'タスクが遅延しています'
      },
      'in-progress': {
        'completed': 'タスクを完了しました',
        'not-started': 'タスクを未開始に戻しました',
        'overdue': 'タスクが遅延しています'
      },
      'completed': {
        'not-started': 'タスクを未開始に戻しました',
        'in-progress': 'タスクを再開しました'
      },
      'overdue': {
        'in-progress': 'タスクを開始しました',
        'completed': 'タスクを完了しました',
        'not-started': 'タスクを未開始に戻しました'
      }
    },
    
    // ステータスに対応するアイコン名
    STATUS_ICONS: {
      'not-started': 'circle',
      'in-progress': 'clock',
      'completed': 'check-circle',
      'overdue': 'alert-circle'
    },
    
    // ステータスに基づくタスクのソート順序（数値が小さいほど優先度が高い）
    STATUS_SORT_ORDER: {
      'overdue': 1,
      'in-progress': 2,
      'not-started': 3,
      'completed': 4
    },
    
    // ステータスカラークラス名（Tailwind CSS用）
    STATUS_COLOR_CLASSES: {
      'not-started': {
        bg: 'bg-gray-100 dark:bg-gray-700',
        border: 'border-gray-300 dark:border-gray-600',
        text: 'text-gray-700 dark:text-gray-300'
      },
      'in-progress': {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        border: 'border-blue-500 dark:border-blue-700',
        text: 'text-blue-800 dark:text-blue-300'
      },
      'completed': {
        bg: 'bg-green-100 dark:bg-green-900/30',
        border: 'border-green-500 dark:border-green-700',
        text: 'text-green-800 dark:text-green-300'
      },
      'overdue': {
        bg: 'bg-red-100 dark:bg-red-900/30',
        border: 'border-red-500 dark:border-red-700',
        text: 'text-red-800 dark:text-red-300'
      }
    }
  };