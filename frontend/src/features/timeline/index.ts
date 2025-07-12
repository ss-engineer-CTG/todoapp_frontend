// システムプロンプト準拠：timeline機能の公開API（軽量化版）
// 🔧 修正内容：エクスポートの一元化、不要エクスポート削除

// コンポーネント（最適化版も提供）
export { TimelineView } from './components/TimelineView'
export { default as OptimizedTimeline } from './components/OptimizedTimeline'
export { TimelineControls } from './components/TimelineControls'
export { TimelineRenderer } from './components/TimelineRenderer'

// フック
export { useTimeline } from './hooks/useTimeline'

// ユーティリティ
export * from './utils'

// 型定義
export * from './types'