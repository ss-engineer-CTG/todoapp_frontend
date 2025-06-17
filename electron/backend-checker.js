/**
 * バックエンド起動確認モジュール
 * システムプロンプト準拠：KISS原則、信頼性確保、適切なエラーハンドリング
 */

const { spawn } = require('child_process')
const http = require('http')
const { APP_CONFIG, URL_CONFIG, PathHelper, LOG_CONFIG, isDev } = require('./config')

class BackendChecker {
  constructor() {
    this.pythonProcess = null
    this.isHealthy = false
    this.startTime = null
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
      if (error) {
        console.error(error)
      }
    } else if (level === 'WARN') {
      console.warn(fullMessage)
    } else {
      console.log(fullMessage)
    }
  }

  /**
   * Pythonバックエンドプロセスを起動
   */
  async startPythonBackend() {
    this.log('INFO', 'Pythonバックエンドを起動しています...')
    this.startTime = Date.now()

    try {
      // Python実行ファイルのパス決定
      const pythonPath = this.getPythonPath()
      const scriptPath = PathHelper.getBackendScriptPath()
      const workingDirectory = PathHelper.getBackendWorkingDir()

      this.log('DEBUG', `Python実行ファイル: ${pythonPath}`)
      this.log('DEBUG', `スクリプトパス: ${scriptPath}`)
      this.log('DEBUG', `作業ディレクトリ: ${workingDirectory}`)

      // プロセス起動
      this.pythonProcess = spawn(pythonPath, [scriptPath], {
        stdio: 'pipe',
        cwd: workingDirectory,
        env: { ...process.env, PYTHONPATH: workingDirectory }
      })

      // イベントリスナー設定
      this.setupProcessListeners()

      // ヘルスチェック開始
      await this.waitForBackendHealth()

      const duration = Date.now() - this.startTime
      this.log('INFO', `Pythonバックエンドの起動が完了しました (${duration}ms)`)

    } catch (error) {
      this.log('ERROR', 'Pythonバックエンドの起動に失敗しました', error)
      throw error
    }
  }

  /**
   * Python実行ファイルのパス取得
   */
  getPythonPath() {
    if (isDev) {
      // 開発環境：システムのPython使用
      return process.platform === 'win32' ? 'python.exe' : 'python3'
    } else {
      // 本番環境：バンドルされたPython使用（将来実装）
      return process.platform === 'win32' 
        ? PathHelper.joinPath(process.resourcesPath, 'python', 'python.exe')
        : PathHelper.joinPath(process.resourcesPath, 'python', 'python')
    }
  }

  /**
   * プロセスイベントリスナー設定
   */
  setupProcessListeners() {
    this.pythonProcess.stdout.on('data', (data) => {
      const output = data.toString().trim()
      if (output) {
        this.log('DEBUG', `Python stdout: ${output}`)
      }
    })

    this.pythonProcess.stderr.on('data', (data) => {
      const error = data.toString().trim()
      if (error) {
        this.log('WARN', `Python stderr: ${error}`)
      }
    })

    this.pythonProcess.on('close', (code) => {
      this.log('INFO', `Pythonプロセスが終了しました。終了コード: ${code}`)
      this.isHealthy = false
    })

    this.pythonProcess.on('error', (error) => {
      this.log('ERROR', 'Pythonプロセスエラー', error)
      this.isHealthy = false
    })
  }

  /**
   * バックエンドのヘルスチェック待機
   */
  async waitForBackendHealth() {
    const maxRetries = APP_CONFIG.BACKEND.MAX_RETRIES
    const interval = APP_CONFIG.BACKEND.HEALTH_CHECK_INTERVAL
    let retryCount = 0

    return new Promise((resolve, reject) => {
      const checkHealth = async () => {
        try {
          retryCount++
          this.log('DEBUG', `ヘルスチェック実行中... (${retryCount}/${maxRetries})`)

          const isHealthy = await this.checkHealth()
          
          if (isHealthy) {
            this.isHealthy = true
            this.log('INFO', 'バックエンドのヘルスチェックが成功しました')
            resolve()
            return
          }

          if (retryCount >= maxRetries) {
            const timeoutError = new Error(`バックエンドの起動がタイムアウトしました (${maxRetries}回試行)`)
            this.log('ERROR', timeoutError.message)
            reject(timeoutError)
            return
          }

          // 次のチェックまで待機
          setTimeout(checkHealth, interval)

        } catch (error) {
          if (retryCount >= maxRetries) {
            this.log('ERROR', 'ヘルスチェックが最大試行回数に達しました', error)
            reject(error)
            return
          }

          this.log('DEBUG', `ヘルスチェック失敗、再試行します... (${retryCount}/${maxRetries})`)
          setTimeout(checkHealth, interval)
        }
      }

      // 初回チェック開始
      setTimeout(checkHealth, 1000) // 1秒後に開始
    })
  }

  /**
   * ヘルスチェック実行
   */
  async checkHealth() {
    return new Promise((resolve) => {
      const request = http.get(URL_CONFIG.BACKEND_HEALTH, (response) => {
        if (response.statusCode === 200) {
          resolve(true)
        } else {
          this.log('WARN', `ヘルスチェック失敗: HTTP ${response.statusCode}`)
          resolve(false)
        }
      })

      request.on('error', (error) => {
        this.log('DEBUG', 'ヘルスチェック接続エラー (正常、起動中)', error.message)
        resolve(false)
      })

      request.setTimeout(3000, () => {
        request.destroy()
        this.log('DEBUG', 'ヘルスチェックタイムアウト')
        resolve(false)
      })
    })
  }

  /**
   * バックエンドプロセス停止
   */
  stopPythonBackend() {
    if (this.pythonProcess) {
      this.log('INFO', 'Pythonバックエンドを停止しています...')
      
      try {
        // 丁寧な終了シーケンス
        this.pythonProcess.kill('SIGTERM')
        
        // 強制終了のタイムアウト設定
        setTimeout(() => {
          if (this.pythonProcess && !this.pythonProcess.killed) {
            this.log('WARN', 'バックエンドプロセスを強制終了します')
            this.pythonProcess.kill('SIGKILL')
          }
        }, 5000)
        
      } catch (error) {
        this.log('ERROR', 'バックエンド停止時エラー', error)
      } finally {
        this.pythonProcess = null
        this.isHealthy = false
      }
    }
  }

  /**
   * バックエンドの健康状態取得
   */
  getHealthStatus() {
    return {
      isHealthy: this.isHealthy,
      hasProcess: !!this.pythonProcess,
      uptime: this.startTime ? Date.now() - this.startTime : 0
    }
  }
}

// シングルトンインスタンス
const backendChecker = new BackendChecker()

module.exports = {
  BackendChecker,
  backendChecker
}