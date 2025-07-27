# DevContainer で Claude Code CLI を使用するための設定

## 概要

Claude Code は Anthropic が提供するターミナルベースの AI アシスタントです。VSCode extension ではなく、コマンドラインツールとして動作します。

## 設定完了項目

### 1. Dockerfile の更新
- Claude Code CLI (`@anthropic-ai/claude-code`) を npm global パッケージとして追加
- コマンド名: `claude` でアクセス可能

### 2. devcontainer.json の更新
- 起動時メッセージにClaude Code CLI利用可能を追加

## 設定内容

### Dockerfile 変更点
```dockerfile
# Claude Code CLI をグローバルにインストール
RUN npm install -g \
    typescript \
    ts-node \
    @typescript-eslint/parser \
    @typescript-eslint/eslint-plugin \
    eslint \
    prettier \
    vite \
    concurrently \
    wait-on \
    cross-env \
    @anthropic-ai/claude-code \
    && npm update -g npm
```

### devcontainer.json 変更点
```json
{
  "postStartCommand": "echo 'Development environment ready! Claude Code CLI available via: claude'"
}
```

## 使用方法

### 1. DevContainer のリビルド
```bash
# VSCode Command Palette で以下を実行
Dev Containers: Rebuild Container
```

### 2. Claude Code CLI の使用
DevContainer 起動後、以下のコマンドでClaude Code を利用:
```bash
# Claude Code CLI の起動
claude

# ヘルプの表示
claude --help

# バージョン確認
claude --version
```

### 3. 認証設定
Claude Code を使用するには認証が必要です：

#### 方法1: Anthropic Console (推奨)
```bash
claude auth login
```

#### 方法2: 環境変数
```bash
export ANTHROPIC_API_KEY="your_api_key_here"
```

## Claude Code の特徴

- **コードベース理解**: プロジェクト全体の構造を理解
- **ファイル編集**: 直接ファイルを編集可能
- **コマンド実行**: ターミナルコマンドの実行
- **Git 統合**: コミット、PR作成などのGitワークフロー
- **自然言語対話**: 日本語での指示が可能

## 利用例

```bash
# プロジェクト分析
claude "このプロジェクトの構造を説明して"

# バグ修正
claude "TypeError が発生している原因を調べて修正して"

# 機能追加
claude "ユーザー認証機能を追加して"

# Git操作
claude "変更をコミットして、適切なメッセージを付けて"
```

## 注意事項

- Claude Code はCLIツールであり、VSCode extension ではありません
- DevContainer内でのみ利用可能（グローバルインストール済み）
- Anthropic API の利用料金が発生します
- インターネット接続が必要です

## トラブルシューティング

### ❗ 【重要】claude: command not found エラー

#### 問題の詳細
DevContainer内でClaude Code CLIが`bash: claude: command not found`エラーで起動しない場合があります。

#### 根本原因
- **環境の不整合**: DockerfileでNode.js 20.xを設定したが、実際の環境ではnvm管理のNode.js（v22.16.0等）が使用される
- **PATH問題**: Claude Code CLIは正常にインストールされているが、nvmのbinディレクトリがPATHに含まれていない
- **インストール場所**: `/home/gbrai/.nvm/versions/node/vX.X.X/bin/claude` にインストールされるが、PATHに追加されていない

#### 診断手順
```bash
# 1. Claude Code CLIのインストール状況確認
npm list -g --depth=0
# @anthropic-ai/claude-code@1.0.61 が表示されることを確認

# 2. Node.js環境確認
which node && which npm
# nvm管理のパス（/home/gbrai/.nvm/versions/node/vX.X.X/bin/）が表示される

# 3. Claude Code CLIバイナリの存在確認
ls -la /home/gbrai/.nvm/versions/node/*/bin/claude
# シンボリックリンクが存在することを確認

# 4. 直接実行テスト
/home/gbrai/.nvm/versions/node/*/bin/claude --version
# 1.0.61 (Claude Code) が表示されることを確認
```

#### 解決方法

**方法1: PATHを手動で修正（推奨）**
```bash
# 現在のNode.jsバージョンを確認
NODE_VERSION=$(node --version | sed 's/v//')

# PATHに追加（一時的）
export PATH="/home/gbrai/.nvm/versions/node/v$NODE_VERSION/bin:$PATH"

# .bashrcに永続化
echo 'export PATH="/home/gbrai/.nvm/versions/node/v'$NODE_VERSION'/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# 動作確認
claude --version
```

**方法2: 動的PATH設定（より堅牢）**
```bash
# .bashrcに以下を追加（Node.jsバージョンに依存しない）
echo '
# Claude Code CLI PATH設定
if [ -d "$HOME/.nvm/current/bin" ]; then
    export PATH="$HOME/.nvm/current/bin:$PATH"
elif [ -d "$HOME/.nvm/versions/node" ]; then
    LATEST_NODE=$(ls -1 $HOME/.nvm/versions/node | tail -1)
    export PATH="$HOME/.nvm/versions/node/$LATEST_NODE/bin:$PATH"
fi' >> ~/.bashrc

source ~/.bashrc
```

#### 予防策
今後この問題を回避するため、Dockerfileに以下の追加を検討：
```dockerfile
# nvm PATH設定の確実化
RUN echo 'export PATH="$HOME/.nvm/current/bin:$PATH"' >> /home/vscode/.bashrc
```

### 認証エラー
```bash
# 認証状態確認
claude auth status

# 再認証
claude auth logout
claude auth login
```

### 一般的なコマンドが見つからない
```bash
# npm global packages 確認
npm list -g --depth=0

# Claude Code 再インストール
npm install -g @anthropic-ai/claude-code@latest
```