import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// システムプロンプト準拠: パス設定の一元管理
const APP_CONFIG = {
  PORTS: {
    FRONTEND: 3000,
    BACKEND: 8000,
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 基本パス
      "@": path.resolve(__dirname, "./src"),
      
      // コアモジュール（統合エイリアス）
      "@core": path.resolve(__dirname, "./src/core"),
      
      // 機能別モジュール
      "@tasklist": path.resolve(__dirname, "./src/features/tasklist"),
      "@timeline": path.resolve(__dirname, "./src/features/timeline"),
      "@daily-focus": path.resolve(__dirname, "./src/features/daily-focus"),
      "@app": path.resolve(__dirname, "./src/app"),
      
      // UIコンポーネント系（shadcn/ui 互換）
      "@/lib/utils": path.resolve(__dirname, "./src/core/utils"),
      "@/components/ui": path.resolve(__dirname, "./src/core/components/ui"),
    },
  },
  server: {
    port: APP_CONFIG.PORTS.FRONTEND,
    proxy: {
      '/api': {
        target: `http://localhost:${APP_CONFIG.PORTS.BACKEND}`,
        changeOrigin: true,
      }
    }
  }
})