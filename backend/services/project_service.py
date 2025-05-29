"""
プロジェクトサービス
システムプロンプト準拠：DRY原則、ビジネスロジック集約
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from ..core.database import DatabaseManager
from ..core.exceptions import NotFoundError, ValidationError
from ..core.logger import get_logger

logger = get_logger(__name__)

class ProjectService:
    """プロジェクト操作サービス"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
    
    def get_all_projects(self) -> List[Dict[str, Any]]:
        """全プロジェクト取得"""
        try:
            projects = self.db_manager.execute_query(
                "SELECT * FROM projects ORDER BY created_at"
            )
            logger.info(f"Retrieved {len(projects)} projects")
            return projects
        except Exception as e:
            logger.error(f"Failed to retrieve projects: {e}")
            raise
    
    def get_project_by_id(self, project_id: str) -> Dict[str, Any]:
        """プロジェクトID指定取得"""
        try:
            projects = self.db_manager.execute_query(
                "SELECT * FROM projects WHERE id = ?", (project_id,)
            )
            
            if not projects:
                raise NotFoundError(f"Project not found: {project_id}")
            
            logger.debug(f"Retrieved project: {project_id}")
            return projects[0]
        except Exception as e:
            logger.error(f"Failed to retrieve project {project_id}: {e}")
            raise
    
    def create_project(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """プロジェクト作成"""
        try:
            # バリデーション
            if not project_data.get('name', '').strip():
                raise ValidationError("Project name is required")
            
            if not project_data.get('color', '').strip():
                raise ValidationError("Project color is required")
            
            # ID生成
            project_id = f"p{int(datetime.now().timestamp() * 1000)}"
            now = datetime.now()
            
            # データベース挿入
            self.db_manager.execute_update(
                """INSERT INTO projects (id, name, color, collapsed, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    project_id,
                    project_data['name'],
                    project_data['color'],
                    project_data.get('collapsed', False),
                    now,
                    now
                )
            )
            
            # 作成されたプロジェクトを取得
            created_project = self.get_project_by_id(project_id)
            logger.info(f"Created project: {created_project['name']} ({project_id})")
            return created_project
            
        except Exception as e:
            logger.error(f"Failed to create project: {e}")
            raise
    
    def update_project(self, project_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """プロジェクト更新"""
        try:
            # 存在確認
            self.get_project_by_id(project_id)
            
            # 更新フィールド構築
            update_fields = []
            values = []
            
            for field, value in updates.items():
                if field in ['name', 'color', 'collapsed']:
                    update_fields.append(f"{field} = ?")
                    values.append(value)
            
            if update_fields:
                update_fields.append("updated_at = ?")
                values.append(datetime.now())
                values.append(project_id)
                
                query = f"UPDATE projects SET {', '.join(update_fields)} WHERE id = ?"
                self.db_manager.execute_update(query, tuple(values))
            
            # 更新されたプロジェクトを取得
            updated_project = self.get_project_by_id(project_id)
            logger.info(f"Updated project: {updated_project['name']} ({project_id})")
            return updated_project
            
        except Exception as e:
            logger.error(f"Failed to update project {project_id}: {e}")
            raise
    
    def delete_project(self, project_id: str) -> None:
        """プロジェクト削除"""
        try:
            # 存在確認
            project = self.get_project_by_id(project_id)
            
            # 削除実行（CASCADE設定により関連タスクも削除される）
            affected_rows = self.db_manager.execute_update(
                "DELETE FROM projects WHERE id = ?", (project_id,)
            )
            
            if affected_rows == 0:
                raise NotFoundError(f"Project not found: {project_id}")
            
            logger.info(f"Deleted project: {project['name']} ({project_id})")
            
        except Exception as e:
            logger.error(f"Failed to delete project {project_id}: {e}")
            raise