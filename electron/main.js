/**
 * Electronメインプロセス（改善版）
 * システムプロンプト準拠：KISS原則、DRY原則、適切なエラーハンドリング
 */

const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron')
const { APP_CONFIG, PathHelper, URL_CONFIG, LOG_CONFIG, isDev } = require('./config')
const { backendChecker } = require('./backend-checker')

class TodoAppMain {
  constructor() {
    this.mainWindow = null
    this.splashWindow = null
    this.isQuitting = false
    this.appStartTime = Date.now()
  }

  /**
   * ログ出力ヘルパー
   */
  log(level, message, error = null) {
    const timestamp = LOG_CONFIG.TIMESTAMP ? new Date().toISOString() : ''
    const prefix = LOG_CONFIG.PREFIX
    const fullMessage = `${timestamp} ${prefix} [${level}] ${message}`
    
    if (level === 'ERROR') {
      console.error(fullMessage)
      if (error) console.error(error)
    } else if (level === 'WARN') {
      console.warn(fullMessage)
    } else {
      console.log(fullMessage)
    }
  }

  /**
   * アプリケーション初期化
   */
  async initialize() {
    this.log('INFO', 'Electronアプリケーションを初期化しています...')
    
    try {
      // IPC通信ハンドラー設定
      this.setupIpcHandlers()
      
      // アプリケーションイベント設定
      this.setupAppEvents()
      
      this.log('INFO', 'アプリケーション初期化が完了しました')
    } catch (error) {
      this.log('ERROR', 'アプリケーション初期化に失敗しました', error)
      throw error
    }
  }

