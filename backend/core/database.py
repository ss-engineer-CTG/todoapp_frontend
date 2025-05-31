"""
データベース管理モジュール
システムプロンプト準拠：DRY原則、統一例外処理
"""
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Generator, Dict, Any, List
from datetime import datetime
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
    
    def execute_query(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        """
        クエリ実行（SELECT用）
        システムプロンプト準拠：日付フィールドの正規化処理追加
        """
        with self.get_connection() as conn:
            cursor = conn.execute(query, params)
            rows = cursor.fetchall()
            
            # システムプロンプト準拠：DRY原則で日付正規化を一元化
            normalized_rows = []
            for row in rows:
                row_dict = dict(row)
                normalized_row = self._normalize_date_fields(row_dict)
                normalized_rows.append(normalized_row)
            
            logger.debug(f"Query executed successfully, returned {len(normalized_rows)} rows")
            return normalized_rows
    
    def execute_update(self, query: str, params: tuple = ()) -> int:
        """クエリ実行（INSERT/UPDATE/DELETE用）"""
        with self.get_connection() as conn:
            cursor = conn.execute(query, params)
            conn.commit()
            affected_rows = cursor.rowcount
            logger.debug(f"Update query executed, affected {affected_rows} rows")
            return affected_rows
    
    def _normalize_date_fields(self, row_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        システムプロンプト準拠：DRY原則による日付フィールド正規化
        SQLiteのTIMESTAMP型をISO 8601形式の文字列に統一
        """
        try:
            # 日付フィールドのマッピング
            date_fields = [
                'start_date', 'due_date', 'completion_date',
                'created_at', 'updated_at'
            ]
            
            for field in date_fields:
                if field in row_dict and row_dict[field] is not None:
                    date_value = row_dict[field]
                    
                    # 既にISO形式の場合はそのまま
                    if isinstance(date_value, str) and self._is_iso_format(date_value):
                        continue
                    
                    # datetime型の場合はISO形式に変換
                    if isinstance(date_value, datetime):
                        row_dict[field] = date_value.isoformat()
                        logger.trace(f"Converted datetime field {field} to ISO format")
                    
                    # 文字列だが非ISO形式の場合は変換を試行
                    elif isinstance(date_value, str):
                        try:
                            parsed_date = datetime.fromisoformat(date_value.replace('Z', '+00:00'))
                            row_dict[field] = parsed_date.isoformat()
                            logger.trace(f"Normalized date field {field} to ISO format")
                        except ValueError:
                            logger.warn(f"Could not parse date field {field}: {date_value}")
                            # 無効な日付は現在時刻で置換
                            row_dict[field] = datetime.now().isoformat()
            
            return row_dict
            
        except Exception as e:
            logger.error(f"Date normalization failed: {e}")
            # フォールバック：元のデータを返す
            return row_dict
    
    def _is_iso_format(self, date_string: str) -> bool:
        """ISO 8601形式かどうかを判定"""
        try:
            datetime.fromisoformat(date_string.replace('Z', '+00:00'))
            return True
        except ValueError:
            return False

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
        
        # システムプロンプト準拠：初期化後のデータ検証
        _validate_initial_data(db_manager)
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise DatabaseError(f"Failed to initialize database: {e}")

def _validate_initial_data(db_manager: DatabaseManager) -> None:
    """
    システムプロンプト準拠：初期データの日付フィールド検証
    """
    try:
        # プロジェクトデータの検証
        projects = db_manager.execute_query("SELECT * FROM projects LIMIT 5")
        logger.info(f"Initial projects validation: {len(projects)} projects found")
        
        # タスクデータの検証
        tasks = db_manager.execute_query("SELECT * FROM tasks LIMIT 5")
        logger.info(f"Initial tasks validation: {len(tasks)} tasks found")
        
        # 日付フィールドの検証
        for task in tasks:
            if 'start_date' in task and task['start_date']:
                logger.debug(f"Task {task.get('id', 'unknown')} start_date: {task['start_date']}")
            if 'due_date' in task and task['due_date']:
                logger.debug(f"Task {task.get('id', 'unknown')} due_date: {task['due_date']}")
        
        logger.info("Initial data validation completed successfully")
        
    except Exception as e:
        logger.warn(f"Initial data validation failed: {e}")
        # 検証失敗は致命的ではないため、警告レベルでログ出力