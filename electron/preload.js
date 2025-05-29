const { contextBridge, ipcRenderer } = require('electron')

// セキュアなAPIをレンダラープロセスに公開
contextBridge.exposeInMainWorld('electronAPI', {
  // アプリケーション情報
  getVersion: () => process.versions,
  getPlatform: () => process.platform,
})

// 開発環境でのデバッグ用
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('electronDebug', {
    getElectronVersion: () => process.versions.electron,
    getNodeVersion: () => process.versions.node,
    getChromeVersion: () => process.versions.chrome,
  })
}

// DOM準備完了後の処理
document.addEventListener('DOMContentLoaded', () => {
  if (process.env.NODE_ENV === 'development') {
    window.isDev = true
    window.electronAPI = window.electronAPI
  }
})