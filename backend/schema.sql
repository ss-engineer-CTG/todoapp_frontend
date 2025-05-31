-- システムプロンプト準拠：階層型ToDoリストアプリケーション データベーススキーマ
-- 修正内容：多様なテストケース用データ追加

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

-- システムプロンプト準拠：基本プロジェクトデータ
INSERT OR IGNORE INTO projects (id, name, color) VALUES
('p1', '仕事', '#f97316'),
('p2', '個人', '#8b5cf6'),
('p3', '学習', '#10b981'),
('p4', 'テスト用プロジェクト', '#ef4444');

-- システムプロンプト準拠：基本タスクデータ（ショートカット機能テスト用）
INSERT OR IGNORE INTO tasks (id, name, project_id, parent_id, completed, start_date, due_date, notes, assignee, level) VALUES
-- 仕事プロジェクト
('t1', 'プロジェクト提案書を完成させる', 'p1', NULL, FALSE, datetime('now'), datetime('now', '+3 days'), '予算見積もりとスケジュールを含める', '自分', 0),
('t2', '競合他社の調査', 'p1', 't1', FALSE, datetime('now'), datetime('now', '+2 days'), '価格と機能に焦点を当てる', '自分', 1),
('t3', 'プレゼンテーションスライドの作成', 'p1', 't1', FALSE, datetime('now'), datetime('now', '+3 days'), '会社のテンプレートを使用する', '自分', 1),

-- 個人プロジェクト
('t4', '食料品の買い物', 'p2', NULL, FALSE, datetime('now'), datetime('now'), '牛乳と卵を忘れないように', '自分', 0),

-- 学習プロジェクト
('t5', 'Reactを学ぶ', 'p3', NULL, FALSE, datetime('now'), datetime('now', '+7 days'), 'オンラインコースを完了する', '自分', 0),
('t6', '練習プロジェクトの構築', 'p3', 't5', FALSE, datetime('now'), datetime('now', '+10 days'), 'ReactでTodoアプリを作る', '自分', 1);

-- システムプロンプト準拠：テスト用データ（不具合検出用）
-- ショートカット機能テスト用の階層構造データ
INSERT OR IGNORE INTO tasks (id, name, project_id, parent_id, completed, start_date, due_date, notes, assignee, level) VALUES
-- 多階層テストデータ（階層深度テスト）
('test_root1', 'ルートタスク1', 'p4', NULL, FALSE, datetime('now'), datetime('now', '+1 days'), 'Enterキーテスト用', '自分', 0),
('test_root2', 'ルートタスク2', 'p4', NULL, FALSE, datetime('now'), datetime('now', '+2 days'), 'Enterキーテスト用', '自分', 0),

-- 階層構造テスト（Tabキーテスト用）
('test_l1_1', 'レベル1タスクA', 'p4', 'test_root1', FALSE, datetime('now'), datetime('now', '+1 days'), 'Tabキーテスト用', '自分', 1),
('test_l1_2', 'レベル1タスクB', 'p4', 'test_root1', FALSE, datetime('now'), datetime('now', '+1 days'), 'Tabキーテスト用', '自分', 1),

('test_l2_1', 'レベル2タスクA-1', 'p4', 'test_l1_1', FALSE, datetime('now'), datetime('now', '+1 days'), '深い階層テスト', '自分', 2),
('test_l2_2', 'レベル2タスクA-2', 'p4', 'test_l1_1', FALSE, datetime('now'), datetime('now', '+1 days'), '深い階層テスト', '自分', 2),

('test_l3_1', 'レベル3タスクA-1-1', 'p4', 'test_l2_1', FALSE, datetime('now'), datetime('now', '+1 days'), '最深階層テスト', '自分', 3),

-- 完了済みタスク混在テスト
('test_completed1', '完了済みタスク1', 'p4', NULL, TRUE, datetime('now', '-2 days'), datetime('now', '-1 days'), '完了状態テスト', '自分', 0),
('test_completed2', '完了済み子タスク', 'p4', 'test_completed1', TRUE, datetime('now', '-2 days'), datetime('now', '-1 days'), '完了状態テスト', '自分', 1),

-- システムプロンプト準拠：エッジケーステストデータ
-- 空名前タスク（要件①テスト用）
('test_empty1', '', 'p4', NULL, FALSE, datetime('now'), datetime('now', '+1 days'), '空名前タスクテスト', '自分', 0),
('test_empty2', '', 'p4', 'test_empty1', FALSE, datetime('now'), datetime('now', '+1 days'), '空名前子タスクテスト', '自分', 1),

-- 長い名前のタスク
('test_long1', 'これは非常に長いタスク名のテストです。長いタスク名がUIで適切に表示されるかどうかを確認するためのテストデータです。', 'p4', NULL, FALSE, datetime('now'), datetime('now', '+1 days'), '長い名前テスト', '自分', 0),

