const { contextBridge, ipcRenderer } = require('electron')

// セキュアなAPIをレンダラープロセスに公開
contextBridge.exposeInMainWorld('electronAPI', {
  // アプリケーション情報
  getVersion: () => process.versions,
  getPlatform: () => process.platform,
  
  // ウィンドウ操作
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  
  // ファイルシステム操作（必要に応じて）
  openFile: () => ipcRenderer.invoke('dialog-open-file'),
  saveFile: (data) => ipcRenderer.invoke('dialog-save-file', data),
  
  // 設定管理
  getConfig: () => ipcRenderer.invoke('config-get'),
  setConfig: (config) => ipcRenderer.invoke('config-set', config),
  
  // 通知
  showNotification: (title, message) => ipcRenderer.invoke('notification-show', title, message),
  
  // システム情報
  getSystemInfo: () => ipcRenderer.invoke('system-info'),
  
  // ログ出力
  log: (level, message) => ipcRenderer.invoke('log', level, message),
})

// IPCレンダラー側のリスナー（必要に応じて）
contextBridge.exposeInMainWorld('electronEvents', {
  // アプリケーションイベント
  onAppReady: (callback) => ipcRenderer.on('app-ready', callback),
  onAppClose: (callback) => ipcRenderer.on('app-close', callback),
  
  // ウィンドウイベント
  onWindowFocus: (callback) => ipcRenderer.on('window-focus', callback),
  onWindowBlur: (callback) => ipcRenderer.on('window-blur', callback),
  
  // カスタムイベント
  onDataUpdate: (callback) => ipcRenderer.on('data-update', callback),
})

// 開発環境でのデバッグ用
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('electronDebug', {
    openDevTools: () => ipcRenderer.invoke('dev-tools-open'),
    reloadWindow: () => ipcRenderer.invoke('window-reload'),
    getElectronVersion: () => process.versions.electron,
    getNodeVersion: () => process.versions.node,
    getChromeVersion: () => process.versions.chrome,
  })
}

// セキュリティログ（不正なアクセス試行を検知）
const originalConsoleLog = console.log
console.log = (...args) => {
  // レンダラープロセスでのログをメインプロセスに送信
  ipcRenderer.invoke('security-log', 'console.log', args)
  originalConsoleLog.apply(console, args)
}

// DOM準備完了後の処理
document.addEventListener('DOMContentLoaded', () => {
  // レンダラープロセス準備完了をメインプロセスに通知
  ipcRenderer.invoke('renderer-ready')
  
  // 開発環境での追加設定
  if (process.env.NODE_ENV === 'development') {
    // 開発者向けのヘルパー関数をグローバルに追加
    window.isDev = true
    window.electronAPI = window.electronAPI
  }
})

// エラーハンドリング
window.addEventListener('error', (event) => {
  ipcRenderer.invoke('renderer-error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error ? event.error.stack : null
  })
})

window.addEventListener('unhandledrejection', (event) => {
  ipcRenderer.invoke('renderer-unhandled-rejection', {
    reason: event.reason,
    promise: event.promise
  })
})

// パフォーマンス監視
if (typeof PerformanceObserver !== 'undefined') {
  const perfObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        ipcRenderer.invoke('performance-metric', {
          type: 'navigation',
          loadTime: entry.loadEventEnd - entry.loadEventStart,
          domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart
        })
      }
    }
  })
  
  perfObserver.observe({ entryTypes: ['navigation'] })
}