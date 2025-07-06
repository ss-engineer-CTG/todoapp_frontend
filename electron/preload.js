/**
 * Electronプリロードスクリプト（改善版）
 * システムプロンプト準拠：セキュアなAPI設計、必要最小限の機能実装
 */

const { contextBridge, ipcRenderer } = require('electron')

// セキュアなAPIをレンダラープロセスに公開
contextBridge.exposeInMainWorld('electronAPI', {
  // ===== システム情報 =====
  
  /**
   * アプリケーションバージョン情報取得
   */
  getVersion: async () => {
    try {
      return await ipcRenderer.invoke('app-get-version')
    } catch (error) {
      console.error('Failed to get version:', error)
      return {
        app: 'unknown',
        electron: 'unknown',
        node: 'unknown',
        chrome: 'unknown'
      }
    }
  },

  /**
   * プラットフォーム情報取得
   */
  getPlatform: () => {
    return {
      os: process.platform,
      arch: process.arch,
      isWindows: process.platform === 'win32',
      isMac: process.platform === 'darwin',
      isLinux: process.platform === 'linux'
    }
  },

  // ===== アプリケーション制御 =====

  /**
   * アプリケーション終了
   */
  closeApp: async () => {
    try {
      return await ipcRenderer.invoke('app-close')
    } catch (error) {
      console.error('Failed to close app:', error)
      return false
    }
  },

  /**
   * ウィンドウ最小化
   */
  minimizeWindow: async () => {
    try {
      return await ipcRenderer.invoke('app-minimize')
    } catch (error) {
      console.error('Failed to minimize window:', error)
      return false
    }
  },

  /**
   * ウィンドウ最大化/復元切り替え
   */
  toggleMaximize: async () => {
    try {
      return await ipcRenderer.invoke('app-maximize')
    } catch (error) {
      console.error('Failed to toggle maximize:', error)
      return false
    }
  },

  // ===== バックエンド監視 =====

  /**
   * バックエンドの状態取得
   */
  getBackendStatus: async () => {
    try {
      return await ipcRenderer.invoke('backend-get-status')
    } catch (error) {
      console.error('Failed to get backend status:', error)
      return {
        isHealthy: false,
        hasProcess: false,
        uptime: 0
      }
    }
  },

  // ===== 設定管理 =====

  /**
   * 設定保存
   */
  saveSettings: async (data) => {
    try {
      return await ipcRenderer.invoke('settings-save', data)
    } catch (error) {
      console.error('Failed to save settings:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * 設定読み込み
   */
  loadSettings: async () => {
    try {
      return await ipcRenderer.invoke('settings-load')
    } catch (error) {
      console.error('Failed to load settings:', error)
      return {}
    }
  },

  // ===== ダイアログ表示 =====

  /**
   * メッセージダイアログ表示
   */
  showMessageDialog: async (options) => {
    try {
      return await ipcRenderer.invoke('dialog-show-message', options)
    } catch (error) {
      console.error('Failed to show message dialog:', error)
      return { response: -1, checkboxChecked: false }
    }
  },

  /**
   * エラーダイアログ表示（ヘルパー）
   */
  showError: async (title, message, detail = null) => {
    const options = {
      type: 'error',
      title: title || 'エラー',
      message: message || '予期しないエラーが発生しました',
      detail: detail,
      buttons: ['OK']
    }
    return await ipcRenderer.invoke('dialog-show-message', options)
  },

  /**
   * 確認ダイアログ表示（ヘルパー）
   */
  showConfirm: async (title, message, detail = null) => {
    const options = {
      type: 'question',
      title: title || '確認',
      message: message || '実行してもよろしいですか？',
      detail: detail,
      buttons: ['キャンセル', 'OK'],
      defaultId: 1,
      cancelId: 0
    }
    const result = await ipcRenderer.invoke('dialog-show-message', options)
    return result.response === 1 // OKが押された場合true
  },

  // ===== ユーティリティ =====

  /**
   * Electron環境かどうかの判定
   */
  isElectron: () => {
    return true
  },

  /**
   * 開発環境かどうかの判定
   */
  isDev: () => {
    return process.env.NODE_ENV === 'development'
  }
})

// 開発環境専用のAPI
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('electronDebug', {
    /**
     * 詳細なバージョン情報
     */
    getDetailedVersions: () => {
      return {
        electron: process.versions.electron,
        node: process.versions.node,
        chrome: process.versions.chrome,
        v8: process.versions.v8,
        openssl: process.versions.openssl
      }
    },

    /**
     * 環境変数取得
     */
    getEnvironment: () => {
      return {
        NODE_ENV: process.env.NODE_ENV,
        platform: process.platform,
        arch: process.arch
      }
    },

    /**
     * プロセス情報
     */
    getProcessInfo: () => {
      return {
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.getProcessMemoryInfo ? process.getProcessMemoryInfo() : null
      }
    }
  })
}

// DOM準備完了後の初期化処理
document.addEventListener('DOMContentLoaded', () => {
  // 開発環境でのデバッグ情報設定
  if (process.env.NODE_ENV === 'development') {
    window.isDev = true
    console.log('[Electron] Development mode enabled')
    console.log('[Electron] Platform:', process.platform)
    console.log('[Electron] Electron version:', process.versions.electron)
  }

  // グローバルエラーハンドラー設定
  window.addEventListener('error', (event) => {
    console.error('[Renderer Process Error]:', event.error)
  })

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Renderer Process Unhandled Rejection]:', event.reason)
  })
})

// セキュリティ強化：グローバル汚染防止
Object.freeze(window.electronAPI)
if (window.electronDebug) {
  Object.freeze(window.electronDebug)
}