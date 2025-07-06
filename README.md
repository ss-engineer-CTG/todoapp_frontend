# 階層型ToDoリストアプリケーション

モダンで直感的な階層型タスク管理アプリケーション。Electron、React、Python（FastAPI）を使用して構築されたクロスプラットフォーム対応のデスクトップアプリです。

## ✨ 主な機能

### プロジェクト管理
- 📁 プロジェクトの作成・編集・削除
- 🎨 プロジェクト別の色分け管理
- 📊 プロジェクト進捗の可視化
- 📁 プロジェクトの折りたたみ表示

### タスク管理
- 🌳 無制限の階層構造でタスク作成
- ✅ タスクの完了状態管理（親タスク完了時の子タスク自動完了）
- 📅 詳細情報設定（開始日・期限日・メモ・担当者）
- 📋 タスクの折りたたみ表示
- 🏷️ 完了タスクの表示・非表示切り替え

### 効率的な操作
- ⌨️ 豊富なキーボードショートカット
- 🔄 複数タスクの選択と一括操作
- 📋 タスクのコピー&ペースト（階層構造を保持）
- 🔀 エリア間のスムーズなナビゲーション
- 🎯 選択状態の視覚的フィードバック

## ⌨️ キーボードショートカット

| キー | 機能 | 説明 |
|------|------|------|
| `Enter` | 同レベルでタスク追加 | 選択中のタスクと同じ階層に新しいタスクを作成 |
| `Tab` | 子タスク追加 | 選択中のタスクの下に子タスクを作成 |
| `Delete`/`Backspace` | タスク削除 | 選択中のタスクとその子タスクを削除 |
| `Ctrl+C` | タスクコピー | 選択中のタスクとその子タスクをコピー |
| `Ctrl+V` | タスク貼り付け | コピーしたタスクを現在の位置に貼り付け |
| `Space` | 完了状態切り替え | タスクの完了・未完了を切り替え |
| `↑`/`↓` | タスク間移動 | 上下のタスクに移動 |
| `→`/`←` | エリア間移動 | プロジェクト・タスク・詳細エリア間を移動 |
| `Ctrl+→` | 折りたたみ切り替え | タスクの折りたたみ状態を切り替え |
| `Shift+↑`/`↓` | 範囲選択 | 複数のタスクを範囲選択 |
| `Ctrl+クリック` | 複数選択 | 個別のタスクを複数選択 |
| `Ctrl+A` | 全選択 | 表示中のすべてのタスクを選択 |
| `Escape` | 選択解除 | 複数選択モードを解除 |

## 🛠️ 開発

### 前提条件

- **Node.js**: バージョン16.0.0以上
- **npm**: バージョン8.0.0以上
- **Python**: バージョン3.8以上
- **pip**: Python package manager

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/your-username/hierarchical-todo-app.git
cd hierarchical-todo-app

# 依存関係をインストール
npm install

# バックエンドの依存関係をインストール
cd backend
pip install -r requirements.txt
cd ..
```

### 開発環境での起動

```bash
# すべてのサービスを同時起動
npm run dev

# 個別起動の場合
npm run dev:frontend    # フロントエンド (http://localhost:3000)
npm run dev:backend     # バックエンド (http://localhost:8000)
npm run dev:electron    # Electron デスクトップアプリ
```

### API エンドポイント

バックエンドAPI（http://localhost:8000）：

#### ヘルスチェック
- `GET /api/health` - アプリケーション状態確認

#### プロジェクト関連
- `GET /api/projects` - プロジェクト一覧取得
- `POST /api/projects` - プロジェクト作成
- `GET /api/projects/{id}` - プロジェクト詳細取得
- `PUT /api/projects/{id}` - プロジェクト更新
- `DELETE /api/projects/{id}` - プロジェクト削除

#### タスク関連
- `GET /api/tasks` - タスク一覧取得
- `GET /api/tasks?projectId={id}` - 特定プロジェクトのタスク取得
- `POST /api/tasks` - タスク作成
- `GET /api/tasks/{id}` - タスク詳細取得
- `PUT /api/tasks/{id}` - タスク更新
- `DELETE /api/tasks/{id}` - タスク削除
- `POST /api/tasks/batch` - 一括操作

#### その他
- `GET /docs` - API ドキュメント（Swagger UI）

### テスト

```bash
# すべてのテストを実行
npm run test

# 個別実行
npm run test:frontend   # フロントエンドテスト
npm run test:backend    # バックエンドテスト
```

### リント

```bash
npm run lint            # ESLint実行
```

## 📦 ビルド・配布

### 開発ビルド

```bash
npm run build
```

### 本番ビルド（配布用パッケージ作成）

```bash
npm run package
```

配布可能なアプリケーションが `dist/` ディレクトリに生成されます：
- **Windows**: `.exe` インストーラー
- **macOS**: `.dmg` ディスクイメージ
- **Linux**: `.AppImage` ポータブルアプリ

### クリーンアップ

```bash
npm run clean           # ビルド成果物を削除
npm run clean:all       # node_modulesも含めて削除
```

## 🗂️ データ管理

### データベース

アプリケーションはSQLiteデータベースを使用してデータをローカルに保存します：

- **場所**: `backend/todo.db`
- **テーブル**: `projects`, `tasks`
- **関係**: プロジェクト（1）→ タスク（多）、タスク（1）→ サブタスク（多）

### データバックアップ

```bash
# データベースファイルのバックアップ
cp backend/todo.db backup/todo_backup_$(date +%Y%m%d).db
```

### データ復元

```bash
# バックアップからの復元
cp backup/todo_backup_YYYYMMDD.db backend/todo.db
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. アプリケーションが起動しない

