import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@app/App.tsx'
import './styles/globals.css'

// エンタープライズログシステム初期化
import '@core/services/errorReporting'
import { logger } from '@core/utils/logger'

// アプリケーション開始ログ
logger.info('Todo Application starting...', undefined, 'Main', 'init')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)