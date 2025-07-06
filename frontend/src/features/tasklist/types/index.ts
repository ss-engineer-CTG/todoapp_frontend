// システムプロンプト準拠：tasklist機能専用型定義
// 🔧 重複型を削除し、@core/typesからの再エクスポートに統合

// 統合済み型の再エクスポート（互換性維持）
export type {
  Task,
  Project,
  BatchOperation,
  TaskRelationMap,
  BatchOperationResult,
  TaskApiActions,
  ProjectApiActions,
  SelectionState
} from '@core/types'