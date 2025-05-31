"""
タスクサービス
システムプロンプト準拠：DRY原則、ビジネスロジック集約
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from core.database import DatabaseManager
from core.exceptions import NotFoundError, ValidationError, handle_date_conversion_error
from core.logger import get_logger, log_data_conversion

logger = get_logger(__name__)

class TaskService:
    """タスク操作サービス"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
    
    def get_tasks(self, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        タスク一覧取得
        システムプロンプト準拠：要求仕様に基づく表示順序実装
        ①レベル0タスクを期限日昇順
        ②下位レベルをレベル順&同階層期限日昇順
        """
        try:
            if project_id:
                # システムプロンプト準拠：シンプルで確実なソート実装
                # まず全タスクを取得し、アプリケーション側で並び替え
                tasks = self.db_manager.execute_query(
                    """SELECT * FROM tasks 
                       WHERE project_id = ? 
                       ORDER BY level ASC, due_date ASC""",
                    (project_id,)
                )
            else:
                tasks = self.db_manager.execute_query(
                    """SELECT * FROM tasks 
                       ORDER BY project_id, level ASC, due_date ASC"""
                )
            
            # システムプロンプト準拠：要求仕様に基づく階層ソート
            if project_id:
                tasks = self._sort_tasks_hierarchically(tasks)
            
            # システムプロンプト準拠：データ変換ログの出力
            log_data_conversion(
                logger, 
                'get_tasks_ordered', 
                {'project_id': project_id}, 
                tasks, 
                True,
                {'task_count': len(tasks), 'order_rule': 'hierarchical_due_date_sort'}
            )
            
            logger.info(f"Retrieved {len(tasks)} tasks with hierarchical ordering" + (f" for project {project_id}" if project_id else ""))
            return tasks
        except Exception as e:
            logger.error(f"Failed to retrieve tasks: {e}")
            raise
    
    def _sort_tasks_hierarchically(self, tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        システムプロンプト準拠：階層構造を考慮したタスクソート
        ①レベル0タスクを期限日昇順
        ②各レベル0タスクの下に子タスクをレベル順&期限日順で配置
        """
        try:
            # レベル0タスクとその他を分離
            level0_tasks = [task for task in tasks if task.get('level', 0) == 0]
            child_tasks = [task for task in tasks if task.get('level', 0) > 0]
            
            # レベル0タスクを期限日順でソート
            level0_tasks.sort(key=lambda task: task.get('due_date', ''))
            
            # 結果リスト
            sorted_tasks = []
            
            # 各レベル0タスクとその子タスクを処理
            for root_task in level0_tasks:
                sorted_tasks.append(root_task)
                
                # この親タスクに属する子タスクを再帰的に追加
                self._add_child_tasks(sorted_tasks, root_task['id'], child_tasks, set())
            
            # 親を持たない子タスク（データ不整合の場合）も末尾に追加
            orphan_tasks = [task for task in child_tasks 
                          if not any(task['id'] in [t['id'] for t in sorted_tasks])]
            orphan_tasks.sort(key=lambda task: (task.get('level', 0), task.get('due_date', '')))
            sorted_tasks.extend(orphan_tasks)
            
            logger.debug(f"Hierarchical sort completed: {len(sorted_tasks)} tasks")
            return sorted_tasks
            
        except Exception as e:
            logger.error(f"Error in hierarchical sort: {e}")
            # フォールバック：元のリストを返す
            return tasks
    
    def _add_child_tasks(self, result_list: List[Dict[str, Any]], parent_id: str, 
                        all_child_tasks: List[Dict[str, Any]], processed_ids: set):
        """
        指定された親タスクの子タスクを再帰的に追加
        システムプロンプト準拠：循環参照防止とレベル順ソート
        """
        try:
            # 循環参照防止
            if parent_id in processed_ids:
                logger.warn(f"Circular reference detected for task {parent_id}")
                return
            
            processed_ids.add(parent_id)
            
            # 直接の子タスクを検索
            direct_children = [task for task in all_child_tasks 
                             if task.get('parent_id') == parent_id]
            
            # 子タスクをレベル順、同レベルでは期限日順でソート
            direct_children.sort(key=lambda task: (task.get('level', 0), task.get('due_date', '')))
            
            # 各子タスクを追加し、その子タスクも再帰的に処理
            for child_task in direct_children:
                # 既に処理済みでない場合のみ追加
                if not any(child_task['id'] == t['id'] for t in result_list):
                    result_list.append(child_task)
                    # 孫タスクも再帰的に追加
                    self._add_child_tasks(result_list, child_task['id'], all_child_tasks, processed_ids)
                    
        except Exception as e:
            logger.error(f"Error adding child tasks for parent {parent_id}: {e}")
    
    def get_task_by_id(self, task_id: str) -> Dict[str, Any]:
        """タスクID指定取得"""
        try:
            tasks = self.db_manager.execute_query(
                "SELECT * FROM tasks WHERE id = ?", (task_id,)
            )
            
            if not tasks:
                raise NotFoundError(f"Task not found: {task_id}")
            
            task = tasks[0]
            
            # システムプロンプト準拠：取得データの検証
            self._validate_task_data(task)
            
            logger.debug(f"Retrieved task: {task_id}")
            return task
        except Exception as e:
            logger.error(f"Failed to retrieve task {task_id}: {e}")
            raise
    
    def create_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """タスク作成"""
        try:
            # バリデーション
            if not task_data.get('name', '').strip():
                raise ValidationError("Task name is required")
            
            if not task_data.get('project_id', '').strip():
                raise ValidationError("Project ID is required")
            
            # システムプロンプト準拠：日付フィールドの正規化
            normalized_task_data = self._normalize_task_dates(task_data)
            
            # ID生成
            task_id = f"t{int(datetime.now().timestamp() * 1000)}"
            now = datetime.now()
            
            # データベース挿入
            self.db_manager.execute_update(
                """INSERT INTO tasks (
                    id, name, project_id, parent_id, completed, start_date, due_date,
                    completion_date, notes, assignee, level, collapsed, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    task_id,
                    normalized_task_data['name'],
                    normalized_task_data['project_id'],
                    normalized_task_data.get('parent_id'),
                    normalized_task_data.get('completed', False),
                    normalized_task_data.get('start_date', now.isoformat()),
                    normalized_task_data.get('due_date', now.isoformat()),
                    normalized_task_data.get('completion_date'),
                    normalized_task_data.get('notes', ''),
                    normalized_task_data.get('assignee', '自分'),
                    normalized_task_data.get('level', 0),
                    normalized_task_data.get('collapsed', False),
                    now.isoformat(),
                    now.isoformat()
                )
            )
            
            # 作成されたタスクを取得
            created_task = self.get_task_by_id(task_id)
            logger.info(f"Created task: {created_task['name']} ({task_id})")
            return created_task
            
        except Exception as e:
            logger.error(f"Failed to create task: {e}")
            raise
    
    def update_task(self, task_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """タスク更新"""
        try:
            # 存在確認
            self.get_task_by_id(task_id)
            
            # システムプロンプト準拠：日付フィールドの正規化
            normalized_updates = self._normalize_task_dates(updates)
            
            # 更新フィールド構築
            update_fields = []
            values = []
            
            allowed_fields = [
                'name', 'project_id', 'parent_id', 'completed', 'start_date', 'due_date',
                'completion_date', 'notes', 'assignee', 'level', 'collapsed'
            ]
            
            for field, value in normalized_updates.items():
                if field in allowed_fields:
                    update_fields.append(f"{field} = ?")
                    values.append(value)
            
            if update_fields:
                update_fields.append("updated_at = ?")
                values.append(datetime.now().isoformat())
                values.append(task_id)
                
                query = f"UPDATE tasks SET {', '.join(update_fields)} WHERE id = ?"
                self.db_manager.execute_update(query, tuple(values))
            
            # 更新されたタスクを取得
            updated_task = self.get_task_by_id(task_id)
            logger.info(f"Updated task: {updated_task['name']} ({task_id})")
            return updated_task
            
        except Exception as e:
            logger.error(f"Failed to update task {task_id}: {e}")
            raise
    
    def delete_task(self, task_id: str) -> None:
        """タスク削除"""
        try:
            # 存在確認
            task = self.get_task_by_id(task_id)
            
            # 削除実行（CASCADE設定により子タスクも削除される）
            affected_rows = self.db_manager.execute_update(
                "DELETE FROM tasks WHERE id = ?", (task_id,)
            )
            
            if affected_rows == 0:
                raise NotFoundError(f"Task not found: {task_id}")
            
            logger.info(f"Deleted task: {task['name']} ({task_id})")
            
        except Exception as e:
            logger.error(f"Failed to delete task {task_id}: {e}")
            raise
    
    def batch_update_tasks(self, operation: str, task_ids: List[str]) -> Dict[str, Any]:
        """タスク一括操作"""
        try:
            if not task_ids:
                raise ValidationError("Task IDs are required")
            
            placeholders = ",".join(["?" for _ in task_ids])
            now = datetime.now().isoformat()
            affected_rows = 0
            
            logger.info(f"Starting batch operation: {operation}", {
                'task_count': len(task_ids),
                'task_ids': task_ids
            })
            
            if operation == "complete":
                # 一括完了
                query = f"""UPDATE tasks SET 
                           completed = ?, 
                           completion_date = ?, 
                           updated_at = ? 
                           WHERE id IN ({placeholders})"""
                params = [True, now, now] + task_ids
                affected_rows = self.db_manager.execute_update(query, tuple(params))
                
                # 子タスクも一括完了
                child_query = f"""UPDATE tasks SET 
                                completed = ?, 
                                completion_date = ?, 
                                updated_at = ? 
                                WHERE parent_id IN ({placeholders})"""
                child_affected = self.db_manager.execute_update(child_query, tuple(params))
                affected_rows += child_affected
                
                logger.info(f"Batch complete: {affected_rows} tasks affected")
                
            elif operation == "incomplete":
                # 一括未完了
                query = f"""UPDATE tasks SET 
                           completed = ?, 
                           completion_date = ?, 
                           updated_at = ? 
                           WHERE id IN ({placeholders})"""
                params = [False, None, now] + task_ids
                affected_rows = self.db_manager.execute_update(query, tuple(params))
                
                # 子タスクも一括未完了
                child_query = f"""UPDATE tasks SET 
                                completed = ?, 
                                completion_date = ?, 
                                updated_at = ? 
                                WHERE parent_id IN ({placeholders})"""
                child_affected = self.db_manager.execute_update(child_query, tuple(params))
                affected_rows += child_affected
                
                logger.info(f"Batch incomplete: {affected_rows} tasks affected")
                
            elif operation == "delete":
                # 一括削除（CASCADE により子タスクも自動削除）
                query = f"DELETE FROM tasks WHERE id IN ({placeholders})"
                params = task_ids
                affected_rows = self.db_manager.execute_update(query, tuple(params))
                
                logger.info(f"Batch delete: {affected_rows} tasks affected")
                
            else:
                raise ValidationError(f"Invalid operation: {operation}")
            
            return {
                'success': True,
                'operation': operation,
                'affected_count': affected_rows,
                'task_ids': task_ids
            }
            
        except Exception as e:
            logger.error(f"Failed to execute batch operation '{operation}': {e}")
            return {
                'success': False,
                'operation': operation,
                'affected_count': 0,
                'error': str(e)
            }
    
    def get_task_hierarchy(self, task_id: str) -> List[Dict[str, Any]]:
        """タスクの階層構造取得（子タスク含む）"""
        try:
            # 再帰的に子タスクを取得
            def get_children(parent_id: str) -> List[Dict[str, Any]]:
                children = self.db_manager.execute_query(
                    "SELECT * FROM tasks WHERE parent_id = ? ORDER BY due_date ASC",
                    (parent_id,)
                )
                result = []
                for child in children:
                    child['children'] = get_children(child['id'])
                    result.append(child)
                return result
            
            # ルートタスクとその子タスクを取得
            root_task = self.get_task_by_id(task_id)
            root_task['children'] = get_children(task_id)
            
            return [root_task]
            
        except Exception as e:
            logger.error(f"Failed to get task hierarchy for {task_id}: {e}")
            raise
    
    def _normalize_task_dates(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        システムプロンプト準拠：DRY原則によるタスク日付フィールド正規化
        """
        normalized_data = task_data.copy()
        date_fields = ['start_date', 'due_date', 'completion_date']
        
        for field in date_fields:
            if field in normalized_data and normalized_data[field] is not None:
                try:
                    value = normalized_data[field]
                    
                    # 既にISO文字列形式の場合
                    if isinstance(value, str):
                        # 妥当性検証
                        datetime.fromisoformat(value.replace('Z', '+00:00'))
                        continue
                    
                    # datetime型の場合
                    if isinstance(value, datetime):
                        normalized_data[field] = value.isoformat()
                        log_data_conversion(
                            logger, 
                            f'normalize_{field}', 
                            value, 
                            normalized_data[field], 
                            True
                        )
                        continue
                    
                    # その他の型は現在時刻で置換
                    logger.warn(f"Invalid date type for {field}: {type(value)}")
                    normalized_data[field] = datetime.now().isoformat()
                    
                except Exception as e:
                    # 変換失敗時のエラーハンドリング
                    date_error = handle_date_conversion_error(
                        field, 
                        normalized_data[field], 
                        e
                    )
                    logger.warn(f"Date conversion failed for {field}, using current time")
                    normalized_data[field] = datetime.now().isoformat()
        
        return normalized_data
    
    def _validate_task_data(self, task: Dict[str, Any]) -> None:
        """
        システムプロンプト準拠：タスクデータの検証
        """
        required_fields = ['id', 'name', 'project_id']
        for field in required_fields:
            if not task.get(field):
                raise ValidationError(f"Required field '{field}' is missing or empty")
        
        # 日付フィールドの検証
        date_fields = ['start_date', 'due_date']
        for field in date_fields:
            if field in task and task[field]:
                try:
                    if isinstance(task[field], str):
                        datetime.fromisoformat(task[field].replace('Z', '+00:00'))
                except ValueError as e:
                    logger.warn(f"Invalid date format in {field}: {task[field]}")
                    raise ValidationError(f"Invalid date format in {field}: {task[field]}")