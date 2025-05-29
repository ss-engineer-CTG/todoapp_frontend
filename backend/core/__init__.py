"""
コア機能モジュール
システムプロンプト準拠：DRY原則適用、共通機能の抽出
"""

from .config import get_config, Config
from .logger import get_logger, setup_logging
from .paths import PATHS, resolve_path, validate_path
from .database import get_database_connection, init_database
from .exceptions import TodoAppError, ValidationError, DatabaseError

__all__ = [
    'get_config',
    'Config',
    'get_logger',
    'setup_logging',
    'PATHS',
    'resolve_path',
    'validate_path',
    'get_database_connection',
    'init_database',
    'TodoAppError',
    'ValidationError',
    'DatabaseError'
]