import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // React Fast Refresh の設定
      fastRefresh: true,
      // JSX の自動インポート
      jsxImportSource: 'react',
    })
  ],
  
  // パスエイリアスの設定（DRY原則に基づく）
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/context': path.resolve(__dirname, './src/context'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/constants': path.resolve(__dirname, './src/constants'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/styles': path.resolve(__dirname, './src/styles'),
    }
  },

  // 開発サーバーの設定
  server: {
    port: 3000,
    host: true, // ネットワーク経由でのアクセスを許可
    open: true, // 開発サーバー起動時にブラウザを自動で開く
    strictPort: false, // ポートが使用中の場合は別のポートを使用
    cors: true, // CORS を有効化
    hmr: {
      overlay: true // エラーオーバーレイを表示
    }
  },

  // プレビューサーバーの設定
  preview: {
    port: 4173,
    host: true,
    strictPort: false
  },

  // ビルドの設定
  build: {
    outDir: 'dist',
    sourcemap: true, // ソースマップを生成
    minify: 'esbuild', // esbuild による高速な最小化
    target: 'esnext', // モダンブラウザをターゲット
    cssCodeSplit: true, // CSS コード分割を有効化
    
    // チャンク分割の設定（パフォーマンス最適化）
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        manualChunks: {
          // vendor: 外部ライブラリ
          vendor: ['react', 'react-dom'],
          // ui: UI コンポーネント
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover'],
          // utils: ユーティリティライブラリ
          utils: ['date-fns', 'clsx', 'tailwind-merge'],
        }
      }
    },
    
    // バンドルサイズ警告の閾値
    chunkSizeWarningLimit: 1000,
    
    // 圧縮設定
    reportCompressedSize: false, // ビルド時間短縮のため無効化
  },

  // CSS の設定
  css: {
    devSourcemap: true, // 開発時の CSS ソースマップ
    preprocessorOptions: {
      scss: {
        // SCSS の追加設定がある場合
      }
    },
    modules: {
      // CSS Modules の設定
      localsConvention: 'camelCase'
    }
  },

  // 環境変数の設定
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  // 依存関係の最適化
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'date-fns',
      'lucide-react',
      'clsx',
      'tailwind-merge'
    ],
    exclude: [
      // 最適化から除外するパッケージ
    ]
  },

  // 開発時のESBuild設定
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    target: 'esnext',
    jsxInject: `import React from 'react'` // JSX の自動 React インポート
  },

  // ワーカーの設定
  worker: {
    format: 'es'
  },

  // アセットの設定
  assetsInclude: ['**/*.md'],
  
  // テスト設定（Vitest）
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**'
      ]
    }
  },

  // SSG/SSR の場合の設定（将来的な拡張用）
  ssr: {
    noExternal: [
      // SSR 時に外部化しないパッケージ
    ]
  },

  // 実験的機能
  experimental: {
    // 将来的な機能のテスト用
  }
})