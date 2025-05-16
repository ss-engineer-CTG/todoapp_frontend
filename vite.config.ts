import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
  },
  server: {
    port: 3000,
    host: true,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Electron に組み込む場合のために最適化を調整
    target: 'esnext',
    minify: 'esbuild',
  },
  // 開発時に CORS エラーが発生する場合のプロキシ設定
  // proxy: {
  //   '/api': {
  //     target: 'http://localhost:8000',
  //     changeOrigin: true,
  //     rewrite: (path) => path.replace(/^\/api/, '')
  //   }
  // }
});