"""
データベース管理モジュール
システムプロンプト準拠：DRY原則、統一例外処理
"""
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Generator, Dict, Any
from core.config import config
from core.logger import get_logger
from core.exceptions import DatabaseError

logger = get_logger(__name__)

class DatabaseManager:
    """データベース管理クラス"""
    
    def __init__(self, db_path: Path = None):
        self.db_path = db_path or config.database_path
        logger.info(f"Database manager initialized: {self.db_path}")
    
    @contextmanager
    def get_connection(self) -> Generator[sqlite3.Connection, None, None]:
        """データベース接続の取得（コンテキストマネージャー）"""
        conn = None
        try:
            conn = sqlite3.connect(str(self.db_path))
            conn.row_factory = sqlite3.Row
            logger.debug("Database connection established")
            yield conn
        except sqlite3.Error as e:
            logger.error(f"Database error: {e}")
            if conn:
                conn.rollback()
            raise DatabaseError(f"Database operation failed: {e}")
        finally:
            if conn:
                conn.close()
                logger.debug("Database connection closed")
    
    def execute_query(self, query: str, params: tuple = ()) -> list:
        """クエリ実行（SELECT用）"""
        with self.get_connection() as conn:
            cursor = conn.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]
    
    def execute_update(self, query: str, params: tuple = ()) -> int:
        """クエリ実行（INSERT/UPDATE/DELETE用）"""
        with self.get_connection() as conn:
            cursor = conn.execute(query, params)
            conn.commit()
            return cursor.rowcount

def init_database() -> None:
    """データベース初期化"""
    try:
        if not config.schema_path.exists():
            raise FileNotFoundError(f"Schema file not found: {config.schema_path}")
        
        schema = config.schema_path.read_text(encoding='utf-8')
        
        db_manager = DatabaseManager()
        with db_manager.get_connection() as conn:
            conn.executescript(schema)
            conn.commit()
        
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise DatabaseError(f"Failed to initialize database: {e}")