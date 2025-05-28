import React from 'react'
import ReactDOM from 'react-dom/client'
import TodoApp from './TodoApp'
import './styles/globals.css'

// React 18のconcurrent modeに対応
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found. Make sure you have a <div id="root"></div> in your HTML.')
}

const root = ReactDOM.createRoot(rootElement)

// エラーハンドリングを強化
try {
  root.render(
    <React.StrictMode>
      <TodoApp />
    </React.StrictMode>
  )
} catch (error) {
  console.error('Failed to render TodoApp:', error)
  
  // フォールバック UI を表示
  root.render(
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      flexDirection: 'column',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#ef4444'
    }}>
      <h1>アプリケーション初期化エラー</h1>
      <p>アプリケーションの起動に失敗しました。ページを再読み込みしてください。</p>
      <button 
        onClick={() => window.location.reload()}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer'
        }}
      >
        再読み込み
      </button>
    </div>
  )
}

// Hot Module Replacement (HMR) for development
if (import.meta.hot) {
  import.meta.hot.accept('./TodoApp', (newModule) => {
    if (newModule) {
      try {
        root.render(
          <React.StrictMode>
            <newModule.default />
          </React.StrictMode>
        )
      } catch (hmrError) {
        console.error('HMR update failed:', hmrError)
      }
    }
  })
}

// サービスワーカーの登録（オフライン対応）
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('SW registered: ', registration)
    } catch (registrationError) {
      console.log('SW registration failed: ', registrationError)
    }
  })
}

// 未処理のエラーをキャッチ（強化）
window.addEventListener('error', (event) => {
  console.error('Global error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  })
  
  // エラー報告サービスに送信（将来実装）
  if (import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true') {
    // sendErrorReport(event.error)
  }
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', {
    reason: event.reason,
    promise: event.promise
  })
  
  // Promise の未処理拒否もエラー報告
  if (import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true') {
    // sendErrorReport(event.reason)
  }
})

// リソース読み込みエラーのキャッチ
window.addEventListener('error', (event) => {
  if (event.target !== window) {
    console.error('Resource loading error:', {
      element: event.target,
      source: (event.target as any)?.src || (event.target as any)?.href,
      message: 'Failed to load resource'
    })
  }
}, true)

// パフォーマンス監視（開発環境のみ）
if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_MODE === 'true') {
  // パフォーマンス測定
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.duration > 100) { // 100ms以上の処理のみログ出力
        console.log(`Performance: ${entry.name}: ${entry.duration.toFixed(2)}ms`)
      }
    })
  })
  
  try {
    observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] })
  } catch (observerError) {
    console.warn('Performance observer not supported:', observerError)
  }

  // メモリ使用量の監視
  if ('memory' in performance) {
    setInterval(() => {
      const memory = (performance as any).memory
      if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB以上
        console.warn('High memory usage:', {
          used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
        })
      }
    }, 30000) // 30秒間隔
  }
}

// アプリケーション情報をコンソールに出力
console.log(`%c統合プロジェクト管理アプリケーション %cv${import.meta.env.VITE_APP_VERSION || '1.0.0'}`, 
  'color: #3b82f6; font-weight: bold; font-size: 16px;',
  'color: #6b7280; font-size: 12px;'
)

if (import.meta.env.DEV) {
  console.log('🚀 Development mode enabled')
  console.log('📊 Debug mode:', import.meta.env.VITE_DEBUG_MODE === 'true' ? 'ON' : 'OFF')
  console.log('🔥 HMR enabled')
}