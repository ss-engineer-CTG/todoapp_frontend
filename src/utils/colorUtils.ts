// カラーコードをRGBA形式に変換
export const hexToRgba = (hex: string, alpha: number = 1): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  // RGBをHEXに変換
  export const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };
  
  // 色の明度を計算
  export const getLuminance = (hex: string): number => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    // RGB -> 明度変換の公式
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  // 色が明るいか暗いかを判定
  export const isLightColor = (hex: string): boolean => {
    return getLuminance(hex) > 0.5;
  };
  
  // 色を明るくする
  export const lightenColor = (hex: string, amount: number = 0.2): string => {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    r = Math.min(255, Math.floor(r + (255 - r) * amount));
    g = Math.min(255, Math.floor(g + (255 - g) * amount));
    b = Math.min(255, Math.floor(b + (255 - b) * amount));
    
    return rgbToHex(r, g, b);
  };
  
  // 色を暗くする
  export const darkenColor = (hex: string, amount: number = 0.2): string => {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    r = Math.max(0, Math.floor(r * (1 - amount)));
    g = Math.max(0, Math.floor(g * (1 - amount)));
    b = Math.max(0, Math.floor(b * (1 - amount)));
    
    return rgbToHex(r, g, b);
  };
  
  // コントラストの高いテキスト色を取得
  export const getContrastColor = (hex: string): string => {
    return isLightColor(hex) ? '#000000' : '#FFFFFF';
  };
  
  // プロジェクト用のランダムカラーを生成
  export const generateRandomColor = (): string => {
    const colors = [
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
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  };