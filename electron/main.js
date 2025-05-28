const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const isDev = process.env.NODE_ENV === 'development'

let mainWindow
let pythonProcess

// Pythonバックエンドプロセスを起動
function startPythonBackend() {
  console.log('Pythonバックエンドを起動しています...')
  
  const pythonPath = isDev ? 'python' : path.join(process.resourcesPath, 'python', 'python')
  const scriptPath = isDev 
    ? path.join(__dirname, '..', 'backend', 'app.py')
    : path.join(process.resourcesPath, 'backend', 'app.py')

  pythonProcess = spawn(pythonPath, [scriptPath], {
    stdio: 'pipe',
    cwd: isDev ? path.join(__dirname, '..', 'backend') : path.join(process.resourcesPath, 'backend')
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
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // アイコンファイルがある場合
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false // 起動時は非表示にして、準備完了後に表示
  })

  // フロントエンドのURLを設定
  const frontendUrl = isDev 
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '..', 'frontend', 'dist', 'index.html')}`

  mainWindow.loadURL(frontendUrl)

  // 開発環境では開発者ツールを開く
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  // ウィンドウが準備完了したら表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    // 開発環境でのフォーカス設定
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

  // ナビゲーション制御（セキュリティ強化）
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    
    if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.protocol !== 'file:') {
      event.preventDefault()
      shell.openExternal(navigationUrl)
    }
  })
}

// アプリケーションの準備が完了したときの処理
app.whenReady().then(async () => {
  console.log('Electronアプリケーションの準備が完了しました')
  
  try {
    // Pythonバックエンドを起動
    await startPythonBackend()
    
    // メインウィンドウを作成
    createWindow()
    
    console.log('アプリケーションの起動が完了しました')
  } catch (error) {
    console.error('アプリケーションの起動に失敗しました:', error)
    app.quit()
  }

  // macOSでアプリケーションがアクティブになったときの処理
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// すべてのウィンドウが閉じられたときの処理
app.on('window-all-closed', () => {
  stopPythonBackend()
  
  // macOS以外では、すべてのウィンドウが閉じられたらアプリケーションを終了
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// アプリケーション終了前の処理
app.on('before-quit', () => {
  console.log('アプリケーションを終了しています...')
  stopPythonBackend()
})

// セキュリティ強化：証明書エラーを処理
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev && url.startsWith('http://localhost:')) {
    // 開発環境ではlocalhostの証明書エラーを許可
    event.preventDefault()
    callback(true)
  } else {
    // 本番環境では厳格に処理
    callback(false)
  }
})

// GPU関連の問題を回避（必要に応じて）
if (!isDev) {
  app.disableHardwareAcceleration()
}

// ファイルプロトコルの許可設定
app.setAsDefaultProtocolClient('todoapp')