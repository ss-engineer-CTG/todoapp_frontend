// フロントエンドパス設定
import { FRONTEND_PATHS } from '../utils/paths/constants'
import { resolvePath } from '../utils/paths/resolver'

export const PATH_CONFIG = {
  ...FRONTEND_PATHS,
  
  // 動的パス生成関数
  resolve: resolvePath,
  
  // よく使用されるパスのショートカット
  SHORTCUTS: {
    // コンポーネント
    PROJECT_PANEL: () => resolvePath(FRONTEND_PATHS.COMPONENTS.ROOT, 'ProjectPanel.tsx'),
    TASK_PANEL: () => resolvePath(FRONTEND_PATHS.COMPONENTS.ROOT, 'TaskPanel.tsx'),
    DETAIL_PANEL: () => resolvePath(FRONTEND_PATHS.COMPONENTS.ROOT, 'DetailPanel.tsx'),
    
    // フック
    USE_AUTO_SCROLL: () => resolvePath(FRONTEND_PATHS.HOOKS.ROOT, 'useAutoScroll.ts'),
    USE_TAB_NAV: () => resolvePath(FRONTEND_PATHS.HOOKS.ROOT, 'useTabNavigation.ts'),
    
    // ユーティリティ
    LOGGER: () => resolvePath(FRONTEND_PATHS.UTILS.ROOT, 'logger', 'logger.ts'),
    ERROR_HANDLER: () => resolvePath(FRONTEND_PATHS.UTILS.ROOT, 'errorHandler.ts')
  }
} as const