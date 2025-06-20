# 処理シーケンス図

このファイルは階層型ToDoリストアプリケーションの主要な処理フローをmermaid記法のシーケンス図で示しています。

## 1. アプリケーション起動シーケンスcd

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant ElectronMain as Electron Main Process
    participant Backend as Python FastAPI
    participant Frontend as React Frontend
    participant ElectronRenderer as Electron Renderer
    participant Database as SQLite Database

    User->>ElectronMain: アプリケーション起動
    ElectronMain->>ElectronMain: メインプロセス初期化
    ElectronMain->>Backend: Python FastAPIサーバー起動
    Backend->>Database: データベース接続確認
    Database-->>Backend: 接続成功
    Backend-->>ElectronMain: サーバー起動完了 (Port: 8000)
    
    ElectronMain->>Frontend: React開発サーバー起動
    Frontend-->>ElectronMain: フロントエンド起動完了 (Port: 3000)
    
    ElectronMain->>ElectronRenderer: レンダラープロセス作成
    ElectronRenderer->>Frontend: 初期画面ロード要求
    Frontend->>Backend: ヘルスチェック (GET /api/health)
    Backend-->>Frontend: サーバー状態正常
    
    Frontend->>Backend: プロジェクト一覧取得 (GET /api/projects)
    Backend->>Database: プロジェクトデータ取得
    Database-->>Backend: プロジェクトデータ
    Backend-->>Frontend: プロジェクト一覧
    
    Frontend->>Backend: タスク一覧取得 (GET /api/tasks)
    Backend->>Database: タスクデータ取得
    Database-->>Backend: タスクデータ
    Backend-->>Frontend: タスク一覧
    
    Frontend-->>ElectronRenderer: 初期画面表示
    ElectronRenderer-->>User: アプリケーション準備完了
```

## 2. タスク作成処理シーケンス

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant TaskPanel as TaskPanel Component
    participant TaskOperations as useTaskOperations Hook
    participant APIService as API Service
    participant FastAPI as FastAPI Backend
    participant TaskService as Task Service
    participant Database as SQLite Database
    participant AppState as useAppState Hook

    User->>TaskPanel: Enterキー押下 / タスク作成ボタンクリック
    TaskPanel->>TaskOperations: createTask()呼び出し
    TaskOperations->>TaskOperations: 新規タスクデータ生成
    
    TaskOperations->>APIService: createTask(taskData)
    APIService->>FastAPI: POST /api/tasks
    FastAPI->>TaskService: create_task(task_data)
    TaskService->>Database: INSERT INTO tasks
    Database-->>TaskService: 作成されたタスクID
    TaskService-->>FastAPI: 作成されたタスクデータ
    FastAPI-->>APIService: HTTP 201 Created
    APIService-->>TaskOperations: 作成成功
    
    TaskOperations->>AppState: タスクリスト更新
    AppState->>TaskPanel: 状態変更通知
    TaskPanel->>TaskPanel: UI再描画
    TaskPanel-->>User: 新しいタスク表示
```

## 3. 階層構造タスク操作シーケンス

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant TaskPanel as TaskPanel Component
    participant KeyboardHook as useKeyboard Hook
    participant TaskOperations as useTaskOperations Hook
    participant APIService as API Service
    participant FastAPI as FastAPI Backend
    participant Database as SQLite Database

    User->>TaskPanel: Tabキー押下（子タスク作成）
    TaskPanel->>KeyboardHook: handleKeyDown(Tab)
    KeyboardHook->>TaskOperations: createSubTask(parentId)
    
    TaskOperations->>APIService: createTask({parentId, ...taskData})
    APIService->>FastAPI: POST /api/tasks
    FastAPI->>Database: INSERT INTO tasks (parent_id設定)
    Database-->>FastAPI: 子タスク作成完了
    FastAPI-->>APIService: 作成されたタスク
    APIService-->>TaskOperations: 作成成功
    
    TaskOperations->>TaskOperations: 階層構造更新
    TaskOperations-->>TaskPanel: UI更新
    TaskPanel-->>User: 子タスク表示（インデント付き）
```

## 4. タスク完了処理シーケンス

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant TaskPanel as TaskPanel Component
    participant TaskOperations as useTaskOperations Hook
    participant APIService as API Service
    participant FastAPI as FastAPI Backend
    participant TaskService as Task Service
    participant Database as SQLite Database

    User->>TaskPanel: スペースキー押下 / チェックボックスクリック
    TaskPanel->>TaskOperations: toggleTaskComplete(taskId)
    
    TaskOperations->>APIService: updateTask(taskId, {completed: true})
    APIService->>FastAPI: PUT /api/tasks/{taskId}
    FastAPI->>TaskService: update_task(task_id, update_data)
    
    TaskService->>Database: UPDATE tasks SET completed = true
    TaskService->>Database: 子タスクの完了状態確認
    Database-->>TaskService: 子タスク一覧
    TaskService->>TaskService: 子タスク自動完了処理
    TaskService->>Database: 子タスクも完了に更新
    
    Database-->>TaskService: 更新完了
    TaskService-->>FastAPI: 更新されたタスクデータ
    FastAPI-->>APIService: HTTP 200 OK
    APIService-->>TaskOperations: 更新成功
    
    TaskOperations->>TaskOperations: ローカル状態更新
    TaskOperations-->>TaskPanel: UI更新通知
    TaskPanel-->>User: 完了状態表示（チェックマーク + 子タスクも完了）
```

