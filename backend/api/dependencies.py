"""
FastAPI依存関係管理
システムプロンプト準拠：依存性注入の統一管理
"""
from core.database import DatabaseManager

def get_database_manager() -> DatabaseManager:
    """データベースマネージャーの依存性注入"""
    return DatabaseManager()