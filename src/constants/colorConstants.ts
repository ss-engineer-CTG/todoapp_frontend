/**
 * 色関連の定数
 */
export const colorConstants = {
    // プロジェクトカラーパレット
    PROJECT_COLORS: [
      '#3B82F6', // blue-500
      '#8B5CF6', // purple-500
      '#EC4899', // pink-500
      '#EF4444', // red-500
      '#F59E0B', // amber-500
      '#10B981', // green-500
      '#06B6D4', // cyan-500
      '#6366F1', // indigo-500
      '#D946EF', // fuchsia-500
      '#F97316'  // orange-500
    ],
    
    // ステータスカラー（ライトモード）
    STATUS_COLORS_LIGHT: {
      'completed': {
        bg: '#D1FAE5',     // green-100
        border: '#059669', // green-600
        text: '#065F46'    // green-800
      },
      'in-progress': {
        bg: '#DBEAFE',     // blue-100
        border: '#3B82F6', // blue-500
        text: '#1E40AF'    // blue-800
      },
      'not-started': {
        bg: '#F3F4F6',     // gray-100
        border: '#9CA3AF', // gray-400
        text: '#4B5563'    // gray-600
      },
      'overdue': {
        bg: '#FEE2E2',     // red-100
        border: '#EF4444', // red-500
        text: '#B91C1C'    // red-700
      }
    },
    
    // ステータスカラー（ダークモード）
    STATUS_COLORS_DARK: {
      'completed': {
        bg: '#065F46',     // green-800
        border: '#10B981', // green-500
        text: '#D1FAE5'    // green-100
      },
      'in-progress': {
        bg: '#1E40AF',     // blue-800
        border: '#3B82F6', // blue-500
        text: '#DBEAFE'    // blue-100
      },
      'not-started': {
        bg: '#4B5563',     // gray-600
        border: '#9CA3AF', // gray-400
        text: '#F3F4F6'    // gray-100
      },
      'overdue': {
        bg: '#B91C1C',     // red-700
        border: '#EF4444', // red-500
        text: '#FEE2E2'    // red-100
      }
    },
    
    // フィードバックカラー
    FEEDBACK_COLORS: {
      'success': {
        bg: '#10B981',    // green-500
        text: '#FFFFFF'   // white
      },
      'error': {
        bg: '#EF4444',    // red-500
        text: '#FFFFFF'   // white
      },
      'warning': {
        bg: '#F59E0B',    // amber-500
        text: '#FFFFFF'   // white
      },
      'info': {
        bg: '#3B82F6',    // blue-500
        text: '#FFFFFF'   // white
      }
    },
    
    // レベル別の優先度カラー
    PRIORITY_COLORS: {
      'high': {
        icon: '!',
        color: '#EF4444'  // red-500
      },
      'medium': {
        icon: '◆',
        color: '#F59E0B'  // amber-500
      },
      'low': {
        icon: '●',
        color: '#3B82F6'  // blue-500
      }
    },
    
    // カレンダーカラー
    CALENDAR_COLORS: {
      'weekend': {
        saturday: 'bg-blue-50 dark:bg-blue-900/30',
        sunday: 'bg-red-50 dark:bg-red-900/30'
      },
      'today': 'bg-yellow-50 dark:bg-yellow-900/20',
      'selected': 'bg-indigo-100 dark:bg-indigo-900/40',
      'hover': 'hover:bg-gray-100 dark:hover:bg-gray-800'
    },
    
    // テーマカラー（ライトモード）
    THEME_COLORS_LIGHT: {
      primary: '#3B82F6',    // blue-500
      secondary: '#8B5CF6',  // purple-500
      background: '#F9FAFB', // gray-50
      surface: '#FFFFFF',    // white
      border: '#E5E7EB',     // gray-200
      text: {
        primary: '#1F2937',  // gray-800
        secondary: '#6B7280', // gray-500
        hint: '#9CA3AF'      // gray-400
      }
    },
    
    // テーマカラー（ダークモード）
    THEME_COLORS_DARK: {
      primary: '#3B82F6',    // blue-500
      secondary: '#8B5CF6',  // purple-500
      background: '#111827', // gray-900
      surface: '#1F2937',    // gray-800
      border: '#374151',     // gray-700
      text: {
        primary: '#F9FAFB',  // gray-50
        secondary: '#D1D5DB', // gray-300
        hint: '#9CA3AF'      // gray-400
      }
    }
  };