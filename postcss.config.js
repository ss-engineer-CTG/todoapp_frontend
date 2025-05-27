export default {
  plugins: {
    // Tailwind CSS
    tailwindcss: {},
    
    // Autoprefixer - ベンダープレフィックスの自動付与
    autoprefixer: {
      // ブラウザサポート設定
      overrideBrowserslist: [
        "> 1%",
        "last 2 versions",
        "not dead",
        "not ie 11"
      ],
      // グリッドレイアウトのサポート
      grid: 'autoplace',
      // flexboxのサポート
      flexbox: 'no-2009'
    },

    // CSS の最適化（本番ビルド時のみ）
    ...(process.env.NODE_ENV === 'production' ? {
      // CSSnano - CSS の最小化
      cssnano: {
        preset: [
          'default',
          {
            // 基本的な最適化設定
            discardComments: {
              removeAll: true,
            },
            normalizeWhitespace: true,
            minifySelectors: true,
            mergeRules: true,
            mergeLonghand: true,
            discardDuplicates: true,
            discardEmpty: true,
            calc: true,
            colormin: true,
            convertValues: true,
            discardUnused: false, // 安全のため無効
            reduceIdents: false, // アニメーション名等に影響するため無効
            zindex: false, // 副作用があるため無効
          }
        ]
      },
    } : {}),
  }
}