-- 特殊文字を含むタスク
('test_special1', 'タスク名 / 特殊文字 & テスト < > " '' \\ ? * | : #', 'p4', NULL, FALSE, datetime('now'), datetime('now', '+1 days'), '特殊文字 & HTML < > " '' テスト', '自分', 0),

-- 折りたたみテスト用データ（多数の子タスク）
('test_collapse1', '折りたたみテスト親タスク', 'p4', NULL, FALSE, datetime('now'), datetime('now', '+5 days'), '折りたたみ機能テスト', '自分', 0);

-- 折りたたみテスト用の多数の子タスク
INSERT OR IGNORE INTO tasks (id, name, project_id, parent_id, completed, start_date, due_date, notes, assignee, level) VALUES
('test_child_1', '子タスク1', 'p4', 'test_collapse1', FALSE, datetime('now'), datetime('now', '+1 days'), '子タスク1', '自分', 1),
('test_child_2', '子タスク2', 'p4', 'test_collapse1', FALSE, datetime('now'), datetime('now', '+1 days'), '子タスク2', '自分', 1),
('test_child_3', '子タスク3', 'p4', 'test_collapse1', FALSE, datetime('now'), datetime('now', '+1 days'), '子タスク3', '自分', 1),
('test_child_4', '子タスク4', 'p4', 'test_collapse1', FALSE, datetime('now'), datetime('now', '+1 days'), '子タスク4', '自分', 1),
('test_child_5', '子タスク5', 'p4', 'test_collapse1', FALSE, datetime('now'), datetime('now', '+1 days'), '子タスク5', '自分', 1),
('test_child_6', '子タスク6', 'p4', 'test_collapse1', FALSE, datetime('now'), datetime('now', '+1 days'), '子タスク6', '自分', 1),
('test_child_7', '子タスク7', 'p4', 'test_collapse1', FALSE, datetime('now'), datetime('now', '+1 days'), '子タスク7', '自分', 1),
('test_child_8', '子タスク8', 'p4', 'test_collapse1', FALSE, datetime('now'), datetime('now', '+1 days'), '子タスク8', '自分', 1),
('test_child_9', '子タスク9', 'p4', 'test_collapse1', FALSE, datetime('now'), datetime('now', '+1 days'), '子タスク9', '自分', 1),
('test_child_10', '子タスク10', 'p4', 'test_collapse1', FALSE, datetime('now'), datetime('now', '+1 days'), '子タスク10', '自分', 1);

-- システムプロンプト準拠：複数選択テスト用データ
INSERT OR IGNORE INTO tasks (id, name, project_id, parent_id, completed, start_date, due_date, notes, assignee, level) VALUES
('test_multi_1', '複数選択テスト1', 'p4', NULL, FALSE, datetime('now'), datetime('now', '+1 days'), '複数選択テスト', '自分', 0),
('test_multi_2', '複数選択テスト2', 'p4', NULL, FALSE, datetime('now'), datetime('now', '+2 days'), '複数選択テスト', '自分', 0),
('test_multi_3', '複数選択テスト3', 'p4', NULL, FALSE, datetime('now'), datetime('now', '+3 days'), '複数選択テスト', '自分', 0),
('test_multi_4', '複数選択テスト4', 'p4', NULL, FALSE, datetime('now'), datetime('now', '+4 days'), '複数選択テスト', '自分', 0),
('test_multi_5', '複数選択テスト5', 'p4', NULL, FALSE, datetime('now'), datetime('now', '+5 days'), '複数選択テスト', '自分', 0);

-- システムプロンプト準拠：日付テストデータ
INSERT OR IGNORE INTO tasks (id, name, project_id, parent_id, completed, start_date, due_date, notes, assignee, level) VALUES
-- 過去の日付
('test_date_past', '過去の期限タスク', 'p4', NULL, FALSE, datetime('now', '-7 days'), datetime('now', '-3 days'), '過去の期限テスト', '自分', 0),
-- 今日の日付
('test_date_today', '今日期限タスク', 'p4', NULL, FALSE, datetime('now'), datetime('now'), '今日期限テスト', '自分', 0),
-- 未来の日付
('test_date_future', '未来の期限タスク', 'p4', NULL, FALSE, datetime('now'), datetime('now', '+30 days'), '未来期限テスト', '自分', 0);

-- システムプロンプト準拠：データ整合性テスト
-- 完了日付設定済みのタスク
UPDATE tasks SET completion_date = datetime('now', '-1 days'), updated_at = datetime('now') WHERE id IN ('test_completed1', 'test_completed2');

-- システムプロンプト準拠：ログ用コメント
-- このスキーマは以下の機能テストをサポートします：
-- 1. ショートカットキー（Enter/Tab）によるタスク追加
-- 2. 階層構造の表示と操作
-- 3. 複数選択とバッチ操作
-- 4. 空名前タスクの処理
-- 5. 特殊文字・長い名前の処理
-- 6. 日付フィールドの処理
-- 7. 完了状態の管理
-- 8. 折りたたみ機能