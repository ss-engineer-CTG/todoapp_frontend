"""
パス管理ユーティリティ
システムプロンプト準拠：KISS原則、YAGNI原則、ハードコード禁止
"""
from pathlib import Path

# システムプロンプト準拠：ベースディレクトリを一箇所で定義
_BASE_DIR = Path(__file__).parent.parent

def get_base_dir() -> Path:
    """ベースディレクトリを取得"""
    return _BASE_DIR

def get_database_path() -> Path:
    """
    データベースファイルパスを取得
    システムプロンプト準拠：ハードコード禁止、パス結合専用関数使用
    """
    return _BASE_DIR / "todo.db"

def get_schema_path() -> Path:
    """
    スキーマファイルパスを取得
    システムプロンプト準拠：ハードコード禁止、パス結合専用関数使用
    """
    return _BASE_DIR / "schema.sql"

def get_log_dir() -> Path:
    """
    ログディレクトリパスを取得
    システムプロンプト準拠：ハードコード禁止、パス結合専用関数使用
    """
    log_dir = _BASE_DIR / "logs"
    log_dir.mkdir(exist_ok=True)
    return log_dir

def get_log_file_path() -> Path:
    """
    ログファイルパスを取得
    システムプロンプト準拠：ハードコード禁止、パス結合専用関数使用
    """
    return get_log_dir() / "app.log"