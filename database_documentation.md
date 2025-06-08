# 階層型ToDoリストアプリケーション データベースドキュメンテーション

## 概要

階層型ToDoリストアプリケーションは、SQLiteデータベースを使用してプロジェクトとタスクの情報を管理します。このドキュメントでは、データベースの構造、設計原則、操作方法について詳しく説明します。

**データベース仕様**
- データベース種類: SQLite 3
- ファイル場所: `backend/todo.db`
- 文字エンコーディング: UTF-8
- 外部キー制約: 有効
- トランザクション: サポート

---

## データベース設計原則

### 1. 正規化
- 第3正規形まで正規化されています
- データの重複を最小限に抑制
- 参照整合性を維持

### 2. パフォーマンス
- 主要なクエリパターンに対するインデックス最適化
- 複合インデックスによる検索性能向上
- カスケード削除による整合性維持

### 3. 拡張性
- 将来的な機能追加を考慮したスキーマ設計
- 柔軟な階層構造サポート
- タイムスタンプによる変更履歴追跡

---

## テーブル構造

### projects テーブル

プロジェクトの基本情報を管理します。

```sql
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    collapsed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**フィールド詳細**

| フィールド名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|------------|---------|---------|------------|------|
| id | TEXT | NO | - | プロジェクトの一意識別子（例: "p1", "p123"） |
| name | TEXT | NO | - | プロジェクト名 |
| color | TEXT | NO | - | プロジェクトカラー（Hex形式、例: "#f97316"） |
| collapsed | BOOLEAN | YES | FALSE | プロジェクトの折りたたみ状態 |
| created_at | TIMESTAMP | YES | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | YES | CURRENT_TIMESTAMP | 更新日時 |

**制約**
- PRIMARY KEY: `id`
- NOT NULL: `name`, `color`

### tasks テーブル

タスクの詳細情報と階層構造を管理します。

```sql
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    project_id TEXT NOT NULL,
    parent_id TEXT,
    completed BOOLEAN DEFAULT FALSE,
    start_date TIMESTAMP NOT NULL,
    due_date TIMESTAMP NOT NULL,
    completion_date TIMESTAMP,
    notes TEXT DEFAULT '',
    assignee TEXT DEFAULT '自分',
    level INTEGER DEFAULT 0,
    collapsed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
);
```

**フィールド詳細**

| フィールド名 | データ型 | NULL許可 | デフォルト値 | 説明 |
|------------|---------|---------|------------|------|
| id | TEXT | NO | - | タスクの一意識別子（例: "t1", "t123"） |
| name | TEXT | NO | - | タスク名 |
| project_id | TEXT | NO | - | 所属プロジェクトのID |
| parent_id | TEXT | YES | NULL | 親タスクのID（ルートタスクの場合はNULL） |
| completed | BOOLEAN | YES | FALSE | 完了状態 |
| start_date | TIMESTAMP | NO | - | 開始予定日時 |
| due_date | TIMESTAMP | NO | - | 期限日時 |
| completion_date | TIMESTAMP | YES | NULL | 実際の完了日時 |
| notes | TEXT | YES | '' | メモ・備考 |
| assignee | TEXT | YES | '自分' | 担当者 |
| level | INTEGER | YES | 0 | 階層レベル（0=ルート, 1=第1レベル...） |
| collapsed | BOOLEAN | YES | FALSE | 子タスクの折りたたみ状態 |
| created_at | TIMESTAMP | YES | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | YES | CURRENT_TIMESTAMP | 更新日時 |

**制約**
- PRIMARY KEY: `id`
- FOREIGN KEY: `project_id` → `projects(id)` ON DELETE CASCADE
- FOREIGN KEY: `parent_id` → `tasks(id)` ON DELETE CASCADE
- NOT NULL: `name`, `project_id`, `start_date`, `due_date`

---

## インデックス

パフォーマンス最適化のため、以下のインデックスが設定されています。

```sql
-- 単一フィールドインデックス
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_level ON tasks(level);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- 複合インデックス
CREATE INDEX IF NOT EXISTS idx_tasks_level_due_date ON tasks(level, due_date);
```

**インデックス用途**

| インデックス名 | 対象フィールド | 用途 |
|---------------|---------------|------|
| idx_tasks_project_id | project_id | プロジェクト別タスク検索 |
| idx_tasks_parent_id | parent_id | 子タスク検索、階層構造取得 |
| idx_tasks_completed | completed | 完了状態別フィルタリング |
| idx_tasks_level | level | 階層レベル別検索 |
| idx_tasks_due_date | due_date | 期限日ソート |
| idx_tasks_level_due_date | level, due_date | 階層構造＋期限日ソート |

---

## 外部キー制約とカスケード削除

### プロジェクト → タスク
```sql
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
```
- プロジェクトが削除されると、関連するすべてのタスクも自動削除されます

### 親タスク → 子タスク
```sql
FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
```
- 親タスクが削除されると、すべての子タスクも自動削除されます
- 孫タスクも再帰的に削除されます

---

## 初期データ

データベース初期化時に以下のサンプルデータが挿入されます。

### プロジェクト

```sql
INSERT OR IGNORE INTO projects (id, name, color) VALUES
('p1', '仕事', '#f97316'),
('p2', '個人', '#8b5cf6'),
('p3', '学習', '#10b981');
```

### タスク

```sql
-- 仕事プロジェクト
INSERT OR IGNORE INTO tasks (id, name, project_id, parent_id, completed, start_date, due_date, notes, assignee, level) VALUES
('t1', '緊急プロジェクト提案書', 'p1', NULL, FALSE, datetime('now'), datetime('now', '+1 days'), '最優先タスク', '自分', 0),
('t2', '競合他社の調査', 'p1', 't1', FALSE, datetime('now'), datetime('now', '+2 days'), '価格と機能に焦点', '自分', 1),
('t3', 'プレゼンテーション準備', 'p1', 't1', FALSE, datetime('now'), datetime('now', '+3 days'), 'スライド作成', '自分', 1),

