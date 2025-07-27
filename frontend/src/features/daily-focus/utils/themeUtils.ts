/**
 * 統一的なテーマとカラーシステム
 * daily-focusモジュール全体で使用する色とスタイルの定義
 */

export type ThemeMode = 'light' | 'dark'

export type ColorVariant = 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'rose'

export type ColorIntensity = 'light' | 'medium' | 'strong'

/**
 * カラーパレット定義
 */
export const colorPalette = {
  blue: {
    light: {
      background: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      textSecondary: 'text-blue-600',
      darkBackground: 'bg-blue-900/20',
      darkBorder: 'border-blue-800',
      darkText: 'text-blue-100',
      darkTextSecondary: 'text-blue-200',
      indicator: 'bg-blue-500'
    },
    medium: {
      background: 'bg-blue-100',
      border: 'border-blue-300',
      text: 'text-blue-900',
      textSecondary: 'text-blue-700',
      darkBackground: 'bg-blue-800/30',
      darkBorder: 'border-blue-700',
      darkText: 'text-blue-50',
      darkTextSecondary: 'text-blue-100',
      indicator: 'bg-blue-600'
    },
    strong: {
      background: 'bg-blue-600',
      border: 'border-blue-600',
      text: 'text-white',
      textSecondary: 'text-blue-100',
      darkBackground: 'bg-blue-600',
      darkBorder: 'border-blue-500',
      darkText: 'text-white',
      darkTextSecondary: 'text-blue-100',
      indicator: 'bg-blue-700'
    }
  },
  green: {
    light: {
      background: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      textSecondary: 'text-green-600',
      darkBackground: 'bg-green-900/20',
      darkBorder: 'border-green-800',
      darkText: 'text-green-100',
      darkTextSecondary: 'text-green-200',
      indicator: 'bg-green-500'
    },
    medium: {
      background: 'bg-green-100',
      border: 'border-green-300',
      text: 'text-green-900',
      textSecondary: 'text-green-700',
      darkBackground: 'bg-green-800/30',
      darkBorder: 'border-green-700',
      darkText: 'text-green-50',
      darkTextSecondary: 'text-green-100',
      indicator: 'bg-green-600'
    },
    strong: {
      background: 'bg-green-600',
      border: 'border-green-600',
      text: 'text-white',
      textSecondary: 'text-green-100',
      darkBackground: 'bg-green-600',
      darkBorder: 'border-green-500',
      darkText: 'text-white',
      darkTextSecondary: 'text-green-100',
      indicator: 'bg-green-700'
    }
  },
  purple: {
    light: {
      background: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      textSecondary: 'text-purple-600',
      darkBackground: 'bg-purple-900/20',
      darkBorder: 'border-purple-800',
      darkText: 'text-purple-100',
      darkTextSecondary: 'text-purple-200',
      indicator: 'bg-purple-500'
    },
    medium: {
      background: 'bg-purple-100',
      border: 'border-purple-300',
      text: 'text-purple-900',
      textSecondary: 'text-purple-700',
      darkBackground: 'bg-purple-800/30',
      darkBorder: 'border-purple-700',
      darkText: 'text-purple-50',
      darkTextSecondary: 'text-purple-100',
      indicator: 'bg-purple-600'
    },
    strong: {
      background: 'bg-purple-600',
      border: 'border-purple-600',
      text: 'text-white',
      textSecondary: 'text-purple-100',
      darkBackground: 'bg-purple-600',
      darkBorder: 'border-purple-500',
      darkText: 'text-white',
      darkTextSecondary: 'text-purple-100',
      indicator: 'bg-purple-700'
    }
  },
  orange: {
    light: {
      background: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      textSecondary: 'text-orange-600',
      darkBackground: 'bg-orange-900/20',
      darkBorder: 'border-orange-800',
      darkText: 'text-orange-100',
      darkTextSecondary: 'text-orange-200',
      indicator: 'bg-orange-500'
    },
    medium: {
      background: 'bg-orange-100',
      border: 'border-orange-300',
      text: 'text-orange-900',
      textSecondary: 'text-orange-700',
      darkBackground: 'bg-orange-800/30',
      darkBorder: 'border-orange-700',
      darkText: 'text-orange-50',
      darkTextSecondary: 'text-orange-100',
      indicator: 'bg-orange-600'
    },
    strong: {
      background: 'bg-orange-600',
      border: 'border-orange-600',
      text: 'text-white',
      textSecondary: 'text-orange-100',
      darkBackground: 'bg-orange-600',
      darkBorder: 'border-orange-500',
      darkText: 'text-white',
      darkTextSecondary: 'text-orange-100',
      indicator: 'bg-orange-700'
    }
  },
  teal: {
    light: {
      background: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-800',
      textSecondary: 'text-teal-600',
      darkBackground: 'bg-teal-900/20',
      darkBorder: 'border-teal-800',
      darkText: 'text-teal-100',
      darkTextSecondary: 'text-teal-200',
      indicator: 'bg-teal-500'
    },
    medium: {
      background: 'bg-teal-100',
      border: 'border-teal-300',
      text: 'text-teal-900',
      textSecondary: 'text-teal-700',
      darkBackground: 'bg-teal-800/30',
      darkBorder: 'border-teal-700',
      darkText: 'text-teal-50',
      darkTextSecondary: 'text-teal-100',
      indicator: 'bg-teal-600'
    },
    strong: {
      background: 'bg-teal-600',
      border: 'border-teal-600',
      text: 'text-white',
      textSecondary: 'text-teal-100',
      darkBackground: 'bg-teal-600',
      darkBorder: 'border-teal-500',
      darkText: 'text-white',
      darkTextSecondary: 'text-teal-100',
      indicator: 'bg-teal-700'
    }
  },
  rose: {
    light: {
      background: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-800',
      textSecondary: 'text-rose-600',
      darkBackground: 'bg-rose-900/20',
      darkBorder: 'border-rose-800',
      darkText: 'text-rose-100',
      darkTextSecondary: 'text-rose-200',
      indicator: 'bg-rose-500'
    },
    medium: {
      background: 'bg-rose-100',
      border: 'border-rose-300',
      text: 'text-rose-900',
      textSecondary: 'text-rose-700',
      darkBackground: 'bg-rose-800/30',
      darkBorder: 'border-rose-700',
      darkText: 'text-rose-50',
      darkTextSecondary: 'text-rose-100',
      indicator: 'bg-rose-600'
    },
    strong: {
      background: 'bg-rose-600',
      border: 'border-rose-600',
      text: 'text-white',
      textSecondary: 'text-rose-100',
      darkBackground: 'bg-rose-600',
      darkBorder: 'border-rose-500',
      darkText: 'text-white',
      darkTextSecondary: 'text-rose-100',
      indicator: 'bg-rose-700'
    }
  }
} as const

