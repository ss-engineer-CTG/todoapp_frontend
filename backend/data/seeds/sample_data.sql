-- サンプルデータ（将来の拡張用）
-- システムプロンプト準拠：YAGNI原則により現在は使用しない

-- 追加プロジェクトサンプル（コメントアウト）
-- INSERT OR IGNORE INTO projects (id, name, color) VALUES
-- ('p4', 'テンプレート機能', '#ec4899'),
-- ('p5', 'タイムライン機能', '#14b8a6');

-- 追加タスクサンプル（コメントアウト）
-- INSERT OR IGNORE INTO tasks (id, name, project_id, parent_id, completed, start_date, due_date, notes, assignee, level) VALUES
-- ('t13', 'テンプレート設計', 'p4', NULL, FALSE, datetime('now'), datetime('now', '+14 days'), '将来機能', '自分', 0),
-- ('t14', 'タイムライン設計', 'p5', NULL, FALSE, datetime('now'), datetime('now', '+21 days'), '将来機能', '自分', 0);