('t4', '通常業務レポート', 'p1', NULL, FALSE, datetime('now'), datetime('now', '+5 days'), '週次レポート', '自分', 0),
('t5', 'データ収集', 'p1', 't4', FALSE, datetime('now'), datetime('now', '+4 days'), '統計データ', '自分', 1),
('t6', 'レポート執筆', 'p1', 't4', FALSE, datetime('now'), datetime('now', '+5 days'), 'グラフ作成含む', '自分', 1),

-- 個人プロジェクト
('t7', '食料品の買い物', 'p2', NULL, FALSE, datetime('now'), datetime('now'), '牛乳と卵', '自分', 0),
('t8', '家計簿整理', 'p2', NULL, FALSE, datetime('now'), datetime('now', '+2 days'), '月末締め', '自分', 0),

-- 学習プロジェクト
('t9', 'React学習', 'p3', NULL, FALSE, datetime('now'), datetime('now', '+7 days'), 'オンラインコース', '自分', 0),
('t10', '基礎概念理解', 'p3', 't9', FALSE, datetime('now'), datetime('now', '+3 days'), 'JSX、コンポーネント', '自分', 1),
('t11', '実践演習', 'p3', 't9', FALSE, datetime('now'), datetime('now', '+7 days'), 'ToDoアプリ構築', '自分', 1),
('t12', 'デプロイ練習', 'p3', 't11', FALSE, datetime('now'), datetime('now', '+10 days'), 'Vercel使用', '自分', 2);
```

---

## データベース管理クラス

### DatabaseManager クラス

`backend/core/database.py`に実装されているデータベース管理クラスの主要機能：

#### 接続管理

```python
@contextmanager
def get_connection(self) -> Generator[sqlite3.Connection, None, None]:
    """データベース接続の取得（コンテキストマネージャー）"""
    conn = None
    try:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        yield conn
    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        raise DatabaseError(f"Database operation failed: {e}")
    finally:
        if conn:
            conn.close()
