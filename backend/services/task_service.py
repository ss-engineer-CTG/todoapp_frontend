"""
タスクサービス
システムプロンプト準拠：DRY原則、ビジネスロジック集約
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from core.database import DatabaseManager
from core.exceptions import NotFoundError, ValidationError
from core.logger import get_logger

logger = get_logger(__name__)

class TaskService:
    """タスク操作サービス"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
    
    def get_tasks(self, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """タスク一覧取得"""
        try:
            if project_id:
                tasks = self.db_manager.execute_query(
                    "SELECT * FROM tasks WHERE project_id = ? ORDER BY level, created_at",
                    (project_id,)
                )
            else:
                tasks = self.db_manager.execute_query(
                    "SELECT * FROM tasks ORDER BY project_id, level, created_at"
                )
            
            logger.info(f"Retrieved {len(tasks)} tasks" + (f" for project {project_id}" if project_id else ""))
            return tasks
        except Exception as e:
            logger.error(f"Failed to retrieve tasks: {e}")
            raise
    
    def get_task_by_id(self, task_id: str) -> Dict[str, Any]:
        """タスクID指定取得"""
        try:
            tasks = self.db_manager.execute_query(
                "SELECT * FROM tasks WHERE id = ?", (task_id,)
            )
            
            if not tasks:
                raise NotFoundError(f"Task not found: {task_id}")
            
            logger.debug(f"Retrieved task: {task_id}")
            return tasks[0]
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
                    task_data['name'],
                    task_data['project_id'],
                    task_data.get('parent_id'),
                    task_data.get('completed', False),
                    task_data.get('start_date', now),
                    task_data.get('due_date', now),
                    task_data.get('completion_date'),
                    task_data.get('notes', ''),
                    task_data.get('assignee', '自分'),
                    task_data.get('level', 0),
                    task_data.get('collapsed', False),
                    now,
                    now
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
            
            # 更新フィールド構築
            update_fields = []
            values = []
            
            allowed_fields = [
                'name', 'project_id', 'parent_id', 'completed', 'start_date', 'due_date',
                'completion_date', 'notes', 'assignee', 'level', 'collapsed'
            ]
            
            for field, value in updates.items():
                if field in allowed_fields:
                    update_fields.append(f"{field} = ?")
                    values.append(value)
            
            if update_fields:
                update_fields.append("updated_at = ?")
                values.append(datetime.now())
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
        """タスク一括操作（page.tsx準拠の詳細実装）"""
        try:
            if not task_ids:
                raise ValidationError("Task IDs are required")
            
            placeholders = ",".join(["?" for _ in task_ids])
            now = datetime.now()
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
                
                # 子タスクも一括完了（page.tsx準拠）
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
                    "SELECT * FROM tasks WHERE parent_id = ? ORDER BY created_at",
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