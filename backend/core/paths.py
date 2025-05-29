"""
パス管理（システムプロンプト準拠：ハードコードパス禁止、専用関数使用）
"""
import os
from pathlib import Path
from typing import Union

# パス定数一元管理
class PATHS:
    """パス定数定義"""
    # ベースパス
    BASE_DIR = Path(__file__).parent.parent
    
    # データベース
    DATABASE_FILE = BASE_DIR / "todo.db"
    SCHEMA_FILE = BASE_DIR / "schema.sql"
    
    # ログ
    LOGS_DIR = BASE_DIR / "logs"
    APP_LOG = LOGS_DIR / "app.log"
    ERROR_LOG = LOGS_DIR / "error.log"
    
    # 設定
    CONFIG_DIR = BASE_DIR / "config"
    ENV_FILE = BASE_DIR / ".env"

def resolve_path(*segments: Union[str, Path]) -> Path:
    """
    パス結合専用関数（システムプロンプト準拠：文字列結合禁止）
    """
    if not segments:
        return Path()
    
    base = Path(segments[0])
    for segment in segments[1:]:
        base = base / segment
    
    return base.resolve()

def validate_path(path: Union[str, Path]) -> bool:
    """
    パス検証関数（システムプロンプト準拷）
    """
    try:
        path_obj = Path(path)
        
        # 危険な文字をチェック
        dangerous_chars = ['<', '>', ':', '"', '|', '?', '*']
        if any(char in str(path_obj) for char in dangerous_chars):
            return False
        
        # 相対パス攻撃をチェック
        if '..' in path_obj.parts:
            return False
        
        return True
    except (TypeError, ValueError):
        return False

def ensure_directory(path: Union[str, Path]) -> Path:
    """ディレクトリ存在確認・作成"""
    path_obj = Path(path)
    
    if not validate_path(path_obj):
        raise ValueError(f"Invalid path: {path_obj}")
    
    path_obj.mkdir(parents=True, exist_ok=True)
    return path_obj

def get_relative_path(base: Union[str, Path], target: Union[str, Path]) -> Path:
    """相対パス取得"""
    base_path = Path(base).resolve()
    target_path = Path(target).resolve()
    
    try:
        return target_path.relative_to(base_path)
    except ValueError:
        # 相対パスにできない場合は絶対パスを返す
        return target_path