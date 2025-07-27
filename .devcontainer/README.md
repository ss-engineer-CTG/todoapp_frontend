# Devcontainer開発環境

このディレクトリには、Todo Appの開発用Devcontainer設定が含まれています。

## 環境構成

- **Base OS**: Ubuntu 22.04
- **Node.js**: 18.x (LTS)
- **Python**: 3.11.4
- **開発対象**: フロントエンド + バックエンド（Electronは除く）

## 含まれるツール

### Python開発
- Python 3.11.4 (pyenv経由)
- pip, setuptools, wheel (最新版)
- virtualenv, pipenv, poetry
- Black (フォーマッター)
- Flake8 (リンター)
- Ruff (高速リンター)

### Node.js/Frontend開発
- Node.js 18.x + npm
- TypeScript
- ESLint + Prettier
- Vite
- Tailwind CSS サポート

### VSCode拡張機能
- Python開発: ms-python.python, black-formatter, flake8
- TypeScript/React: vscode-typescript-next, eslint
- CSS: vscode-tailwindcss
- ユーティリティ: thunder-client, todo-tree, path-intellisense

## 使用方法

### 1. 初回セットアップ
```bash
# VSCodeでプロジェクトを開く
code /path/to/ToDoApp

# コマンドパレット (Ctrl+Shift+P) で実行:
# "Dev Containers: Reopen in Container"
```

### 2. 開発開始
```bash
# 依存関係のインストール（自動実行済み）
npm run setup

# 開発サーバー起動
npm run dev
```

### 3. 利用可能なポート
- **3000**: フロントエンド (React/Vite)
- **8000**: バックエンド (FastAPI)

## データ永続化

### SQLiteデータベース
- ホストの `backend/todo.db` がコンテナにバインドマウント
- データは永続化され、コンテナ再起動後も保持

### ログファイル
- ホストの `backend/logs/` がコンテナにバインドマウント
- アプリケーションログは永続化

## 開発コマンド

```bash
# フロントエンド開発
cd frontend
npm run dev          # 開発サーバー
npm run build        # ビルド
npm run lint         # ESLint
npm run type-check   # TypeScript型チェック

# バックエンド開発
cd backend
python app.py        # FastAPI開発サーバー
pip install -r requirements.txt  # 依存関係インストール
python -m pytest    # テスト実行
python -m flake8 .   # リント

# 統合開発
npm run dev          # 全サービス同時起動
npm run test         # 全テスト実行
npm run lint         # 全リント実行
```

## トラブルシューティング

### Python環境の問題
```bash
# Python バージョン確認
python --version     # 3.11.4であることを確認

# pyenv 再設定
pyenv rehash
pyenv global 3.11.4
```

### Node.js環境の問題
```bash
# Node.js バージョン確認
node --version       # v18.x.x であることを確認

# npm キャッシュクリア
npm cache clean --force
```

### ポート競合
```bash
# ポート使用状況確認
netstat -tlnp | grep -E ':(3000|8000)'

# プロセス終了
pkill -f "node.*vite"
pkill -f "python.*app.py"
```

## 設定カスタマイズ

### VSCode設定の変更
`devcontainer.json` の `customizations.vscode.settings` セクションを編集

### 追加拡張機能
`devcontainer.json` の `customizations.vscode.extensions` 配列に追加

### ポート設定変更
`devcontainer.json` の `forwardPorts` と `portsAttributes` を編集

## 参考リンク

- [Dev Containers 公式ドキュメント](https://containers.dev/)
- [VSCode Dev Containers 拡張機能](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- [Python in containers](https://code.visualstudio.com/docs/containers/quickstart-python)
- [Node.js in containers](https://code.visualstudio.com/docs/containers/quickstart-node)