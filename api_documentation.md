# 階層型ToDoリストアプリケーション API ドキュメンテーション

## 概要

このAPIは階層型ToDoリストアプリケーションのバックエンドサービスです。プロジェクトとタスクの管理機能を提供し、タスクの階層構造、期限管理、一括操作などをサポートします。

**基本情報**
- Base URL: `http://localhost:8000`
- プロトコル: HTTP/HTTPS
- データ形式: JSON
- フレームワーク: FastAPI
- データベース: SQLite

## 認証

現在のバージョンでは認証は実装されていません。

## エラーハンドリング

APIは統一されたエラーレスポンス形式を使用します：

```json
{
  "error": "ErrorType",
  "message": "エラーメッセージ",
  "context": {
    "additional_info": "追加情報"
  }
}
```

**一般的なHTTPステータスコード**
- `200`: 成功
- `400`: バリデーションエラー
- `404`: リソースが見つからない
- `500`: サーバー内部エラー

---

## ヘルスチェック

### GET /api/health

アプリケーションの稼働状況を確認します。

**レスポンス**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

## プロジェクト API

### GET /api/projects

全プロジェクトの一覧を取得します。

**レスポンス**
```json
[
  {
    "id": "p1",
    "name": "仕事",
    "color": "#f97316",
    "collapsed": false,
    "created_at": "2024-01-15T10:00:00",
    "updated_at": "2024-01-15T10:00:00"
  }
]
```

### POST /api/projects

新しいプロジェクトを作成します。

**リクエストボディ**
```json
{
  "name": "新しいプロジェクト",
  "color": "#f97316",
  "collapsed": false
}
```

**レスポンス**
```json
{
  "id": "p123",
  "name": "新しいプロジェクト",
  "color": "#f97316",
  "collapsed": false,
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00"
}
```

### GET /api/projects/{project_id}

指定したプロジェクトの詳細を取得します。

**パラメータ**
- `project_id` (string): プロジェクトID

**レスポンス**
```json
{
  "id": "p1",
  "name": "仕事",
  "color": "#f97316",
  "collapsed": false,
  "created_at": "2024-01-15T10:00:00",
  "updated_at": "2024-01-15T10:00:00"
}
```

### PUT /api/projects/{project_id}

プロジェクトの情報を更新します。

**パラメータ**
- `project_id` (string): プロジェクトID

**リクエストボディ**
```json
{
  "name": "更新されたプロジェクト名",
  "color": "#8b5cf6",
  "collapsed": true
}
```

**レスポンス**
```json
{
  "id": "p1",
  "name": "更新されたプロジェクト名",
  "color": "#8b5cf6",
  "collapsed": true,
  "created_at": "2024-01-15T10:00:00",
  "updated_at": "2024-01-15T11:00:00"
}
```

### DELETE /api/projects/{project_id}

プロジェクトを削除します。関連するタスクもすべて削除されます。

**パラメータ**
- `project_id` (string): プロジェクトID

**レスポンス**
```json
{
  "message": "Project deleted successfully"
}
```

---

## タスク API

### GET /api/tasks

タスクの一覧を取得します。

**クエリパラメータ**
- `projectId` (string, optional): 特定のプロジェクトのタスクのみを取得

**レスポンス**
```json
[
  {
    "id": "t1",
    "name": "緊急プロジェクト提案書",
    "project_id": "p1",
    "parent_id": null,
    "completed": false,
    "start_date": "2024-01-15T10:00:00",
    "due_date": "2024-01-16T18:00:00",
    "completion_date": null,
    "notes": "最優先タスク",
    "assignee": "自分",
    "level": 0,
    "collapsed": false,
    "created_at": "2024-01-15T10:00:00",
    "updated_at": "2024-01-15T10:00:00"
  }
]
```

### POST /api/tasks

新しいタスクを作成します。

**リクエストボディ**
```json
{
  "name": "新しいタスク",
  "project_id": "p1",
  "parent_id": "t1",
  "completed": false,
  "start_date": "2024-01-15T10:00:00",
  "due_date": "2024-01-20T18:00:00",
  "notes": "タスクの詳細",
  "assignee": "自分",
  "level": 1,
  "collapsed": false
}
```

**レスポンス**
```json
{
  "id": "t123",
  "name": "新しいタスク",
  "project_id": "p1",
  "parent_id": "t1",
  "completed": false,
  "start_date": "2024-01-15T10:00:00",
  "due_date": "2024-01-20T18:00:00",
  "completion_date": null,
  "notes": "タスクの詳細",
  "assignee": "自分",
  "level": 1,
  "collapsed": false,
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00"
}
```

### GET /api/tasks/{task_id}

指定したタスクの詳細を取得します。

**パラメータ**
- `task_id` (string): タスクID

