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
      "@components": path.resolve(__dirname, "./src/components"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@config": path.resolve(__dirname, "./src/config"),
      "@types": path.resolve(__dirname, "./src/types"),
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