```

#### クエリ実行

```python
def execute_query(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """クエリ実行（SELECT用）"""
    
def execute_update(self, query: str, params: tuple = ()) -> int:
    """クエリ実行（INSERT/UPDATE/DELETE用）"""
```

#### 日付フィールド正規化

```python
def _normalize_date_fields(self, row_dict: Dict[str, Any]) -> Dict[str, Any]:
    """SQLiteのTIMESTAMP型をISO 8601形式の文字列に統一"""
```

---

## データベース操作パターン

### 1. プロジェクト操作

#### プロジェクト作成
```python
def create_project(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
    project_id = f"p{int(datetime.now().timestamp() * 1000)}"
    now = datetime.now()
    
    self.db_manager.execute_update(
        """INSERT INTO projects (id, name, color, collapsed, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (project_id, project_data['name'], project_data['color'],
         project_data.get('collapsed', False), now.isoformat(), now.isoformat())
    )
```

#### プロジェクト取得
```python
def get_all_projects(self) -> List[Dict[str, Any]]:
    return self.db_manager.execute_query(
        "SELECT * FROM projects ORDER BY created_at"
    )
```

### 2. タスク操作

#### タスク作成
```python
def create_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
    task_id = f"t{int(datetime.now().timestamp() * 1000)}"
    now = datetime.now()
    
    self.db_manager.execute_update(
        """INSERT INTO tasks (
            id, name, project_id, parent_id, completed, start_date, due_date,
            completion_date, notes, assignee, level, collapsed, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (task_id, task_data['name'], task_data['project_id'], ...)
    )
```

#### タスク階層取得
```python
def get_task_hierarchy(self, task_id: str) -> List[Dict[str, Any]]:
    def get_children(parent_id: str) -> List[Dict[str, Any]]:
        children = self.db_manager.execute_query(
            "SELECT * FROM tasks WHERE parent_id = ? ORDER BY due_date ASC, created_at ASC",
            (parent_id,)
        )
        result = []
        for child in children:
            child['children'] = get_children(child['id'])
            result.append(child)
        return result
    
    root_task = self.get_task_by_id(task_id)
    root_task['children'] = get_children(task_id)
    return [root_task]
```

### 3. 一括操作

#### 一括完了
```python
def batch_update_tasks(self, operation: str, task_ids: List[str]) -> Dict[str, Any]:
    placeholders = ",".join(["?" for _ in task_ids])
    now = datetime.now().isoformat()
    
    if operation == "complete":
        query = f"""UPDATE tasks SET 
                   completed = ?, 
                   completion_date = ?, 
                   updated_at = ? 
                   WHERE id IN ({placeholders})"""
        params = [True, now, now] + task_ids
        affected_rows = self.db_manager.execute_update(query, tuple(params))
```

---

## パフォーマンス最適化

### 1. クエリ最適化

#### インデックス活用例
```sql
-- プロジェクト別タスク取得（インデックス使用）
SELECT * FROM tasks 
WHERE project_id = ? 
ORDER BY due_date ASC, created_at ASC;

-- 階層構造取得（複合インデックス使用）
SELECT * FROM tasks 
WHERE parent_id = ? 
ORDER BY level, due_date ASC;
```

#### 効率的な階層クエリ
```sql
-- 子タスク存在チェック
SELECT COUNT(*) FROM tasks WHERE parent_id = ?;

-- 特定レベルのタスク取得
SELECT * FROM tasks WHERE level = ? AND project_id = ?;
```

### 2. トランザクション管理

#### 一括操作でのトランザクション
```python
with self.db_manager.get_connection() as conn:
    cursor = conn.execute(query, params)
    conn.commit()
    affected_rows = cursor.rowcount
```

### 3. メモリ効率

#### 大量データ処理
```python
# ページネーション対応（将来実装予定）
def get_tasks_paginated(self, offset: int, limit: int) -> List[Dict[str, Any]]:
    return self.db_manager.execute_query(
        "SELECT * FROM tasks ORDER BY due_date LIMIT ? OFFSET ?",
        (limit, offset)
    )
```

---

## データ整合性

### 1. 外部キー制約

SQLiteで外部キー制約を有効化：
```sql
PRAGMA foreign_keys = ON;
```

### 2. データ検証

#### アプリケーションレベル検証
```python
def _validate_task_data(self, task: Dict[str, Any]) -> None:
    required_fields = ['id', 'name', 'project_id']
    for field in required_fields:
        if not task.get(field):
            raise ValidationError(f"Required field '{field}' is missing or empty")
    
    # 日付フィールドの検証
    date_fields = ['start_date', 'due_date']
    for field in date_fields:
        if field in task and task[field]:
            try:
                datetime.fromisoformat(task[field].replace('Z', '+00:00'))
            except ValueError:
                raise ValidationError(f"Invalid date format in {field}: {task[field]}")
```

### 3. データ正規化

#### 日付フィールド正規化
```python
def _normalize_date_fields(self, row_dict: Dict[str, Any]) -> Dict[str, Any]:
    date_fields = ['start_date', 'due_date', 'completion_date', 'created_at', 'updated_at']
    
    for field in date_fields:
        if field in row_dict and row_dict[field] is not None:
            date_value = row_dict[field]
            
            if isinstance(date_value, datetime):
                row_dict[field] = date_value.isoformat()
            elif isinstance(date_value, str):
                try:
                    parsed_date = datetime.fromisoformat(date_value.replace('Z', '+00:00'))
                    row_dict[field] = parsed_date.isoformat()
                except ValueError:
                    row_dict[field] = datetime.now().isoformat()
    
    return row_dict
```

---

## バックアップとリストア

### 1. データベースバックアップ

```bash
# SQLiteデータベースのバックアップ
cp backend/todo.db backend/todo_backup_$(date +%Y%m%d_%H%M%S).db

# SQLダンプ作成
sqlite3 backend/todo.db .dump > backup.sql
```

### 2. データベースリストア

```bash
# バックアップからリストア
cp backend/todo_backup_20240115_120000.db backend/todo.db

# SQLダンプからリストア
sqlite3 backend/todo.db < backup.sql
```

### 3. 自動バックアップスクリプト例

```python
import shutil
from datetime import datetime
from pathlib import Path

def backup_database():
    source = Path("backend/todo.db")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = Path(f"backend/backups/todo_backup_{timestamp}.db")
    
    backup_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, backup_path)
    
    print(f"Database backed up to: {backup_path}")
```

---

## トラブルシューティング

### 1. よくある問題

#### 外部キー制約エラー
```
sqlite3.IntegrityError: FOREIGN KEY constraint failed
```
**解決方法**: 参照先のレコードが存在することを確認

#### ロックエラー
```
sqlite3.OperationalError: database is locked
```
**解決方法**: 接続を適切にクローズ、トランザクションの見直し

#### 日付形式エラー
```
ValueError: Invalid isoformat string
```
**解決方法**: ISO 8601形式での日付文字列使用

### 2. デバッグ方法

#### SQLログ有効化
```python
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# クエリログ出力
logger.debug(f"Executing query: {query} with params: {params}")
```

#### データベース状態確認
```sql
-- テーブル一覧
.tables

-- スキーマ確認
.schema tasks

-- インデックス確認
.indices tasks

-- 外部キー確認
PRAGMA foreign_key_check;
```

---

## 将来的な拡張計画

### 1. パフォーマンス改善
- クエリキャッシュの実装
- 読み取り専用レプリカの検討
- インデックス最適化の継続

### 2. 機能拡張
- タスクのタグ機能
- 添付ファイル管理
- タスクテンプレート
- 履歴・監査ログ

### 3. スケーラビリティ
- PostgreSQLへの移行検討
- 分散データベース対応
- レプリケーション設定

このデータベースドキュメンテーションは、アプリケーションの継続的な開発とメンテナンスに必要な情報を包括的に提供しています。