export default {
    plugins: {
      // Tailwind CSS
      tailwindcss: {},
      
      // Autoprefixer - ベンダープレフィックスの自動付与
      autoprefixer: {
        // ブラウザサポート設定（package.json の browserslist を参照）
        // 特定の設定が必要な場合はここでオーバーライド可能
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
              // 設定オプション
              discardComments: {
                removeAll: true, // すべてのコメントを削除
              },
              normalizeWhitespace: true, // 空白の正規化
              minifySelectors: true, // セレクターの最小化
              mergeRules: true, // ルールのマージ
              mergeLonghand: true, // 短縮記法への変換
              discardDuplicates: true, // 重複ルールの削除
              discardEmpty: true, // 空のルールの削除
              calc: true, // calc() の計算
              colormin: true, // カラー値の最小化
              convertValues: true, // 値の変換
              discardUnused: false, // 未使用CSSの削除（false推奨）
              minifyFontValues: true, // フォント値の最小化
              minifyParams: true, // パラメータの最小化
              normalizeCharset: true, // charset の正規化
              normalizeDisplayValues: true, // display 値の正規化
              normalizePositions: true, // position 値の正規化
              normalizeRepeatStyle: true, // repeat スタイルの正規化
              normalizeString: true, // 文字列の正規化
              normalizeTimingFunctions: true, // timing-function の正規化
              normalizeUnicode: true, // Unicode の正規化
              normalizeUrl: true, // URL の正規化
              orderedValues: true, // 値の順序最適化
              reduceIdents: false, // 識別子の削減（アニメーション名等に影響するため無効）
              reduceInitial: true, // initial 値の削減
              reduceTransforms: true, // transform の削減
              svgo: true, // SVG の最適化
              uniqueSelectors: true, // セレクターの重複削除
              zindex: false, // z-index の最適化（副作用があるため無効）
            }
          ]
        },
  
        // PurgeCSS - 未使用CSSの削除（オプション）
        // '@fullhuman/postcss-purgecss': {
        //   content: [
        //     './index.html',
        //     './src/**/*.{vue,js,ts,jsx,tsx}'
        //   ],
        //   defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
        //   safelist: {
        //     standard: [
        //       'html', 'body',
        //       /^(.*?):/, // 擬似クラス・擬似要素
        //       /^(.*?)(\[.*?\])/, // 属性セレクタ
        //     ],
        //     deep: [
        //       /^project-/, // プロジェクトカラー関連
        //       /^status-/, // ステータス関連
        //       /^priority-/, // 優先度関連
        //     ],
        //     greedy: [
        //       /^animate-/, // アニメーション
        //       /^transition-/, // トランジション
        //     ]
        //   }
        // }
      } : {}),
  
      // PostCSS Preset Env - 将来のCSS機能を現在のブラウザで使用可能に
      'postcss-preset-env': {
        stage: 2, // Stage 2 の機能を有効化
        features: {
          'nesting-rules': true, // CSS ネスト
          'custom-media-queries': true, // カスタムメディアクエリ
          'custom-properties': true, // CSS カスタムプロパティ
          'color-function': true, // color() 関数
          'logical-properties-and-values': true, // 論理プロパティ
        },
        // ブラウザサポート設定
        browsers: 'last 2 versions',
        // 自動でプレフィックスを付与
        autoprefixer: {
          grid: true
        }
      },
  
      // PostCSS Import - @import の処理
      'postcss-import': {
        // インポートパスの解決
        resolve: (id, basedir) => {
          // node_modules からのインポートを許可
          if (id.startsWith('~')) {
            return id.substring(1)
          }
          return id
        }
      },
  
      // PostCSS URL - url() の処理
      'postcss-url': {
        // アセットの処理方法
        url: 'rebase' // 相対パスを調整
      },
  
      // PostCSS Mixins - CSS ミックスイン（オプション）
      // 'postcss-mixins': {
      //   mixinsDir: path.join(__dirname, 'src/styles/mixins')
      // },
  
      // PostCSS Nested - CSS ネスト記法のサポート
      'postcss-nested': {},
  
      // PostCSS Custom Properties - CSS カスタムプロパティのフォールバック
      'postcss-custom-properties': {
        preserve: true, // 元のカスタムプロパティも保持
        importFrom: [
          // カスタムプロパティの定義ファイル
          'src/styles/properties.css'
        ]
      },
    }
  }