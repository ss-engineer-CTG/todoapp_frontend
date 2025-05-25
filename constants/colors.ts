// カラーパレット定数

export interface ColorOption {
    name: string
    value: string
    rgb?: string
    description?: string
  }
  
  // プロジェクトカラー選択肢
  export const PROJECT_COLORS: ColorOption[] = [
    { 
      name: "オレンジ", 
      value: "#f97316", 
      rgb: "249, 115, 22",
      description: "エネルギッシュで積極的な印象"
    },
    { 
      name: "紫", 
      value: "#8b5cf6", 
      rgb: "139, 92, 246",
      description: "創造性と神秘性を表現"
    },
    { 
      name: "緑", 
      value: "#10b981", 
      rgb: "16, 185, 129",
      description: "成長と安定を象徴"
    },
    { 
      name: "赤", 
      value: "#ef4444", 
      rgb: "239, 68, 68",
      description: "緊急性と重要性を強調"
    },
    { 
      name: "青", 
      value: "#3b82f6", 
      rgb: "59, 130, 246",
      description: "信頼性と専門性を表現"
    },
    { 
      name: "琥珀", 
      value: "#f59e0b", 
      rgb: "245, 158, 11",
      description: "温かみと注意を促す"
    },
    { 
      name: "ピンク", 
      value: "#ec4899", 
      rgb: "236, 72, 153",
      description: "親しみやすさと創造性"
    },
    { 
      name: "ティール", 
      value: "#14b8a6", 
      rgb: "20, 184, 166",
      description: "バランスと落ち着き"
    },
    { 
      name: "インディゴ", 
      value: "#6366f1", 
      rgb: "99, 102, 241",
      description: "深い思考と集中"
    },
    { 
      name: "シアン", 
      value: "#06b6d4", 
      rgb: "6, 182, 212",
      description: "革新性と明快さ"
    }
  ]
  
  // ステータスカラー
  export const STATUS_COLORS = {
    'not-started': {
      background: '#f3f4f6',
      border: '#9ca3af',
      text: '#374151'
    },
    'in-progress': {
      background: '#dbeafe',
      border: '#3b82f6',
      text: '#1e40af'
    },
    'completed': {
      background: '#d1fae5',
      border: '#10b981',
      text: '#065f46'
    },
    'overdue': {
      background: '#fee2e2',
      border: '#ef4444',
      text: '#991b1b'
    }
  } as const
  
  // 優先度カラー
  export const PRIORITY_COLORS = {
    low: {
      background: '#f3f4f6',
      border: '#9ca3af',
      text: '#6b7280'
    },
    medium: {
      background: '#fef3c7',
      border: '#f59e0b',
      text: '#92400e'
    },
    high: {
      background: '#fee2e2',
      border: '#ef4444',
      text: '#991b1b'
    }
  } as const
  
  // テーマカラー
  export const THEME_COLORS = {
    light: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    },
    dark: {
      primary: '#60a5fa',
      secondary: '#9ca3af',
      accent: '#fbbf24',
      background: '#111827',
      surface: '#1f2937',
      text: '#f9fafb',
      textSecondary: '#d1d5db',
      border: '#374151',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa'
    }
  } as const
  
  // グラデーションカラー
  export const GRADIENT_COLORS = [
    'from-blue-500 to-purple-600',
    'from-green-400 to-blue-500',
    'from-purple-400 to-pink-400',
    'from-yellow-400 to-orange-500',
    'from-red-400 to-pink-500',
    'from-indigo-400 to-cyan-400',
    'from-teal-400 to-green-500',
    'from-orange-400 to-red-500'
  ] as const
  
  // カラーユーティリティ関数
  export const colorUtils = {
    // HEXからRGBに変換
    hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null
    },
  
    // RGBからHEXに変換
    rgbToHex: (r: number, g: number, b: number): string => {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
    },
  
    // 色の明度を取得
    getLuminance: (hex: string): number => {
      const rgb = colorUtils.hexToRgb(hex)
      if (!rgb) return 0
  
      const { r, g, b } = rgb
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })
  
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
    },
  
    // コントラスト比を計算
    getContrastRatio: (color1: string, color2: string): number => {
      const lum1 = colorUtils.getLuminance(color1)
      const lum2 = colorUtils.getLuminance(color2)
      const brightest = Math.max(lum1, lum2)
      const darkest = Math.min(lum1, lum2)
      return (brightest + 0.05) / (darkest + 0.05)
    },
  
    // 色を明るく/暗くする
    adjustBrightness: (hex: string, percent: number): string => {
      const rgb = colorUtils.hexToRgb(hex)
      if (!rgb) return hex
  
      const adjust = (value: number) => {
        const adjusted = value + (255 - value) * (percent / 100)
        return Math.min(255, Math.max(0, Math.round(adjusted)))
      }
  
      return colorUtils.rgbToHex(
        adjust(rgb.r),
        adjust(rgb.g),
        adjust(rgb.b)
      )
    },
  
    // 透明度を追加
    addOpacity: (hex: string, opacity: number): string => {
      const rgb = colorUtils.hexToRgb(hex)
      if (!rgb) return hex
  
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`
    },
  
    // 読みやすい文字色を取得
    getReadableTextColor: (backgroundColor: string): string => {
      const contrastWithWhite = colorUtils.getContrastRatio(backgroundColor, '#ffffff')
      const contrastWithBlack = colorUtils.getContrastRatio(backgroundColor, '#000000')
      
      return contrastWithWhite > contrastWithBlack ? '#ffffff' : '#000000'
    }
  }
  
  // カラーパレット生成
  export const generateColorPalette = (baseColor: string, count: number = 5): string[] => {
    const colors: string[] = []
    const step = 20
    
    for (let i = 0; i < count; i++) {
      const adjustment = (i - Math.floor(count / 2)) * step
      colors.push(colorUtils.adjustBrightness(baseColor, adjustment))
    }
    
    return colors
  }
  
  // ランダムカラー取得
  export const getRandomColor = (): ColorOption => {
    return PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]
  }