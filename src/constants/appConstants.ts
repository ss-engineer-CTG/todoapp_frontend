/**
 * アプリケーション全般で使用する定数
 */
export const appConstants = {
    // アプリケーション名
    APP_NAME: 'タイムラインToDoアプリ',
    
    // バージョン
    VERSION: '1.0.0',
    
    // ローカルストレージのキー
    STORAGE_KEYS: {
      PROJECTS: 'timeline-todo-projects',
      SETTINGS: 'timeline-todo-settings',
      TEMPLATES: 'timeline-todo-templates',
      THEME: 'timeline-todo-theme',
      USER_PREFERENCES: 'timeline-todo-user-preferences'
    },
    
    // デフォルトのタイムライン設定
    DEFAULT_TIMELINE: {
      START_DATE_OFFSET: -7, // 今日から7日前
      END_DATE_OFFSET: 30,   // 今日から30日後
      DEFAULT_ZOOM: 100,     // デフォルトズームレベル (%)
      MIN_ZOOM: 50,          // 最小ズームレベル (%)
      MAX_ZOOM: 200,         // 最大ズームレベル (%)
      ZOOM_STEP: 25,         // ズーム変更ステップ (%)
      DEFAULT_SCALE: 'day',  // デフォルトのスケール ('day', 'week', 'month')
    },
    
    // タスク関連の定数
    TASK: {
      DEFAULT_DURATION: 1,  // デフォルトのタスク期間（日）
      MAX_NAME_LENGTH: 100, // タスク名の最大長
      MAX_NOTE_LENGTH: 1000 // タスクノートの最大長
    },
    
    // アニメーション時間
    ANIMATION: {
      DEFAULT: 200,       // デフォルトのアニメーション時間（ミリ秒）
      FAST: 150,          // 高速アニメーション（ミリ秒）
      SLOW: 300           // 低速アニメーション（ミリ秒）
    },
    
    // フィードバック表示時間
    FEEDBACK_TIMEOUT: 3000, // フィードバックメッセージの表示時間（ミリ秒）
    
    // フィルタリングモード
    FILTER_MODES: {
      ALL: 'all',
      TODAY: 'today',
      OVERDUE: 'overdue'
    },
    
    // 表示密度
    DENSITY: {
      COMPACT: {
        TASK_HEIGHT: 24,
        SUBTASK_HEIGHT: 20
      },
      STANDARD: {
        TASK_HEIGHT: 32,
        SUBTASK_HEIGHT: 28
      },
      EXPANDED: {
        TASK_HEIGHT: 40,
        SUBTASK_HEIGHT: 32
      }
    },
    
    // 反対モード（テーマなど）のマッピング
    OPPOSITE_MODES: {
      'light': 'dark',
      'dark': 'light',
      'day': 'week',
      'week': 'month',
      'month': 'day'
    },
    
    // API関連（将来的な拡張用）
    API: {
      BASE_URL: '/api',
      TIMEOUT: 10000 // ミリ秒
    }
  };