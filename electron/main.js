/**
 * Electronメインプロセス
 * システムプロンプト準拠：KISS原則、環境別バックエンド起動制御
 */

const { app, BrowserWindow, shell, ipcMain } = require('electron')
const { spawn } = require('child_process')
const path = require('path')

const { APP_CONFIG, PathHelper, URL_CONFIG, LOG_CONFIG, isDev } = require('./config')
const BackendChecker = require('./backend-checker')

// グローバル変数
let mainWindow = null
let splashWindow = null
let backendProcess = null
let backendChecker = null

/**
 * ログ出力ヘルパー
 * システムプロンプト準拠：DRY原則による統一ログ機能
 */
const logger = {
  info: (message) => console.log(`${new Date().toISOString()} ${LOG_CONFIG.PREFIX} [INFO] ${message}`),
  warn: (message) => console.log(`${new Date().toISOString()} ${LOG_CONFIG.PREFIX} [WARN] ${message}`),
  error: (message) => console.log(`${new Date().toISOString()} ${LOG_CONFIG.PREFIX} [ERROR] ${message}`),
  debug: (message) => {
    if (LOG_CONFIG.LEVEL === 'DEBUG') {
      console.log(`${new Date().toISOString()} ${LOG_CONFIG.PREFIX} [DEBUG] ${message}`)
    }
  }
}

/**
 * スプラッシュ画面作成
 */