**問題**: `npm run dev`実行後、Electronアプリが起動しない

**確認方法**:
```bash
# ポートの使用状況を確認
lsof -ti:3000  # フロントエンド
lsof -ti:8000  # バックエンド

# プロセスの確認
ps aux | grep node
ps aux | grep python
```

**解決方法**:
```bash
# 使用中のプロセスを停止
kill -9 $(lsof -ti:3000)
kill -9 $(lsof -ti:8000)

# 再度起動
npm run dev
```

#### 2. Python依存関係エラー

**問題**: `ModuleNotFoundError: No module named 'fastapi'`

**解決方法**:
```bash
cd backend

# 仮想環境の作成（推奨）
python -m venv venv
source venv/bin/activate  # Mac/Linux
# または
venv\Scripts\activate  # Windows

# 依存関係をインストール
pip install --upgrade pip
pip install -r requirements.txt
```

#### 3. Node.js依存関係エラー

**問題**: `Cannot resolve dependency`

**解決方法**:
```bash
# node_modules を削除して再インストール
npm run clean:node_modules
npm install

# フロントエンドの依存関係も再インストール
cd frontend
npm install
cd ..
```

#### 4. データベース接続エラー

**問題**: `sqlite3.OperationalError: database is locked`

**解決方法**:
```bash
# Pythonプロセスを停止
pkill -f "python app.py"

# データベースファイルの権限確認
ls -la backend/todo.db

# 必要に応じてデータベースを再作成
rm backend/todo.db
npm run dev:backend  # データベースが自動作成される
```

#### 5. ポート競合エラー

**問題**: `Error: listen EADDRINUSE: address already in use`

**解決方法**:
```bash
# Mac/Linux
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

#### 6. Electron起動エラー

**問題**: `Error: Electron failed to install correctly`

**解決方法**:
```bash
# Electronを再インストール
npm uninstall electron
npm install electron --save-dev

# 完全なクリーンインストール（上記で解決しない場合）
npm run clean:all
npm install
```

### 詳細診断

```bash
# システム情報確認
node --version
npm --version
python --version
pip --version

# 起動ログの確認
npm run dev 2>&1 | tee debug.log

# ディスク容量確認
df -h

# メモリ使用状況確認
free -h  # Linux
top      # Mac/Linux
```

### パフォーマンス最適化

#### メモリ使用量の改善

```bash
# Node.jsのメモリ制限を増加
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

#### 起動速度の改善

```bash
# キャッシュのクリア
npm cache clean --force
rm -rf node_modules/.cache

# 並列処理の最適化
# package.jsonでconcurrentlyが並列実行を管理
```

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！

### 開発フロー

1. **Fork** このリポジトリをフォーク
2. **Branch** 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. **Commit** 変更をコミット (`git commit -m 'Add amazing feature'`)
4. **Push** ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. **PR** プルリクエストを作成

### コーディング規約

- **KISS原則**: シンプルな実装を心がける
- **DRY原則**: コードの重複を避ける
- **YAGNI原則**: 必要のない機能は実装しない
- **型安全性**: TypeScriptの型システムを活用
- **ログ出力**: 適切なレベルでのログ出力

### コミットメッセージ

```
種類(スコープ): 簡潔な説明

より詳細な説明（必要に応じて）

- 変更内容1
- 変更内容2

Fixes #123
```

**種類**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント更新
- `style`: スタイル修正
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: その他の変更

## 📝 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

## 👥 開発チーム

- **プロジェクトリード**: [Your Name](mailto:your.email@example.com)
- **フロントエンド**: React/TypeScript開発者
- **バックエンド**: Python/FastAPI開発者
- **デスクトップ**: Electron開発者

## 📞 サポート

### 問題報告

バグを発見した場合や機能要望がある場合は、[Issues](https://github.com/your-username/hierarchical-todo-app/issues) を作成してください。

### セキュリティ

セキュリティに関する問題を発見した場合は、公開のIssueではなく、直接 [security@example.com](mailto:security@example.com) までご連絡ください。

### FAQ

**Q: アプリケーションが起動しない**
A: [トラブルシューティング](#🔧-トラブルシューティング) セクションを確認してください。

**Q: データはどこに保存されますか？**
A: すべてのデータはローカルのSQLiteデータベース（`backend/todo.db`）に保存されます。

**Q: 他のデバイスとデータを同期できますか？**
A: 現在、データ同期機能は実装されていませんが、将来のバージョンで検討予定です。

**Q: カスタムテーマを追加できますか？**
A: 現在はライト/ダークモードのみサポートしていますが、カスタムテーマ機能は将来の拡張候補です。

---

📌 **最新情報**: [リリースノート](CHANGELOG.md) で最新の変更内容を確認できます。

⭐ **このプロジェクトが役に立った場合は、ぜひスターを付けてください！**