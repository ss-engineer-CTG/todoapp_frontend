# 階層型ToDoリストアプリケーション

プロジェクトベースの階層的なタスク管理を提供するデスクトップアプリケーションです。React + Vite（フロントエンド）、Python + FastAPI + SQLite（バックエンド）、Electron（デスクトップアプリ）で構築されています。

![アプリケーションスクリーンショット](docs/images/screenshot.png)

## ✨ 特徴

- **🌳 階層的タスク管理**: 親タスクの下に子タスクを無制限に作成可能
- **📁 プロジェクト管理**: タスクをプロジェクト単位で整理・カラーコーディング
- **⌨️ キーボードショートカット**: 効率的な操作のための豊富なショートカット
- **🔄 複数選択**: 複数タスクの一括操作に対応
- **🌙 ダークモード**: ライト/ダークテーマの自動切り替え
- **🇯🇵 日本語対応**: 完全な日本語インターフェース
- **💾 ローカルデータ**: SQLiteによる高速でプライベートなデータ管理
- **📱 レスポンシブUI**: 様々な画面サイズに対応した3パネルレイアウト

## 🚀 クイックスタート

### 前提条件

以下のソフトウェアがインストールされている必要があります：

- [Node.js](https://nodejs.org/) (v16.0.0以上)
- [Python](https://www.python.org/) (v3.8以上)
- [Git](https://git-scm.com/)

### インストール

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/your-username/hierarchical-todo-app.git
   cd hierarchical-todo-app
   ```

2. **依存関係のインストール**
   ```bash
   # ルートの依存関係
   npm install
   
   # フロントエンドの依存関係
   cd frontend
   npm install
   cd ..
   
   # バックエンドの依存関係
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

3. **開発サーバーの起動**
   ```bash
   npm run dev
   ```

   または、個別に起動する場合：
   ```bash
   # ターミナル1: バックエンド
   npm run dev:backend
   
   # ターミナル2: フロントエンド
   npm run dev:frontend
   
   # ターミナル3: Electron
   npm run dev:electron
   ```

## 📁 プロジェクト構造

```
todo-app/
├── 📂 frontend/                    # React + Vite フロントエンド
│   ├── 📂 src/
│   │   ├── 📂 components/          # UIコンポーネント
│   │   ├── 📂 hooks/               # カスタムフック
│   │   ├── 📂 utils/               # ユーティリティ関数
│   │   ├── 📂 styles/              # スタイルシート
│   │   ├── 📄 types.ts             # TypeScript型定義
│   │   └── 📄 TodoApp.tsx          # メインアプリコンポーネント
│   ├── 📄 package.json
│   ├── 📄 vite.config.js
│   └── 📄 tsconfig.json
├── 📂 backend/                     # Python + FastAPI バックエンド
│   ├── 📄 app.py                   # メインAPIアプリケーション
│   ├── 📄 schema.sql               # データベーススキーマ
│   └── 📄 requirements.txt         # Python依存関係
├── 📂 electron/                    # Electron メインプロセス
│   ├── 📄 main.js                  # メインプロセス
│   └── 📄 preload.js               # プリロードスクリプト
├── 📂 dist/                        # ビルド出力（自動生成）
├── 📄 package.json                 # プロジェクト設定
└── 📄 README.md                    # このファイル
```

## 🎯 主要機能

### プロジェクト管理
- ✅ プロジェクトの作成・編集・削除
- 🎨 8色のカラーパレットからプロジェクトカラーを選択
- 📊 プロジェクト単位でのタスク表示とフィルタリング
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
- `GET /api/health` - ヘルスチェック
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

#### 1. ポート競合エラー

**問題**: `Error: listen EADDRINUSE: address already in use :::3000`

**解決方法**:
```bash
# 使用中のプロセスを確認
lsof -ti:3000
lsof -ti:8000

# プロセスを停止
kill -9 <PID>
```

#### 2. Python依存関係エラー

**問題**: `ModuleNotFoundError: No module named 'fastapi'`

**解決方法**:
```bash
cd backend
pip install --upgrade pip
pip install -r requirements.txt
```

#### 3. Node.js依存関係エラー

**問題**: `Cannot resolve dependency`

**解決方法**:
```bash
# node_modules を削除して再インストール
rm -rf node_modules frontend/node_modules
npm install
cd frontend && npm install
```

#### 4. データベース接続エラー

**問題**: `sqlite3.OperationalError: database is locked`

**解決方法**:
```bash
# Pythonプロセスを停止
pkill -f "python app.py"

# データベースファイルの権限確認
ls -la backend/todo.db
```

#### 5. Electron起動エラー

**問題**: `Error: Electron failed to install correctly`

**解決方法**:
```bash
# Electronを再インストール
npm uninstall electron
npm install electron --save-dev
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