/**
 * アプリケーション全体で使用する色の定義
 */

/**
 * ベースカラー
 */
export const baseColors = {
    // 背景色
    background: '#F8F9FA', // bg-gray-50
    contentBackground: '#FFFFFF', // bg-white
    
    // 境界線
    border: '#E2E8F0', // border-gray-200
    
    // テキスト
    textPrimary: '#333333', // text-gray-800
    textSecondary: '#6B7280', // text-gray-500
  };
  
  /**
   * アクセントカラー
   */
  export const accentColors = {
    primary: '#3B82F6', // blue-500
    primaryDark: '#1E40AF', // blue-800
    primaryLight: '#BFDBFE', // blue-200
    
    success: '#10B981', // green-500
    successDark: '#047857', // green-700
    successLight: '#A7F3D0', // green-200
    
    warning: '#F59E0B', // amber-500
    warningDark: '#B45309', // amber-700
    warningLight: '#FDE68A', // amber-200
    
    danger: '#EF4444', // red-500
    dangerDark: '#B91C1C', // red-800
    dangerLight: '#FECACA', // red-200
    
    info: '#3B82F6', // blue-500
    infoDark: '#1E40AF', // blue-800
    infoLight: '#BFDBFE', // blue-200
  };
  
  /**
   * タスクステータスのカラー
   */
  export const statusColors = {
    // 遅延タスク
    delayed: {
      background: '#FECACA', // bg-red-200
      border: '#EF4444', // border-red-500
      text: '#B91C1C', // text-red-800
    },
    
    // 進行中タスク
    active: {
      background: '#BFDBFE', // bg-blue-200
      border: '#3B82F6', // border-blue-500
      text: '#1E40AF', // text-blue-800
    },
    
    // 未来タスク
    future: {
      background: '#A7F3D0', // bg-green-200
      border: '#10B981', // border-green-500
      text: '#047857', // text-green-800
    },
    
    // 完了タスク
    completed: {
      background: '#E5E7EB', // bg-gray-200
      border: '#9CA3AF', // border-gray-400
      text: '#4B5563', // text-gray-600
    },
  };
  
  /**
   * 優先度のカラー
   */
  export const priorityColors = {
    high: {
      background: '#FECACA', // bg-red-200
      text: '#B91C1C', // text-red-800
    },
    
    medium: {
      background: '#FEF3C7', // bg-amber-200
      text: '#B45309', // text-amber-800
    },
    
    low: {
      background: '#D1FAE5', // bg-green-200
      text: '#065F46', // text-green-800
    },
  };
  
  /**
   * 特殊な日付のカラー
   */
  export const dateColors = {
    today: '#FEE2E2', // bg-red-100
    weekend: '#F3F4F6', // bg-gray-100
  };
  
  /**
   * カラーユーティリティ関数
   */
  
  /**
   * HEX カラーを RGBA に変換
   */
  export const hexToRgba = (hex: string, alpha: number = 1): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  /**
   * カラーを暗くする
   */
  export const darken = (hex: string, amount: number = 0.1): string => {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) * (1 - amount));
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) * (1 - amount));
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) * (1 - amount));
    
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
  };
  
  /**
   * カラーを明るくする
   */
  export const lighten = (hex: string, amount: number = 0.1): string => {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + (255 - parseInt(hex.slice(1, 3), 16)) * amount);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + (255 - parseInt(hex.slice(3, 5), 16)) * amount);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + (255 - parseInt(hex.slice(5, 7), 16)) * amount);
    
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
  };
  
  /**
   * タスクステータスに応じたカラーを取得
   */
  export const getStatusColors = (status: 'delayed' | 'active' | 'future' | 'completed') => {
    return statusColors[status] || statusColors.active;
  };
  
  /**
   * 優先度に応じたカラーを取得
   */
  export const getPriorityColors = (priority: 'high' | 'medium' | 'low') => {
    return priorityColors[priority] || priorityColors.medium;
  };