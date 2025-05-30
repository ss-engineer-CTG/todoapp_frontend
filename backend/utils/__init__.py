"""
Utility modules for the backend application.
システムプロンプト準拠：DRY原則、必要最小限の機能提供
"""

from .paths import get_base_dir, get_database_path, get_schema_path, get_log_dir

__all__ = [
    'get_base_dir',
    'get_database_path',
    'get_schema_path', 
    'get_log_dir'
]