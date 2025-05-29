// フロントエンド用パス定数（システムプロンプト準拠）
export const FRONTEND_PATHS = {
    // ルート
    ROOT: '/',
    
    // コンポーネント
    COMPONENTS: {
      ROOT: '/src/components',
      UI: '/src/components/ui',
      PROJECT_PANEL: '/src/components/ProjectPanel',
      TASK_PANEL: '/src/components/TaskPanel',
      DETAIL_PANEL: '/src/components/DetailPanel'
    },
    
    // フック
    HOOKS: {
      ROOT: '/src/hooks',
      TASK_RELATIONS: '/src/hooks/useTaskRelations',
      MULTI_SELECT: '/src/hooks/useMultiSelect',
      KEYBOARD_SHORTCUTS: '/src/hooks/useKeyboardShortcuts',
      AUTO_SCROLL: '/src/hooks/useAutoScroll',
      TAB_NAVIGATION: '/src/hooks/useTabNavigation'
    },
    
    // ユーティリティ
    UTILS: {
      ROOT: '/src/utils',
      API: '/src/utils/api',
      DATE_UTILS: '/src/utils/dateUtils',
      CONSTANTS: '/src/utils/constants',
      CN: '/src/utils/cn'
    },
    
    // 設定
    CONFIG: {
      ROOT: '/src/config',
      APP: '/src/config/app',
      PATHS: '/src/config/paths',
      LOGGER: '/src/config/logger'
    },
    
    // 型定義
    TYPES: {
      ROOT: '/src/types',
      INDEX: '/src/types/index',
      LOGGER: '/src/types/logger',
      PATHS: '/src/types/paths'
    }
  } as const