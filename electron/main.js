const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

// システムプロンプト準拠: ハードコード禁止、設定の一元管理
const APP_CONFIG = {
  PORTS: {
    FRONTEND: 3000,
    BACKEND: 8000
  },
  PATHS: {
    BACKEND_SCRIPT: 'app.py',
    BACKEND_DIR: 'backend',
    FRONTEND_DIST: path.join('frontend', 'dist'),
    FRONTEND_INDEX: 'index.html'
  },
  WINDOW: {
    WIDTH: 1400,
    HEIGHT: 900,
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600
  }
}

const isDev = process.env.NODE_ENV === 'development'

let mainWindow
let pythonProcess

// システムプロンプト準拠: パス結合専用関数
function joinPath(...segments) {
  return path.join(...segments)
}

// Pythonバックエンドプロセスを起動
function startPythonBackend() {
  console.log('Pythonバックエンドを起動しています...')
  
  const pythonPath = isDev ? 'python' : joinPath(process.resourcesPath, 'python', 'python')
  const scriptPath = isDev 
    ? joinPath(__dirname, '..', APP_CONFIG.PATHS.BACKEND_DIR, APP_CONFIG.PATHS.BACKEND_SCRIPT)
    : joinPath(process.resourcesPath, APP_CONFIG.PATHS.BACKEND_DIR, APP_CONFIG.PATHS.BACKEND_SCRIPT)

  const workingDirectory = isDev 
    ? joinPath(__dirname, '..', APP_CONFIG.PATHS.BACKEND_DIR)
    : joinPath(process.resourcesPath, APP_CONFIG.PATHS.BACKEND_DIR)

  pythonProcess = spawn(pythonPath, [scriptPath], {
    stdio: 'pipe',
    cwd: workingDirectory
  })

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python stdout: ${data}`)
  })

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data}`)
  })

  pythonProcess.on('close', (code) => {
    console.log(`Pythonプロセスが終了しました。終了コード: ${code}`)
  })

  pythonProcess.on('error', (error) => {
    console.error('Pythonプロセスの起動に失敗しました:', error)
  })

  // バックエンドの起動を待つ
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Pythonバックエンドの起動が完了しました')
      resolve()
    }, 3000)
  })
}

// Pythonバックエンドプロセスを停止
function stopPythonBackend() {
  if (pythonProcess) {
    console.log('Pythonバックエンドを停止しています...')
    pythonProcess.kill('SIGTERM')
    pythonProcess = null
  }
}

// メインウィンドウを作成
function createWindow() {
  mainWindow = new BrowserWindow({
    width: APP_CONFIG.WINDOW.WIDTH,
    height: APP_CONFIG.WINDOW.HEIGHT,
    minWidth: APP_CONFIG.WINDOW.MIN_WIDTH,
    minHeight: APP_CONFIG.WINDOW.MIN_HEIGHT,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: joinPath(__dirname, 'preload.js'),
      webSecurity: true
    },
    icon: joinPath(__dirname, 'assets', 'icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false
  })

  // システムプロンプト準拠: URL構築の一元化
  const frontendUrl = isDev 
    ? `http://localhost:${APP_CONFIG.PORTS.FRONTEND}`
    : `file://${joinPath(__dirname, '..', APP_CONFIG.PATHS.FRONTEND_DIST, APP_CONFIG.PATHS.FRONTEND_INDEX)}`

  mainWindow.loadURL(frontendUrl)

  // 開発環境では開発者ツールを開く
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  // ウィンドウが準備完了したら表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    if (isDev) {
      mainWindow.focus()
    }
  })

  // ウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 外部リンクはデフォルトブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // ナビゲーション制御
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    
    const allowedOrigins = [
      `http://localhost:${APP_CONFIG.PORTS.FRONTEND}`,
      'file:'
    ]
    
    const isAllowed = allowedOrigins.some(origin => 
      parsedUrl.origin === origin || parsedUrl.protocol === origin
    )
    
    if (!isAllowed) {
      event.preventDefault()
      shell.openExternal(navigationUrl)
    }
  })
}

// アプリケーションの準備が完了したときの処理
app.whenReady().then(async () => {
  console.log('Electronアプリケーションの準備が完了しました')
  
  try {
    await startPythonBackend()
    createWindow()
    console.log('アプリケーションの起動が完了しました')
  } catch (error) {
    console.error('アプリケーションの起動に失敗しました:', error)
    app.quit()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// すべてのウィンドウが閉じられたときの処理
app.on('window-all-closed', () => {
  stopPythonBackend()
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// アプリケーション終了前の処理
app.on('before-quit', () => {
  console.log('アプリケーションを終了しています...')
  stopPythonBackend()
})