"""
タスク関連ビジネスロジック統一
"""
from typing import List, Dict, Any, Optional
from datetime import datetime

from core.database import DatabaseManager
from core.exceptions import NotFoundError, ValidationError, DatabaseError
from core.logger import get_logger
from utils.id_generator import generate_task_id
from utils.validation import validate_task_data

logger = get_logger(__name__)

class TaskService:
    """タスク管理サービス"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
    
    def get_tasks(self, project_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """タスク一覧取得"""
        try:
            with self.db_manager.get_connection_context() as conn:
                if project_id:
                    cursor = conn.execute(
                        "SELECT * FROM tasks WHERE project_id = ? ORDER BY level, created_at",
                        (project_id,)
                    )
                else:
                    cursor = conn.execute(
                        "SELECT * FROM tasks ORDER BY project_id, level, created_at"
                    )
                
                tasks = [dict(row) for row in cursor.fetchall()]
            
            logger.info(f"Retrieved {len(tasks)} tasks" + (f" for project {project_id}" if project_id else ""))
            return tasks
        except Exception as e:
            logger.error(f"Failed to get tasks: {e}")
            raise DatabaseError("Failed to retrieve tasks") from e
    
    def get_task_by_id(self, task_id: str) -> Dict[str, Any]:
        """ID指定タスク取得"""
        try:
            with self.db_manager.get_connection_context() as conn:
                cursor = conn.execute(
                    "SELECT * FROM tasks WHERE id = ?",
                    (task_id,)
                )
                task = cursor.fetchone()
            
            if not task:
                raise NotFoundError(
                    f"Task not found: {task_id}",
                    context={"task_id": task_id}
                )
            
            logger.debug(f"Retrieved task: {task_id}")
            return dict(task)
        except NotFoundError:
            raise
        except Exception as e:
            logger.error(f"Failed to get task {task_id}: {e}")
            raise DatabaseError("Failed to retrieve task") from e
    
    def create_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """タスク作成"""
        try:
            # バリデーション
            validated_data = validate_task_data(task_data)
            
            # ID生成
            task_id = generate_task_id()
            now = datetime.now()
            
            # データベース挿入
            with self.db_manager.get_connection_context() as conn:
                conn.execute(
                    """INSERT INTO tasks (
                        id, name, project_id, parent_id, completed,
                        start_date, due_date, completion_date, notes, assignee,
                        level, collapsed, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        task_id,
                        validated_data["name"],
                        validated_data["project_id"],
                        validated_data["parent_id"],
                        validated_data["completed"],
                        validated_data["start_date"],
                        validated_data["due_date"],
                        validated_data.get("completion_date"),
                        validated_data["notes"],
                        validated_data["assignee"],
                        validated_data["level"],
                        validated_data["collapsed"],
                        now,
                        now
                    )
                )
                conn.commit()
            
            # 作成されたタスクを取得
            created_task = self.get_task_by_id(task_id)
            
            logger.info(f"Created task: {task_id} - {validated_data['name']}")
            return created_task
        except (ValidationError, NotFoundError):
            raise
        except Exception as e:
            logger.error(f"Failed to create task: {e}")
            raise DatabaseError("Failed to create task") from e
    
    def update_task(self, task_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """タスク更新"""
        try:
            # 存在確認
            self.get_task_by_id(task_id)
            
            # 更新フィールド構築
            update_fields = []
            values = []
            
            allowed_fields = [
                "name", "project_id", "parent_id", "completed",
                "start_date", "due_date", "completion_date", "notes",
                "assignee", "level", "collapsed"
            ]
            
            for field, value in updates.items():
                if field in allowed_fields:
                    update_fields.append(f"{field} = ?")
                    values.append(value)
            
            if update_fields:
                update_fields.append("updated_at = ?")
                values.append(datetime.now())
                values.append(task_id)
                
                with self.db_manager.get_connection_context() as conn:
                    query = f"UPDATE tasks SET {', '.join(update_fields)} WHERE id = ?"
                    conn.execute(query, values)
                    conn.commit()
            
            # 更新されたタスクを取得
            updated_task = self.get_task_by_id(task_id)
            
            logger.info(f"Updated task: {task_id}")
            return updated_task
        except (ValidationError, NotFoundError):
            raise
        except Exception as e:
            logger.error(f"Failed to update task {task_id}: {e}")
            raise DatabaseError("Failed to update task") from e
    
    def delete_task(self, task_id: str) -> None:
        """タスク削除"""
        try:
            # 存在確認
            self.get_task_by_id(task_id)
            
            with self.db_manager.get_connection_context() as conn:
                # 子タスクも自動削除される（CASCADE設定による）
                conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
                conn.commit()
            
            logger.info(f"Deleted task: {task_id}")
        except NotFoundError:
            raise
        except Exception as e:
            logger.error(f"Failed to delete task {task_id}: {e}")
            raise DatabaseError("Failed to delete task") from e
    
    def batch_update_tasks(self, operation: str, task_ids: List[str]) -> None:
        """タスク一括操作"""
        try:
            if not task_ids:
                return
            
            placeholders = ",".join(["?" for _ in task_ids])
            now = datetime.now()
            
            with self.db_manager.get_connection_context() as conn:
                if operation == "complete":
                    conn.execute(
                        f"UPDATE tasks SET completed = ?, completion_date = ?, updated_at = ? WHERE id IN ({placeholders})",
                        [True, now, now] + task_ids
                    )
                elif operation == "incomplete":
                    conn.execute(
                        f"UPDATE tasks SET completed = ?, completion_date = ?, updated_at = ? WHERE id IN ({placeholders})",
                        [False, None, now] + task_ids
                    )
                elif operation == "delete":
                    conn.execute(f"DELETE FROM tasks WHERE id IN ({placeholders})", task_ids)
                else:
                    raise ValidationError(f"Invalid batch operation: {operation}")
                
                conn.commit()
            
            logger.info(f"Batch operation '{operation}' executed for {len(task_ids)} tasks")
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to execute batch operation: {e}")
            raise DatabaseError("Failed to execute batch operation") from e