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
      "@": path.resolve(__dirname, "./src"),
      "@core": path.resolve(__dirname, "./src/core"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@tasklist": path.resolve(__dirname, "./src/features/tasklist"),
      "@timeline": path.resolve(__dirname, "./src/features/timeline"),
      "@template": path.resolve(__dirname, "./src/features/template"),
      "@app": path.resolve(__dirname, "./src/app"),
      "@components": path.resolve(__dirname, "./src/core/components"),
      "@hooks": path.resolve(__dirname, "./src/features/tasklist/hooks"),
      "@utils": path.resolve(__dirname, "./src/core/utils"),
      "@services": path.resolve(__dirname, "./src/core/services"),
      "@config": path.resolve(__dirname, "./src/core/config"),
      "@types": path.resolve(__dirname, "./src/core/types"),
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