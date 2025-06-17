/**
 * バックエンドヘルスチェック管理
 * システムプロンプト準拠：KISS原則、環境別接続先対応
 */

const http = require('http')
const { APP_CONFIG, URL_CONFIG, LOG_CONFIG, isDev } = require('./config')

class BackendChecker {
  constructor(logger) {
    this.logger = logger
    this.retryCount = 0
    this.maxRetries = APP_CONFIG.BACKEND.MAX_RETRIES
    this.checkInterval = APP_CONFIG.BACKEND.HEALTH_CHECK_INTERVAL
    this.isChecking = false
  }

  /**
   * ヘルスチェック開始
   * システムプロンプト準拠：KISS原則による単純なチェック機能
   */
  async start() {
    if (this.isChecking) {
      this.logger.warn('ヘルスチェックは既に実行中です')
      return Promise.resolve()
    }

    this.isChecking = true
    this.retryCount = 0

    if (isDev && APP_CONFIG.DEV.USE_EXTERNAL_BACKEND) {
      this.logger.info('開発環境: 外部バックエンドの状態を確認しています...')
    } else {
      this.logger.info('本番環境: 内部バックエンドの状態を確認しています...')
    }

    return new Promise((resolve, reject) => {
      this.checkHealth(resolve, reject)
    })
  }

  /**
   * ヘルスチェック実行
   * システムプロンプト準拠：DRY原則による統一チェック処理
   */
  checkHealth(resolve, reject) {
    this.retryCount++
    this.logger.debug(`ヘルスチェック実行中... (${this.retryCount}/${this.maxRetries})`)

    const options = {
      hostname: 'localhost',
      port: APP_CONFIG.PORTS.BACKEND,
      path: APP_CONFIG.BACKEND.HEALTH_ENDPOINT,
      method: 'GET',
      timeout: 5000
    }

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        this.logger.info('バックエンドの起動が確認できました')
        this.isChecking = false
        resolve()
      } else {
        this.logger.debug(`ヘルスチェック失敗: HTTP ${res.statusCode}`)
        this.handleRetry(resolve, reject)
      }
    })

    req.on('error', (error) => {
      // システムプロンプト準拠：KISS原則による分かりやすいエラー判定
      if (error.code === 'ECONNREFUSED') {
        this.logger.debug('ヘルスチェック接続エラー (正常、起動中)')
      } else if (error.code === 'EADDRINUSE') {
        // ポート競合の明確なエラーメッセージ
        this.logger.error('ポート競合エラー: バックエンドが既に起動している可能性があります')
        if (isDev) {
          this.logger.error('開発環境では npm run dev:backend で起動されたバックエンドを使用してください')
        }
      } else {
        this.logger.debug(`ヘルスチェックエラー: ${error.message}`)
      }
      this.handleRetry(resolve, reject)
    })

    req.on('timeout', () => {
      this.logger.debug('ヘルスチェックタイムアウト')
      req.destroy()
      this.handleRetry(resolve, reject)
    })

    req.end()
  }

  /**
   * リトライ処理
   * システムプロンプト準拠：YAGNI原則による必要最小限の機能
   */
  handleRetry(resolve, reject) {
    if (this.retryCount >= this.maxRetries) {
      this.isChecking = false
      const errorMessage = `バックエンドの起動がタイムアウトしました (${this.maxRetries}回試行)`
      this.logger.error(errorMessage)
      
      // 環境別の詳細メッセージ
      if (isDev) {
        this.logger.error('開発環境: npm run dev:backend でバックエンドが起動していることを確認してください')
      } else {
        this.logger.error('本番環境: バックエンドプロセスの起動に失敗しました')
      }
      
      reject(new Error(errorMessage))
    } else {
      setTimeout(() => {
        this.checkHealth(resolve, reject)
      }, this.checkInterval)
    }
  }

  /**
   * ヘルスチェック停止
   */
  stop() {
    this.isChecking = false
    this.retryCount = 0
  }
}

module.exports = BackendChecker