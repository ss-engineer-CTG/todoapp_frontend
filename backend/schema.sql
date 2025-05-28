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

-- 初期データ
INSERT OR IGNORE INTO projects (id, name, color) VALUES
('p1', '仕事', '#f97316'),
('p2', '個人', '#8b5cf6'),
('p3', '学習', '#10b981');

INSERT OR IGNORE INTO tasks (id, name, project_id, parent_id, completed, start_date, due_date, notes, assignee, level) VALUES
('t1', 'プロジェクト提案書を完成させる', 'p1', NULL, FALSE, datetime('now'), datetime('now', '+3 days'), '予算見積もりとスケジュールを含める', '自分', 0),
('t2', '競合他社の調査', 'p1', 't1', FALSE, datetime('now'), datetime('now', '+2 days'), '価格と機能に焦点を当てる', '自分', 1),
('t3', 'プレゼンテーションスライドの作成', 'p1', 't1', FALSE, datetime('now'), datetime('now', '+3 days'), '会社のテンプレートを使用する', '自分', 1),
('t4', '食料品の買い物', 'p2', NULL, FALSE, datetime('now'), datetime('now'), '牛乳と卵を忘れないように', '自分', 0),
('t5', 'Reactを学ぶ', 'p3', NULL, FALSE, datetime('now'), datetime('now', '+7 days'), 'オンラインコースを完了する', '自分', 0),
('t6', '練習プロジェクトの構築', 'p3', 't5', FALSE, datetime('now'), datetime('now', '+10 days'), 'ReactでTodoアプリを作る', '自分', 1);