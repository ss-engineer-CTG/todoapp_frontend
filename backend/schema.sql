-- システムプロンプト準拠：階層型ToDoリストアプリケーション データベーススキーマ
-- 修正内容：期限日を要求仕様に合わせて調整、SQL構文エラーを修正

-- プロジェクトテーブル
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    collapsed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- タスクテーブル
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

-- インデックス
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_level ON tasks(level);
-- システムプロンプト準拠：新しい表示順序要求に対応するインデックス追加
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_level_due_date ON tasks(level, due_date);

-- システムプロンプト準拠：基本プロジェクトデータ
INSERT OR IGNORE INTO projects (id, name, color) VALUES
('p1', '仕事', '#f97316'),
('p2', '個人', '#8b5cf6'),
('p3', '学習', '#10b981'),
('p4', 'テスト用プロジェクト', '#ef4444');

-- システムプロンプト準拠：表示順序テスト用データ（期限日調整）
INSERT OR IGNORE INTO tasks (id, name, project_id, parent_id, completed, start_date, due_date, notes, assignee, level) VALUES
-- 仕事プロジェクト（レベル0タスクの期限日順序をテスト）
('t1', '緊急プロジェクト提案書', 'p1', NULL, FALSE, datetime('now'), datetime('now', '+1 days'), '最優先タスク', '自分', 0),
('t2', '競合他社の調査', 'p1', 't1', FALSE, datetime('now'), datetime('now', '+2 days'), '価格と機能に焦点', '自分', 1),
('t3', 'プレゼンテーション準備', 'p1', 't1', FALSE, datetime('now'), datetime('now', '+3 days'), 'スライド作成', '自分', 1),

('t4', '通常業務レポート', 'p1', NULL, FALSE, datetime('now'), datetime('now', '+5 days'), '週次レポート', '自分', 0),
('t5', 'データ収集', 'p1', 't4', FALSE, datetime('now'), datetime('now', '+4 days'), '統計データ', '自分', 1),
('t6', 'レポート執筆', 'p1', 't4', FALSE, datetime('now'), datetime('now', '+5 days'), 'グラフ作成含む', '自分', 1),

-- 個人プロジェクト
('t7', '食料品の買い物', 'p2', NULL, FALSE, datetime('now'), datetime('now'), '牛乳と卵', '自分', 0),
('t8', '家計簿整理', 'p2', NULL, FALSE, datetime('now'), datetime('now', '+2 days'), '月末締め', '自分', 0),

-- 学習プロジェクト（階層テスト）
('t9', 'React学習', 'p3', NULL, FALSE, datetime('now'), datetime('now', '+7 days'), 'オンラインコース', '自分', 0),
('t10', '基礎概念理解', 'p3', 't9', FALSE, datetime('now'), datetime('now', '+3 days'), 'JSX、コンポーネント', '自分', 1),
('t11', '実践演習', 'p3', 't9', FALSE, datetime('now'), datetime('now', '+7 days'), 'ToDoアプリ構築', '自分', 1),
('t12', 'デプロイ練習', 'p3', 't11', FALSE, datetime('now'), datetime('now', '+10 days'), 'Vercel使用', '自分', 2);

-- システムプロンプト準拠：表示順序テスト用データ（期限日バラエティ）
INSERT OR IGNORE INTO tasks (id, name, project_id, parent_id, completed, start_date, due_date, notes, assignee, level) VALUES
-- テストプロジェクト（複雑な階層と期限日順序）
('test_urgent', '緊急対応タスク', 'p4', NULL, FALSE, datetime('now'), datetime('now'), '今日期限', '自分', 0),
('test_medium', '中優先度タスク', 'p4', NULL, FALSE, datetime('now'), datetime('now', '+3 days'), '3日後期限', '自分', 0),
('test_low', '低優先度タスク', 'p4', NULL, FALSE, datetime('now'), datetime('now', '+7 days'), '1週間後期限', '自分', 0),

-- 中優先度タスクの子タスク（同階層での期限日順序テスト）
('test_child1', '子タスク（早い期限）', 'p4', 'test_medium', FALSE, datetime('now'), datetime('now', '+1 days'), '子タスク1', '自分', 1),
('test_child2', '子タスク（遅い期限）', 'p4', 'test_medium', FALSE, datetime('now'), datetime('now', '+4 days'), '子タスク2', '自分', 1),
('test_child3', '子タスク（中間期限）', 'p4', 'test_medium', FALSE, datetime('now'), datetime('now', '+2 days'), '子タスク3', '自分', 1),

-- 深い階層テスト
('test_grandchild1', '孫タスク1', 'p4', 'test_child1', FALSE, datetime('now'), datetime('now', '+1 days'), '深い階層', '自分', 2),
('test_grandchild2', '孫タスク2', 'p4', 'test_child2', FALSE, datetime('now'), datetime('now', '+3 days'), '深い階層', '自分', 2),

-- 完了済みタスク混在テスト
('test_completed1', '完了済みタスク1', 'p4', NULL, TRUE, datetime('now', '-2 days'), datetime('now', '-1 days'), '完了状態テスト', '自分', 0),
('test_completed2', '完了済み子タスク', 'p4', 'test_completed1', TRUE, datetime('now', '-2 days'), datetime('now', '-1 days'), '完了状態テスト', '自分', 1);

-- システムプロンプト準拠：データ整合性確保
-- 完了日付設定済みのタスク
UPDATE tasks SET completion_date = datetime('now', '-1 days'), updated_at = datetime('now') WHERE id IN ('test_completed1', 'test_completed2');