import React from 'react'
import ReactDOM from 'react-dom/client'
import TodoApp from './TodoApp'
import './styles/globals.css'

// React 18のconcurrent modeに対応
const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <TodoApp />
  </React.StrictMode>
)

// Hot Module Replacement (HMR) for development
if (import.meta.hot) {
  import.meta.hot.accept()
}

// サービスワーカーの登録（オフライン対応）
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// 未処理のエラーをキャッチ
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  // ここでエラー報告サービスに送信することも可能
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  // Promiseの未処理拒否をキャッチ
})

// パフォーマンス監視
if (import.meta.env.DEV) {
  // 開発環境でのパフォーマンス測定
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      console.log(`${entry.name}: ${entry.duration}ms`)
    })
  })
  
  observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] })
}