  /**
   * スプラッシュウィンドウ作成
   */
  createSplashWindow() {
    this.log('INFO', 'スプラッシュ画面を作成しています...')
    
    try {
      this.splashWindow = new BrowserWindow({
        width: APP_CONFIG.SPLASH.WIDTH,
        height: APP_CONFIG.SPLASH.HEIGHT,
        frame: false,
        alwaysOnTop: true,
        center: true,
        resizable: false,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          enableRemoteModule: false,
          webSecurity: true
        },
        icon: PathHelper.getAssetPath('icon.png')
      })

      // スプラッシュ画面読み込み
      this.splashWindow.loadFile(PathHelper.getSplashPath())

      // 準備完了時に表示
      this.splashWindow.once('ready-to-show', () => {
        this.splashWindow.show()
        this.log('INFO', 'スプラッシュ画面を表示しました')
      })

      // エラーハンドリング
      this.splashWindow.on('closed', () => {
        this.splashWindow = null
      })

    } catch (error) {
      this.log('ERROR', 'スプラッシュ画面の作成に失敗しました', error)
      // スプラッシュ画面なしでも継続
    }
  }

  /**
   * メインウィンドウ作成
   */
  createMainWindow() {
    this.log('INFO', 'メインウィンドウを作成しています...')
    
    try {
      this.mainWindow = new BrowserWindow({
        width: APP_CONFIG.WINDOW.WIDTH,
        height: APP_CONFIG.WINDOW.HEIGHT,
        minWidth: APP_CONFIG.WINDOW.MIN_WIDTH,
        minHeight: APP_CONFIG.WINDOW.MIN_HEIGHT,
        show: false, // 準備完了まで非表示
        webPreferences: {
          nodeIntegration: APP_CONFIG.SECURITY.NODE_INTEGRATION,
          contextIsolation: APP_CONFIG.SECURITY.CONTEXT_ISOLATION,
          enableRemoteModule: APP_CONFIG.SECURITY.ENABLE_REMOTE_MODULE,
          preload: PathHelper.getPreloadPath(),
          webSecurity: APP_CONFIG.SECURITY.WEB_SECURITY
        },
        icon: PathHelper.getAssetPath('icon.png'),
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
      })

      // フロントエンド読み込み
      this.mainWindow.loadURL(URL_CONFIG.FRONTEND)

      // 開発環境設定
      if (isDev && APP_CONFIG.DEV.AUTO_OPEN_DEV_TOOLS) {
        this.mainWindow.webContents.openDevTools()
      }

      // ウィンドウイベント設定
      this.setupMainWindowEvents()

      // セキュリティ設定
      this.setupSecurityHandlers()

      this.log('INFO', 'メインウィンドウを作成しました')

    } catch (error) {
      this.log('ERROR', 'メインウィンドウの作成に失敗しました', error)
      throw error
    }
  }

  /**
   * メインウィンドウイベント設定
   */
  setupMainWindowEvents() {
    // 準備完了時の処理
    this.mainWindow.once('ready-to-show', () => {
      // スプラッシュ画面を閉じる
      if (this.splashWindow) {
        this.splashWindow.close()
        this.splashWindow = null
      }

      // メインウィンドウを表示
      this.mainWindow.show()

      if (isDev && APP_CONFIG.DEV.FOCUS_ON_SHOW) {
        this.mainWindow.focus()
      }

      const totalTime = Date.now() - this.appStartTime
      this.log('INFO', `アプリケーションの起動が完了しました (${totalTime}ms)`)
    })

    // 閉じる時の処理
    this.mainWindow.on('closed', () => {
      this.mainWindow = null
    })

    // 最小化前の処理
    this.mainWindow.on('minimize', () => {
      this.log('DEBUG', 'ウィンドウが最小化されました')
    })

    // 復元時の処理
    this.mainWindow.on('restore', () => {
      this.log('DEBUG', 'ウィンドウが復元されました')
    })
  }

  /**
   * セキュリティハンドラー設定
   */
  setupSecurityHandlers() {
    // 外部リンクの処理
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      this.log('INFO', `外部リンクを開きます: ${url}`)
      shell.openExternal(url)
      return { action: 'deny' }
    })

    // ナビゲーション制御
    this.mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
      const isAllowed = URL_CONFIG.ALLOWED_ORIGINS.some(origin => 
        navigationUrl.startsWith(origin)
      )
      
      if (!isAllowed) {
        this.log('WARN', `不許可のナビゲーションをブロックしました: ${navigationUrl}`)
        event.preventDefault()
        shell.openExternal(navigationUrl)
      }
    })

    // 新しいウィンドウの制御
    this.mainWindow.webContents.on('new-window', (event, url) => {
      event.preventDefault()
      shell.openExternal(url)
    })
  }

  /**
   * IPC通信ハンドラー設定
   */
  setupIpcHandlers() {
    // アプリケーション制御
    ipcMain.handle('app-close', () => {
      this.log('INFO', 'アプリケーション終了要求を受信しました')
      app.quit()
    })

    ipcMain.handle('app-minimize', () => {
      if (this.mainWindow) {
        this.mainWindow.minimize()
      }
    })

    ipcMain.handle('app-maximize', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMaximized()) {
          this.mainWindow.unmaximize()
        } else {
          this.mainWindow.maximize()
        }
      }
    })

    // アプリケーション情報
    ipcMain.handle('app-get-version', () => {
      return {
        app: app.getVersion(),
        electron: process.versions.electron,
        node: process.versions.node,
        chrome: process.versions.chrome
      }
    })

    // バックエンド状態
    ipcMain.handle('backend-get-status', () => {
      return backendChecker.getHealthStatus()
    })

    // 設定管理（将来実装）
    ipcMain.handle('settings-save', async (event, data) => {
      this.log('DEBUG', '設定保存要求', data)
      // TODO: electron-store を使用した設定保存
      return { success: true }
    })

    ipcMain.handle('settings-load', async () => {
      this.log('DEBUG', '設定読み込み要求')
      // TODO: electron-store を使用した設定読み込み
      return {}
    })

    // ダイアログ表示
    ipcMain.handle('dialog-show-message', async (event, options) => {
      if (this.mainWindow) {
        return await dialog.showMessageBox(this.mainWindow, options)
      }
      return await dialog.showMessageBox(options)
    })

    this.log('DEBUG', 'IPC通信ハンドラーを設定しました')
  }

  /**
   * アプリケーションイベント設定
   */
  setupAppEvents() {
    // アプリケーション準備完了
    app.on('ready', async () => {
      await this.onReady()
    })

    // すべてのウィンドウが閉じられた時
    app.on('window-all-closed', () => {
      this.onWindowAllClosed()
    })

    // アクティベート（macOS）
    app.on('activate', () => {
      this.onActivate()
    })

    // 終了前処理
    app.on('before-quit', () => {
      this.onBeforeQuit()
    })

    // セカンドインスタンス防止
    app.on('second-instance', () => {
      this.onSecondInstance()
    })
  }

  /**
   * アプリケーション準備完了時の処理
   */
  async onReady() {
    this.log('INFO', 'Electronアプリケーションの準備が完了しました')
    
    try {
      // スプラッシュ画面表示
      this.createSplashWindow()
      
      // バックエンド起動
      await backendChecker.startPythonBackend()
      
      // メインウィンドウ作成
      this.createMainWindow()
      
    } catch (error) {
      this.log('ERROR', 'アプリケーションの起動に失敗しました', error)
      
      // エラーダイアログ表示
      await this.showStartupError(error)
      app.quit()
    }
  }

  /**
   * 起動エラーダイアログ表示
   */
  async showStartupError(error) {
    const options = {
      type: 'error',
      title: 'アプリケーション起動エラー',
      message: 'アプリケーションの起動に失敗しました',
      detail: `エラーの詳細:\n${error.message}\n\n以下を確認してください:\n- Pythonがインストールされているか\n- バックエンドの依存関係がインストールされているか`,
      buttons: ['終了', '詳細をコピー']
    }

    try {
      const result = await dialog.showMessageBox(options)
      
      if (result.response === 1) {
        // 詳細をクリップボードにコピー
        const { clipboard } = require('electron')
        clipboard.writeText(`Error: ${error.message}\nStack: ${error.stack}`)
      }
    } catch (dialogError) {
      this.log('ERROR', 'エラーダイアログの表示に失敗しました', dialogError)
    }
  }

  /**
   * すべてのウィンドウが閉じられた時の処理
   */
  onWindowAllClosed() {
    this.log('INFO', 'すべてのウィンドウが閉じられました')
    
    // バックエンド停止
    backendChecker.stopPythonBackend()
    
    // macOS以外では終了
    if (process.platform !== 'darwin') {
      app.quit()
    }
  }

  /**
   * アクティベート時の処理（macOS）
   */
  onActivate() {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.log('INFO', 'ウィンドウを再作成します')
      this.createMainWindow()
    }
  }

  /**
   * 終了前処理
   */
  onBeforeQuit() {
    this.log('INFO', 'アプリケーションを終了しています...')
    this.isQuitting = true
    backendChecker.stopPythonBackend()
  }

  /**
   * セカンドインスタンス実行時の処理
   */
  onSecondInstance() {
    // 既存のウィンドウをフォーカス
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore()
      }
      this.mainWindow.focus()
    }
  }
}

// セカンドインスタンス防止
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  console.log('アプリケーションは既に起動しています')
  app.quit()
} else {
  // メインアプリケーション実行
  const todoApp = new TodoAppMain()
  
  // 未処理例外のキャッチ
  process.on('uncaughtException', (error) => {
    todoApp.log('ERROR', '未処理例外が発生しました', error)
    console.error('Uncaught Exception:', error)
  })
  
  process.on('unhandledRejection', (reason, promise) => {
    todoApp.log('ERROR', '未処理のPromise拒否が発生しました', reason)
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  })
  
  // アプリケーション初期化
  todoApp.initialize().catch((error) => {
    console.error('Application initialization failed:', error)
    app.quit()
  })
}