**レスポンス**
```json
{
  "id": "t1",
  "name": "緊急プロジェクト提案書",
  "project_id": "p1",
  "parent_id": null,
  "completed": false,
  "start_date": "2024-01-15T10:00:00",
  "due_date": "2024-01-16T18:00:00",
  "completion_date": null,
  "notes": "最優先タスク",
  "assignee": "自分",
  "level": 0,
  "collapsed": false,
  "created_at": "2024-01-15T10:00:00",
  "updated_at": "2024-01-15T10:00:00"
}
```

### PUT /api/tasks/{task_id}

タスクの情報を更新します。

**パラメータ**
- `task_id` (string): タスクID

**リクエストボディ**
```json
{
  "name": "更新されたタスク名",
  "completed": true,
  "completion_date": "2024-01-15T15:00:00",
  "notes": "完了しました"
}
```

**レスポンス**
```json
{
  "id": "t1",
  "name": "更新されたタスク名",
  "project_id": "p1",
  "parent_id": null,
  "completed": true,
  "start_date": "2024-01-15T10:00:00",
  "due_date": "2024-01-16T18:00:00",
  "completion_date": "2024-01-15T15:00:00",
  "notes": "完了しました",
  "assignee": "自分",
  "level": 0,
  "collapsed": false,
  "created_at": "2024-01-15T10:00:00",
  "updated_at": "2024-01-15T15:00:00"
}
```

### DELETE /api/tasks/{task_id}

タスクを削除します。子タスクも一緒に削除されます。

**パラメータ**
- `task_id` (string): タスクID

**レスポンス**
```json
{
  "message": "Task deleted successfully"
}
```

### POST /api/tasks/batch

複数のタスクに対して一括操作を実行します。

**リクエストボディ**
```json
{
  "operation": "complete",
  "task_ids": ["t1", "t2", "t3"]
}
```

**操作タイプ**
- `complete`: 一括完了
- `incomplete`: 一括未完了
- `delete`: 一括削除

**レスポンス**
```json
{
  "message": "Batch operation 'complete' completed successfully",
  "affected_count": 3,
  "task_ids": ["t1", "t2", "t3"]
}
```

### GET /api/tasks/{task_id}/hierarchy

指定したタスクの階層構造（子タスク含む）を取得します。

**パラメータ**
- `task_id` (string): ルートタスクのID

**レスポンス**
```json
[
  {
    "id": "t1",
    "name": "親タスク",
    "project_id": "p1",
    "parent_id": null,
    "level": 0,
    "children": [
      {
        "id": "t2",
        "name": "子タスク1",
        "project_id": "p1",
        "parent_id": "t1",
        "level": 1,
        "children": []
      }
    ]
  }
]
```

### GET /api/stats

アプリケーションの統計情報を取得します。

**レスポンス**
```json
{
  "projects": {
    "total": 3,
    "active": 2
  },
  "tasks": {
    "total": 12,
    "completed": 4,
    "pending": 8,
    "root_tasks": 5,
    "child_tasks": 7
  }
}
```

---

## データ構造

### Project

```typescript
interface Project {
  id: string
  name: string
  color: string           // hex color code (例: "#f97316")
  collapsed: boolean
  created_at?: string     // ISO 8601 形式
  updated_at?: string     // ISO 8601 形式
}
```

### Task

```typescript
interface Task {
  id: string
  name: string
  project_id: string
  parent_id: string | null  // 親タスクのID（ルートタスクの場合はnull）
  completed: boolean
  start_date: string        // ISO 8601 形式
  due_date: string          // ISO 8601 形式
  completion_date?: string | null  // ISO 8601 形式
  notes: string
  assignee: string
  level: number            // 階層レベル（0がルート）
  collapsed: boolean       // 子タスクの折りたたみ状態
  created_at?: string      // ISO 8601 形式
  updated_at?: string      // ISO 8601 形式
}
```

---

## 使用例（JavaScript）

### プロジェクト操作

```javascript
// プロジェクト作成
const createProject = async () => {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: '新しいプロジェクト',
      color: '#f97316',
      collapsed: false
    })
  });
  
  const project = await response.json();
  console.log('作成されたプロジェクト:', project);
  return project;
};

// プロジェクト一覧取得
const getProjects = async () => {
  const response = await fetch('/api/projects');
  const projects = await response.json();
  console.log('プロジェクト一覧:', projects);
  return projects;
};
```

### タスク操作

```javascript
// タスク作成
const createTask = async (projectId) => {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'タスク名',
      project_id: projectId,
      parent_id: null,
      completed: false,
      start_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1週間後
      notes: 'タスクの詳細',
      assignee: '自分',
      level: 0,
      collapsed: false
    })
  });
  
  const task = await response.json();
  console.log('作成されたタスク:', task);
  return task;
};

// プロジェクトのタスク一覧取得
const getProjectTasks = async (projectId) => {
  const response = await fetch(`/api/tasks?projectId=${projectId}`);
  const tasks = await response.json();
  console.log('プロジェクトのタスク:', tasks);
  return tasks;
};

// タスク更新
const updateTask = async (taskId, updates) => {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates)
  });
  
  const task = await response.json();
  console.log('更新されたタスク:', task);
  return task;
};
```

