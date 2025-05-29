// TypeScript化されたプリロードスクリプト
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// セキュアなAPI公開
contextBridge.exposeInMainWorld('electronAPI', {
  // アプリケーション情報
  getVersion: () => process.versions,
  getPlatform: () => process.platform,
  
  // ウィンドウ操作
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  
  // ファイルシステム操作
  openFile: () => ipcRenderer.invoke('dialog-open-file'),
  saveFile: (data: any) => ipcRenderer.invoke('dialog-save-file', data),
  
  // システム情報
  getSystemInfo: () => ipcRenderer.invoke('system-info'),
  
  // ログ出力
  log: (level: string, message: string) => ipcRenderer.invoke('log', level, message),
})

// イベントリスナー
contextBridge.exposeInMainWorld('electronEvents', {
  // メニューイベント
  onMenuNewProject: (callback: () => void) => {
    ipcRenderer.on('menu-new-project', callback)
  },
  
  // リスナー削除
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
})

// 開発環境用デバッグAPI
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('electronDebug', {
    openDevTools: () => ipcRenderer.invoke('dev-tools-open'),
    reloadWindow: () => ipcRenderer.invoke('window-reload'),
    getElectronVersion: () => process.versions.electron,
    getNodeVersion: () => process.versions.node,
    getChromeVersion: () => process.versions.chrome,
  })
}

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

// DOM準備完了
document.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.invoke('renderer-ready')
  
  if (process.env.NODE_ENV === 'development') {
    window.isDev = true
  }
})

// 型定義
declare global {
  interface Window {
    electronAPI: {
      getVersion: () => NodeJS.ProcessVersions
      getPlatform: () => string
      minimizeWindow: () => Promise<void>
      maximizeWindow: () => Promise<void>
      closeWindow: () => Promise<void>
      openFile: () => Promise<string | null>
      saveFile: (data: any) => Promise<string | null>
      getSystemInfo: () => Promise<any>
      log: (level: string, message: string) => Promise<void>
    }
    electronEvents: {
      onMenuNewProject: (callback: () => void) => void
      removeAllListeners: (channel: string) => void
    }
    electronDebug?: {
      openDevTools: () => Promise<void>
      reloadWindow: () => Promise<void>
      getElectronVersion: () => string
      getNodeVersion: () => string
      getChromeVersion: () => string
    }
    isDev?: boolean
  }
}