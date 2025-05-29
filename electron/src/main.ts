// TypeScript化されたElectronメインプロセス（システムプロンプト準拠）
import { app, BrowserWindow, shell, ipcMain, dialog, Menu, MenuItem } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import { getLogger } from './logger'
import { ELECTRON_PATHS, resolvePath } from './paths'

const logger = getLogger('main')
const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow | null = null
let pythonProcess: ChildProcess | null = null

/**
 * Pythonバックエンドプロセス管理
 */
class PythonBackendManager {
  private process: ChildProcess | null = null
  
  async start(): Promise<void> {
    logger.info('Starting Python backend process...')
    
    const pythonPath = isDev ? 'python' : resolvePath(process.resourcesPath, 'python', 'python')
    const scriptPath = isDev 
      ? resolvePath(__dirname, '..', '..', 'backend', 'main.py')
      : resolvePath(process.resourcesPath, 'backend', 'main.py')
    
    // パス検証
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Python script not found: ${scriptPath}`)
    }
    
    this.process = spawn(pythonPath, [scriptPath], {
      stdio: 'pipe',
      cwd: isDev 
        ? resolvePath(__dirname, '..', '..', 'backend')
        : resolvePath(process.resourcesPath, 'backend')
    })
    
    this.process.stdout?.on('data', (data) => {
      logger.debug(`Python stdout: ${data}`)
    })
    
    this.process.stderr?.on('data', (data) => {
      logger.error(`Python stderr: ${data}`)
    })
    
    this.process.on('close', (code) => {
      logger.info(`Python process exited with code: ${code}`)
    })
    
    this.process.on('error', (error) => {
      logger.error('Python process error:', { error: error.message })
    })
    
    // バックエンド起動待機
    await this.waitForBackend()
    logger.info('Python backend started successfully')
  }
  
  private async waitForBackend(timeout: number = 10000): Promise<void> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch('http://localhost:8000/api/health')
        if (response.ok) {
          return
        }
      } catch {
        // 接続エラーは無視して再試行
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    throw new Error('Backend startup timeout')
  }
  
  stop(): void {
    if (this.process) {
      logger.info('Stopping Python backend process...')
      this.process.kill('SIGTERM')
      this.process = null
    }
  }
}

const backendManager = new PythonBackendManager()

/**
 * メインウィンドウ作成
 */
function createMainWindow(): void {
  logger.info('Creating main window...')
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: resolvePath(__dirname, 'preload.js'),
      webSecurity: true,
      sandbox: false // preloadスクリプトでNode.js APIが必要
    },
    icon: resolvePath(ELECTRON_PATHS.ASSETS, 'icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false, // 準備完了後に表示
    backgroundColor: '#ffffff' // ちらつき防止
  })
  
  // フロントエンドURL設定
  const frontendUrl = isDev 
    ? 'http://localhost:3000'
    : `file://${resolvePath(__dirname, '..', '..', 'frontend', 'dist', 'index.html')}`
  
  mainWindow.loadURL(frontendUrl)
  
  // 開発環境での開発者ツール
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }
  
  // ウィンドウ準備完了時の処理
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show()
      
      if (isDev) {
        mainWindow.focus()
      }
      
      logger.info('Main window displayed')
    }
  })
  
  // ウィンドウクローズ処理
  mainWindow.on('closed', () => {
    mainWindow = null
    logger.info('Main window closed')
  })
  
  // 外部リンクハンドリング
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
  
  // ナビゲーション制御
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    
    // 許可されたオリジン以外への移動を防ぐ
    const allowedOrigins = ['http://localhost:3000', 'file://']
    const isAllowed = allowedOrigins.some(origin => navigationUrl.startsWith(origin))
    
    if (!isAllowed) {
      event.preventDefault()
      shell.openExternal(navigationUrl)
      logger.warn(`Blocked navigation to: ${navigationUrl}`)
    }
  })
}

/**
 * アプリケーションメニュー設定
 */
function setupApplicationMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'ファイル',
      submenu: [
        {
          label: '新規プロジェクト',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu-new-project')
          }
        },
        { type: 'separator' },
        {
          label: '終了',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: '編集',
      submenu: [
        { label: '元に戻す', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'やり直し', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '切り取り', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'コピー', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '貼り付け', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: '表示',
      submenu: [
        { label: 'リロード', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '強制リロード', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: '開発者ツール', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '実際のサイズ', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '拡大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '縮小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全画面表示', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'ヘルプ',
      submenu: [
        {
          label: 'このアプリケーションについて',
          click: async () => {
            await dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'About',
              message: '階層型ToDoリストアプリケーション',
              detail: 'Version 1.0.0\nElectron + React + Python'
            })
          }
        }
      ]
    }
  ]
  
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

/**
 * IPCハンドラー設定
 */
function setupIpcHandlers(): void {
  // ウィンドウ操作
  ipcMain.handle('window-minimize', () => {
    mainWindow?.minimize()
  })
  
  ipcMain.handle('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  
  ipcMain.handle('window-close', () => {
    app.quit()
  })
  
  // ファイル操作
  ipcMain.handle('dialog-open-file', async () => {
    if (!mainWindow) return null
    
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    
    return result.canceled ? null : result.filePaths[0]
  })
  
  ipcMain.handle('dialog-save-file', async (_, data: any) => {
    if (!mainWindow) return null
    
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2))
      return result.filePath
    }
    
    return null
  })
  
  // システム情報
  ipcMain.handle('system-info', () => ({
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  }))
  
  // ログ出力
  ipcMain.handle('log', (_, level: string, message: string) => {
    logger[level as keyof typeof logger]?.(message) || logger.info(message)
  })
  
  // エラー報告
  ipcMain.handle('renderer-error', (_, errorInfo: any) => {
    logger.error('Renderer process error:', errorInfo)
  })
  
  ipcMain.handle('renderer-unhandled-rejection', (_, rejectionInfo: any) => {
    logger.error('Renderer unhandled rejection:', rejectionInfo)
  })
}

/**
 * アプリケーション初期化
 */
async function initializeApp(): Promise<void> {
  try {
    logger.info('Initializing application...')
    
    // Pythonバックエンド起動
    await backendManager.start()
    
    // メインウィンドウ作成
    createMainWindow()
    
    // メニュー設定
    setupApplicationMenu()
    
    // IPCハンドラー設定
    setupIpcHandlers()
    
    logger.info('Application initialization completed')
  } catch (error) {
    logger.error('Application initialization failed:', { error })
    app.quit()
  }
}

/**
 * アプリケーションイベントハンドラー
 */
app.whenReady().then(initializeApp)

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})

app.on('window-all-closed', () => {
  backendManager.stop()
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  logger.info('Application is quitting...')
  backendManager.stop()
})

// セキュリティ強化
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev && url.startsWith('http://localhost:')) {
    event.preventDefault()
    callback(true)
  } else {
    callback(false)
  }
})

// GPU問題回避
if (!isDev) {
  app.disableHardwareAcceleration()
}

// プロトコル設定
app.setAsDefaultProtocolClient('todoapp')