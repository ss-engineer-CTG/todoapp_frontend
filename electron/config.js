/**
 * Electron設定管理モジュール
 * システムプロンプト準拠：DRY原則による設定一元化、環境判定対応
 */

const path = require('path')

// システムプロンプト準拠：パス結合専用関数
function joinPath(...segments) {
  return path.join(...segments)
}

// 開発環境判定
const isDev = process.env.NODE_ENV === 'development'

// アプリケーション設定
const APP_CONFIG = {
  // ポート設定
  PORTS: {
    FRONTEND: 3000,
    BACKEND: 8000
  },

  // 開発環境設定（システムプロンプト準拠：KISS原則）
  DEV: {
    USE_EXTERNAL_BACKEND: true,  // 開発環境では外部バックエンドを使用
    AUTO_OPEN_DEV_TOOLS: true,
    FOCUS_ON_SHOW: true
  },

  // パス設定
  PATHS: {
    BACKEND_SCRIPT: 'app.py',
    BACKEND_DIR: 'backend',
    FRONTEND_DIST: joinPath('frontend', 'dist'),
    FRONTEND_INDEX: 'index.html',
    ASSETS: 'assets',
    SPLASH: 'splash.html'
  },

  // ウィンドウ設定
  WINDOW: {
    WIDTH: 1400,
    HEIGHT: 900,
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600,
    SHOW_DEV_TOOLS: isDev
  },

  // スプラッシュ画面設定
  SPLASH: {
    WIDTH: 400,
    HEIGHT: 300,
    SHOW_DURATION: 2000 // 最小表示時間（ミリ秒）
  },

  // バックエンド設定（環境別）
  BACKEND: {
    STARTUP_TIMEOUT: 30000, // 30秒
    HEALTH_CHECK_INTERVAL: 1000, // 1秒間隔
    MAX_RETRIES: 30,
    HEALTH_ENDPOINT: '/api/health',
    // システムプロンプト準拠：YAGNI原則による環境判定
    START_INTERNAL_PROCESS: !isDev  // 開発環境では内部プロセスを起動しない
  },

  // セキュリティ設定
  SECURITY: {
    NODE_INTEGRATION: false,
    CONTEXT_ISOLATION: true,
    ENABLE_REMOTE_MODULE: false,
    WEB_SECURITY: true
  }
}

// パス解決ヘルパー関数
const PathHelper = {
  /**
   * アセットファイルのパス取得
   */
  getAssetPath: (filename) => {
    return joinPath(__dirname, APP_CONFIG.PATHS.ASSETS, filename)
  },

  /**
   * スプラッシュファイルのパス取得
   */
  getSplashPath: () => {
    return joinPath(__dirname, APP_CONFIG.PATHS.SPLASH)
  },

  /**
   * プリロードスクリプトのパス取得
   */
  getPreloadPath: () => {
    return joinPath(__dirname, 'preload.js')
  },

  /**
   * バックエンドスクリプトのパス取得（環境別）
   */
  getBackendScriptPath: () => {
    return isDev 
      ? joinPath(__dirname, '..', APP_CONFIG.PATHS.BACKEND_DIR, APP_CONFIG.PATHS.BACKEND_SCRIPT)
      : joinPath(process.resourcesPath, APP_CONFIG.PATHS.BACKEND_DIR, APP_CONFIG.PATHS.BACKEND_SCRIPT)
  },

  /**
   * バックエンド作業ディレクトリのパス取得（環境別）
   */
  getBackendWorkingDir: () => {
    return isDev 
      ? joinPath(__dirname, '..', APP_CONFIG.PATHS.BACKEND_DIR)
      : joinPath(process.resourcesPath, APP_CONFIG.PATHS.BACKEND_DIR)
  },

  /**
   * フロントエンドURLの取得
   */
  getFrontendUrl: () => {
    return isDev 
      ? `http://localhost:${APP_CONFIG.PORTS.FRONTEND}`
      : `file://${joinPath(__dirname, '..', APP_CONFIG.PATHS.FRONTEND_DIST, APP_CONFIG.PATHS.FRONTEND_INDEX)}`
  }
}

// URL設定（環境判定対応）
const URL_CONFIG = {
  FRONTEND: PathHelper.getFrontendUrl(),
  BACKEND_BASE: `http://localhost:${APP_CONFIG.PORTS.BACKEND}`,
  BACKEND_HEALTH: `http://localhost:${APP_CONFIG.PORTS.BACKEND}${APP_CONFIG.BACKEND.HEALTH_ENDPOINT}`,
  
  // 許可するオリジン（セキュリティ用）
  ALLOWED_ORIGINS: [
    `http://localhost:${APP_CONFIG.PORTS.FRONTEND}`,
    'file:'
  ]
}

// ログ設定
const LOG_CONFIG = {
  LEVEL: isDev ? 'DEBUG' : 'INFO',
  PREFIX: '[TodoApp]',
  TIMESTAMP: true
}

module.exports = {
  APP_CONFIG,
  PathHelper,
  URL_CONFIG,
  LOG_CONFIG,
  isDev,
  joinPath
}