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
    host: true,
    open: true,
    strictPort: false,
    cors: true,
    hmr: {
      overlay: true
    }
  },

  // プレビューサーバーの設定
  preview: {
    port: 4173,
    host: true,
    strictPort: false
  },

  // ビルドの設定（最適化）
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'esnext',
    cssCodeSplit: true,
    
    // チャンク分割の最適化
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        manualChunks: {
          // React 関連
          'react-vendor': ['react', 'react-dom'],
          // UI ライブラリ
          'ui-vendor': [
            '@radix-ui/react-dialog', 
            '@radix-ui/react-dropdown-menu', 
            '@radix-ui/react-popover',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-slot',
            '@radix-ui/react-label'
          ],
          // ユーティリティライブラリ
          'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          // アイコン
          'icons': ['lucide-react'],
          // カレンダー
          'calendar': ['react-day-picker']
        }
      }
    },
    
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
  },

  // CSS の設定
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "src/styles/variables.scss";`
      }
    },
    modules: {
      localsConvention: 'camelCase'
    }
  },

  // 環境変数の設定
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
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
      'tailwind-merge',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-slot',
      '@radix-ui/react-label',
      'react-day-picker'
    ],
    exclude: []
  },

  // 開発時のESBuild設定
  esbuild: {
    logOverride: { 
      'this-is-undefined-in-esm': 'silent' 
    },
    target: 'esnext',
    jsxInject: `import React from 'react'`
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
  }
})