/**
 * ニュートラルカラー定義
 */
export const neutralColors = {
  light: {
    surface: 'bg-white',
    surfaceSecondary: 'bg-gray-50',
    surfaceTertiary: 'bg-gray-100',
    border: 'border-gray-200',
    borderSecondary: 'border-gray-300',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textTertiary: 'text-gray-500',
    textMuted: 'text-gray-400'
  },
  dark: {
    surface: 'bg-gray-800',
    surfaceSecondary: 'bg-gray-700',
    surfaceTertiary: 'bg-gray-600',
    border: 'border-gray-700',
    borderSecondary: 'border-gray-600',
    text: 'text-gray-100',
    textSecondary: 'text-gray-200',
    textTertiary: 'text-gray-300',
    textMuted: 'text-gray-400'
  }
} as const

/**
 * インタラクション状態のスタイル
 */
export const interactionStyles = {
  light: {
    hover: 'hover:bg-gray-100',
    hoverSecondary: 'hover:bg-gray-200',
    focus: 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white',
    active: 'active:bg-gray-200',
    disabled: 'opacity-50 cursor-not-allowed'
  },
  dark: {
    hover: 'hover:bg-gray-700',
    hoverSecondary: 'hover:bg-gray-600',
    focus: 'focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800',
    active: 'active:bg-gray-600',
    disabled: 'opacity-50 cursor-not-allowed'
  }
} as const

/**
 * 選択状態のプロトタイプ品質スタイル
 */
export const selectionStyles = {
  light: {
    selected: 'ring-2 ring-blue-400 ring-offset-2 ring-offset-white border-blue-400 scale-[1.02] shadow-lg',
    unselected: 'border-transparent hover:border-gray-300 hover:scale-[1.01]'
  },
  dark: {
    selected: 'ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-800 border-blue-400 scale-[1.02] shadow-lg',
    unselected: 'border-transparent hover:border-gray-600 hover:scale-[1.01]'
  }
} as const