### 一括操作

```javascript
// タスクの一括完了
const completeTasks = async (taskIds) => {
  const response = await fetch('/api/tasks/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operation: 'complete',
      task_ids: taskIds
    })
  });
  
  const result = await response.json();
  console.log('一括操作結果:', result);
  return result;
};

// タスクの一括削除
const deleteTasks = async (taskIds) => {
  const response = await fetch('/api/tasks/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operation: 'delete',
      task_ids: taskIds
    })
  });
  
  const result = await response.json();
  console.log('一括削除結果:', result);
  return result;
};
```

### 階層構造とその他

```javascript
// タスクの階層構造取得
const getTaskHierarchy = async (taskId) => {
  const response = await fetch(`/api/tasks/${taskId}/hierarchy`);
  const hierarchy = await response.json();
  console.log('タスク階層:', hierarchy);
  return hierarchy;
};

// アプリケーション統計取得
const getStats = async () => {
  const response = await fetch('/api/stats');
  const stats = await response.json();
  console.log('統計情報:', stats);
  return stats;
};

// ヘルスチェック
const healthCheck = async () => {
  const response = await fetch('/api/health');
  const health = await response.json();
  console.log('ヘルス状態:', health);
  return health;
};
```

### エラーハンドリング

```javascript
// エラーハンドリングの例
const handleApiCall = async (apiFunction) => {
  try {
    const result = await apiFunction();
    return { success: true, data: result };
  } catch (error) {
    console.error('API呼び出しエラー:', error);
    return { success: false, error: error.message };
  }
};

// 使用例
const main = async () => {
  // プロジェクト作成
  const projectResult = await handleApiCall(() => createProject());
  if (!projectResult.success) return;
  
  const project = projectResult.data;
  
  // タスク作成
  const task1 = await createTask(project.id);
  const task2 = await createTask(project.id);
  
  // 子タスク作成
  const childTask = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: '子タスク',
      project_id: project.id,
      parent_id: task1.id,
      completed: false,
      start_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      notes: '',
      assignee: '自分',
      level: 1,
      collapsed: false
    })
  }).then(res => res.json());
  
  // 複数タスクの一括完了
  await completeTasks([task2.id, childTask.id]);
  
  // 統計情報確認
  await getStats();
};
```

---

## 注意事項

### 日付形式
- すべての日付フィールドはISO 8601形式の文字列で送受信されます
- 例: `"2024-01-15T10:30:00"`
- フロントエンドではDate型として処理されますが、API通信時は文字列に変換されます

### タスクの階層構造
- `level`: 階層レベル（0がルート、1が第1レベルの子、2が第2レベルの子...）
- `parent_id`: 親タスクのID（ルートタスクの場合はnull）
- 最大階層レベルは10に制限されています
- 子タスクは親タスクが削除されると自動的に削除されます

### カスケード削除
- プロジェクトを削除すると、関連するすべてのタスクも削除されます
- タスクを削除すると、すべての子タスクも削除されます
- 削除操作は元に戻せないため注意が必要です

### ソート
- タスク一覧は期限日（due_date）昇順でソートされます
- 同じ期限日の場合は作成日時順でソートされます
- フロントエンドでは階層構造を維持しながらソートされます

### 一括操作
- 一括操作では子タスクも自動的に同じ状態に更新されます
- 例：親タスクを完了にすると、すべての子タスクも完了になります
- 草稿タスク（`_isDraft: true`）は一括操作の対象外です

### パフォーマンス
- 大量のタスクを扱う場合は、projectIdでフィルタリングして取得することを推奨します
- 一括操作は効率的に実装されており、個別操作より高速です

---

## 開発・デバッグ

### ローカル開発
```bash
# バックエンド起動（ポート8000）
cd backend
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# フロントエンド起動（ポート3000）
cd frontend  
npm run dev
```

### ログ
アプリケーションは詳細なログを出力します：
- API操作ログ
- データ変換ログ
- パフォーマンスログ
- エラーログ

### データベース
- SQLiteデータベースファイル: `backend/todo.db`
- スキーマファイル: `backend/schema.sql`
- 初期化時に自動的にサンプルデータが作成されます

### CORS設定
開発環境では以下のオリジンからのアクセスが許可されています：
- `http://localhost:3000`
- `http://127.0.0.1:3000`

このAPIドキュメンテーションを参考に、階層型ToDoリストアプリケーションの開発・統合を進めてください。