function createSplashWindow() {
  logger.info('スプラッシュ画面を作成しています...')
  
  splashWindow = new BrowserWindow({
    width: APP_CONFIG.SPLASH.WIDTH,
    height: APP_CONFIG.SPLASH.HEIGHT,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  splashWindow.loadFile(PathHelper.getSplashPath())
  splashWindow.center()
  
  splashWindow.once('ready-to-show', () => {
    splashWindow.show()
    logger.info('スプラッシュ画面を表示しました')
  })

  splashWindow.on('closed', () => {
    splashWindow = null
  })
}

/**
 * メインウィンドウ作成
 */
function createMainWindow() {
  logger.debug('メインウィンドウを作成しています...')
  
  mainWindow = new BrowserWindow({
    width: APP_CONFIG.WINDOW.WIDTH,
    height: APP_CONFIG.WINDOW.HEIGHT,
    minWidth: APP_CONFIG.WINDOW.MIN_WIDTH,
    minHeight: APP_CONFIG.WINDOW.MIN_HEIGHT,
    show: false,
    webPreferences: {
      nodeIntegration: APP_CONFIG.SECURITY.NODE_INTEGRATION,
      contextIsolation: APP_CONFIG.SECURITY.CONTEXT_ISOLATION,
      enableRemoteModule: APP_CONFIG.SECURITY.ENABLE_REMOTE_MODULE,
      webSecurity: APP_CONFIG.SECURITY.WEB_SECURITY,
      preload: PathHelper.getPreloadPath()
    }
  })

  // 外部リンクをデフォルトブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.loadURL(URL_CONFIG.FRONTEND)

  mainWindow.once('ready-to-show', () => {
    // スプラッシュ画面を閉じる
    if (splashWindow) {
      splashWindow.close()
    }
    
    mainWindow.show()
    
    if (isDev && APP_CONFIG.DEV.AUTO_OPEN_DEV_TOOLS) {
      mainWindow.webContents.openDevTools()
    }
    
    if (APP_CONFIG.DEV.FOCUS_ON_SHOW) {
      mainWindow.focus()
    }
    
    logger.info('メインウィンドウを表示しました')
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

/**
 * Pythonバックエンド起動
 * システムプロンプト準拠：KISS原則による環境別処理
 */
async function startBackend() {
  // 開発環境では外部バックエンドを使用
  if (isDev && APP_CONFIG.DEV.USE_EXTERNAL_BACKEND) {
    logger.info('開発環境: 外部バックエンド (npm run dev:backend) を使用します')
    return Promise.resolve()
  }

  // 本番環境では内部バックエンドを起動
  logger.info('Pythonバックエンドを起動しています...')
  
  const scriptPath = PathHelper.getBackendScriptPath()
  const workingDir = PathHelper.getBackendWorkingDir()

  logger.debug(`Python実行ファイル: python.exe`)
  logger.debug(`スクリプトパス: ${scriptPath}`)
  logger.debug(`作業ディレクトリ: ${workingDir}`)

  return new Promise((resolve, reject) => {
    try {
      backendProcess = spawn('python.exe', [scriptPath], {
        cwd: workingDir,
        stdio: ['ignore', 'pipe', 'pipe']
      })

      backendProcess.stdout.on('data', (data) => {
        logger.debug(`Python stdout: ${data.toString().trim()}`)
      })

      backendProcess.stderr.on('data', (data) => {
        logger.warn(`Python stderr: ${data.toString().trim()}`)
      })

      backendProcess.on('error', (error) => {
        logger.error(`Pythonプロセス起動エラー: ${error.message}`)
        reject(error)
      })

      backendProcess.on('exit', (code) => {
        logger.info(`Pythonプロセスが終了しました。終了コード: ${code}`)
        backendProcess = null
      })

      // プロセス起動を即座に成功とする（ヘルスチェックで実際の起動を確認）
      resolve()
    } catch (error) {
      logger.error(`バックエンド起動失敗: ${error.message}`)
      reject(error)
    }
  })
}

/**
 * バックエンドヘルスチェック
 * システムプロンプト準拠：DRY原則による統一チェック処理
 */
async function checkBackendHealth() {
  backendChecker = new BackendChecker(logger)
  
  try {
    await backendChecker.start()
    logger.info('バックエンドの起動が確認できました')
  } catch (error) {
    logger.error('Pythonバックエンドの起動に失敗しました')
    throw error
  }
}

/**
 * アプリケーション初期化
 * システムプロンプト準拠：KISS原則による段階的初期化
 */
async function initializeApp() {
  try {
    logger.info('Electronアプリケーションを初期化しています...')
    
    // IPC通信ハンドラー設定
    setupIpcHandlers()
    
    logger.info('アプリケーション初期化が完了しました')
  } catch (error) {
    logger.error(`初期化エラー: ${error.message}`)
    throw error
  }
}

/**
 * IPC通信ハンドラー設定
 */
function setupIpcHandlers() {
  // 将来の拡張用（現在は空実装）
  logger.debug('IPC通信ハンドラーを設定しました')
}

/**
 * アプリケーション起動
 * システムプロンプト準拠：YAGNI原則による必要最小限の起動処理
 */
async function startApplication() {
  try {
    // スプラッシュ画面表示
    createSplashWindow()
    
    // バックエンド起動（環境別）
    await startBackend()
    
    // バックエンドヘルスチェック
    await checkBackendHealth()
    
    // メインウィンドウ作成
    createMainWindow()
    
  } catch (error) {
    logger.error('アプリケーションの起動に失敗しました')
    logger.error(error.message)
    
    // スプラッシュ画面を閉じる
    if (splashWindow) {
      splashWindow.close()
    }
    
    // アプリケーション終了
    app.quit()
  }
}

/**
 * バックエンドプロセス停止
 */
function stopBackend() {
  if (backendProcess) {
    logger.info('Pythonバックエンドを停止しています...')
    backendProcess.kill('SIGTERM')
    backendProcess = null
  }
  
  if (backendChecker) {
    backendChecker.stop()
    backendChecker = null
  }
}

// Electronイベントハンドラー
app.whenReady().then(async () => {
  logger.info('Electronアプリケーションの準備が完了しました')
  
  try {
    await initializeApp()
    await startApplication()
  } catch (error) {
    logger.error(`アプリケーション起動エラー: ${error.message}`)
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})

app.on('before-quit', (event) => {
  logger.info('アプリケーションを終了しています...')
  stopBackend()
})

// プロセス終了時のクリーンアップ
process.on('exit', () => {
  stopBackend()
})

process.on('SIGINT', () => {
  app.quit()
})

process.on('SIGTERM', () => {
  app.quit()
})