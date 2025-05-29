"""
プロジェクト関連ビジネスロジック統一
"""
from typing import List, Dict, Any, Optional
from datetime import datetime

from core.database import DatabaseManager
from core.exceptions import NotFoundError, ValidationError, DatabaseError
from core.logger import get_logger
from utils.id_generator import generate_project_id
from utils.validation import validate_project_data

logger = get_logger(__name__)

class ProjectService:
    """プロジェクト管理サービス"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
    
    def get_all_projects(self) -> List[Dict[str, Any]]:
        """全プロジェクト取得"""
        try:
            with self.db_manager.get_connection_context() as conn:
                cursor = conn.execute(
                    "SELECT * FROM projects ORDER BY created_at ASC"
                )
                projects = [dict(row) for row in cursor.fetchall()]
            
            logger.info(f"Retrieved {len(projects)} projects")
            return projects
        except Exception as e:
            logger.error(f"Failed to get projects: {e}")
            raise DatabaseError("Failed to retrieve projects") from e
    
    def get_project_by_id(self, project_id: str) -> Dict[str, Any]:
        """ID指定プロジェクト取得"""
        try:
            with self.db_manager.get_connection_context() as conn:
                cursor = conn.execute(
                    "SELECT * FROM projects WHERE id = ?",
                    (project_id,)
                )
                project = cursor.fetchone()
            
            if not project:
                raise NotFoundError(
                    f"Project not found: {project_id}",
                    context={"project_id": project_id}
                )
            
            logger.debug(f"Retrieved project: {project_id}")
            return dict(project)
        except NotFoundError:
            raise
        except Exception as e:
            logger.error(f"Failed to get project {project_id}: {e}")
            raise DatabaseError("Failed to retrieve project") from e
    
    def create_project(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """プロジェクト作成"""
        try:
            # バリデーション
            validated_data = validate_project_data(project_data)
            
            # ID生成
            project_id = generate_project_id()
            now = datetime.now()
            
            # データベース挿入
            with self.db_manager.get_connection_context() as conn:
                conn.execute(
                    """INSERT INTO projects (id, name, color, collapsed, created_at, updated_at)
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (
                        project_id,
                        validated_data["name"],
                        validated_data["color"],
                        validated_data["collapsed"],
                        now,
                        now
                    )
                )
                conn.commit()
            
            # 作成されたプロジェクトを取得
            created_project = self.get_project_by_id(project_id)
            
            logger.info(f"Created project: {project_id} - {validated_data['name']}")
            return created_project
        except (ValidationError, NotFoundError):
            raise
        except Exception as e:
            logger.error(f"Failed to create project: {e}")
            raise DatabaseError("Failed to create project") from e
    
    def update_project(self, project_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """プロジェクト更新"""
        try:
            # 存在確認
            self.get_project_by_id(project_id)
            
            # 更新データのバリデーション
            if updates:
                # 部分的なバリデーション
                if "name" in updates:
                    from utils.validation import validate_string_length
                    validate_string_length(updates["name"], "name", min_length=1, max_length=100)
                    updates["name"] = updates["name"].strip()
                
                if "color" in updates:
                    from utils.validation import validate_color_format
                    validate_color_format(updates["color"])
            
            # 更新フィールド構築
            update_fields = []
            values = []
            
            for field, value in updates.items():
                if field in ["name", "color", "collapsed"]:
                    update_fields.append(f"{field} = ?")
                    values.append(value)
            
            if update_fields:
                update_fields.append("updated_at = ?")
                values.append(datetime.now())
                values.append(project_id)
                
                with self.db_manager.get_connection_context() as conn:
                    query = f"UPDATE projects SET {', '.join(update_fields)} WHERE id = ?"
                    conn.execute(query, values)
                    conn.commit()
            
            # 更新されたプロジェクトを取得
            updated_project = self.get_project_by_id(project_id)
            
            logger.info(f"Updated project: {project_id}")
            return updated_project
        except (ValidationError, NotFoundError):
            raise
        except Exception as e:
            logger.error(f"Failed to update project {project_id}: {e}")
            raise DatabaseError("Failed to update project") from e
    
    def delete_project(self, project_id: str) -> None:
        """プロジェクト削除"""
        try:
            # 存在確認
            self.get_project_by_id(project_id)
            
            with self.db_manager.get_connection_context() as conn:
                # 関連タスクも自動削除される（CASCADE設定による）
                conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
                conn.commit()
            
            logger.info(f"Deleted project: {project_id}")
        except NotFoundError:
            raise
        except Exception as e:
            logger.error(f"Failed to delete project {project_id}: {e}")
            raise DatabaseError("Failed to delete project") from e