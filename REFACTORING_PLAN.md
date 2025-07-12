# 階層型ToDoリストアプリケーション リファクタリング方針書

## 1. 概要

### 1.1 背景
現在のアプリケーションでは以下の問題が確認されています：
- **コード肥大化**: 最大769行の巨大ファイル (TodoApp.tsx)
- **メモリ消費量増大**: 過度なメモ化（21個のuseCallback/useMemo）、大きなデータ構造
- **保守性低下**: 単一ファイルに複数責任が混在

### 1.2 目標
- **メモリ使用量30%削減**
- **メンテナンス工数50%削減**
- **コード可読性・再利用性向上**

### 1.3 基本原則
- **KISS (Keep It Simple, Stupid)**: 複雑な多重責任を単一責任に分割
- **YAGNI (You Aren't Gonna Need It)**: 過度なメモ化を必要最小限に削減
- **DRY (Don't Repeat Yourself)**: 重複ロジックの統合

---

## 2. 現状分析結果

### 2.1 肥大化ファイル一覧
| ファイル | 行数 | 主要問題 |
|----------|------|----------|
| TodoApp.tsx | 769行 | UI状態・ビジネスロジック・イベント処理混在 |
| useRowSelection.ts | 756行 | 選択・ドラッグ・範囲選択の責任混在 |
| TimelineView.tsx | 651行 | レンダリング・状態管理・イベント処理混在 |
| TimelineRenderer.tsx | 615行 | TimelineViewと責任重複 |
| DetailPanel.tsx | 588行 | フォーム・バリデーション・UI制御混在 |

### 2.2 メモリ消費問題
- **過度なメモ化**: useRowSelection.ts (21個)、useTimeline.ts (13個)
- **大きなデータ構造**: Map/Set状態の多用
- **タイマー管理**: 19箇所のsetTimeout（清理漏れリスク）

---

## 3. リファクタリング計画

### フェーズ1: 緊急対応（1-2週間）
**優先度: 🔴 最高**

#### ステップ1.1: TodoApp.tsx の分割
**期間**: 3-4日  
**担当範囲**: メインアプリケーションコンテナ

**分割対象**:
```
TodoApp.tsx (769行)
├── containers/
│   ├── AppContainer.tsx          # 状態管理・API呼び出し
│   ├── ProjectContainer.tsx      # プロジェクト関連ロジック
│   ├── TaskContainer.tsx         # タスク関連ロジック
│   └── TimelineContainer.tsx     # タイムライン関連ロジック
├── layouts/
│   ├── AppLayout.tsx             # レイアウト・UI構造
│   └── ViewSwitcher.tsx          # ビュー切り替えUI
└── hooks/
    ├── useAppNavigation.tsx      # ナビゲーション制御
    └── useViewMode.tsx           # ビューモード管理
```

**具体的作業**:
1. **AppContainer.tsx作成** (1日)
   - 状態管理ロジック抽出
   - API呼び出し処理統合
   - 子コンテナへのprops配布
   
2. **各Container作成** (2日)
   - ProjectContainer: プロジェクト CRUD + 選択状態
   - TaskContainer: タスク CRUD + フィルタリング
   - TimelineContainer: タイムライン表示制御
   
3. **Layout分離** (1日)
   - UI構造をAppLayoutに移動
   - ViewSwitcherでビュー切り替えUI分離

#### ステップ1.2: useRowSelection.ts の責任分離
**期間**: 3-4日  
**担当範囲**: タイムライン選択機能

**分割対象**:
```
useRowSelection.ts (756行)
├── hooks/
│   ├── useSelection.ts           # 基本選択機能
│   ├── useDragSelection.ts       # ドラッグ選択
│   ├── useRangeSelection.ts      # 範囲選択
│   └── useSelectionEffects.ts    # 副作用処理
├── utils/
│   ├── selectionUtils.ts         # 選択計算ロジック
│   └── positionUtils.ts          # 位置計算ロジック
└── types/
    └── selectionTypes.ts         # 型定義統合
```

**具体的作業**:
1. **基本選択機能抽出** (1日)
   - useState/setSelection 統合
   - 単一選択・複数選択ロジック分離
   
2. **ドラッグ選択分離** (1日)
   - ドラッグ開始・移動・終了処理
   - イベントリスナー管理最適化
   
3. **範囲選択分離** (1日)
   - Shift+クリック範囲選択
   - キーボード範囲選択
   
4. **メモ化最適化** (1日)
   - useCallback/useMemo 50%削減
   - 本当に必要な箇所のみ保持

### フェーズ2: 効果的改善（2-3週間）
**優先度: 🟡 高**

#### ステップ2.1: タイムライン統合最適化
**期間**: 4-5日  
**担当範囲**: タイムライン表示機能

**統合対象**:
```
TimelineView.tsx + TimelineRenderer.tsx → OptimizedTimeline.tsx
├── components/
│   ├── OptimizedTimeline.tsx     # 統合最適化コンポーネント
│   ├── TimelineHeader.tsx        # ヘッダー部分
│   ├── TimelineGrid.tsx          # グリッド描画
│   └── TaskBar.tsx               # タスクバー最適化
└── hooks/
    ├── useTimelineRender.ts      # レンダリング最適化
    └── useTimelineEvents.ts      # イベント処理
```

**具体的作業**:
1. **重複機能統合** (2日)
   - TimelineView + TimelineRenderer 統合
   - 重複するstate/props除去
   
2. **レンダリング最適化** (2日)
   - React.memo 適用
   - 仮想化実装検討
   - 不要な再レンダリング除去
   
3. **パフォーマンステスト** (1日)
   - レンダリング時間測定
   - メモリ使用量検証

#### ステップ2.2: DetailPanel.tsx 機能分割
**期間**: 3-4日  
**担当範囲**: タスク詳細パネル

**分割対象**:
```
DetailPanel.tsx (588行)
├── components/
│   ├── TaskForm.tsx              # フォーム部分
│   ├── DatePickerField.tsx       # 日付選択
│   ├── TaskNotes.tsx             # ノート編集
│   └── FormActions.tsx           # 保存・キャンセル
├── hooks/
│   ├── useTaskForm.ts            # フォーム状態管理
│   └── useFormValidation.ts      # バリデーション
└── utils/
    └── formUtils.ts              # フォームヘルパー
```

**具体的作業**:
1. **フォーム機能分離** (2日)
   - TaskForm: 基本フォーム構造
   - DatePickerField: 日付選択UI
   - TaskNotes: テキストエリア部分
   
2. **状態管理最適化** (1日)
   - useTaskForm: フォーム状態統合
   - useFormValidation: バリデーションロジック
   
3. **再利用性向上** (1日)
   - 汎用コンポーネント化
   - プロップス設計最適化

#### ステップ2.3: メモ化最適化プロジェクト
**期間**: 2-3日  
**担当範囲**: 全体的なパフォーマンス改善

**対象ファイル**:
- useTimeline.ts (13個 → 6-7個に削減)
- useTaskDrag.ts (5個 → 2-3個に削減)
- useMultipleSelection.ts (10個 → 5-6個に削減)

**具体的作業**:
1. **メモ化分析** (1日)
   - 各useCallback/useMemoの依存関係分析
   - 実際の再計算頻度測定
   
2. **不要メモ化除去** (1日)
   - 軽量な計算のメモ化除去
   - 過度な最適化の撤廃
   
3. **効果的メモ化選定** (1日)
   - 重い処理のみメモ化保持
   - React.memo 適用箇所決定

### フェーズ3: 長期保守性向上（3-4週間）
**優先度: 🟢 中**

#### ステップ3.1: Utils 再構成
**期間**: 2-3日  
**担当範囲**: ユーティリティ関数整理

**再構成対象**:
```
task.ts (536行)
├── domain/
│   ├── taskDomain.ts             # ドメインロジック
│   └── taskHierarchy.ts          # 階層構造処理
├── validation/
│   ├── taskValidation.ts         # バリデーション
│   └── dateValidation.ts         # 日付バリデーション
├── filter/
│   ├── taskFilter.ts             # フィルタリング
│   └── searchFilter.ts           # 検索機能
└── transform/
    ├── taskTransform.ts          # データ変換
    └── displayTransform.ts       # 表示用変換
```

#### ステップ3.2: タイマー管理改善
**期間**: 1-2日  
**担当範囲**: メモリリーク防止

**改善対象**:
- setTimeout の適切な clearTimeout 実装
- useEffect cleanup 関数の完全実装
- カスタムフック useTimer 作成

#### ステップ3.3: 型定義整理
**期間**: 1-2日  
**担当範囲**: TypeScript型の最適化

**整理対象**:
- 重複型定義の統合
- 汎用型の作成
- 型安全性向上

---

## 4. 成功指標・検証方法

### 4.1 定量的指標

#### メモリ使用量
- **測定方法**: Chrome DevTools Performance タブ
- **目標**: 30%削減
- **測定タイミング**: 各フェーズ完了時

#### ファイルサイズ
- **測定方法**: `wc -l` コマンド
- **目標**: 最大ファイル400行以下
- **測定タイミング**: 各ステップ完了時

#### パフォーマンス
- **測定方法**: React DevTools Profiler
- **目標**: 初期レンダリング時間20%短縮
- **測定タイミング**: フェーズ2完了時

### 4.2 定性的指標

#### コード品質
- **測定方法**: ESLint/TypeScript エラー数
- **目標**: 警告数50%削減
- **測定タイミング**: 各ステップ完了時

#### 保守性
- **測定方法**: コードレビュー時間
- **目標**: 新機能追加時間50%短縮
- **測定タイミング**: フェーズ3完了後

---

## 5. リスク対策・ロールバック計画

### 5.1 主要リスク

#### リスク1: 機能破綻
- **発生確率**: 中
- **対策**: 各ステップでユニットテスト実行
- **ロールバック**: Gitブランチ単位で戻し

#### リスク2: パフォーマンス悪化
- **発生確率**: 低
- **対策**: 各フェーズでパフォーマンステスト
- **ロールバック**: 最適化前のコミットに戻し

#### リスク3: 開発効率低下
- **発生確率**: 中
- **対策**: 段階的リリース、チームレビュー
- **ロールバック**: 機能単位で旧実装併用

### 5.2 ロールバック手順

#### 緊急ロールバック
1. 該当ブランチから main への緊急 revert
2. CI/CD による自動デプロイ
3. 影響範囲の確認・検証

#### 段階的ロールバック
1. 機能フラグによる新機能無効化
2. 旧機能への段階的切り戻し
3. データ整合性確認

---

## 6. スケジュール・マイルストーン

### 6.1 全体スケジュール

```
Week 1-2  : フェーズ1 (緊急対応)
Week 3-5  : フェーズ2 (効果的改善)
Week 6-9  : フェーズ3 (長期保守性)
Week 10   : 最終検証・ドキュメント更新
```

### 6.2 主要マイルストーン

| マイルストーン | 期日 | 成果物 | 検証項目 |
|----------------|------|---------|-----------|
| M1: TodoApp分割完了 | Week 2 | 分割されたコンテナ群 | 機能正常性、メモリ削減確認 |
| M2: 選択機能分離完了 | Week 2 | 責任分離されたhooks | パフォーマンス改善確認 |
| M3: タイムライン最適化完了 | Week 4 | 統合コンポーネント | レンダリング効率改善確認 |
| M4: 全体最適化完了 | Week 9 | 完全リファクタリング版 | 全指標達成確認 |

### 6.3 品質ゲート

各マイルストーンで以下を必須チェック：
- [ ] 既存機能の正常動作
- [ ] パフォーマンス指標達成
- [ ] コード品質基準クリア
- [ ] テストカバレッジ維持

---

## 7. 実装ガイドライン

### 7.1 コーディング規約

#### ファイル命名
- **Container**: `XxxContainer.tsx`
- **Component**: `XxxComponent.tsx` または `Xxx.tsx`
- **Hook**: `useXxx.ts`
- **Util**: `xxxUtils.ts`

#### ディレクトリ構造
```
src/
├── containers/     # 状態管理・ロジック
├── components/     # プレゼンテーション
├── hooks/          # カスタムフック
├── utils/          # ユーティリティ
├── types/          # 型定義
└── __tests__/      # テストファイル
```

### 7.2 実装パターン

#### Container/Component パターン
```typescript
// Container: 状態とロジック
const TaskContainer: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const handleCreate = useCallback(...) // ロジック
  
  return <TaskComponent tasks={tasks} onCreate={handleCreate} />
}

// Component: UIのみ
const TaskComponent: React.FC<Props> = ({ tasks, onCreate }) => {
  return <div>...</div> // UI描画のみ
}
```

#### カスタムフック分離
```typescript
// ロジック分離
const useTaskLogic = () => {
  const [state, setState] = useState(...)
  const operations = useMemo(() => ({
    create: ...,
    update: ...,
    delete: ...
  }), [])
  
  return { state, operations }
}
```

---

## 8. 最終チェックリスト

### 8.1 機能要件
- [ ] 既存の全機能が正常動作
- [ ] タスク作成・編集・削除
- [ ] プロジェクト管理
- [ ] タイムライン表示・操作
- [ ] 複数選択・ドラッグ操作
- [ ] キーボードショートカット

### 8.2 非機能要件
- [ ] メモリ使用量30%削減達成
- [ ] 初期レンダリング時間20%短縮
- [ ] 最大ファイルサイズ400行以下
- [ ] ESLint警告50%削減

### 8.3 品質要件
- [ ] ユニットテストカバレッジ維持
- [ ] E2Eテスト全通過
- [ ] TypeScript型エラー0件
- [ ] パフォーマンステスト通過

### 8.4 ドキュメント更新
- [ ] CLAUDE.md 更新
- [ ] sequence-diagrams.md 更新
- [ ] README.md 更新
- [ ] API仕様書更新

---

## 9. 承認・レビュー

### 9.1 レビュー体制
- **設計レビュー**: 各フェーズ開始前
- **コードレビュー**: 各ステップ完了時
- **最終レビュー**: 全フェーズ完了時

### 9.2 承認プロセス
1. **技術レビュー**: 実装品質・パフォーマンス確認
2. **機能レビュー**: 要件達成・UX確認
3. **最終承認**: プロダクトオーナー承認

---

**作成日**: 2025-07-12  
**更新日**: 2025-07-12  
**版数**: v1.0  
**承認者**: [署名欄]