## 5. タイムライン表示・ドラッグ操作シーケンス

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant TimelineView as TimelineView Component
    participant TimelineHook as useTimeline Hook
    participant DragHook as useTaskDrag Hook
    participant APIService as API Service
    participant FastAPI as FastAPI Backend
    participant Database as SQLite Database

    User->>TimelineView: タイムラインタブ選択
    TimelineView->>TimelineHook: initializeTimeline()
    TimelineHook->>APIService: getAllTasks()
    APIService->>FastAPI: GET /api/tasks
    FastAPI->>Database: SELECT * FROM tasks
    Database-->>FastAPI: タスクデータ
    FastAPI-->>APIService: タスク一覧
    APIService-->>TimelineHook: タスクデータ
    
    TimelineHook->>TimelineView: タイムライン描画データ生成
    TimelineView-->>User: ガントチャート表示
    
    Note over User, TimelineView: ドラッグ&ドロップ操作
    User->>TimelineView: タスクバードラッグ開始
    TimelineView->>DragHook: handleDragStart(taskId)
    User->>TimelineView: 新しい日付位置にドロップ
    TimelineView->>DragHook: handleDrop(taskId, newDate)
    
    DragHook->>APIService: updateTask(taskId, {startDate: newDate})
    APIService->>FastAPI: PUT /api/tasks/{taskId}
    FastAPI->>Database: UPDATE tasks SET start_date = ?
    Database-->>FastAPI: 更新完了
    FastAPI-->>APIService: 更新されたタスク
    APIService-->>DragHook: 更新成功
    
    DragHook->>TimelineHook: タイムラインデータ更新
    TimelineHook->>TimelineView: 再描画
    TimelineView-->>User: 新しい位置にタスクバー表示
```

## 6. プロジェクト作成・切り替えシーケンス

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant ProjectPanel as ProjectPanel Component
    participant AppState as useAppState Hook
    participant APIService as API Service
    participant FastAPI as FastAPI Backend
    participant Database as SQLite Database
    participant TaskPanel as TaskPanel Component

    User->>ProjectPanel: 新規プロジェクト作成
    ProjectPanel->>APIService: createProject(projectData)
    APIService->>FastAPI: POST /api/projects
    FastAPI->>Database: INSERT INTO projects
    Database-->>FastAPI: 作成されたプロジェクト
    FastAPI-->>APIService: プロジェクトデータ
    APIService-->>ProjectPanel: 作成成功
    
    ProjectPanel->>AppState: プロジェクト一覧更新
    AppState-->>ProjectPanel: 状態更新
    ProjectPanel-->>User: 新しいプロジェクト表示
    
    Note over User, TaskPanel: プロジェクト切り替え
    User->>ProjectPanel: プロジェクト選択
    ProjectPanel->>AppState: setSelectedProject(projectId)
    AppState->>APIService: getTasks(projectId)
    APIService->>FastAPI: GET /api/tasks?projectId={id}
    FastAPI->>Database: SELECT * FROM tasks WHERE project_id = ?
    Database-->>FastAPI: 該当プロジェクトのタスク
    FastAPI-->>APIService: タスクデータ
    APIService-->>AppState: 取得成功
    
    AppState->>TaskPanel: 選択プロジェクト変更通知
    TaskPanel-->>User: 該当プロジェクトのタスク一覧表示
```

## 7. エラーハンドリングシーケンス

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Frontend as Frontend Component
    participant APIService as API Service
    participant FastAPI as FastAPI Backend
    participant Database as SQLite Database

    User->>Frontend: 操作実行
    Frontend->>APIService: API呼び出し
    APIService->>FastAPI: HTTP Request
    FastAPI->>Database: データベース操作
    Database-->>FastAPI: エラー発生
    FastAPI-->>APIService: HTTP 500 Internal Server Error
    APIService->>APIService: エラーハンドリング
    APIService-->>Frontend: エラー情報
    Frontend->>Frontend: エラー表示
    Frontend-->>User: エラーメッセージ表示
```

これらのシーケンス図は、アプリケーションの主要な処理フローを示しており、各コンポーネント間の相互作用を理解するのに役立ちます。