/**
 * テーマに基づく色クラスを取得
 */
export const getColorClasses = (
  color: ColorVariant,
  intensity: ColorIntensity = 'light',
  theme: ThemeMode = 'light'
) => {
  const colorConfig = colorPalette[color][intensity]
  
  if (theme === 'dark') {
    return {
      background: colorConfig.darkBackground,
      border: colorConfig.darkBorder,
      text: colorConfig.darkText,
      textSecondary: colorConfig.darkTextSecondary,
      indicator: colorConfig.indicator
    }
  }
  
  return {
    background: colorConfig.background,
    border: colorConfig.border,
    text: colorConfig.text,
    textSecondary: colorConfig.textSecondary,
    indicator: colorConfig.indicator
  }
}

/**
 * ニュートラルカラークラスを取得
 */
export const getNeutralClasses = (theme: ThemeMode = 'light') => {
  return neutralColors[theme]
}

/**
 * インタラクションスタイルを取得
 */
export const getInteractionClasses = (theme: ThemeMode = 'light') => {
  return interactionStyles[theme]
}

/**
 * 選択状態スタイルを取得
 */
export const getSelectionClasses = (isSelected: boolean, theme: ThemeMode = 'light') => {
  const styles = selectionStyles[theme]
  return isSelected ? styles.selected : styles.unselected
}

/**
 * カラーバリアントのインジケータクラスを取得
 */
export const getColorIndicator = (color: ColorVariant) => {
  return colorPalette[color].light.indicator
}

/**
 * 状態に応じたクラス名を結合
 */
export const combineClasses = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}

/**
 * プリセットスタイル：カード
 */
export const getCardStyles = (theme: ThemeMode = 'light', color?: ColorVariant, intensity: ColorIntensity = 'light') => {
  const neutral = getNeutralClasses(theme)
  const interaction = getInteractionClasses(theme)
  
  if (color) {
    const colorClasses = getColorClasses(color, intensity, theme)
    return combineClasses(
      colorClasses.background,
      colorClasses.border,
      colorClasses.text,
      'border-2 rounded-lg p-3 transition-all duration-200 ease-in-out',
      interaction.hover
    )
  }
  
  return combineClasses(
    neutral.surface,
    neutral.border,
    neutral.text,
    'border-2 rounded-lg p-3 transition-all duration-200 ease-in-out',
    interaction.hover
  )
}

/**
 * プリセットスタイル：ボタン
 */
export const getButtonStyles = (
  variant: 'primary' | 'secondary' | 'ghost' = 'secondary',
  color: ColorVariant = 'blue',
  theme: ThemeMode = 'light'
) => {
  const interaction = getInteractionClasses(theme)
  
  switch (variant) {
    case 'primary': {
      const primaryColors = getColorClasses(color, 'strong', theme)
      return combineClasses(
        primaryColors.background,
        primaryColors.text,
        'px-3 py-1 rounded transition-colors font-medium',
        'hover:opacity-90'
      )
    }
      
    case 'secondary': {
      const secondaryColors = getColorClasses(color, 'light', theme)
      return combineClasses(
        secondaryColors.background,
        secondaryColors.text,
        'px-3 py-1 rounded transition-colors',
        interaction.hover
      )
    }
      
    case 'ghost': {
      const neutral = getNeutralClasses(theme)
      return combineClasses(
        neutral.textSecondary,
        'px-3 py-1 rounded transition-colors',
        interaction.hover
      )
    }
      
    default:
      return ''
  }
}

/**
 * プリセットスタイル：入力フィールド
 */
export const getInputStyles = (theme: ThemeMode = 'light', hasError: boolean = false) => {
  const neutral = getNeutralClasses(theme)
  const interaction = getInteractionClasses(theme)
  
  const baseClasses = combineClasses(
    neutral.surface,
    neutral.border,
    neutral.text,
    'px-3 py-2 border rounded transition-colors',
    interaction.focus
  )
  
  if (hasError) {
    const errorColors = getColorClasses('rose', 'light', theme)
    return combineClasses(baseClasses, errorColors.border, errorColors.text)
  }
  
  return baseClasses
}