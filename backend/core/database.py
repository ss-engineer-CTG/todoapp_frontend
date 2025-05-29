"""
データベース接続管理
"""
import sqlite3
from pathlib import Path
from typing import Optional
from contextlib import contextmanager

from .paths import PATHS, validate_path
from .logger import get_logger

logger = get_logger(__name__)

class DatabaseManager:
    """データベース管理クラス"""
    
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or PATHS.DATABASE_FILE
        
        if not validate_path(self.db_path):
            raise ValueError(f"Invalid database path: {self.db_path}")
    
    def get_connection(self) -> sqlite3.Connection:
        """データベース接続取得"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            conn.row_factory = sqlite3.Row
            logger.debug(f"Database connection established: {self.db_path}")
            return conn
        except sqlite3.Error as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    @contextmanager
    def get_connection_context(self):
        """コンテキストマネージャーでの接続管理"""
        conn = None
        try:
            conn = self.get_connection()
            yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Database operation failed: {e}")
            raise
        finally:
            if conn:
                conn.close()
    
    def init_database(self) -> None:
        """データベース初期化"""
        schema_path = PATHS.SCHEMA_FILE
        
        if not schema_path.exists():
            raise FileNotFoundError(f"Schema file not found: {schema_path}")
        
        try:
            with open(schema_path, 'r', encoding='utf-8') as f:
                schema = f.read()
            
            with self.get_connection_context() as conn:
                conn.executescript(schema)
                conn.commit()
            
            logger.info(f"Database initialized successfully: {self.db_path}")
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            raise

# グローバルインスタンス
db_manager = DatabaseManager()

def get_database_connection() -> sqlite3.Connection:
    """データベース接続取得"""
    return db_manager.get_connection()

def init_database() -> None:
    """データベース初期化"""
    db_manager.init_database()