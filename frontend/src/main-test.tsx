import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/globals.css'

const TestApp: React.FC = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🔧 テスト用アプリケーション</h1>
      <p>このページが表示されれば、基本的なReactの動作は正常です。</p>
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => alert('ボタンが動作しています！')} style={{ padding: '10px 20px', fontSize: '16px' }}>
          テストボタン
        </button>
      </div>
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        現在時刻: {new Date().toLocaleString()}
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>,
)